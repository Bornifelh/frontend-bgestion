import { io } from "socket.io-client";
import { useAuthStore } from "../stores/authStore";
import { useBoardStore } from "../stores/boardStore";
import { useWorkspaceStore } from "../stores/workspaceStore";

const WS_URL = import.meta.env.VITE_WS_URL || undefined;

let socket = null;
let isInitializing = false;
let pendingJoins = [];
let currentRooms = { workspaces: new Set(), boards: new Set() };

const flushPendingJoins = () => {
  if (!socket?.connected) return;
  const joins = [...pendingJoins];
  pendingJoins = [];
  joins.forEach((fn) => fn());
};

const rejoinRooms = () => {
  if (!socket?.connected) return;
  currentRooms.workspaces.forEach((id) =>
    socket.emit("join:workspace", id),
  );
  currentRooms.boards.forEach((id) => socket.emit("join:board", id));
};

const registerEventHandlers = (s) => {
  s.on("item:created", (data) => {
    useBoardStore.getState().addItem(data);
  });
  s.on("item:updated", (data) => {
    useBoardStore.getState().updateItem(data.id, data);
  });
  s.on("item:value_updated", ({ itemId, columnId, value }) => {
    useBoardStore.getState().updateItemValue(itemId, columnId, value);
  });
  s.on("item:deleted", ({ itemId }) => {
    useBoardStore.getState().deleteItem(itemId);
  });
  s.on("items:deleted", ({ itemIds }) => {
    useBoardStore.getState().deleteItems(itemIds);
  });
  s.on("items:reordered", ({ items }) => {
    useBoardStore.getState().reorderItems(items);
  });
  s.on("column:created", (data) => {
    useBoardStore.getState().addColumn(data);
  });
  s.on("column:updated", (data) => {
    useBoardStore.getState().updateColumn(data.id, data);
  });
  s.on("column:deleted", ({ columnId }) => {
    useBoardStore.getState().deleteColumn(columnId);
  });
  s.on("columns:reordered", ({ columns }) => {
    useBoardStore.getState().reorderColumns(columns);
  });
  s.on("label:created", ({ columnId, label }) => {
    useBoardStore.getState().addLabel(columnId, label);
  });
  s.on("label:updated", ({ columnId, label }) => {
    useBoardStore.getState().updateLabel(columnId, label.id, label);
  });
  s.on("label:deleted", ({ columnId, labelId }) => {
    useBoardStore.getState().deleteLabel(columnId, labelId);
  });
  s.on("board:created", (board) => {
    useWorkspaceStore.getState().addBoard(board);
  });
  s.on("board:updated", (data) => {
    useWorkspaceStore.getState().updateBoard(data.id, data);
    const currentBoard = useBoardStore.getState().currentBoard;
    if (currentBoard?.id === data.id) {
      useBoardStore.getState().setBoard({
        ...currentBoard,
        ...data,
        columns: currentBoard.columns,
        items: currentBoard.items,
        groups: currentBoard.groups,
      });
    }
  });
  s.on("board:deleted", ({ boardId }) => {
    useWorkspaceStore.getState().deleteBoard(boardId);
  });
  s.on("member:added", () => {});
  s.on("member:removed", () => {});
};

export const initSocket = () => {
  const { accessToken } = useAuthStore.getState();

  if (!accessToken) return null;
  if (socket?.connected) return socket;
  if (isInitializing) return socket;

  isInitializing = true;

  if (socket) {
    socket.auth = { token: accessToken };
    socket.connect();
    isInitializing = false;
    return socket;
  }

  socket = io(WS_URL, {
    auth: { token: accessToken },
    transports: ["websocket", "polling"],
    upgrade: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 500,
    reconnectionDelayMax: 8000,
    randomizationFactor: 0.3,
    timeout: 10000,
    forceNew: false,
    withCredentials: false,
  });

  socket.on("connect", () => {
    isInitializing = false;
    rejoinRooms();
    flushPendingJoins();
  });

  socket.on("disconnect", (reason) => {
    if (reason === "io server disconnect") {
      setTimeout(() => {
        const { accessToken: token } = useAuthStore.getState();
        if (token && socket) {
          socket.auth = { token };
          socket.connect();
        }
      }, 500);
    }
  });

  socket.on("connect_error", (error) => {
    isInitializing = false;
    if (
      error.message?.includes("auth") ||
      error.message?.includes("unauthorized")
    ) {
      const { accessToken: freshToken } = useAuthStore.getState();
      if (freshToken && socket) {
        socket.auth = { token: freshToken };
      } else {
        socket.disconnect();
      }
    }
  });

  socket.on("reconnect", () => {
    rejoinRooms();
    flushPendingJoins();
  });

  registerEventHandlers(socket);
  isInitializing = false;
  return socket;
};

export const updateSocketAuth = () => {
  const { accessToken } = useAuthStore.getState();
  if (socket && accessToken) {
    socket.auth = { token: accessToken };
    if (!socket.connected) {
      socket.connect();
    }
  }
};

export const getSocket = () => socket;
export const isSocketConnected = () => socket?.connected ?? false;

export const joinWorkspace = (workspaceId) => {
  currentRooms.workspaces.add(workspaceId);
  if (socket?.connected) {
    socket.emit("join:workspace", workspaceId);
  } else {
    pendingJoins.push(() => socket?.emit("join:workspace", workspaceId));
  }
};

export const leaveWorkspace = (workspaceId) => {
  currentRooms.workspaces.delete(workspaceId);
  if (socket?.connected) {
    socket.emit("leave:workspace", workspaceId);
  }
};

export const joinBoard = (boardId) => {
  currentRooms.boards.add(boardId);
  if (socket?.connected) {
    socket.emit("join:board", boardId);
  } else {
    pendingJoins.push(() => socket?.emit("join:board", boardId));
  }
};

export const leaveBoard = (boardId) => {
  currentRooms.boards.delete(boardId);
  if (socket?.connected) {
    socket.emit("leave:board", boardId);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    currentRooms.workspaces.clear();
    currentRooms.boards.clear();
    pendingJoins = [];
    socket.disconnect();
    socket = null;
    isInitializing = false;
  }
};
