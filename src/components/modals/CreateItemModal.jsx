import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Type, Hash, Calendar, User, CheckCircle, Flag, BarChart3, ChevronDown, ChevronUp, Search, Check, Upload, FileText, Loader2, Trash2 } from 'lucide-react';
import { itemApi, memberApi, fileApi } from '../../lib/api';
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
  files: FileText,
  file: FileText,
};

// Helper for avatar colors
const getAvatarColor = (user) => {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'
  ];
  const index = (user?.id || user?.email || '').toString().charCodeAt(0) % colors.length;
  return colors[index];
};

const getInitials = (user) => {
  if (user?.firstName && user?.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  return user?.email?.[0]?.toUpperCase() || '?';
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
  
  // State for person selection
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [searchQueries, setSearchQueries] = useState({});
  const [openPersonDropdown, setOpenPersonDropdown] = useState(null);
  
  // State for file uploads
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [pendingFiles, setPendingFiles] = useState({}); // Files to upload when item is created
  const fileInputRefs = useRef({});

  // Load workspace members when modal opens
  useEffect(() => {
    if (isOpen && currentBoard?.workspaceId) {
      loadWorkspaceMembers();
    }
  }, [isOpen, currentBoard?.workspaceId]);

  const loadWorkspaceMembers = async () => {
    if (!currentBoard?.workspaceId || membersLoading) return;
    
    setMembersLoading(true);
    try {
      const response = await memberApi.getByWorkspace(currentBoard.workspaceId);
      setWorkspaceMembers(response.data || []);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setMembersLoading(false);
    }
  };

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

      const itemId = response.data.id;
      const finalValues = { ...formData.values };

      // Upload pending files first
      for (const [columnId, files] of Object.entries(pendingFiles)) {
        if (files && files.length > 0) {
          const uploadedFiles = [];
          for (const file of files) {
            try {
              const uploadResponse = await fileApi.upload(file, itemId, columnId);
              if (uploadResponse.data?.file) {
                uploadedFiles.push(uploadResponse.data.file);
              }
            } catch (err) {
              console.error('File upload error:', err);
              toast.error(`Erreur lors de l'upload de ${file.name}`);
            }
          }
          if (uploadedFiles.length > 0) {
            finalValues[columnId] = uploadedFiles;
          }
        }
      }

      // Set initial values for columns - run in parallel
      const updatePromises = [];
      for (const [columnId, value] of Object.entries(finalValues)) {
        if (value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)) {
          updatePromises.push(itemApi.updateValue(itemId, columnId, value));
        }
      }
      
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      addItem({
        ...response.data,
        values: finalValues,
      });
      toast.success('Item créé avec succès');
      handleClose();
    } catch (error) {
      toast.error('Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', groupId: '', values: {} });
    setShowAdvanced(false);
    setPendingFiles({});
    setSearchQueries({});
    setOpenPersonDropdown(null);
    onClose();
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

      case 'person': {
        const selectedUserIds = Array.isArray(value) ? value : [];
        const selectedUsers = workspaceMembers.filter(m => selectedUserIds.includes(m.id));
        const searchQuery = searchQueries[column.id] || '';
        const filteredMembers = workspaceMembers.filter(member => {
          if (!searchQuery) return true;
          const q = searchQuery.toLowerCase();
          return member.fullName?.toLowerCase().includes(q) || 
                 member.email?.toLowerCase().includes(q);
        });
        const isDropdownOpen = openPersonDropdown === column.id;

        const toggleUser = (userId) => {
          const newIds = selectedUserIds.includes(userId)
            ? selectedUserIds.filter(id => id !== userId)
            : [...selectedUserIds, userId];
          handleValueChange(column.id, newIds);
        };

        return (
          <div className="relative">
            {/* Selected users display */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-1.5 px-2 py-1 bg-surface-700 rounded-full text-xs"
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white font-medium"
                      style={{ backgroundColor: getAvatarColor(user) }}
                    >
                      {getInitials(user)}
                    </div>
                    <span className="text-surface-300">
                      {user.firstName || user.email?.split('@')[0]}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleUser(user.id)}
                      className="p-0.5 hover:bg-surface-600 rounded-full text-surface-500 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search input */}
            <div 
              className="relative cursor-pointer"
              onClick={() => setOpenPersonDropdown(isDropdownOpen ? null : column.id)}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
              <input
                type="text"
                placeholder="Rechercher un membre..."
                value={searchQuery}
                onChange={(e) => {
                  e.stopPropagation();
                  setSearchQueries(prev => ({ ...prev, [column.id]: e.target.value }));
                  if (!isDropdownOpen) setOpenPersonDropdown(column.id);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isDropdownOpen) setOpenPersonDropdown(column.id);
                }}
                className="w-full pl-9 pr-3 py-2 bg-surface-700 border-none rounded-lg text-sm text-surface-200 placeholder-surface-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-surface-800 border border-surface-700 rounded-lg shadow-xl">
                {membersLoading ? (
                  <div className="p-3 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary-500" />
                  </div>
                ) : filteredMembers.length > 0 ? (
                  filteredMembers.map(member => {
                    const isSelected = selectedUserIds.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => toggleUser(member.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-700 transition-colors ${
                          isSelected ? 'bg-primary-600/10' : ''
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white font-medium"
                          style={{ backgroundColor: getAvatarColor(member) }}
                        >
                          {getInitials(member)}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm text-surface-200">
                            {member.fullName || member.email}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary-400" />}
                      </button>
                    );
                  })
                ) : (
                  <p className="p-3 text-sm text-surface-500 text-center">Aucun membre trouvé</p>
                )}
              </div>
            )}
          </div>
        );
      }

      case 'files':
      case 'file': {
        const columnFiles = pendingFiles[column.id] || [];
        
        const handleFileSelect = (e) => {
          const selectedFiles = Array.from(e.target.files);
          if (selectedFiles.length > 0) {
            setPendingFiles(prev => ({
              ...prev,
              [column.id]: [...(prev[column.id] || []), ...selectedFiles]
            }));
          }
          e.target.value = '';
        };

        const removeFile = (index) => {
          setPendingFiles(prev => ({
            ...prev,
            [column.id]: prev[column.id].filter((_, i) => i !== index)
          }));
        };

        return (
          <div className="space-y-2">
            <input
              ref={el => fileInputRefs.current[column.id] = el}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {/* File list */}
            {columnFiles.length > 0 && (
              <div className="space-y-1.5">
                {columnFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-surface-700 rounded-lg"
                  >
                    <FileText className="w-4 h-4 text-primary-400 flex-shrink-0" />
                    <span className="flex-1 text-sm text-surface-200 truncate">
                      {file.name}
                    </span>
                    <span className="text-xs text-surface-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-surface-600 rounded text-surface-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Upload button */}
            <button
              type="button"
              onClick={() => fileInputRefs.current[column.id]?.click()}
              className="flex items-center gap-2 px-3 py-2 w-full border-2 border-dashed border-surface-600 rounded-lg hover:border-primary-500 transition-colors text-surface-400 hover:text-primary-400"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm">Ajouter des fichiers</span>
            </button>
          </div>
        );
      }

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
        onClick={handleClose}
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
              onClick={handleClose}
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
              onClick={handleClose}
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
