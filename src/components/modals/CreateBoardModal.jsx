import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderKanban, FileText, ChevronRight } from 'lucide-react';
import { boardApi, templateApi } from '../../lib/api';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import toast from 'react-hot-toast';

const icons = ['📋', '📊', '📈', '🎯', '🚀', '💡', '⚡', '🔥', '✨', '📝'];
const colors = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
];

export default function CreateBoardModal({ isOpen, onClose, workspaceId }) {
  const addBoard = useWorkspaceStore((state) => state.addBoard);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('choose');
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📋',
    color: '#6366f1',
  });

  useEffect(() => {
    if (isOpen && workspaceId) {
      setLoadingTemplates(true);
      templateApi.getAll(workspaceId)
        .then(res => setTemplates(res.data || []))
        .catch(() => {})
        .finally(() => setLoadingTemplates(false));
    }
    if (!isOpen) {
      setStep('choose');
    }
  }, [isOpen, workspaceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      const response = await boardApi.create({
        ...formData,
        workspaceId,
      });
      addBoard(response.data);
      toast.success('Board créé avec succès');
      onClose();
      setFormData({
        name: '',
        description: '',
        icon: '📋',
        color: '#6366f1',
      });
    } catch (error) {
      toast.error('Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTemplate = async (templateId) => {
    if (!formData.name.trim()) {
      toast.error('Veuillez d\'abord entrer un nom');
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await templateApi.apply(templateId, {
        workspaceId,
        name: formData.name.trim(),
        description: formData.description,
      });
      addBoard(data);
      toast.success('Board créé depuis le template');
      onClose();
      setFormData({ name: '', description: '', icon: '📋', color: '#6366f1' });
    } catch (error) {
      toast.error('Erreur lors de l\'application du template');
    } finally {
      setIsLoading(false);
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
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-surface-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-surface-100">
                  Créer un board
                </h2>
                <p className="text-sm text-surface-500">
                  {step === 'choose' ? 'Choisissez un point de départ' : 'Gérez vos tâches et projets'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-700 text-surface-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Template Selection Step */}
          {step === 'choose' && (
            <div className="p-6 space-y-4">
              <button
                onClick={() => setStep('blank')}
                className="w-full flex items-center gap-4 p-4 bg-surface-800/50 rounded-xl hover:bg-surface-800 transition-colors text-left"
              >
                <div className="p-3 bg-primary-500/20 rounded-lg">
                  <FolderKanban className="w-6 h-6 text-primary-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-surface-200">Board vide</p>
                  <p className="text-sm text-surface-500">Commencer de zéro</p>
                </div>
                <ChevronRight className="w-5 h-5 text-surface-500" />
              </button>

              {templates.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Depuis un template</p>
                  <div className="space-y-2">
                    {templates.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => { setStep('template'); setFormData(prev => ({ ...prev, _templateId: tpl.id })); }}
                        className="w-full flex items-center gap-4 p-4 bg-surface-800/50 rounded-xl hover:bg-surface-800 transition-colors text-left"
                      >
                        <div className="p-3 bg-cyan-500/20 rounded-lg">
                          <FileText className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-surface-200">{tpl.name}</p>
                          <p className="text-sm text-surface-500">{tpl.description || 'Template de board'}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-surface-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loadingTemplates && (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}

          {/* Template name form */}
          {step === 'template' && (
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">Nom du board</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nom du board..."
                  className="input"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">Description <span className="text-surface-500">(optionnel)</span></label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez votre board..."
                  className="input resize-none h-20"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button type="button" onClick={() => setStep('choose')} className="btn btn-secondary">Retour</button>
                <button
                  type="button"
                  disabled={isLoading || !formData.name.trim()}
                  onClick={() => handleApplyTemplate(formData._templateId)}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : 'Créer depuis le template'}
                </button>
              </div>
            </div>
          )}

          {/* Blank board form */}
          {step === 'blank' && <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Icon & Color */}
            <div className="flex items-center gap-6">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${formData.color}20` }}
              >
                {formData.icon}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-surface-500 mb-2">
                    Icône
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {icons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-surface-700 transition-colors ${
                          formData.icon === icon
                            ? 'bg-surface-700 ring-2 ring-primary-500'
                            : ''
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-500 mb-2">
                    Couleur
                  </label>
                  <div className="flex gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          formData.color === color
                            ? 'ring-2 ring-offset-2 ring-offset-surface-900 ring-white scale-110'
                            : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Nom du board
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Gestion de projet"
                className="input"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Description{' '}
                <span className="text-surface-500">(optionnel)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Décrivez votre board..."
                className="input resize-none h-20"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => templates.length > 0 ? setStep('choose') : onClose()}
                className="btn btn-secondary"
              >
                {templates.length > 0 ? 'Retour' : 'Annuler'}
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Créer le board'
                )}
              </button>
            </div>
          </form>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
