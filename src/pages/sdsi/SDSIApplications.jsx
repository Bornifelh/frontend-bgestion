import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  X,
  Banknote,
  Users,
  Code,
} from 'lucide-react';
import { sdsiApi } from '../../lib/api';

const statusConfig = {
  production: { label: 'Production', color: 'bg-emerald-500', icon: CheckCircle },
  development: { label: 'Développement', color: 'bg-blue-500', icon: Code },
  maintenance: { label: 'Maintenance', color: 'bg-amber-500', icon: Clock },
  deprecated: { label: 'Obsolète', color: 'bg-red-500', icon: AlertTriangle },
  planned: { label: 'Planifié', color: 'bg-surface-500', icon: Clock },
};

const criticalityConfig = {
  low: { label: 'Faible', color: 'text-surface-400', bg: 'bg-surface-700' },
  medium: { label: 'Moyenne', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  high: { label: 'Élevée', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  critical: { label: 'Critique', color: 'text-red-400', bg: 'bg-red-500/20' },
};

const categoryIcons = {
  erp: '📊',
  crm: '👥',
  hr: '👔',
  finance: '💰',
  infrastructure: '🖥️',
  security: '🔒',
  collaboration: '🤝',
  analytics: '📈',
  default: '📦',
};

export default function SDSIApplications() {
  const { workspaceId } = useParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCriticality, setFilterCriticality] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    loadApplications();
  }, [workspaceId]);

  const loadApplications = async () => {
    try {
      const { data } = await sdsiApi.getApplications(workspaceId);
      setApplications(data);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (search && !app.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filterStatus && app.status !== filterStatus) {
      return false;
    }
    if (filterCriticality && app.criticality !== filterCriticality) {
      return false;
    }
    return true;
  });

  const stats = {
    total: applications.length,
    production: applications.filter((a) => a.status === 'production').length,
    deprecated: applications.filter((a) => a.status === 'deprecated').length,
    critical: applications.filter((a) => a.criticality === 'critical').length,
    totalCost: applications.reduce((sum, a) => sum + (a.annualCost || 0), 0),
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
            Inventaire des Applications
          </h1>
          <p className="text-surface-400 mt-1">
            Cartographie du système d'information
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nouvelle Application
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4">
          <p className="text-2xl font-bold text-surface-100">{stats.total}</p>
          <p className="text-sm text-surface-400">Applications</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-emerald-400">{stats.production}</p>
          <p className="text-sm text-surface-400">En production</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-red-400">{stats.deprecated}</p>
          <p className="text-sm text-surface-400">Obsolètes</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-orange-400">{stats.critical}</p>
          <p className="text-sm text-surface-400">Critiques</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-primary-400">
            {stats.totalCost.toLocaleString('fr-FR')} FCFA
          </p>
          <p className="text-sm text-surface-400">Coût annuel total</p>
        </div>
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
                placeholder="Rechercher une application..."
                className="input w-full pl-10"
              />
            </div>
          </div>
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
          <select
            value={filterCriticality}
            onChange={(e) => setFilterCriticality(e.target.value)}
            className="input w-40"
          >
            <option value="">Toutes criticités</option>
            {Object.entries(criticalityConfig).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredApps.map((app, index) => {
          const statusInfo = statusConfig[app.status];
          const criticalityInfo = criticalityConfig[app.criticality];
          const StatusIcon = statusInfo?.icon || CheckCircle;

          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card p-5 hover:bg-surface-800/80 transition-colors cursor-pointer"
              onClick={() => setSelectedApp(app)}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center text-2xl">
                  {categoryIcons[app.category?.toLowerCase()] || categoryIcons.default}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {app.code && (
                      <span className="text-xs text-surface-500 font-mono">
                        {app.code}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${statusInfo?.color} text-white`}
                    >
                      {statusInfo?.label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-surface-100 truncate">
                    {app.name}
                  </h3>
                  {app.vendor && (
                    <p className="text-sm text-surface-400">{app.vendor}</p>
                  )}
                </div>
              </div>

              {app.description && (
                <p className="text-sm text-surface-400 mt-3 line-clamp-2">
                  {app.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-4 text-xs text-surface-400">
                <span className={`px-2 py-1 rounded ${criticalityInfo?.bg} ${criticalityInfo?.color}`}>
                  {criticalityInfo?.label}
                </span>
                {app.usersCount && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {app.usersCount}
                  </div>
                )}
                {app.annualCost && (
                  <div className="flex items-center gap-1">
                    <Banknote className="w-3 h-3" />
                    {app.annualCost.toLocaleString('fr-FR')}
                  </div>
                )}
              </div>

              {app.technologyStack && app.technologyStack.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {app.technologyStack.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 bg-surface-700 rounded text-xs text-surface-300"
                    >
                      {tech}
                    </span>
                  ))}
                  {app.technologyStack.length > 3 && (
                    <span className="px-2 py-0.5 text-xs text-surface-500">
                      +{app.technologyStack.length - 3}
                    </span>
                  )}
                </div>
              )}

              {app.endOfLifeDate && new Date(app.endOfLifeDate) < new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  Fin de vie: {new Date(app.endOfLifeDate).toLocaleDateString('fr-FR')}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {filteredApps.length === 0 && (
        <div className="card p-12 text-center">
          <Server className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-surface-300 mb-2">
            {search || filterStatus || filterCriticality
              ? 'Aucune application trouvée'
              : 'Aucune application'}
          </h3>
          <p className="text-surface-500 mb-6">
            {search || filterStatus || filterCriticality
              ? 'Essayez de modifier vos filtres'
              : 'Commencez à inventorier vos applications'}
          </p>
          {!search && !filterStatus && !filterCriticality && (
            <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
              <Plus className="w-4 h-4" />
              Ajouter une application
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <ApplicationModal
            workspaceId={workspaceId}
            onClose={() => setShowModal(false)}
            onSave={(app) => {
              setApplications((prev) => [app, ...prev]);
              setShowModal(false);
            }}
          />
        )}
        {selectedApp && (
          <ApplicationDetailModal
            app={selectedApp}
            onClose={() => setSelectedApp(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ApplicationModal({ workspaceId, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    category: '',
    vendor: '',
    version: '',
    technologyStack: '',
    status: 'production',
    criticality: 'medium',
    dataSensitivity: 'internal',
    usersCount: '',
    annualCost: '',
    owner: '',
    technicalContact: '',
    goLiveDate: '',
    endOfLifeDate: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data } = await sdsiApi.createApplication({
        ...form,
        workspaceId,
        technologyStack: form.technologyStack ? form.technologyStack.split(',').map((t) => t.trim()) : [],
        usersCount: form.usersCount ? parseInt(form.usersCount) : null,
        annualCost: form.annualCost ? parseFloat(form.annualCost) : null,
      });
      onSave(data);
    } catch (error) {
      console.error('Error creating application:', error);
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
            Nouvelle Application
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-800 text-surface-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Nom *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input w-full"
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
              className="input w-full h-20 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Catégorie
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input w-full"
              >
                <option value="">Sélectionner</option>
                <option value="erp">ERP</option>
                <option value="crm">CRM</option>
                <option value="hr">RH</option>
                <option value="finance">Finance</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="security">Sécurité</option>
                <option value="collaboration">Collaboration</option>
                <option value="analytics">Analytics</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Éditeur
              </label>
              <input
                type="text"
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Version
              </label>
              <input
                type="text"
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">
              Technologies (séparées par des virgules)
            </label>
            <input
              type="text"
              value={form.technologyStack}
              onChange={(e) => setForm({ ...form, technologyStack: e.target.value })}
              className="input w-full"
              placeholder="Java, PostgreSQL, React..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Statut
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input w-full"
              >
                {Object.entries(statusConfig).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Criticité
              </label>
              <select
                value={form.criticality}
                onChange={(e) => setForm({ ...form, criticality: e.target.value })}
                className="input w-full"
              >
                {Object.entries(criticalityConfig).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Sensibilité données
              </label>
              <select
                value={form.dataSensitivity}
                onChange={(e) => setForm({ ...form, dataSensitivity: e.target.value })}
                className="input w-full"
              >
                <option value="public">Publique</option>
                <option value="internal">Interne</option>
                <option value="confidential">Confidentielle</option>
                <option value="restricted">Restreinte</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Nb utilisateurs
              </label>
              <input
                type="number"
                value={form.usersCount}
                onChange={(e) => setForm({ ...form, usersCount: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Coût annuel (FCFA)
              </label>
              <input
                type="number"
                value={form.annualCost}
                onChange={(e) => setForm({ ...form, annualCost: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Fin de vie
              </label>
              <input
                type="date"
                value={form.endOfLifeDate}
                onChange={(e) => setForm({ ...form, endOfLifeDate: e.target.value })}
                className="input w-full"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Annuler
            </button>
            <button type="submit" disabled={saving || !form.name} className="btn-primary flex-1">
              {saving ? 'Création...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function ApplicationDetailModal({ app, onClose }) {
  const statusInfo = statusConfig[app.status];
  const criticalityInfo = criticalityConfig[app.criticality];

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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center text-2xl">
              {categoryIcons[app.category?.toLowerCase()] || categoryIcons.default}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-surface-100">{app.name}</h2>
              {app.code && <p className="text-sm text-surface-400 font-mono">{app.code}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-800 text-surface-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm ${statusInfo?.color} text-white`}>
              {statusInfo?.label}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${criticalityInfo?.bg} ${criticalityInfo?.color}`}>
              Criticité: {criticalityInfo?.label}
            </span>
          </div>

          {app.description && (
            <p className="text-surface-300">{app.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-800">
            {app.vendor && (
              <div>
                <p className="text-xs text-surface-500">Éditeur</p>
                <p className="text-surface-200">{app.vendor}</p>
              </div>
            )}
            {app.version && (
              <div>
                <p className="text-xs text-surface-500">Version</p>
                <p className="text-surface-200">{app.version}</p>
              </div>
            )}
            {app.usersCount && (
              <div>
                <p className="text-xs text-surface-500">Utilisateurs</p>
                <p className="text-surface-200">{app.usersCount}</p>
              </div>
            )}
            {app.annualCost && (
              <div>
                <p className="text-xs text-surface-500">Coût annuel</p>
                <p className="text-surface-200">{app.annualCost.toLocaleString('fr-FR')} FCFA</p>
              </div>
            )}
            {app.owner && (
              <div>
                <p className="text-xs text-surface-500">Responsable</p>
                <p className="text-surface-200">{app.owner}</p>
              </div>
            )}
            {app.technicalContact && (
              <div>
                <p className="text-xs text-surface-500">Contact technique</p>
                <p className="text-surface-200">{app.technicalContact}</p>
              </div>
            )}
          </div>

          {app.technologyStack && app.technologyStack.length > 0 && (
            <div className="pt-4 border-t border-surface-800">
              <p className="text-xs text-surface-500 mb-2">Technologies</p>
              <div className="flex flex-wrap gap-2">
                {app.technologyStack.map((tech) => (
                  <span key={tech} className="px-3 py-1 bg-surface-800 rounded-lg text-sm text-surface-300">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
