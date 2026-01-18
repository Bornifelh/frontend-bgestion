import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Columns } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { columnApi } from '../../lib/api';
import { useBoardStore } from '../../stores/boardStore';
import toast from 'react-hot-toast';

export default function CreateColumnModal({ isOpen, onClose, boardId }) {
  const addColumn = useBoardStore((state) => state.addColumn);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'text',
  });

  // Fetch column types
  const { data: columnTypes } = useQuery({
    queryKey: ['columnTypes'],
    queryFn: async () => {
      const response = await columnApi.getTypes();
      return response.data;
    },
    enabled: isOpen,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !boardId) return;

    setIsLoading(true);
    try {
      const response = await columnApi.create({
        boardId,
        title: formData.title.trim(),
        type: formData.type,
      });
      addColumn(response.data);
      toast.success('Colonne créée avec succès');
      onClose();
      setFormData({ title: '', type: 'text' });
    } catch (error) {
      toast.error('Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const typeLabels = {
    text: '📝 Texte',
    status: '🏷️ Statut',
    person: '👤 Personne',
    date: '📅 Date',
    number: '🔢 Nombre',
    dropdown: '📋 Liste déroulante',
    checkbox: '☑️ Case à cocher',
    timeline: '📊 Timeline',
    files: '📎 Fichiers',
    link: '🔗 Lien',
    email: '✉️ Email',
    phone: '📞 Téléphone',
    rating: '⭐ Note',
    tags: '🏷️ Tags',
    priority: '🚨 Priorité',
    progress: '📈 Progression',
  };

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
          className="modal-content max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-surface-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
                <Columns className="w-5 h-5 text-primary-400" />
              </div>
              <h2 className="text-lg font-semibold text-surface-100">
                Ajouter une colonne
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
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Titre de la colonne
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ma colonne"
                className="input"
                required
                autoFocus
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Type de colonne
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {columnTypes?.map((type) => (
                  <button
                    key={type.name}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: type.name })
                    }
                    className={`p-3 rounded-xl text-left text-sm transition-all ${
                      formData.type === type.name
                        ? 'bg-primary-600/20 border-2 border-primary-500 text-primary-300'
                        : 'bg-surface-800 border-2 border-transparent hover:border-surface-600 text-surface-300'
                    }`}
                  >
                    {typeLabels[type.name] || type.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.title.trim()}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Ajouter'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
