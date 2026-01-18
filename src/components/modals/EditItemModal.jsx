import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Type, Hash, Calendar, User, CheckCircle, Flag, BarChart3, Plus, Users, FolderPlus } from 'lucide-react';
import { itemApi, memberApi, groupApi } from '../../lib/api';
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

export default function EditItemModal({ isOpen, onClose, item, workspaceId }) {
  const { columns, groups, updateItem, updateItemValue, deleteItem, currentBoard, addGroup } = useBoardStore();
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#6366f1');
  const [formData, setFormData] = useState({
    name: '',
    groupId: '',
    values: {},
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        groupId: item.groupId || '',
        values: { ...item.values } || {},
      });
    }
  }, [item]);

  // Load workspace members
  useEffect(() => {
    const loadMembers = async () => {
      const wsId = workspaceId || currentBoard?.workspaceId;
      if (wsId && isOpen) {
        try {
          const { data } = await memberApi.getByWorkspace(wsId);
          setMembers(data);
        } catch (error) {
          console.error('Error loading members:', error);
        }
      }
    };
    loadMembers();
  }, [workspaceId, currentBoard?.workspaceId, isOpen]);

  // Get member name by ID
  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member ? `${member.firstName} ${member.lastName}` : memberId;
  };

  const handleValueChange = (columnId, value) => {
    setFormData(prev => ({
      ...prev,
      values: { ...prev.values, [columnId]: value },
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim() || !item || isLoading) return;

    setIsLoading(true);
    try {
      // Update item name and group
      await itemApi.update(item.id, {
        name: formData.name.trim(),
        groupId: formData.groupId || null,
      });

      // Update values that changed - collect promises to run in parallel
      const updatePromises = [];
      for (const [columnId, value] of Object.entries(formData.values)) {
        if (item.values?.[columnId] !== value) {
          updatePromises.push(itemApi.updateValue(item.id, columnId, value));
        }
      }
      
      // Execute all value updates in parallel
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      updateItem(item.id, {
        name: formData.name.trim(),
        groupId: formData.groupId || null,
        values: formData.values,
      });

      toast.success('Item modifié avec succès');
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la modification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet item ?')) return;

    try {
      await itemApi.delete(item.id);
      deleteItem(item.id);
      toast.success('Item supprimé');
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !currentBoard) return;

    try {
      const { data } = await groupApi.create({
        boardId: currentBoard.id,
        name: newGroupName.trim(),
        color: newGroupColor,
      });
      
      addGroup(data);
      setFormData({ ...formData, groupId: data.id });
      setShowNewGroup(false);
      setNewGroupName('');
      toast.success('Groupe créé');
    } catch (error) {
      toast.error('Erreur lors de la création du groupe');
    }
  };

  const renderColumnInput = (column) => {
    const value = formData.values[column.id];
    const Icon = columnIcons[column.type] || Type;

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
        // Safely parse the date value
        let dateValue = '';
        if (value) {
          const parsedDate = new Date(value);
          if (!isNaN(parsedDate.getTime())) {
            dateValue = parsedDate.toISOString().split('T')[0];
          }
        }
        return (
          <input
            type="date"
            value={dateValue}
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
                {label.label || label.name}
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

      case 'person':
        const personIds = Array.isArray(value) ? value : (value ? [value] : []);
        return (
          <div className="space-y-2">
            {/* Current assignments */}
            {personIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {personIds.map((personId) => (
                  <span 
                    key={personId}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary-500/20 text-primary-400 rounded-lg text-sm"
                  >
                    <User className="w-3 h-3" />
                    {getMemberName(personId)}
                    <button
                      type="button"
                      onClick={() => {
                        const newIds = personIds.filter(id => id !== personId);
                        handleValueChange(column.id, newIds.length > 0 ? newIds : null);
                      }}
                      className="ml-1 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {/* Add new person */}
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  const newIds = [...personIds, e.target.value];
                  handleValueChange(column.id, newIds);
                }
              }}
              className="input text-sm"
            >
              <option value="">+ Ajouter un responsable...</option>
              {members
                .filter(m => !personIds.includes(m.id))
                .map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
            </select>
          </div>
        );

      case 'files':
        // Files type - show info
        const files = Array.isArray(value) ? value : [];
        return (
          <div className="text-sm text-surface-400 italic">
            {files.length > 0 
              ? `${files.length} fichier(s) attaché(s)`
              : 'Utilisez le tableau pour gérer les fichiers'
            }
          </div>
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

  if (!isOpen || !item) return null;

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
          className="modal-content max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-surface-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
                <Save className="w-5 h-5 text-primary-400" />
              </div>
              <h2 className="text-lg font-semibold text-surface-100">
                Modifier l'item
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
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Nom de l'item *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom de l'item..."
                className="input text-lg font-medium"
                required
              />
            </div>

            {/* Group */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Groupe
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.groupId}
                  onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                  className="input flex-1"
                >
                  <option value="">Aucun groupe</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewGroup(!showNewGroup)}
                  className="btn btn-secondary px-3"
                  title="Créer un groupe"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
              </div>
              
              {/* New Group Form */}
              <AnimatePresence>
                {showNewGroup && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-3 bg-surface-800/50 rounded-lg border border-surface-700 space-y-3">
                      <p className="text-sm font-medium text-surface-300">Nouveau groupe</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="Nom du groupe"
                          className="input flex-1"
                        />
                        <input
                          type="color"
                          value={newGroupColor}
                          onChange={(e) => setNewGroupColor(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewGroup(false);
                            setNewGroupName('');
                          }}
                          className="btn btn-ghost text-sm flex-1"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateGroup}
                          disabled={!newGroupName.trim()}
                          className="btn btn-primary text-sm flex-1"
                        >
                          <Plus className="w-4 h-4" />
                          Créer
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Columns */}
            {columns.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-surface-400 uppercase tracking-wider">
                  Propriétés
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            )}
          </form>

          {/* Actions */}
          <div className="flex items-center justify-between p-6 border-t border-surface-700 bg-surface-800/50">
            <button
              type="button"
              onClick={handleDelete}
              className="btn btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer</span>
            </button>
            
            <div className="flex items-center gap-3">
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
                    <Save className="w-4 h-4" />
                    <span>Enregistrer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
