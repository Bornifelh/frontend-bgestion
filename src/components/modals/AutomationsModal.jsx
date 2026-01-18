import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  Plus,
  Trash2,
  Play,
  Pause,
  ChevronRight,
  RefreshCw,
  Settings,
  Bell,
  Users,
  Calendar,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { automationApi } from '../../lib/api';
import toast from 'react-hot-toast';

const triggerIcons = {
  status_changed: RefreshCw,
  item_created: Plus,
  date_arrived: Calendar,
  column_changed: Settings,
  person_assigned: Users,
};

const actionIcons = {
  change_status: RefreshCw,
  assign_person: Users,
  notify_person: Bell,
  notify_owner: Bell,
  set_date: Calendar,
  move_to_group: ArrowRight,
  create_item: Plus,
  send_email: Bell,
};

export default function AutomationsModal({ boardId, onClose }) {
  const [automations, setAutomations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [triggers, setTriggers] = useState({});
  const [actions, setActions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    loadData();
  }, [boardId]);

  const loadData = async () => {
    try {
      const [automationsRes, templatesRes] = await Promise.all([
        automationApi.getByBoard(boardId),
        automationApi.getTemplates(),
      ]);
      setAutomations(automationsRes.data);
      setTemplates(templatesRes.data.templates);
      setTriggers(templatesRes.data.triggers);
      setActions(templatesRes.data.actions);
    } catch (error) {
      console.error('Error loading automations:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (automationId) => {
    try {
      const { data } = await automationApi.toggle(automationId);
      setAutomations((prev) =>
        prev.map((a) => (a.id === automationId ? { ...a, isActive: data.isActive } : a))
      );
      toast.success(data.isActive ? 'Automation activée' : 'Automation désactivée');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDelete = async (automationId) => {
    if (!confirm('Supprimer cette automation ?')) return;
    try {
      await automationApi.delete(automationId);
      setAutomations((prev) => prev.filter((a) => a.id !== automationId));
      toast.success('Automation supprimée');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleCreateFromTemplate = async (template) => {
    setSelectedTemplate(template);
    setShowCreate(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface-900 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-surface-100">Automatisations</h2>
              <p className="text-sm text-surface-400">
                {automations.length} automation{automations.length !== 1 && 's'} configurée
                {automations.length !== 1 && 's'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-800 text-surface-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Active Automations */}
              {automations.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-surface-300 mb-3">
                    Automations actives
                  </h3>
                  <div className="space-y-2">
                    {automations.map((automation) => {
                      const TriggerIcon = triggerIcons[automation.trigger] || Zap;
                      const ActionIcon = actionIcons[automation.action] || CheckCircle;

                      return (
                        <div
                          key={automation.id}
                          className={`p-4 rounded-xl border transition-colors ${
                            automation.isActive
                              ? 'bg-surface-800/50 border-surface-700'
                              : 'bg-surface-900 border-surface-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  automation.isActive
                                    ? 'bg-primary-500/20 text-primary-400'
                                    : 'bg-surface-700 text-surface-400'
                                }`}
                              >
                                <Zap className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-medium text-surface-100">{automation.name}</h4>
                                <div className="flex items-center gap-2 text-sm text-surface-400">
                                  <TriggerIcon className="w-3 h-3" />
                                  <span>{triggers[automation.trigger]?.name || automation.trigger}</span>
                                  <ChevronRight className="w-3 h-3" />
                                  <ActionIcon className="w-3 h-3" />
                                  <span>{actions[automation.action]?.name || automation.action}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {automation.executionCount > 0 && (
                                <span className="text-xs text-surface-500">
                                  {automation.executionCount} exécution{automation.executionCount > 1 && 's'}
                                </span>
                              )}
                              <button
                                onClick={() => handleToggle(automation.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  automation.isActive
                                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                    : 'bg-surface-700 text-surface-400 hover:bg-surface-600'
                                }`}
                                title={automation.isActive ? 'Désactiver' : 'Activer'}
                              >
                                {automation.isActive ? (
                                  <Play className="w-4 h-4" />
                                ) : (
                                  <Pause className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(automation.id)}
                                className="p-2 rounded-lg bg-surface-700 text-surface-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Templates */}
              <div>
                <h3 className="text-sm font-medium text-surface-300 mb-3">
                  Ajouter une automation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleCreateFromTemplate(template)}
                      className="p-4 rounded-xl bg-surface-800/50 border border-surface-700 hover:border-primary-500/50 hover:bg-surface-800 transition-colors text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{template.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-surface-100 group-hover:text-primary-400 transition-colors">
                            {template.name}
                          </h4>
                          <p className="text-sm text-surface-400 mt-1">{template.description}</p>
                        </div>
                        <Plus className="w-5 h-5 text-surface-500 group-hover:text-primary-400 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {automations.length === 0 && (
                <div className="text-center py-8">
                  <Zap className="w-12 h-12 text-surface-600 mx-auto mb-3" />
                  <p className="text-surface-400">
                    Aucune automation configurée. Choisissez un template ci-dessus pour commencer.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Create Modal */}
        <AnimatePresence>
          {showCreate && selectedTemplate && (
            <CreateAutomationModal
              boardId={boardId}
              template={selectedTemplate}
              triggers={triggers}
              actions={actions}
              onClose={() => {
                setShowCreate(false);
                setSelectedTemplate(null);
              }}
              onCreated={(automation) => {
                setAutomations((prev) => [automation, ...prev]);
                setShowCreate(false);
                setSelectedTemplate(null);
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function CreateAutomationModal({ boardId, template, triggers, actions, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: template.name,
    description: template.description,
    trigger: template.trigger,
    action: template.action,
    triggerConfig: {},
    actionConfig: {},
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data } = await automationApi.create({
        boardId,
        ...form,
      });
      onCreated({
        id: data.id,
        name: form.name,
        description: form.description,
        trigger: form.trigger,
        action: form.action,
        isActive: true,
        executionCount: 0,
      });
      toast.success('Automation créée');
    } catch (error) {
      console.error('Error creating automation:', error);
      toast.error('Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface-900 rounded-2xl w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-surface-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{template.icon}</span>
            <h2 className="text-lg font-semibold text-surface-100">Nouvelle automation</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-800 text-surface-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Nom</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input w-full h-20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Déclencheur</label>
              <select
                value={form.trigger}
                onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                className="input w-full"
              >
                {Object.entries(triggers).map(([key, trigger]) => (
                  <option key={key} value={key}>
                    {trigger.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Action</label>
              <select
                value={form.action}
                onChange={(e) => setForm({ ...form, action: e.target.value })}
                className="input w-full"
              >
                {Object.entries(actions).map(([key, action]) => (
                  <option key={key} value={key}>
                    {action.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Config for status_changed trigger */}
          {form.trigger === 'status_changed' && (
            <div className="p-4 bg-surface-800/50 rounded-xl space-y-3">
              <p className="text-sm text-surface-400">Configuration du déclencheur</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Statut source (optionnel)</label>
                  <input
                    type="text"
                    value={form.triggerConfig.fromStatus || ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        triggerConfig: { ...form.triggerConfig, fromStatus: e.target.value },
                      })
                    }
                    className="input w-full text-sm"
                    placeholder="Ex: En cours"
                  />
                </div>
                <div>
                  <label className="block text-xs text-surface-400 mb-1">Statut cible</label>
                  <input
                    type="text"
                    value={form.triggerConfig.toStatus || ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        triggerConfig: { ...form.triggerConfig, toStatus: e.target.value },
                      })
                    }
                    className="input w-full text-sm"
                    placeholder="Ex: Terminé"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Config for notify actions */}
          {(form.action === 'notify_owner' || form.action === 'notify_person') && (
            <div className="p-4 bg-surface-800/50 rounded-xl">
              <label className="block text-xs text-surface-400 mb-1">Message de notification</label>
              <input
                type="text"
                value={form.actionConfig.message || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    actionConfig: { ...form.actionConfig, message: e.target.value },
                  })
                }
                className="input w-full text-sm"
                placeholder="Ex: L'item a été mis à jour"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Annuler
            </button>
            <button type="submit" disabled={saving || !form.name} className="btn-primary flex-1">
              {saving ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
