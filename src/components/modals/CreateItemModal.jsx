import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Type, Hash, Calendar, User, CheckCircle, Flag, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { itemApi } from '../../lib/api';
import { useBoardStore } from '../../stores/boardStore';
import toast from 'react-hot-toast';

const columnIcons = {
  text: Type,
  number: Hash,
  date: Calendar,
  person: User,
  status: CheckCircle,
  priority: Flag,
  progress: BarChart3,
  checkbox: CheckCircle,
};

export default function CreateItemModal({ isOpen, onClose }) {
  const { currentBoard, groups, columns, addItem } = useBoardStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    groupId: '',
    values: {},
  });

  const handleValueChange = (columnId, value) => {
    setFormData(prev => ({
      ...prev,
      values: { ...prev.values, [columnId]: value },
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim() || !currentBoard || isLoading) return;

    setIsLoading(true);
    try {
      const response = await itemApi.create({
        boardId: currentBoard.id,
        groupId: formData.groupId || null,
        name: formData.name.trim(),
      });

      // Set initial values for columns - run in parallel
      const updatePromises = [];
      for (const [columnId, value] of Object.entries(formData.values)) {
        if (value !== undefined && value !== '') {
          updatePromises.push(itemApi.updateValue(response.data.id, columnId, value));
        }
      }
      
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      addItem({
        ...response.data,
        values: formData.values,
      });
      toast.success('Item créé avec succès');
      onClose();
      setFormData({ name: '', groupId: '', values: {} });
      setShowAdvanced(false);
    } catch (error) {
      toast.error('Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  const renderColumnInput = (column) => {
    const value = formData.values[column.id];

    switch (column.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleValueChange(column.id, e.target.value)}
            placeholder={`Entrer ${column.title}...`}
            className="input"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleValueChange(column.id, e.target.value)}
            placeholder="0"
            className="input"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleValueChange(column.id, e.target.value)}
            className="input"
          />
        );

      case 'status':
        return (
          <div className="flex flex-wrap gap-2">
            {column.labels?.map((label) => (
              <button
                key={label.id}
                type="button"
                onClick={() => handleValueChange(column.id, label.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  value === label.id
                    ? 'ring-2 ring-white/50 scale-105'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: label.color, color: 'white' }}
              >
                {label.name}
              </button>
            ))}
          </div>
        );

      case 'priority':
        const priorities = [
          { id: 'low', name: 'Basse', color: '#6b7280' },
          { id: 'medium', name: 'Moyenne', color: '#f59e0b' },
          { id: 'high', name: 'Haute', color: '#ef4444' },
          { id: 'critical', name: 'Critique', color: '#7c3aed' },
        ];
        return (
          <div className="flex flex-wrap gap-2">
            {priorities.map((priority) => (
              <button
                key={priority.id}
                type="button"
                onClick={() => handleValueChange(column.id, priority.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  value === priority.id
                    ? 'ring-2 ring-white/50 scale-105'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: priority.color, color: 'white' }}
              >
                {priority.name}
              </button>
            ))}
          </div>
        );

      case 'progress':
        // Handle both number and {progress: number} formats
        const progressValue = typeof value === 'object' ? (value?.progress ?? 0) : (value ?? 0);
        return (
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              value={progressValue}
              onChange={(e) => handleValueChange(column.id, { progress: parseInt(e.target.value) })}
              className="w-full h-2 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">0%</span>
              <span className="text-primary-400 font-medium">{progressValue}%</span>
              <span className="text-surface-500">100%</span>
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleValueChange(column.id, e.target.checked)}
              className="w-5 h-5 rounded border-surface-600 bg-surface-800 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-surface-300">{value ? 'Oui' : 'Non'}</span>
          </label>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleValueChange(column.id, e.target.value)}
            placeholder={`Entrer ${column.title}...`}
            className="input"
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="modal-content max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-surface-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary-400" />
              </div>
              <h2 className="text-lg font-semibold text-surface-100">
                Nouvel item
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-700 text-surface-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Nom de l'item *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nouvelle tâche..."
                className="input"
                required
                autoFocus
              />
            </div>

            {/* Group */}
            {groups.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  Groupe
                </label>
                <select
                  value={formData.groupId}
                  onChange={(e) =>
                    setFormData({ ...formData, groupId: e.target.value })
                  }
                  className="input"
                >
                  <option value="">Aucun groupe</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Advanced options toggle */}
            {columns.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showAdvanced ? 'Masquer les propriétés' : 'Définir les propriétés'}
              </button>
            )}

            {/* Column values */}
            <AnimatePresence>
              {showAdvanced && columns.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 pt-2 border-t border-surface-700">
                    {columns.map((column) => {
                      const Icon = columnIcons[column.type] || Type;
                      return (
                        <div key={column.id} className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-surface-300">
                            <Icon className="w-4 h-4 text-surface-500" />
                            {column.title}
                          </label>
                          {renderColumnInput(column)}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-surface-700">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !formData.name.trim()}
              className="btn btn-primary"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Créer</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
