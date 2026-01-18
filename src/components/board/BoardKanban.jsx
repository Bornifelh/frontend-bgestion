import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, Trash2, Edit2, GripVertical, User, Calendar, CheckCircle2 } from 'lucide-react';
import { useBoardStore } from '../../stores/boardStore';
import { itemApi, memberApi } from '../../lib/api';
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import EditItemModal from '../modals/EditItemModal';

export default function BoardKanban() {
  const { currentBoard, columns, groups, items, addItem, updateItemValue, deleteItem } = useBoardStore();
  const [newItemName, setNewItemName] = useState({});
  const [showNewItem, setShowNewItem] = useState({});
  const [activeMenu, setActiveMenu] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [editingItem, setEditingItem] = useState(null);

  // Load workspace members for displaying names
  useEffect(() => {
    const loadMembers = async () => {
      if (!currentBoard?.workspaceId) return;
      try {
        const response = await memberApi.getByWorkspace(currentBoard.workspaceId);
        setWorkspaceMembers(response.data || []);
      } catch (error) {
        console.error('Failed to load members:', error);
      }
    };
    loadMembers();
  }, [currentBoard?.workspaceId]);

  // Helper to get member name by ID
  const getMemberName = (memberId) => {
    const member = workspaceMembers.find(m => m.id === memberId);
    if (member) {
      return `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email?.split('@')[0] || 'Membre';
    }
    return null;
  };

  // Helper to format column values for display
  const formatColumnValue = (column, value) => {
    if (!value) return null;

    switch (column.type) {
      case 'person': {
        // Value can be: array of IDs, single ID string, or object with userIds
        let userIds = [];
        if (Array.isArray(value)) {
          userIds = value;
        } else if (typeof value === 'string') {
          userIds = [value];
        } else if (value?.userIds) {
          userIds = Array.isArray(value.userIds) ? value.userIds : [value.userIds];
        }
        
        if (userIds.length === 0) return null;
        
        const names = userIds
          .map(id => getMemberName(id))
          .filter(Boolean);
        
        if (names.length === 0) return null;
        
        return (
          <div className="flex items-center gap-1">
            <User className="w-3 h-3 text-primary-400" />
            <span className="text-surface-200 truncate font-medium">
              {names.join(', ')}
            </span>
          </div>
        );
      }
      
      case 'date': {
        const dateStr = typeof value === 'object' ? value?.date : value;
        if (!dateStr) return null;
        const date = new Date(dateStr);
        if (!isValid(date)) return null;
        
        return (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-surface-500" />
            <span className="text-surface-300">
              {format(date, 'd MMM', { locale: fr })}
            </span>
          </div>
        );
      }
      
      case 'progress': {
        const progress = typeof value === 'object' ? (value?.progress ?? 0) : (parseInt(value) || 0);
        const color = progress >= 100 ? '#22c55e' : progress >= 50 ? '#eab308' : '#ef4444';
        
        return (
          <div className="flex items-center gap-1">
            <div className="w-12 h-1.5 bg-surface-700 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-surface-400 text-[10px]">{progress}%</span>
          </div>
        );
      }
      
      case 'priority': {
        const priorityLabels = column.labels || [];
        const label = priorityLabels.find(l => l.id === value || l.name === value);
        if (label) {
          return (
            <span 
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: `${label.color}20`, color: label.color }}
            >
              {label.name || label.label}
            </span>
          );
        }
        return <span className="text-surface-400">{String(value)}</span>;
      }
      
      default:
        if (typeof value === 'object') {
          return null; // Don't show complex objects
        }
        return <span className="text-surface-400 truncate">{String(value)}</span>;
    }
  };

  // Find status column for Kanban grouping
  const statusColumn = useMemo(() => {
    return columns.find(col => col.type === 'status') || columns[0];
  }, [columns]);

  // Get status labels or create default ones
  const statusLabels = useMemo(() => {
    if (statusColumn?.labels?.length > 0) {
      return statusColumn.labels;
    }
    // Default labels if no status column
    return [
      { id: 'todo', name: 'À faire', color: '#6b7280' },
      { id: 'in_progress', name: 'En cours', color: '#3b82f6' },
      { id: 'done', name: 'Terminé', color: '#10b981' },
    ];
  }, [statusColumn]);

  // Group items by status
  const itemsByStatus = useMemo(() => {
    const result = {};
    statusLabels.forEach(label => {
      result[label.id] = items.filter(item => {
        const value = item.values?.[statusColumn?.id];
        return value === label.id || (!value && label.id === statusLabels[0]?.id);
      });
    });
    return result;
  }, [items, statusColumn, statusLabels]);

  const handleCreateItem = async (statusId) => {
    const name = newItemName[statusId];
    if (!name?.trim()) return;

    try {
      const response = await itemApi.create({
        boardId: currentBoard.id,
        name: name.trim(),
      });
      
      // Set initial status value
      if (statusColumn) {
        await itemApi.updateValue(response.data.id, statusColumn.id, statusId);
      }
      
      addItem({
        ...response.data,
        values: { [statusColumn?.id]: statusId }
      });
      setNewItemName({ ...newItemName, [statusId]: '' });
      setShowNewItem({ ...showNewItem, [statusId]: false });
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, statusId) => {
    e.preventDefault();
    if (!draggedItem || !statusColumn) return;

    try {
      await itemApi.updateValue(draggedItem.id, statusColumn.id, statusId);
      updateItemValue(draggedItem.id, statusColumn.id, statusId);
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error('Erreur');
    }
    setDraggedItem(null);
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await itemApi.delete(itemId);
      deleteItem(itemId);
      toast.success('Item supprimé');
    } catch (error) {
      toast.error('Erreur');
    }
    setActiveMenu(null);
  };

  if (!statusColumn) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-surface-400 mb-4">Ajoutez une colonne "Statut" pour utiliser la vue Kanban</p>
        <p className="text-sm text-surface-500">
          La vue Kanban utilise une colonne de type Statut pour organiser les items
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {statusLabels.map((status) => (
        <div
          key={status.id}
          className="flex-shrink-0 w-72 flex flex-col bg-surface-800/30 rounded-xl"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status.id)}
        >
          {/* Column Header */}
          <div className="p-3 border-b border-surface-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: status.color || '#6b7280' }}
                />
                <span className="font-medium text-surface-200 text-sm">
                  {status.name || status.label || 'Sans nom'}
                </span>
                <span className="text-sm text-surface-500">
                  {itemsByStatus[status.id]?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]">
            <AnimatePresence>
              {itemsByStatus[status.id]?.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  className={`group p-3 bg-surface-800 rounded-lg border border-surface-700 cursor-grab hover:border-surface-600 transition-colors ${
                    draggedItem?.id === item.id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-surface-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex-1 min-w-0">
                      <p 
                        className="font-medium text-surface-200 text-sm hover:text-primary-400 cursor-pointer transition-colors"
                        onClick={() => setEditingItem(item)}
                      >
                        {item.name}
                      </p>
                      
                      {/* Show other column values */}
                      <div className="mt-2 space-y-1.5">
                        {columns.filter(c => c.id !== statusColumn.id && c.type !== 'status').slice(0, 3).map(col => {
                          const value = item.values?.[col.id];
                          const formattedValue = formatColumnValue(col, value);
                          if (!formattedValue) return null;
                          return (
                            <div key={col.id} className="text-xs">
                              {formattedValue}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                        className="p-1 rounded hover:bg-surface-700 text-surface-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      
                      {activeMenu === item.id && (
                        <div className="absolute right-0 top-6 z-10 bg-surface-800 border border-surface-700 rounded-lg shadow-lg py-1 min-w-[120px]">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setActiveMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-300 hover:bg-surface-700"
                          >
                            <Edit2 className="w-4 h-4" />
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-surface-700"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Drop zone indicator */}
            {draggedItem && (
              <div className="h-16 border-2 border-dashed border-primary-500/30 rounded-lg flex items-center justify-center">
                <span className="text-sm text-primary-400">Déposer ici</span>
              </div>
            )}
          </div>

          {/* Add item */}
          <div className="p-2 border-t border-surface-700/50">
            {showNewItem[status.id] ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Nom de l'item..."
                  value={newItemName[status.id] || ''}
                  onChange={(e) => setNewItemName({ ...newItemName, [status.id]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateItem(status.id);
                    if (e.key === 'Escape') setShowNewItem({ ...showNewItem, [status.id]: false });
                  }}
                  autoFocus
                  className="w-full px-3 py-2 bg-surface-700 border border-surface-600 rounded-lg text-sm text-surface-200 focus:outline-none focus:border-primary-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCreateItem(status.id)}
                    className="flex-1 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-400"
                  >
                    Ajouter
                  </button>
                  <button
                    onClick={() => setShowNewItem({ ...showNewItem, [status.id]: false })}
                    className="px-3 py-1.5 text-surface-400 hover:text-surface-200 text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewItem({ ...showNewItem, [status.id]: true })}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-surface-500 hover:text-surface-300 hover:bg-surface-700/50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter un item
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Edit Item Modal */}
      <EditItemModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        workspaceId={currentBoard?.workspaceId}
      />
    </div>
  );
}
