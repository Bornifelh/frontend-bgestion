import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, TrendingUp, Award, Clock, CheckCircle2, AlertTriangle, 
  Target, ChevronDown, ChevronUp, RefreshCw, Trophy,
  Zap, Star, Medal, BarChart3, PieChart
} from 'lucide-react';
import { memberApi } from '../lib/api';
import { ProgressCircle, HorizontalBarChart, RadarChart, DistributionPie } from '../components/charts/ChartComponents';

// Performance badge
const PerformanceBadge = ({ score }) => {
  let badge = { icon: Star, label: 'Standard', color: 'text-gray-500', bg: 'bg-gray-100' };
  
  if (score >= 90) {
    badge = { icon: Trophy, label: 'Excellence', color: 'text-yellow-600', bg: 'bg-yellow-50' };
  } else if (score >= 75) {
    badge = { icon: Medal, label: 'Performant', color: 'text-green-600', bg: 'bg-green-50' };
  } else if (score >= 50) {
    badge = { icon: Zap, label: 'En progrès', color: 'text-blue-600', bg: 'bg-blue-50' };
  } else if (score >= 25) {
    badge = { icon: AlertTriangle, label: 'À améliorer', color: 'text-orange-600', bg: 'bg-orange-50' };
  }
  
  const Icon = badge.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.color}`}>
      <Icon className="w-3 h-3" />
      {badge.label}
    </span>
  );
};

// Member card
const MemberCard = ({ member, rank }) => {
  const [expanded, setExpanded] = useState(false);
  const { metrics } = member;
  
  const getScoreColor = (score) => {
    if (score >= 75) return '#22c55e';
    if (score >= 50) return '#3b82f6';
    if (score >= 25) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <motion.div
      layout
      className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
    >
      <div 
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Rank */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
          rank === 1 ? 'bg-yellow-50 text-yellow-600' :
          rank === 2 ? 'bg-gray-100 text-gray-500' :
          rank === 3 ? 'bg-orange-50 text-orange-600' :
          'bg-gray-100 text-gray-500'
        }`}>
          {rank}
        </div>

        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
          {member.firstName?.[0]}{member.lastName?.[0]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{member.fullName}</h3>
          <p className="text-sm text-gray-500">{member.email}</p>
        </div>

        {/* Performance */}
        <div className="flex items-center gap-4">
          <ProgressCircle 
            value={metrics.performanceScore} 
            size={60} 
            strokeWidth={6}
            color={getScoreColor(metrics.performanceScore)}
          />
          <PerformanceBadge score={metrics.performanceScore} />
        </div>

        {/* Expand button */}
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </button>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{metrics.totalTasks}</div>
                <div className="text-xs text-gray-500">Tâches assignées</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.completedTasks}</div>
                <div className="text-xs text-gray-500">Terminées</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.inProgressTasks}</div>
                <div className="text-xs text-gray-500">En cours</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{metrics.overdueTasks}</div>
                <div className="text-xs text-gray-500">En retard</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Taux de complétion</span>
                  <span className="font-semibold text-gray-900">{metrics.completionRate}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${metrics.completionRate}%` }}
                  />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Progression moyenne</span>
                  <span className="font-semibold text-gray-900">{metrics.averageProgress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${metrics.averageProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function TeamEvaluation() {
  const { workspaceId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const loadEvaluation = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await memberApi.getEvaluation(workspaceId);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      loadEvaluation();
    }
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
          <p className="text-gray-500">Calcul des performances en cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={loadEvaluation} className="btn-primary">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const { teamMetrics, members: allMembers } = data || { teamMetrics: {}, members: [] };
  
  // Filter to only show members who have assigned tasks
  const members = allMembers.filter(member => member.metrics?.totalTasks > 0);

  return (
    <div className="p-6 space-y-6">
      {/* Team Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-primary-50 to-purple-50 border-primary-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Performance moyenne</p>
              <p className="text-2xl font-bold text-gray-900">{teamMetrics.avgPerformance}%</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-gray-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Membres avec tâches</p>
              <p className="text-2xl font-bold text-gray-900">{members.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-50 rounded-xl">
              <Target className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tâches totales</p>
              <p className="text-2xl font-bold text-gray-900">{teamMetrics.totalTasks}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white border border-gray-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Terminées</p>
              <p className="text-2xl font-bold text-gray-900">{teamMetrics.totalCompleted}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-gray-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-xl">
              <Clock className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">En retard</p>
              <p className="text-2xl font-bold text-gray-900">{teamMetrics.totalOverdue}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section - Only show if we have real data */}
      {teamMetrics.totalTasks > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Team Skills Radar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary-600" />
              Compétences équipe
            </h3>
            <div className="flex justify-center">
              <RadarChart
                data={[
                  { label: 'Perf.', value: teamMetrics.avgPerformance || 0 },
                  { label: 'Qualité', value: teamMetrics.totalTasks > 0 ? Math.round((teamMetrics.totalCompleted / teamMetrics.totalTasks) * 100) : 0 },
                  { label: 'Délais', value: teamMetrics.totalTasks > 0 ? Math.round(100 - ((teamMetrics.totalOverdue / teamMetrics.totalTasks) * 100)) : 0 },
                  { label: 'Charge', value: teamMetrics.totalMembers > 0 ? Math.min(Math.round((teamMetrics.totalTasks / teamMetrics.totalMembers) * 10), 100) : 0 },
                ]}
                size={180}
              />
            </div>
          </motion.div>

          {/* Task Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyan-500" />
              Distribution des tâches
            </h3>
            <div className="flex items-center justify-center mb-4">
              <DistributionPie
                data={[
                  { value: teamMetrics.totalCompleted, color: '#22c55e' },
                  { value: Math.max(0, teamMetrics.totalTasks - teamMetrics.totalCompleted - teamMetrics.totalOverdue), color: '#3b82f6' },
                  { value: teamMetrics.totalOverdue, color: '#ef4444' },
                ].filter(d => d.value > 0)}
                size={120}
              />
            </div>
            <div className="flex justify-center gap-4 text-xs">
              {teamMetrics.totalCompleted > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-gray-500">Terminées ({teamMetrics.totalCompleted})</span>
                </div>
              )}
              {(teamMetrics.totalTasks - teamMetrics.totalCompleted - teamMetrics.totalOverdue) > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-gray-500">En cours ({teamMetrics.totalTasks - teamMetrics.totalCompleted - teamMetrics.totalOverdue})</span>
                </div>
              )}
              {teamMetrics.totalOverdue > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-gray-500">En retard ({teamMetrics.totalOverdue})</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Top Performers */}
          {members.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Top performers
              </h3>
              <HorizontalBarChart
                data={members.slice(0, 5).map((m, i) => ({
                  label: m.fullName?.split(' ')[0] || m.firstName || 'Membre',
                  value: m.metrics?.performanceScore || 0,
                  color: i === 0 ? '#eab308' : i === 1 ? '#9ca3af' : i === 2 ? '#f97316' : '#6366f1',
                }))}
                maxValue={100}
              />
            </motion.div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Calcul de la performance
        </h3>
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Taux de complétion (40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Progression moyenne (30%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span>Respect des délais (30%)</span>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary-600" />
            Classement des membres
            {members.length > 0 && (
              <span className="text-sm font-normal text-gray-500">
                ({members.length} avec des tâches assignées)
              </span>
            )}
          </h2>
          <span className="text-sm text-gray-500">
            Trié par performance décroissante
          </span>
        </div>

        {members.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun membre avec des tâches</h3>
            <p className="text-gray-500">
              {allMembers.length > 0 
                ? `${allMembers.length} membre(s) dans cet espace, mais aucun n'a de tâche assignée.`
                : "Il n'y a pas encore de membres dans cet espace de travail."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MemberCard member={member} rank={index + 1} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
