import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useBoardStore } from '../stores/boardStore';
import { useWorkspaceStore } from '../stores/workspaceStore';

let socket = null;

export const initSocket = () => {
  const { accessToken } = useAuthStore.getState();

  if (!accessToken) {
    console.warn('No access token, cannot initialize socket');
    return null;
  }

  if (socket?.connected) {
    return socket;
  }

  socket = io({
    auth: {
      token: accessToken,
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  // Board events
  socket.on('item:created', (data) => {
    useBoardStore.getState().addItem(data);
  });

  socket.on('item:updated', (data) => {
    useBoardStore.getState().updateItem(data.id, data);
  });

  socket.on('item:value_updated', ({ itemId, columnId, value }) => {
    useBoardStore.getState().updateItemValue(itemId, columnId, value);
  });

  socket.on('item:deleted', ({ itemId }) => {
    useBoardStore.getState().deleteItem(itemId);
  });

  socket.on('items:deleted', ({ itemIds }) => {
    useBoardStore.getState().deleteItems(itemIds);
  });

  socket.on('items:reordered', ({ items }) => {
    useBoardStore.getState().reorderItems(items);
  });

  socket.on('column:created', (data) => {
    useBoardStore.getState().addColumn(data);
  });

  socket.on('column:updated', (data) => {
    useBoardStore.getState().updateColumn(data.id, data);
  });

  socket.on('column:deleted', ({ columnId }) => {
    useBoardStore.getState().deleteColumn(columnId);
  });

  socket.on('columns:reordered', ({ columns }) => {
    useBoardStore.getState().reorderColumns(columns);
  });

  socket.on('label:created', ({ columnId, label }) => {
    useBoardStore.getState().addLabel(columnId, label);
  });

  socket.on('label:updated', ({ columnId, label }) => {
    useBoardStore.getState().updateLabel(columnId, label.id, label);
  });

  socket.on('label:deleted', ({ columnId, labelId }) => {
    useBoardStore.getState().deleteLabel(columnId, labelId);
  });

  // Workspace events
  socket.on('board:created', (board) => {
    useWorkspaceStore.getState().addBoard(board);
  });

  socket.on('board:updated', (data) => {
    useWorkspaceStore.getState().updateBoard(data.id, data);
    const currentBoard = useBoardStore.getState().currentBoard;
    if (currentBoard?.id === data.id) {
      useBoardStore.getState().setBoard({ ...currentBoard, ...data });
    }
  });

  socket.on('board:deleted', ({ boardId }) => {
    useWorkspaceStore.getState().deleteBoard(boardId);
  });

  socket.on('member:added', ({ member }) => {
    // Could update workspace members list
    console.log('Member added:', member);
  });

  socket.on('member:removed', ({ memberId }) => {
    // Could update workspace members list
    console.log('Member removed:', memberId);
  });

  return socket;
};

export const getSocket = () => socket;

export const joinWorkspace = (workspaceId) => {
  if (socket?.connected) {
    socket.emit('join:workspace', workspaceId);
  }
};

export const leaveWorkspace = (workspaceId) => {
  if (socket?.connected) {
    socket.emit('leave:workspace', workspaceId);
  }
};

export const joinBoard = (boardId) => {
  if (socket?.connected) {
    socket.emit('join:board', boardId);
  }
};

export const leaveBoard = (boardId) => {
  if (socket?.connected) {
    socket.emit('leave:board', boardId);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
