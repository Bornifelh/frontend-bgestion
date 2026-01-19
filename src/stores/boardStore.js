import { create } from 'zustand';

export const useBoardStore = create((set, get) => ({
  currentBoard: null,
  columns: [],
  groups: [],
  items: [],
  views: [],
  selectedItems: [],
  activeView: 'table',
  filters: [],
  sorts: [],
  filter: { searchTerm: '', status: '', priority: '' },

  setBoard: (board) => {
    set({
      currentBoard: board,
      columns: board.columns || [],
      groups: board.groups || [],
      items: board.items || [],
      views: board.views || [],
      selectedItems: [],
    });
  },

  clearBoard: () => {
    set({
      currentBoard: null,
      columns: [],
      groups: [],
      items: [],
      views: [],
      selectedItems: [],
    });
  },

  // Items
  addItem: (item) => {
    set((state) => {
      // Prevent duplicates
      const exists = state.items.some((i) => i.id === item.id);
      if (exists) {
        return state;
      }
      return {
        items: [...state.items, item],
      };
    });
  },

  updateItem: (itemId, updates) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    }));
  },

  updateItemValue: (itemId, columnId, value) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId
          ? { ...item, values: { ...item.values, [columnId]: value } }
          : item
      ),
    }));
  },

  deleteItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
      selectedItems: state.selectedItems.filter((id) => id !== itemId),
    }));
  },

  deleteItems: (itemIds) => {
    set((state) => ({
      items: state.items.filter((item) => !itemIds.includes(item.id)),
      selectedItems: state.selectedItems.filter((id) => !itemIds.includes(id)),
    }));
  },

  reorderItems: (updates) => {
    set((state) => {
      const itemsMap = new Map(state.items.map((item) => [item.id, item]));
      updates.forEach(({ id, position, groupId }) => {
        const item = itemsMap.get(id);
        if (item) {
          item.position = position;
          if (groupId !== undefined) {
            item.groupId = groupId;
          }
        }
      });
      return { items: Array.from(itemsMap.values()) };
    });
  },

  // Selection
  toggleItemSelection: (itemId) => {
    set((state) => ({
      selectedItems: state.selectedItems.includes(itemId)
        ? state.selectedItems.filter((id) => id !== itemId)
        : [...state.selectedItems, itemId],
    }));
  },

  selectAllItems: () => {
    set((state) => ({
      selectedItems: state.items.map((item) => item.id),
    }));
  },

  clearSelection: () => {
    set({ selectedItems: [] });
  },

  // Columns
  addColumn: (column) => {
    set((state) => {
      // Prevent duplicates
      const exists = state.columns.some((c) => c.id === column.id);
      if (exists) {
        return state;
      }
      return {
        columns: [...state.columns, column],
      };
    });
  },

  updateColumn: (columnId, updates) => {
    set((state) => ({
      columns: state.columns.map((col) =>
        col.id === columnId ? { ...col, ...updates } : col
      ),
    }));
  },

  deleteColumn: (columnId) => {
    set((state) => ({
      columns: state.columns.filter((col) => col.id !== columnId),
    }));
  },

  reorderColumns: (updates) => {
    set((state) => {
      const columnsMap = new Map(state.columns.map((col) => [col.id, col]));
      updates.forEach(({ id, position }) => {
        const col = columnsMap.get(id);
        if (col) {
          col.position = position;
        }
      });
      return {
        columns: Array.from(columnsMap.values()).sort(
          (a, b) => a.position - b.position
        ),
      };
    });
  },

  // Labels
  addLabel: (columnId, label) => {
    set((state) => ({
      columns: state.columns.map((col) =>
        col.id === columnId
          ? { ...col, labels: [...(col.labels || []), label] }
          : col
      ),
    }));
  },

  updateLabel: (columnId, labelId, updates) => {
    set((state) => ({
      columns: state.columns.map((col) =>
        col.id === columnId
          ? {
              ...col,
              labels: col.labels.map((label) =>
                label.id === labelId ? { ...label, ...updates } : label
              ),
            }
          : col
      ),
    }));
  },

  deleteLabel: (columnId, labelId) => {
    set((state) => ({
      columns: state.columns.map((col) =>
        col.id === columnId
          ? { ...col, labels: col.labels.filter((l) => l.id !== labelId) }
          : col
      ),
    }));
  },

  // Groups
  addGroup: (group) => {
    set((state) => {
      // Prevent duplicates
      const exists = state.groups.some((g) => g.id === group.id);
      if (exists) {
        return state;
      }
      return {
        groups: [...state.groups, group],
      };
    });
  },

  updateGroup: (groupId, updates) => {
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group
      ),
    }));
  },

  deleteGroup: (groupId) => {
    set((state) => ({
      groups: state.groups.filter((group) => group.id !== groupId),
      items: state.items.map((item) =>
        item.groupId === groupId ? { ...item, groupId: null } : item
      ),
    }));
  },

  toggleGroupCollapse: (groupId) => {
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === groupId
          ? { ...group, isCollapsed: !group.isCollapsed }
          : group
      ),
    }));
  },

  // View
  setActiveView: (view) => set({ activeView: view }),
  setFilters: (filters) => set({ filters }),
  setSorts: (sorts) => set({ sorts }),
  setFilter: (filter) => set({ filter }),

  // Get filtered items
  getFilteredItems: () => {
    const state = get();
    const { items, columns, filter } = state;
    
    if (!filter.searchTerm && !filter.status && !filter.priority) {
      return items;
    }

    return items.filter(item => {
      // Search term filter
      if (filter.searchTerm) {
        const search = filter.searchTerm.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(search);
        const valuesMatch = Object.values(item.values || {}).some(v => 
          String(v).toLowerCase().includes(search)
        );
        if (!nameMatch && !valuesMatch) return false;
      }

      // Status filter
      if (filter.status) {
        const statusCol = columns.find(c => c.type === 'status');
        if (statusCol) {
          const itemStatus = item.values?.[statusCol.id];
          if (itemStatus !== filter.status) return false;
        }
      }

      // Priority filter
      if (filter.priority) {
        const priorityCol = columns.find(c => c.type === 'priority');
        if (priorityCol) {
          const itemPriority = item.values?.[priorityCol.id];
          if (itemPriority !== filter.priority) return false;
        }
      }

      return true;
    });
  },
}));
