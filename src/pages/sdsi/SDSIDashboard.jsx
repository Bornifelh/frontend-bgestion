import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  FolderGit2,
  Server,
  TrendingUp,
  Calendar,
  ArrowRight,
  Flag,
  AlertTriangle,
  CheckCircle,
  Clock,
  Banknote,
  Bell,
  RefreshCw,
  Activity,
  Zap,
  AlertCircle,
  ChevronRight,
  TrendingDown,
  Plus,
  Settings,
  Eye,
  PlayCircle,
} from 'lucide-react';
import { sdsiApi } from '../../lib/api';
import toast from 'react-hot-toast';

const statusColors = {
  planned: 'bg-surface-600',
  in_progress: 'bg-blue-500',
  completed: 'bg-emerald-500',
  on_hold: 'bg-amber-500',
  cancelled: 'bg-red-500',
};

const statusLabels = {
  planned: 'Planifié',
  in_progress: 'En cours',
  completed: 'Terminé',
  on_hold: 'En pause',
  cancelled: 'Annulé',
};

const healthColors = {
  excellent: { bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'Excellent' },
  good: { bg: 'bg-green-500', text: 'text-green-400', label: 'Bon' },
  warning: { bg: 'bg-amber-500', text: 'text-amber-400', label: 'Attention' },
  critical: { bg: 'bg-red-500', text: 'text-red-400', label: 'Critique' },
};

export default function SDSIDashboard() {
  const { workspaceId } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showAlerts, setShowAlerts] = useState(true);

  useEffect(() => {
    loadDashboard();
    // Auto-refresh toutes les 5 minutes
    const interval = setInterval(() => {
      loadDashboard(true);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [workspaceId]);

  const loadDashboard = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const { data } = await sdsiApi.getDashboard(workspaceId);
      setDashboard(data);
      setLastRefresh(new Date());
      if (silent) toast.success('Données actualisées');
    } catch (error) {
      console.error('Error loading SDSI dashboard:', error);
      if (!silent) toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calcul des alertes automatiques
  const alerts = useMemo(() => {
    if (!dashboard) return [];
    const alertList = [];

    // Alertes budget
    const budgetProgress = dashboard.summary?.totalBudget > 0
      ? (dashboard.summary.spentBudget / dashboard.summary.totalBudget) * 100
      : 0;

    if (budgetProgress > 90) {
      alertList.push({
        type: 'critical',
        icon: Banknote,
        title: 'Budget critique',
        message: `${budgetProgress.toFixed(1)}% du budget global consommé`,
        action: 'Revoir les allocations',
      });
    } else if (budgetProgress > 75) {
      alertList.push({
        type: 'warning',
        icon: Banknote,
        title: 'Budget élevé',
        message: `${budgetProgress.toFixed(1)}% du budget global consommé`,
        action: 'Surveiller les dépenses',
      });
    }

    // Alertes KPIs
    if (dashboard.kpisStatus?.critical > 0) {
      alertList.push({
        type: 'critical',
        icon: TrendingDown,
        title: 'KPIs critiques',
        message: `${dashboard.kpisStatus.critical} indicateur(s) en zone critique`,
        action: 'Analyser les KPIs',
      });
    }

    if (dashboard.kpisStatus?.at_risk > 0) {
      alertList.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'KPIs à risque',
        message: `${dashboard.kpisStatus.at_risk} indicateur(s) à surveiller`,
        action: 'Prendre des mesures',
      });
    }

    // Alertes jalons proches
    const upcomingCritical = dashboard.upcomingMilestones?.filter(
      m => m.is_critical && new Date(m.due_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
    if (upcomingCritical?.length > 0) {
      alertList.push({
        type: 'warning',
        icon: Flag,
        title: 'Jalons critiques imminents',
        message: `${upcomingCritical.length} jalon(s) critique(s) dans les 7 jours`,
        action: 'Voir les jalons',
      });
    }

    // Projets en retard (en pause depuis longtemps)
    const onHoldProjects = dashboard.byStatus?.find(s => s.status === 'on_hold')?.count || 0;
    if (onHoldProjects > 0) {
      alertList.push({
        type: 'info',
        icon: Clock,
        title: 'Projets en pause',
        message: `${onHoldProjects} projet(s) actuellement en pause`,
        action: 'Revoir les priorités',
      });
    }

    return alertList;
  }, [dashboard]);

  // Calcul de la santé globale
  const overallHealth = useMemo(() => {
    if (!dashboard) return 'good';
    const criticalAlerts = alerts.filter(a => a.type === 'critical').length;
    const warningAlerts = alerts.filter(a => a.type === 'warning').length;

    if (criticalAlerts > 0) return 'critical';
    if (warningAlerts > 2) return 'warning';
    if (warningAlerts > 0) return 'good';
    return 'excellent';
  }, [alerts, dashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { summary, byStatus, byAxis, upcomingMilestones, kpisStatus } = dashboard || {};
  const budgetProgress = summary?.totalBudget > 0
    ? (summary.spentBudget / summary.totalBudget) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header avec indicateur de santé */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-surface-100">
              Schéma Directeur SI
            </h1>
            <p className="text-surface-400 mt-1">
              Vue d'ensemble de la stratégie des systèmes d'information
            </p>
          </div>
          {/* Health Indicator */}
          <div className={`px-4 py-2 rounded-xl ${healthColors[overallHealth].bg}/20 flex items-center gap-2`}>
            <Activity className={`w-5 h-5 ${healthColors[overallHealth].text}`} />
            <span className={`font-medium ${healthColors[overallHealth].text}`}>
              {healthColors[overallHealth].label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="btn-ghost btn-sm"
            title="Actualiser les données"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-xs text-surface-500">
            Mise à jour: {lastRefresh.toLocaleTimeString('fr-FR')}
          </span>
          <Link to={`/workspace/${workspaceId}/sdsi/roadmap`} className="btn-primary">
            <Calendar className="w-4 h-4" />
            Voir la Roadmap
          </Link>
        </div>
      </div>

      {/* Alertes automatiques */}
      <AnimatePresence>
        {showAlerts && alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-4 border-l-4 border-amber-500"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-surface-100">
                  Alertes et Notifications ({alerts.length})
                </h3>
              </div>
              <button
                onClick={() => setShowAlerts(false)}
                className="text-surface-400 hover:text-surface-200 text-sm"
              >
                Masquer
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {alerts.map((alert, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg ${
                    alert.type === 'critical' ? 'bg-red-500/10 border border-red-500/20' :
                    alert.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' :
                    'bg-blue-500/10 border border-blue-500/20'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <alert.icon className={`w-4 h-4 mt-0.5 ${
                      alert.type === 'critical' ? 'text-red-400' :
                      alert.type === 'warning' ? 'text-amber-400' :
                      'text-blue-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-200">{alert.title}</p>
                      <p className="text-xs text-surface-400 mt-0.5">{alert.message}</p>
                      <button className="text-xs text-primary-400 hover:text-primary-300 mt-1 flex items-center gap-1">
                        {alert.action} <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid amélioré */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -mr-8 -mt-8" />
          <div className="flex items-center gap-4 relative">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-100">{summary?.axesCount || 0}</p>
              <p className="text-sm text-surface-400">Axes stratégiques</p>
            </div>
          </div>
          <Link
            to={`/workspace/${workspaceId}/sdsi/axes`}
            className="mt-3 text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
          >
            Gérer <ArrowRight className="w-3 h-3" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full -mr-8 -mt-8" />
          <div className="flex items-center gap-4 relative">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <FolderGit2 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-100">{summary?.projectsCount || 0}</p>
              <p className="text-sm text-surface-400">Projets</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 flex items-center gap-1">
              <PlayCircle className="w-3 h-3" />
              {summary?.projectsInProgress || 0} en cours
            </span>
            <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {summary?.projectsCompleted || 0} terminés
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full -mr-8 -mt-8" />
          <div className="flex items-center gap-4 relative">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Server className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-100">{summary?.applicationsCount || 0}</p>
              <p className="text-sm text-surface-400">Applications</p>
            </div>
          </div>
          <Link
            to={`/workspace/${workspaceId}/sdsi/applications`}
            className="mt-3 text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
          >
            Inventaire <ArrowRight className="w-3 h-3" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-8 -mt-8" />
          <div className="flex items-center gap-4 relative">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-100">{summary?.kpisCount || 0}</p>
              <p className="text-sm text-surface-400">Indicateurs KPI</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2 text-xs">
            {kpisStatus?.on_target > 0 && (
              <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                {kpisStatus.on_target} sur cible
              </span>
            )}
            {kpisStatus?.at_risk > 0 && (
              <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
                {kpisStatus.at_risk} à risque
              </span>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Overview amélioré */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-primary-400" />
            Budget Global
            {budgetProgress > 75 && (
              <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                budgetProgress > 90 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {budgetProgress > 90 ? 'Critique' : 'Élevé'}
              </span>
            )}
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-surface-400">Consommé</span>
                <span className="text-surface-200 font-mono">
                  {summary?.spentBudget?.toLocaleString('fr-FR')} / {summary?.totalBudget?.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="h-4 bg-surface-800 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(budgetProgress, 100)}%` }}
                  className={`h-full rounded-full ${
                    budgetProgress > 90 ? 'bg-gradient-to-r from-red-500 to-red-400' : 
                    budgetProgress > 75 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 
                    'bg-gradient-to-r from-emerald-500 to-emerald-400'
                  }`}
                />
                {/* Marker à 75% */}
                <div className="absolute top-0 left-[75%] w-0.5 h-full bg-surface-600" />
              </div>
              <div className="flex justify-between text-xs text-surface-500 mt-1">
                <span>0%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 bg-surface-800/50 rounded-lg">
                <p className={`text-xl font-bold ${
                  budgetProgress > 90 ? 'text-red-400' : 
                  budgetProgress > 75 ? 'text-amber-400' : 
                  'text-surface-100'
                }`}>
                  {budgetProgress.toFixed(1)}%
                </p>
                <p className="text-xs text-surface-400">Consommé</p>
              </div>
              <div className="text-center p-3 bg-surface-800/50 rounded-lg">
                <p className="text-xl font-bold text-emerald-400">
                  {((summary?.totalBudget || 0) - (summary?.spentBudget || 0)).toLocaleString('fr-FR')}
                </p>
                <p className="text-xs text-surface-400">FCFA Restant</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Projects by Status avec mini graphique */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-surface-100 mb-4">
            Projets par Statut
          </h2>
          <div className="space-y-3">
            {byStatus?.map((item) => {
              const total = byStatus.reduce((acc, s) => acc + s.count, 0);
              const percentage = total > 0 ? (item.count / total) * 100 : 0;
              return (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${statusColors[item.status]}`} />
                      <span className="text-surface-300 text-sm">{statusLabels[item.status]}</span>
                    </div>
                    <span className="font-semibold text-surface-100">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className={`h-full rounded-full ${statusColors[item.status]}`}
                    />
                  </div>
                </div>
              );
            })}
            {(!byStatus || byStatus.length === 0) && (
              <p className="text-surface-500 text-center py-4">Aucun projet</p>
            )}
          </div>
        </motion.div>

        {/* KPIs Status avec actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-100">
              État des KPIs
            </h2>
            <Link
              to={`/workspace/${workspaceId}/sdsi/kpis`}
              className="text-xs text-primary-400 hover:text-primary-300"
            >
              Voir tout
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="flex-1 text-surface-300">Sur cible</span>
              <span className="font-bold text-emerald-400">{kpisStatus?.on_target || 0}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span className="flex-1 text-surface-300">À risque</span>
              <span className="font-bold text-amber-400">{kpisStatus?.at_risk || 0}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="flex-1 text-surface-300">Critique</span>
              <span className="font-bold text-red-400">{kpisStatus?.critical || 0}</span>
            </div>
          </div>
          {(kpisStatus?.at_risk > 0 || kpisStatus?.critical > 0) && (
            <Link
              to={`/workspace/${workspaceId}/sdsi/kpis`}
              className="btn-warning btn-sm w-full mt-4"
            >
              <Zap className="w-4 h-4" />
              Analyser les KPIs à risque
            </Link>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects by Axis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-100">
              Projets par Axe Stratégique
            </h2>
            <Link
              to={`/workspace/${workspaceId}/sdsi/axes`}
              className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
            >
              Voir tous <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {byAxis?.slice(0, 5).map((axis, index) => {
              const maxCount = Math.max(...(byAxis?.map(a => a.count) || [1]));
              const percentage = (axis.count / maxCount) * 100;
              return (
                <motion.div
                  key={axis.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: axis.color }}
                      />
                      <span className="text-surface-300 truncate max-w-[200px]">{axis.name}</span>
                    </div>
                    <span className="font-semibold text-surface-100">{axis.count}</span>
                  </div>
                  <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: axis.color }}
                    />
                  </div>
                </motion.div>
              );
            })}
            {(!byAxis || byAxis.length === 0) && (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-surface-600 mx-auto mb-3" />
                <p className="text-surface-500 mb-4">Aucun axe stratégique défini</p>
                <Link to={`/workspace/${workspaceId}/sdsi/axes`} className="btn-primary btn-sm">
                  <Plus className="w-4 h-4" />
                  Créer un axe
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Upcoming Milestones avec indicateur d'urgence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-100">
              Prochains Jalons
            </h2>
            <Link
              to={`/workspace/${workspaceId}/sdsi/projects`}
              className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
            >
              Voir tous <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingMilestones?.slice(0, 5).map((milestone, index) => {
              const dueDate = new Date(milestone.due_date);
              const today = new Date();
              const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
              const isUrgent = daysLeft <= 7;
              const isOverdue = daysLeft < 0;

              return (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.05 }}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    isOverdue ? 'bg-red-500/10 border border-red-500/20' :
                    isUrgent ? 'bg-amber-500/10 border border-amber-500/20' :
                    'bg-surface-800/50'
                  }`}
                >
                  <Flag
                    className={`w-4 h-4 mt-0.5 ${
                      isOverdue ? 'text-red-400' :
                      milestone.is_critical ? 'text-amber-400' : 'text-primary-400'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-200 truncate">
                      {milestone.name}
                    </p>
                    <p className="text-xs text-surface-500 truncate">
                      {milestone.project_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center gap-1 text-xs ${
                      isOverdue ? 'text-red-400' :
                      isUrgent ? 'text-amber-400' : 'text-surface-400'
                    }`}>
                      <Clock className="w-3 h-3" />
                      {dueDate.toLocaleDateString('fr-FR')}
                    </div>
                    {isOverdue ? (
                      <span className="text-xs text-red-400">En retard</span>
                    ) : isUrgent ? (
                      <span className="text-xs text-amber-400">{daysLeft}j restants</span>
                    ) : (
                      <span className="text-xs text-surface-500">{daysLeft}j restants</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
            {(!upcomingMilestones || upcomingMilestones.length === 0) && (
              <div className="text-center py-8">
                <Flag className="w-12 h-12 text-surface-600 mx-auto mb-3" />
                <p className="text-surface-500">Aucun jalon à venir</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions - Liens rapides améliorés */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Link
          to={`/workspace/${workspaceId}/sdsi/axes`}
          className="card p-4 hover:bg-surface-800/80 hover:border-indigo-500/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-indigo-400" />
            <ArrowRight className="w-4 h-4 text-surface-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-medium text-surface-200 group-hover:text-surface-100">
            Axes Stratégiques
          </h3>
          <p className="text-sm text-surface-500">Gérer les orientations</p>
        </Link>
        <Link
          to={`/workspace/${workspaceId}/sdsi/projects`}
          className="card p-4 hover:bg-surface-800/80 hover:border-purple-500/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <FolderGit2 className="w-8 h-8 text-purple-400" />
            <ArrowRight className="w-4 h-4 text-surface-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-medium text-surface-200 group-hover:text-surface-100">
            Projets
          </h3>
          <p className="text-sm text-surface-500">Portefeuille de projets</p>
        </Link>
        <Link
          to={`/workspace/${workspaceId}/sdsi/applications`}
          className="card p-4 hover:bg-surface-800/80 hover:border-cyan-500/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <Server className="w-8 h-8 text-cyan-400" />
            <ArrowRight className="w-4 h-4 text-surface-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-medium text-surface-200 group-hover:text-surface-100">
            Applications
          </h3>
          <p className="text-sm text-surface-500">Inventaire du SI</p>
        </Link>
        <Link
          to={`/workspace/${workspaceId}/sdsi/kpis`}
          className="card p-4 hover:bg-surface-800/80 hover:border-emerald-500/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-emerald-400" />
            <ArrowRight className="w-4 h-4 text-surface-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-medium text-surface-200 group-hover:text-surface-100">
            Indicateurs KPI
          </h3>
          <p className="text-sm text-surface-500">Mesurer la performance</p>
        </Link>
      </motion.div>
    </div>
  );
}
