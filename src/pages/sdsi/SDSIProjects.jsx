import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderGit2,
  Plus,
  Filter,
  Search,
  Calendar,
  Banknote,
  User,
  ChevronRight,
  X,
  Target,
} from 'lucide-react';
import { sdsiApi } from '../../lib/api';

const statusConfig = {
  planned: { label: 'Planifié', color: 'bg-surface-500', textColor: 'text-surface-300' },
  in_progress: { label: 'En cours', color: 'bg-blue-500', textColor: 'text-blue-400' },
  completed: { label: 'Terminé', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
  on_hold: { label: 'En pause', color: 'bg-amber-500', textColor: 'text-amber-400' },
  cancelled: { label: 'Annulé', color: 'bg-red-500', textColor: 'text-red-400' },
};

const priorityConfig = {
  low: { label: 'Basse', color: 'text-surface-400' },
  medium: { label: 'Moyenne', color: 'text-amber-400' },
  high: { label: 'Haute', color: 'text-orange-400' },
  critical: { label: 'Critique', color: 'text-red-400' },
};

export default function SDSIProjects() {
  const { workspaceId } = useParams();
  const [projects, setProjects] = useState([]);
  const [axes, setAxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAxis, setFilterAxis] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const loadData = async () => {
    try {
      const [projectsRes, axesRes] = await Promise.all([
        sdsiApi.getProjects(workspaceId, {}),
        sdsiApi.getAxes(workspaceId),
      ]);
      setProjects(projectsRes.data);
      setAxes(axesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    if (search && !project.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filterAxis && project.axisId !== filterAxis) {
      return false;
    }
    if (filterStatus && project.status !== filterStatus) {
      return false;
    }
    return true;
  });

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
            Projets SDSI
          </h1>
          <p className="text-surface-400 mt-1">
            Portefeuille de projets du schéma directeur
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nouveau Projet
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un projet..."
                className="input w-full pl-10"
              />
            </div>
          </div>
          <select
            value={filterAxis}
            onChange={(e) => setFilterAxis(e.target.value)}
            className="input w-48"
          >
            <option value="">Tous les axes</option>
            {axes.map((axis) => (
              <option key={axis.id} value={axis.id}>
                {axis.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input w-40"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(statusConfig).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={`/workspace/${workspaceId}/sdsi/project/${project.id}`}
              className="card p-5 block hover:bg-surface-800/80 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: project.axisColor
                      ? `${project.axisColor}20`
                      : 'rgba(99, 102, 241, 0.2)',
                  }}
                >
                  <FolderGit2
                    className="w-5 h-5"
                    style={{ color: project.axisColor || '#6366f1' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {project.code && (
                      <span className="text-xs text-surface-500 font-mono">
                        {project.code}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${statusConfig[project.status]?.color} text-white`}
                    >
                      {statusConfig[project.status]?.label}
                    </span>
                    <span className={`text-xs ${priorityConfig[project.priority]?.color}`}>
                      {priorityConfig[project.priority]?.label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-surface-100 group-hover:text-white truncate">
                    {project.name}
                  </h3>
                  {project.axisName && (
                    <div className="flex items-center gap-1 mt-1">
                      <Target className="w-3 h-3" style={{ color: project.axisColor }} />
                      <span className="text-xs text-surface-400">{project.axisName}</span>
                    </div>
                  )}
                  {project.description && (
                    <p className="text-sm text-surface-400 mt-2 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Progress */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-surface-400">Progression</span>
                      <span className="text-surface-300">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        className="h-full bg-primary-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-surface-400">
                    {project.startDate && project.endDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(project.startDate).toLocaleDateString('fr-FR', {
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        -{' '}
                        {new Date(project.endDate).toLocaleDateString('fr-FR', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    )}
                    {project.estimatedBudget && (
                      <div className="flex items-center gap-1">
                        <Banknote className="w-3 h-3" />
                        {project.estimatedBudget.toLocaleString('fr-FR')} FCFA
                      </div>
                    )}
                    {project.projectManager && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {project.projectManager}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-surface-500 group-hover:text-surface-300 shrink-0" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="card p-12 text-center">
          <FolderGit2 className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-surface-300 mb-2">
            {search || filterAxis || filterStatus
              ? 'Aucun projet trouvé'
              : 'Aucun projet'}
          </h3>
          <p className="text-surface-500 mb-6">
            {search || filterAxis || filterStatus
              ? 'Essayez de modifier vos filtres'
              : 'Créez votre premier projet SDSI'}
          </p>
          {!search && !filterAxis && !filterStatus && (
            <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
              <Plus className="w-4 h-4" />
              Créer un projet
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <ProjectModal
            workspaceId={workspaceId}
            axes={axes}
            onClose={() => setShowModal(false)}
            onSave={(project) => {
              setProjects((prev) => [project, ...prev]);
              setShowModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProjectModal({ workspaceId, axes, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    objectives: '',
    axisId: '',
    priority: 'medium',
    status: 'planned',
    complexity: 'medium',
    strategicValue: 5,
    urgency: 5,
    estimatedBudget: '',
    startDate: '',
    endDate: '',
    sponsor: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data } = await sdsiApi.createProject({
        ...form,
        workspaceId,
        estimatedBudget: form.estimatedBudget ? parseFloat(form.estimatedBudget) : null,
      });
      onSave(data);
    } catch (error) {
      console.error('Error creating project:', error);
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
        className="bg-surface-900 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-surface-800">
          <h2 className="text-xl font-semibold text-surface-100">
            Nouveau Projet SDSI
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-800 text-surface-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Nom du projet *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input w-full"
                placeholder="Ex: Migration ERP"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Code
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="input w-full font-mono"
                placeholder="PRJ-001"
                maxLength={20}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input w-full h-24 resize-none"
              placeholder="Décrivez le projet..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">
              Objectifs
            </label>
            <textarea
              value={form.objectives}
              onChange={(e) => setForm({ ...form, objectives: e.target.value })}
              className="input w-full h-20 resize-none"
              placeholder="Quels sont les objectifs de ce projet ?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Axe stratégique
              </label>
              <select
                value={form.axisId}
                onChange={(e) => setForm({ ...form, axisId: e.target.value })}
                className="input w-full"
              >
                <option value="">Sélectionner un axe</option>
                {axes.map((axis) => (
                  <option key={axis.id} value={axis.id}>
                    {axis.icon} {axis.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Sponsor
              </label>
              <input
                type="text"
                value={form.sponsor}
                onChange={(e) => setForm({ ...form, sponsor: e.target.value })}
                className="input w-full"
                placeholder="Nom du sponsor"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Priorité
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="input w-full"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="critical">Critique</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Complexité
              </label>
              <select
                value={form.complexity}
                onChange={(e) => setForm({ ...form, complexity: e.target.value })}
                className="input w-full"
              >
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Élevée</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Budget estimé (FCFA)
              </label>
              <input
                type="number"
                value={form.estimatedBudget}
                onChange={(e) => setForm({ ...form, estimatedBudget: e.target.value })}
                className="input w-full"
                placeholder="0"
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Valeur stratégique (1-10)
              </label>
              <input
                type="range"
                value={form.strategicValue}
                onChange={(e) => setForm({ ...form, strategicValue: parseInt(e.target.value) })}
                className="w-full"
                min={1}
                max={10}
              />
              <div className="flex justify-between text-xs text-surface-400">
                <span>Faible</span>
                <span className="font-bold text-primary-400">{form.strategicValue}</span>
                <span>Élevée</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Urgence (1-10)
              </label>
              <input
                type="range"
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: parseInt(e.target.value) })}
                className="w-full"
                min={1}
                max={10}
              />
              <div className="flex justify-between text-xs text-surface-400">
                <span>Faible</span>
                <span className="font-bold text-primary-400">{form.urgency}</span>
                <span>Élevée</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Date de début
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Date de fin
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="input w-full"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !form.name}
              className="btn-primary flex-1"
            >
              {saving ? 'Création...' : 'Créer le projet'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
