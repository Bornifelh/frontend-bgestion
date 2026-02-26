import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Check, AlertTriangle, GitBranch } from 'lucide-react';
import { boardApi } from '../../lib/api';
import { useBoardStore } from '../../stores/boardStore';
import toast from 'react-hot-toast';

export default function WorkflowConfigModal({ isOpen, onClose }) {
  const { currentBoard, columns } = useBoardStore();
  const [transitions, setTransitions] = useState({});
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const statusColumn = useMemo(() => {
    return columns.find(col => col.type === 'status');
  }, [columns]);

  const statusLabels = useMemo(() => {
    return statusColumn?.labels || [];
  }, [statusColumn]);

  useEffect(() => {
    if (currentBoard?.config?.workflow) {
      setTransitions(currentBoard.config.workflow.transitions || {});
      setEnabled(currentBoard.config.workflow.enabled || false);
    } else {
      const defaultTransitions = {};
      statusLabels.forEach(label => {
        defaultTransitions[label.id] = statusLabels
          .filter(l => l.id !== label.id)
          .map(l => l.id);
      });
      setTransitions(defaultTransitions);
      setEnabled(false);
    }
  }, [currentBoard, statusLabels]);

  const toggleTransition = (fromId, toId) => {
    setTransitions(prev => {
      const current = prev[fromId] || [];
      const updated = current.includes(toId)
        ? current.filter(id => id !== toId)
        : [...current, toId];
      return { ...prev, [fromId]: updated };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await boardApi.update(currentBoard.id, {
        config: {
          ...currentBoard.config,
          workflow: { enabled, transitions },
        },
      });
      toast.success('Workflow sauvegardé');
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !statusColumn) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-surface-900 rounded-2xl w-full max-w-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-surface-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <GitBranch className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-surface-100">Configuration du workflow</h2>
                <p className="text-sm text-surface-500">Définissez les transitions autorisées entre statuts</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-700 text-surface-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 bg-surface-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-surface-200">Activer le workflow</p>
                  <p className="text-xs text-surface-500">Restreindre les transitions entre statuts</p>
                </div>
              </div>
              <button
                onClick={() => setEnabled(!enabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-primary-500' : 'bg-surface-600'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Transition Matrix */}
            {statusLabels.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-surface-300 mb-3">Matrice des transitions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-surface-400 font-normal">
                          <span className="flex items-center gap-1">De <ArrowRight className="w-3 h-3" /> Vers</span>
                        </th>
                        {statusLabels.map((label) => (
                          <th key={label.id} className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: label.color }} />
                              <span className="text-xs text-surface-300 font-medium">{label.name || label.label}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {statusLabels.map((fromLabel) => (
                        <tr key={fromLabel.id} className="border-t border-surface-800">
                          <td className="p-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fromLabel.color }} />
                              <span className="text-surface-200 font-medium">{fromLabel.name || fromLabel.label}</span>
                            </div>
                          </td>
                          {statusLabels.map((toLabel) => (
                            <td key={toLabel.id} className="p-2 text-center">
                              {fromLabel.id === toLabel.id ? (
                                <span className="text-surface-600">—</span>
                              ) : (
                                <button
                                  onClick={() => toggleTransition(fromLabel.id, toLabel.id)}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                    (transitions[fromLabel.id] || []).includes(toLabel.id)
                                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                      : 'bg-surface-800 text-surface-600 hover:bg-surface-700'
                                  }`}
                                >
                                  {(transitions[fromLabel.id] || []).includes(toLabel.id) && (
                                    <Check className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {statusLabels.length === 0 && (
              <div className="text-center py-8 text-surface-500">
                <p>Ajoutez une colonne de type Statut avec des labels pour configurer le workflow.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-surface-700">
            <button onClick={onClose} className="btn btn-secondary">Annuler</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Sauvegarder'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
