import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Target,
  BarChart3,
  X,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Zap,
  Clock,
  Settings,
  History,
  Link2,
} from 'lucide-react';
import { sdsiApi } from '../../lib/api';
import toast from 'react-hot-toast';

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const categoryColors = {
  performance: '#6366f1',
  quality: '#10b981',
  efficiency: '#f59e0b',
  security: '#ef4444',
  satisfaction: '#8b5cf6',
  cost: '#06b6d4',
};

export default function SDSIKPIs() {
  const { workspaceId } = useParams();
  const [kpis, setKpis] = useState([]);
  const [projects, setProjects] = useState([]);
  const [axes, setAxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState(''); // 'auto', 'manual', ''

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const loadData = async () => {
    try {
      const [kpisRes, projectsRes, axesRes] = await Promise.all([
        sdsiApi.getKPIs(workspaceId),
        sdsiApi.getProjects(workspaceId),
        sdsiApi.getAxes(workspaceId),
      ]);
      setKpis(kpisRes.data);
      setProjects(projectsRes.data);
      setAxes(axesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const syncAllKPIs = async () => {
    setSyncing(true);
    try {
      const { data } = await sdsiApi.syncAllKPIs(workspaceId);
      toast.success(`${data.synced} KPI(s) synchronisé(s)`);
      loadData(); // Reload to get updated values
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erreur de synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const syncSingleKPI = async (kpiId, e) => {
    e.stopPropagation();
    try {
      const { data } = await sdsiApi.syncKPI(kpiId);
      setKpis((prev) =>
        prev.map((k) =>
          k.id === kpiId ? { ...k, currentValue: data.newValue, trend: data.trend } : k
        )
      );
      toast.success('KPI synchronisé');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const filteredKPIs = kpis.filter((kpi) => {
    if (filterCategory && kpi.category !== filterCategory) return false;
    if (filterType === 'auto' && !kpi.calculationMethod) return false;
    if (filterType === 'manual' && kpi.calculationMethod) return false;
    return true;
  });

  const categories = [...new Set(kpis.map((k) => k.category).filter(Boolean))];
  const automatedCount = kpis.filter((k) => k.calculationMethod).length;

  const getKPIStatus = (kpi) => {
    if (!kpi.targetValue || kpi.currentValue === null || kpi.currentValue === undefined) return 'neutral';
    const progress = (kpi.currentValue / kpi.targetValue) * 100;
    if (progress >= 100) return 'success';
    if (progress >= 80) return 'warning';
    return 'danger';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-emerald-400';
      case 'warning': return 'text-amber-400';
      case 'danger': return 'text-red-400';
      default: return 'text-surface-400';
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
            Indicateurs de Performance
          </h1>
          <p className="text-surface-400 mt-1">
            Suivez les KPIs clés de votre stratégie SI
          </p>
        </div>
        <div className="flex items-center gap-3">
          {automatedCount > 0 && (
            <button
              onClick={syncAllKPIs}
              disabled={syncing}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Synchroniser tout
            </button>
          )}
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nouveau KPI
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">
                {kpis.filter((k) => getKPIStatus(k) === 'success').length}
              </p>
              <p className="text-sm text-surface-400">Sur cible</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">
                {kpis.filter((k) => getKPIStatus(k) === 'warning').length}
              </p>
              <p className="text-sm text-surface-400">À surveiller</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">
                {kpis.filter((k) => getKPIStatus(k) === 'danger').length}
              </p>
              <p className="text-sm text-surface-400">En alerte</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-400">{automatedCount}</p>
              <p className="text-sm text-surface-400">Automatisés</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-700 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-surface-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-200">{kpis.length}</p>
              <p className="text-sm text-surface-400">Total KPIs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 p-1 bg-surface-800 rounded-lg">
          <button
            onClick={() => setFilterType('')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              !filterType ? 'bg-surface-700 text-surface-100' : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilterType('auto')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
              filterType === 'auto' ? 'bg-primary-500/20 text-primary-400' : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            <Zap className="w-3 h-3" />
            Automatisés
          </button>
          <button
            onClick={() => setFilterType('manual')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filterType === 'manual' ? 'bg-surface-700 text-surface-100' : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            Manuels
          </button>
        </div>

        {categories.length > 0 && (
          <div className="flex gap-1 p-1 bg-surface-800 rounded-lg">
            <button
              onClick={() => setFilterCategory('')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                !filterCategory ? 'bg-surface-700 text-surface-100' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              Toutes catégories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filterCategory === cat ? 'bg-surface-700 text-surface-100' : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredKPIs.map((kpi, index) => {
          const status = getKPIStatus(kpi);
          const TrendIcon = trendIcons[kpi.trend] || Minus;
          const currentVal = kpi.currentValue ?? 0;
          const targetVal = kpi.targetValue ?? 100;
          const progress = targetVal > 0 ? (currentVal / targetVal) * 100 : 0;
          const isAutomated = !!kpi.calculationMethod;

          return (
            <motion.div
              key={kpi.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="card p-5 cursor-pointer hover:bg-surface-800/80 transition-colors relative group"
              onClick={() => setSelectedKPI(kpi)}
            >
              {/* Automated badge */}
              {isAutomated && (
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <button
                    onClick={(e) => syncSingleKPI(kpi.id, e)}
                    className="p-1.5 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors opacity-0 group-hover:opacity-100"
                    title="Synchroniser"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <div className="px-2 py-1 rounded-md bg-primary-500/20 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-primary-400" />
                    <span className="text-xs font-medium text-primary-400">Auto</span>
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-20">
                  {kpi.category && (
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full mb-2 inline-block"
                      style={{
                        backgroundColor: `${categoryColors[kpi.category.toLowerCase()] || '#6366f1'}20`,
                        color: categoryColors[kpi.category.toLowerCase()] || '#6366f1',
                      }}
                    >
                      {kpi.category}
                    </span>
                  )}
                  <h3 className="font-semibold text-surface-100">{kpi.name}</h3>
                  {kpi.description && (
                    <p className="text-sm text-surface-400 mt-1 line-clamp-2">{kpi.description}</p>
                  )}
                </div>
                {!isAutomated && kpi.trend && (
                  <TrendIcon
                    className={`w-5 h-5 ${
                      kpi.trend === 'up' ? 'text-emerald-400' : kpi.trend === 'down' ? 'text-red-400' : 'text-surface-400'
                    }`}
                  />
                )}
              </div>

              <div className="space-y-3">
                {/* Current Value */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-surface-500">Valeur actuelle</p>
                    <p className={`text-3xl font-bold ${getStatusColor(status)}`}>
                      {kpi.currentValue?.toLocaleString('fr-FR') ?? '-'}
                      {kpi.unit && <span className="text-sm text-surface-400 ml-1">{kpi.unit}</span>}
                    </p>
                  </div>
                  {kpi.targetValue && (
                    <div className="text-right">
                      <p className="text-xs text-surface-500">Cible</p>
                      <p className="text-lg text-surface-300">
                        {kpi.targetValue.toLocaleString('fr-FR')} {kpi.unit}
                      </p>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        status === 'success' ? 'bg-emerald-500' : 
                        status === 'warning' ? 'bg-amber-500' : 
                        status === 'danger' ? 'bg-red-500' : 
                        'bg-primary-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-surface-500 mt-1">
                    <span>{currentVal.toLocaleString('fr-FR')} / {targetVal.toLocaleString('fr-FR')} {kpi.unit}</span>
                    <span className={status === 'success' ? 'text-emerald-400' : status === 'warning' ? 'text-amber-400' : status === 'danger' ? 'text-red-400' : ''}>
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Links */}
                <div className="flex items-center gap-3 pt-2 text-xs text-surface-400">
                  {kpi.axisName && (
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {kpi.axisName}
                    </div>
                  )}
                  {kpi.projectName && (
                    <div className="flex items-center gap-1 truncate">
                      <Link2 className="w-3 h-3" />
                      {kpi.projectName}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredKPIs.length === 0 && (
        <div className="card p-12 text-center">
          <TrendingUp className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-surface-300 mb-2">
            {filterCategory || filterType ? 'Aucun KPI correspondant' : 'Aucun KPI défini'}
          </h3>
          <p className="text-surface-500 mb-6">
            Créez des indicateurs pour suivre la performance de votre stratégie
          </p>
          {!filterCategory && !filterType && (
            <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
              <Plus className="w-4 h-4" />
              Créer un KPI
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <KPIModal
            workspaceId={workspaceId}
            projects={projects}
            axes={axes}
            onClose={() => setShowModal(false)}
            onSave={(kpi) => {
              setKpis((prev) => [kpi, ...prev]);
              setShowModal(false);
            }}
          />
        )}
        {selectedKPI && (
          <KPIDetailModal
            kpi={selectedKPI}
            projects={projects}
            axes={axes}
            onClose={() => setSelectedKPI(null)}
            onUpdate={(updatedKpi) => {
              setKpis((prev) => prev.map((k) => (k.id === updatedKpi.id ? updatedKpi : k)));
              setSelectedKPI(updatedKpi);
            }}
            onDelete={(id) => {
              setKpis((prev) => prev.filter((k) => k.id !== id));
              setSelectedKPI(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function KPIModal({ workspaceId, projects, axes, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    unit: '%',
    targetValue: '100',
    currentValue: '',
    baselineValue: '',
    minThreshold: '',
    frequency: 'monthly',
    projectId: '',
    axisId: '',
    calculationMethod: '',
  });
  const [methods, setMethods] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      const { data } = await sdsiApi.getCalculationMethods();
      setMethods(data);
    } catch (error) {
      console.error('Error loading methods:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data } = await sdsiApi.createKPI({
        ...form,
        workspaceId,
        targetValue: form.targetValue ? parseFloat(form.targetValue) : null,
        currentValue: form.currentValue ? parseFloat(form.currentValue) : null,
        baselineValue: form.baselineValue ? parseFloat(form.baselineValue) : null,
        minThreshold: form.minThreshold ? parseFloat(form.minThreshold) : null,
        projectId: form.projectId || null,
        axisId: form.axisId || null,
        calculationMethod: form.calculationMethod || null,
      });

      // If automated, sync immediately
      if (form.calculationMethod) {
        try {
          await sdsiApi.syncKPI(data.id);
        } catch (e) {
          // Ignore sync error on creation
        }
      }

      onSave(data);
      toast.success('KPI créé');
    } catch (error) {
      console.error('Error creating KPI:', error);
      toast.error('Erreur');
    } finally {
      setSaving(false);
    }
  };

  const selectedMethod = methods.find((m) => m.id === form.calculationMethod);

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
        className="bg-surface-900 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-surface-800">
          <h2 className="text-xl font-semibold text-surface-100">Nouveau KPI</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-800 text-surface-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Nom du KPI *</label>
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

          {/* Automation Section */}
          <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-400" />
              <h3 className="font-medium text-primary-400">Calcul automatique</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">Lier à un projet</label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="input w-full"
                >
                  <option value="">Aucun projet</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code ? `[${p.code}] ` : ''}{p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">Ou lier à un axe</label>
                <select
                  value={form.axisId}
                  onChange={(e) => setForm({ ...form, axisId: e.target.value })}
                  className="input w-full"
                >
                  <option value="">Aucun axe</option>
                  {axes.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Méthode de calcul</label>
              <select
                value={form.calculationMethod}
                onChange={(e) => setForm({ ...form, calculationMethod: e.target.value })}
                className="input w-full"
              >
                <option value="">Manuel (pas d'automatisation)</option>
                {methods
                  .filter((m) => {
                    if (m.requiresProject && !form.projectId) return false;
                    if (m.requiresAxis && !form.axisId) return false;
                    return true;
                  })
                  .map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
              </select>
              {selectedMethod && (
                <p className="text-xs text-surface-400 mt-2">{selectedMethod.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Catégorie</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input w-full"
              >
                <option value="">Sélectionner</option>
                <option value="Performance">Performance</option>
                <option value="Quality">Qualité</option>
                <option value="Efficiency">Efficacité</option>
                <option value="Security">Sécurité</option>
                <option value="Satisfaction">Satisfaction</option>
                <option value="Cost">Coût</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Unité</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="input w-full"
                placeholder="%, FCFA, jours..."
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Valeur cible</label>
              <input
                type="number"
                value={form.targetValue}
                onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                className="input w-full"
                step="any"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Valeur actuelle {form.calculationMethod && '(auto)'}
              </label>
              <input
                type="number"
                value={form.currentValue}
                onChange={(e) => setForm({ ...form, currentValue: e.target.value })}
                className="input w-full"
                step="any"
                disabled={!!form.calculationMethod}
                placeholder={form.calculationMethod ? 'Calculée auto' : ''}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Seuil min</label>
              <input
                type="number"
                value={form.minThreshold}
                onChange={(e) => setForm({ ...form, minThreshold: e.target.value })}
                className="input w-full"
                step="any"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Fréquence de mesure</label>
            <select
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              className="input w-full"
            >
              <option value="daily">Quotidienne</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuelle</option>
              <option value="quarterly">Trimestrielle</option>
              <option value="yearly">Annuelle</option>
            </select>
          </div>

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

function KPIDetailModal({ kpi, projects, axes, onClose, onUpdate, onDelete }) {
  const [newValue, setNewValue] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const status =
    kpi.targetValue && kpi.currentValue !== null
      ? (kpi.currentValue / kpi.targetValue) * 100 >= 100
        ? 'success'
        : (kpi.currentValue / kpi.targetValue) * 100 >= 80
        ? 'warning'
        : 'danger'
      : 'neutral';

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data } = await sdsiApi.getKPIHistory(kpi.id);
      setHistory(data);
      setShowHistory(true);
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAddValue = async () => {
    if (!newValue) return;
    try {
      await sdsiApi.addKPIValue(kpi.id, {
        value: parseFloat(newValue),
        recordedAt: new Date().toISOString(),
      });
      onUpdate({ ...kpi, currentValue: parseFloat(newValue) });
      setNewValue('');
      toast.success('Valeur ajoutée');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data } = await sdsiApi.syncKPI(kpi.id);
      onUpdate({ ...kpi, currentValue: data.newValue, trend: data.trend });
      toast.success('KPI synchronisé');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer ce KPI ?')) return;
    try {
      await sdsiApi.deleteKPI(kpi.id);
      onDelete(kpi.id);
      toast.success('KPI supprimé');
    } catch (error) {
      toast.error('Erreur');
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
        className="bg-surface-900 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-surface-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-surface-100">{kpi.name}</h2>
              {kpi.calculationMethod && (
                <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded-full text-xs flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Auto
                </span>
              )}
            </div>
            {kpi.category && <span className="text-sm text-primary-400">{kpi.category}</span>}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-800 text-surface-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {kpi.description && <p className="text-surface-300">{kpi.description}</p>}

          <div className="text-center py-6 bg-surface-800/50 rounded-xl">
            <p className="text-sm text-surface-400 mb-2">Valeur actuelle</p>
            <p
              className={`text-5xl font-bold ${
                status === 'success'
                  ? 'text-emerald-400'
                  : status === 'warning'
                  ? 'text-amber-400'
                  : status === 'danger'
                  ? 'text-red-400'
                  : 'text-surface-200'
              }`}
            >
              {kpi.currentValue?.toLocaleString('fr-FR') ?? '-'}
              {kpi.unit && <span className="text-xl text-surface-400 ml-2">{kpi.unit}</span>}
            </p>
            {kpi.targetValue && (
              <p className="text-surface-400 mt-2">
                Cible: {kpi.targetValue.toLocaleString('fr-FR')} {kpi.unit}
              </p>
            )}
          </div>

          {/* Links info */}
          {(kpi.projectName || kpi.axisName) && (
            <div className="flex flex-wrap gap-3">
              {kpi.projectName && (
                <div className="flex items-center gap-2 px-3 py-2 bg-surface-800/50 rounded-lg text-sm">
                  <Link2 className="w-4 h-4 text-surface-400" />
                  <span className="text-surface-300">Projet: {kpi.projectName}</span>
                </div>
              )}
              {kpi.axisName && (
                <div className="flex items-center gap-2 px-3 py-2 bg-surface-800/50 rounded-lg text-sm">
                  <Target className="w-4 h-4 text-surface-400" />
                  <span className="text-surface-300">Axe: {kpi.axisName}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {kpi.calculationMethod && (
              <button onClick={handleSync} disabled={syncing} className="btn-secondary flex-1">
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                Synchroniser
              </button>
            )}
            <button onClick={loadHistory} disabled={loadingHistory} className="btn-secondary flex-1">
              <History className="w-4 h-4" />
              Historique
            </button>
          </div>

          {/* History */}
          {showHistory && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-surface-300">Historique des valeurs</h4>
              {history.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 bg-surface-800/30 rounded-lg text-sm">
                      <span className="text-surface-400">
                        {new Date(h.recorded_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="font-medium text-surface-200">
                        {parseFloat(h.value).toLocaleString('fr-FR')} {kpi.unit}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-surface-500 text-center py-4">Aucun historique</p>
              )}
            </div>
          )}

          {/* Add value (only for manual KPIs) */}
          {!kpi.calculationMethod && (
            <div className="pt-4 border-t border-surface-800">
              <label className="block text-sm font-medium text-surface-300 mb-2">Ajouter une mesure</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="input flex-1"
                  placeholder={`Nouvelle valeur ${kpi.unit ? `(${kpi.unit})` : ''}`}
                  step="any"
                />
                <button onClick={handleAddValue} disabled={!newValue} className="btn-primary">
                  Ajouter
                </button>
              </div>
            </div>
          )}

          {/* Delete button */}
          <div className="pt-4 border-t border-surface-800">
            <button onClick={handleDelete} className="text-red-400 hover:text-red-300 text-sm">
              Supprimer ce KPI
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
