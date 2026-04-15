import { create } from 'zustand';

export const useWorkspaceStore = create((set) => ({
  workspaces: [],
  currentWorkspace: null,
  boards: [],

  setWorkspaces: (workspaces) => set({ workspaces }),

  addWorkspace: (workspace) => {
    set((state) => ({
      workspaces: [...state.workspaces, workspace],
    }));
  },

  updateWorkspace: (workspaceId, updates) => {
    set((state) => ({
      workspaces: state.workspaces.map((ws) =>
        ws.id === workspaceId ? { ...ws, ...updates } : ws
      ),
      currentWorkspace:
        state.currentWorkspace?.id === workspaceId
          ? { ...state.currentWorkspace, ...updates }
          : state.currentWorkspace,
    }));
  },

  deleteWorkspace: (workspaceId) => {
    set((state) => ({
      workspaces: state.workspaces.filter((ws) => ws.id !== workspaceId),
      currentWorkspace:
        state.currentWorkspace?.id === workspaceId
          ? null
          : state.currentWorkspace,
    }));
  },

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

  setBoards: (boards) => set({ boards }),

  addBoard: (board) => {
    set((state) => {
      // Prevent duplicates by checking if board already exists
      const exists = state.boards.some((b) => b.id === board.id);
      if (exists) {
        return state; // Don't add if already exists
      }
      return {
        boards: [...state.boards, board],
      };
    });
  },

  updateBoard: (boardId, updates) => {
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId ? { ...board, ...updates } : board
      ),
    }));
  },

  deleteBoard: (boardId) => {
    set((state) => ({
      boards: state.boards.filter((board) => board.id !== boardId),
    }));
  },
}));
