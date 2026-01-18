import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Plus, Edit2, Trash2, X, ChevronRight, FolderGit2,
  TrendingUp, Calendar, CheckCircle, Clock
} from 'lucide-react';
import { sdsiApi } from '../../lib/api';
import toast from 'react-hot-toast';

const priorityColors = {
  1: 'bg-emerald-500',
  2: 'bg-green-500',
  3: 'bg-amber-500',
  4: 'bg-orange-500',
  5: 'bg-red-500',
};

const statusConfig = {
  active: { label: 'Actif', color: 'bg-emerald-500' },
  planning: { label: 'Planification', color: 'bg-blue-500' },
  completed: { label: 'Terminé', color: 'bg-surface-500' },
};

export default function SDSIAxes() {
  const { workspaceId } = useParams();
  const [axes, setAxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAxis, setEditingAxis] = useState(null);

  useEffect(() => {
    loadAxes();
  }, [workspaceId]);

  const loadAxes = async () => {
    try {
      const { data } = await sdsiApi.getAxes(workspaceId);
      setAxes(data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (axisId) => {
    if (!confirm('Supprimer cet axe stratégique ? Les projets associés seront désassociés.')) return;
    try {
      await sdsiApi.deleteAxis(axisId);
      toast.success('Axe supprimé');
      loadAxes();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-100">
            Axes Stratégiques
          </h1>
          <p className="text-surface-400 mt-1">
            Définissez les grandes orientations de votre schéma directeur
          </p>
        </div>
        <button onClick={() => { setEditingAxis(null); setShowModal(true); }} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nouvel Axe
        </button>
      </div>

      {/* Axes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {axes.map((axis, index) => (
          <motion.div
            key={axis.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card p-5 hover:bg-surface-800/80 transition-colors group relative"
          >
            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => { setEditingAxis(axis); setShowModal(true); }}
                className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-surface-200"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(axis.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-surface-400 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl"
                style={{ backgroundColor: `${axis.color}20` }}
              >
                {axis.icon || <Target className="w-6 h-6" style={{ color: axis.color }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${priorityColors[axis.priority] || 'bg-surface-500'}`} />
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusConfig[axis.status]?.color || 'bg-surface-600'} text-white`}>
                    {statusConfig[axis.status]?.label || 'Actif'}
                  </span>
                </div>
                <h3 className="font-semibold text-surface-100 truncate">{axis.name}</h3>
                {axis.description && (
                  <p className="text-sm text-surface-400 mt-1 line-clamp-2">{axis.description}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-1 text-surface-400">
                    <FolderGit2 className="w-4 h-4" />
                    <span>{axis.projectCount} projets</span>
                  </div>
                  <div className="flex items-center gap-1 text-surface-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>{axis.kpiCount} KPIs</span>
                  </div>
                  {axis.startYear && axis.endYear && (
                    <div className="flex items-center gap-1 text-surface-400">
                      <Calendar className="w-4 h-4" />
                      <span>{axis.startYear} - {axis.endYear}</span>
                    </div>
                  )}
                </div>

                {/* Objectives */}
                {axis.objectives && (
                  <div className="mt-3 p-2 bg-surface-800/50 rounded-lg">
                    <p className="text-xs text-surface-500 line-clamp-2">{axis.objectives}</p>
                  </div>
                )}
              </div>
            </div>

            <Link
              to={`/workspace/${workspaceId}/sdsi/projects?axis=${axis.id}`}
              className="mt-4 flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300"
            >
              Voir les projets <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ))}
      </div>

      {axes.length === 0 && (
        <div className="card p-12 text-center">
          <Target className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-surface-300 mb-2">Aucun axe stratégique</h3>
          <p className="text-surface-500 mb-6">
            Créez votre premier axe pour structurer votre schéma directeur
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
            <Plus className="w-4 h-4" />
            Créer un axe
          </button>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <AxisModal
            workspaceId={workspaceId}
            axis={editingAxis}
            onClose={() => { setShowModal(false); setEditingAxis(null); }}
            onSave={() => { setShowModal(false); setEditingAxis(null); loadAxes(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AxisModal({ workspaceId, axis, onClose, onSave }) {
  const [form, setForm] = useState({
    name: axis?.name || '',
    description: axis?.description || '',
    objectives: axis?.objectives || '',
    priority: axis?.priority || 1,
    color: axis?.color || '#6366f1',
    icon: axis?.icon || '',
    status: axis?.status || 'active',
    startYear: axis?.startYear || new Date().getFullYear(),
    endYear: axis?.endYear || new Date().getFullYear() + 3,
  });
  const [saving, setSaving] = useState(false);

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
    '#10b981', '#06b6d4', '#3b82f6', '#64748b'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (axis) {
        await sdsiApi.updateAxis(axis.id, form);
        toast.success('Axe mis à jour');
      } else {
        await sdsiApi.createAxis({ ...form, workspaceId });
        toast.success('Axe créé');
      }
      onSave();
    } catch (error) {
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
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
          <h2 className="text-xl font-semibold text-surface-100">
            {axis ? 'Modifier l\'axe' : 'Nouvel Axe Stratégique'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-800 text-surface-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Nom *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input w-full"
              placeholder="Ex: Transformation digitale"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input w-full h-20 resize-none"
              placeholder="Décrivez cet axe stratégique..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Objectifs</label>
            <textarea
              value={form.objectives}
              onChange={(e) => setForm({ ...form, objectives: e.target.value })}
              className="input w-full h-20 resize-none"
              placeholder="Quels sont les objectifs de cet axe ?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Priorité</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
                className="input w-full"
              >
                <option value={1}>1 - Très haute</option>
                <option value={2}>2 - Haute</option>
                <option value={3}>3 - Moyenne</option>
                <option value={4}>4 - Basse</option>
                <option value={5}>5 - Très basse</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Statut</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input w-full"
              >
                <option value="active">Actif</option>
                <option value="planning">Planification</option>
                <option value="completed">Terminé</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Année début</label>
              <input
                type="number"
                value={form.startYear}
                onChange={(e) => setForm({ ...form, startYear: parseInt(e.target.value) })}
                className="input w-full"
                min={2020}
                max={2050}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Année fin</label>
              <input
                type="number"
                value={form.endYear}
                onChange={(e) => setForm({ ...form, endYear: parseInt(e.target.value) })}
                className="input w-full"
                min={2020}
                max={2050}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Couleur</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`w-8 h-8 rounded-lg transition-transform ${
                    form.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-900 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Icône (emoji)</label>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className="input w-full"
              placeholder="🎯"
              maxLength={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Annuler
            </button>
            <button type="submit" disabled={saving || !form.name} className="btn-primary flex-1">
              {saving ? 'Enregistrement...' : axis ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
