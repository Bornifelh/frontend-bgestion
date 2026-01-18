import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  FolderKanban,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Star,
  Activity,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useAuthStore } from '../stores/authStore';
import { activityApi, workspaceApi } from '../lib/api';
import CreateWorkspaceModal from '../components/modals/CreateWorkspaceModal';

// Mini bar chart component
const MiniBarChart = ({ data, height = 60 }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((item, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(item.value / maxValue) * 100}%` }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          className="flex-1 rounded-t-sm relative group cursor-pointer"
          style={{ backgroundColor: item.color, minHeight: item.value > 0 ? 4 : 0 }}
        >
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-surface-900 text-xs text-surface-200 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            {item.label}: {item.value}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Donut chart component
const DonutChart = ({ data, size = 120, strokeWidth = 20 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  let currentOffset = 0;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-surface-800"
        />
        {data.map((item, i) => {
          const percentage = total > 0 ? item.value / total : 0;
          const dashLength = circumference * percentage;
          const offset = currentOffset;
          currentOffset += dashLength;
          
          return (
            <motion.circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={item.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${dashLength} ${circumference}`}
              strokeDashoffset={-offset}
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${dashLength} ${circumference}` }}
              transition={{ delay: i * 0.2, duration: 0.8 }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-surface-100">{total}</span>
        <span className="text-xs text-surface-500">Total</span>
      </div>
    </div>
  );
};

// Progress wave animation
const ProgressWave = ({ value, color = '#6366f1' }) => (
  <div className="relative h-2 bg-surface-800 rounded-full overflow-hidden">
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="h-full rounded-full relative overflow-hidden"
      style={{ backgroundColor: color }}
    >
      <motion.div
        animate={{ x: ['-100%', '100%'] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
    </motion.div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const user = useAuthStore((state) => state.user);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workspaceStats, setWorkspaceStats] = useState(null);

  useEffect(() => {
    loadActivities();
    loadWorkspaceStats();
  }, [workspaces]);

  const loadWorkspaceStats = async () => {
    if (workspaces.length === 0) return;
    try {
      // Aggregate stats from all workspaces
      const stats = { byStatus: {}, byPriority: {}, weekly: [] };
      for (const ws of workspaces.slice(0, 3)) {
        try {
          const { data } = await workspaceApi.getStats(ws.id);
          if (data.itemsByStatus) {
            Object.entries(data.itemsByStatus).forEach(([k, v]) => {
              stats.byStatus[k] = (stats.byStatus[k] || 0) + v;
            });
          }
          if (data.itemsByPriority) {
            Object.entries(data.itemsByPriority).forEach(([k, v]) => {
              stats.byPriority[k] = (stats.byPriority[k] || 0) + v;
            });
          }
        } catch (e) {
          // Ignore individual workspace errors
        }
      }
      setWorkspaceStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadActivities = async () => {
    try {
      const { data } = await activityApi.getMy({ limit: 3 });
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const totalBoards = workspaces.reduce((acc, ws) => acc + (ws.boardCount || 0), 0);
  const totalMembers = workspaces.reduce((acc, ws) => acc + (ws.memberCount || 0), 0);

  const stats = [
    {
      label: 'Espaces de travail',
      value: workspaces.length,
      icon: FolderKanban,
      color: 'from-primary-500 to-primary-600',
      bgColor: 'bg-primary-500/10',
    },
    {
      label: 'Boards actifs',
      value: totalBoards,
      icon: FolderKanban,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Collaborateurs',
      value: totalMembers,
      icon: Users,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-500/10',
    },
    {
      label: 'Activités récentes',
      value: activities.length,
      icon: Activity,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  const getActivityIcon = (action) => {
    switch (action) {
      case 'item_created':
        return <Plus className="w-4 h-4 text-green-400" />;
      case 'item_updated':
      case 'value_updated':
        return <TrendingUp className="w-4 h-4 text-blue-400" />;
      case 'comment_added':
        return <Activity className="w-4 h-4 text-purple-400" />;
      case 'status_changed':
        return <CheckCircle2 className="w-4 h-4 text-amber-400" />;
      default:
        return <Clock className="w-4 h-4 text-surface-400" />;
    }
  };

  const getActivityText = (activity) => {
    const actions = {
      'item_created': 'a créé un item',
      'item_updated': 'a modifié un item',
      'value_updated': 'a mis à jour une valeur',
      'comment_added': 'a commenté',
      'status_changed': 'a changé un statut',
      'board_created': 'a créé un board',
      'member_invited': 'a invité un membre',
    };
    return actions[activity.action] || 'a effectué une action';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-4xl font-display font-bold text-surface-100 mb-2">
          {getGreeting()}, {user?.firstName} ! 👋
        </h1>
        <p className="text-lg text-surface-400">
          Voici un aperçu de vos projets et activités récentes.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-5 hover:bg-surface-800/80 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
              >
                <stat.icon className="w-6 h-6 text-surface-100" />
              </div>
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${stat.color}`} />
            </div>
            <p className="text-3xl font-display font-bold text-surface-100 mb-1">
              {stat.value}
            </p>
            <p className="text-sm text-surface-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Section - Only show if we have real data */}
      {workspaces.length > 0 && workspaceStats && Object.keys(workspaceStats.byStatus).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {/* Status Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-primary-400" />
              <h3 className="font-semibold text-surface-200">Répartition par statut</h3>
            </div>
            <div className="flex items-center justify-center mb-4">
              <DonutChart
                data={Object.entries(workspaceStats.byStatus)
                  .filter(([_, v]) => v > 0)
                  .map(([status, count]) => ({
                    value: count,
                    color: status === 'done' || status === 'completed' ? '#22c55e' :
                           status === 'in_progress' ? '#3b82f6' :
                           status === 'blocked' ? '#ef4444' : '#6b7280',
                    label: status === 'done' || status === 'completed' ? 'Terminé' :
                           status === 'in_progress' ? 'En cours' :
                           status === 'blocked' ? 'Bloqué' : 'À faire',
                  }))}
                size={100}
                strokeWidth={16}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(workspaceStats.byStatus).filter(([_, v]) => v > 0).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    status === 'done' || status === 'completed' ? 'bg-green-500' :
                    status === 'in_progress' ? 'bg-blue-500' :
                    status === 'blocked' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-surface-400">
                    {status === 'done' || status === 'completed' ? 'Terminé' :
                     status === 'in_progress' ? 'En cours' :
                     status === 'blocked' ? 'Bloqué' : 
                     status === 'todo' ? 'À faire' : 'À faire'} ({count})
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Priority Distribution */}
          {Object.keys(workspaceStats.byPriority).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-surface-200">Par priorité</h3>
              </div>
              <MiniBarChart
                data={Object.entries(workspaceStats.byPriority)
                  .filter(([_, v]) => v > 0)
                  .map(([priority, count]) => ({
                    value: count,
                    color: priority === 'critical' ? '#dc2626' :
                           priority === 'high' ? '#ef4444' :
                           priority === 'medium' ? '#f59e0b' : '#6b7280',
                    label: priority === 'critical' ? 'Critique' :
                           priority === 'high' ? 'Haute' :
                           priority === 'medium' ? 'Moyenne' : 'Basse',
                  }))}
                height={80}
              />
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-surface-500">
                {Object.entries(workspaceStats.byPriority).filter(([_, v]) => v > 0).map(([priority]) => (
                  <span key={priority}>
                    {priority === 'critical' ? 'Critique' :
                     priority === 'high' ? 'Haute' :
                     priority === 'medium' ? 'Moyenne' : priority}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Progress Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-surface-200">Progression globale</h3>
            </div>
            {(() => {
              const totalItems = Object.values(workspaceStats.byStatus).reduce((a, b) => a + b, 0);
              const completedItems = (workspaceStats.byStatus.done || 0) + (workspaceStats.byStatus.completed || 0);
              const inProgressItems = workspaceStats.byStatus.in_progress || 0;
              const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
              const activeRate = totalItems > 0 ? Math.round(((completedItems + inProgressItems) / totalItems) * 100) : 0;
              
              return (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-surface-400">Tâches terminées</span>
                      <span className="text-green-400 font-medium">{completionRate}%</span>
                    </div>
                    <ProgressWave value={completionRate} color="#22c55e" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-surface-400">Tâches actives</span>
                      <span className="text-blue-400 font-medium">{activeRate}%</span>
                    </div>
                    <ProgressWave value={activeRate} color="#3b82f6" />
                  </div>
                  <div className="pt-2 border-t border-surface-800">
                    <div className="text-center">
                      <span className="text-2xl font-bold text-surface-100">{totalItems}</span>
                      <span className="text-sm text-surface-500 ml-2">tâches au total</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspaces */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-display font-semibold text-surface-100">
              Vos espaces de travail
            </h2>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn-secondary text-sm"
            >
              <Plus className="w-4 h-4" />
              Nouveau
            </button>
          </div>

          {workspaces.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card text-center py-12"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-8 h-8 text-primary-400" />
              </div>
              <h3 className="text-xl font-display font-semibold text-surface-100 mb-2">
                Créez votre premier espace de travail
              </h3>
              <p className="text-surface-400 max-w-md mx-auto mb-5">
                Les espaces de travail vous permettent d'organiser vos projets et
                de collaborer avec votre équipe.
              </p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" />
                Créer un workspace
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workspaces.slice(0, 6).map((workspace, index) => (
                <motion.button
                  key={workspace.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/workspace/${workspace.id}`)}
                  className="card p-5 text-left hover:border-primary-500/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${workspace.color}20` }}
                    >
                      {workspace.icon}
                    </div>
                    <ArrowRight className="w-5 h-5 text-surface-500 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="font-semibold text-surface-100 mb-1">
                    {workspace.name}
                  </h3>
                  <p className="text-sm text-surface-500 mb-3 line-clamp-2">
                    {workspace.description || 'Aucune description'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-surface-500">
                    <span className="flex items-center gap-1">
                      <FolderKanban className="w-3.5 h-3.5" />
                      {workspace.boardCount || 0} boards
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {workspace.memberCount || 0} membres
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-display font-semibold text-surface-100">
              Activité récente
            </h2>
          </div>
          
          <div className="card p-4">
            {loadingActivities ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-4">
                {activities.slice(0, 3).map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center flex-shrink-0">
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-surface-300">
                        <span className="font-medium text-surface-200">
                          {activity.userName || 'Utilisateur'}
                        </span>
                        {' '}{getActivityText(activity)}
                        {activity.itemName && (
                          <span className="text-primary-400"> "{activity.itemName}"</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {activity.boardName && (
                          <span className="text-xs text-surface-500 flex items-center gap-1">
                            <FolderKanban className="w-3 h-3" />
                            {activity.boardName}
                          </span>
                        )}
                        <span className="text-xs text-surface-600">•</span>
                        <span className="text-xs text-surface-500">
                          {formatDistanceToNow(new Date(activity.createdAt), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-10 h-10 text-surface-600 mx-auto mb-3" />
                <p className="text-surface-500 text-sm">
                  Vos activités récentes apparaîtront ici
                </p>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-surface-400 mb-3">Actions rapides</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-surface-800/50 hover:bg-surface-800 rounded-xl text-left transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-primary-400" />
                </div>
                <span className="text-surface-300 group-hover:text-surface-100 transition-colors">
                  Nouvel espace de travail
                </span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-surface-800/50 hover:bg-surface-800 rounded-xl text-left transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Star className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-surface-300 group-hover:text-surface-100 transition-colors">
                  Accéder aux favoris
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
