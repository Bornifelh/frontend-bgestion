import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, TrendingUp, Award, Clock, CheckCircle2, AlertTriangle, 
  Target, ChevronDown, ChevronUp, ArrowLeft, RefreshCw, Trophy,
  Zap, Star, Medal, BarChart3, PieChart
} from 'lucide-react';
import { memberApi } from '../lib/api';

// Progress circle component
const ProgressCircle = ({ value, size = 80, strokeWidth = 8, color = '#6366f1' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

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
          className="text-surface-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold" style={{ color }}>{value}%</span>
      </div>
    </div>
  );
};

// Horizontal bar chart for comparison
const HorizontalBarChart = ({ data, maxValue }) => {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-surface-300 truncate">{item.label}</span>
            <span className="text-surface-400 font-medium">{item.value}</span>
          </div>
          <div className="h-3 bg-surface-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="h-full rounded-full"
              style={{ backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Radar chart for skills
const RadarChart = ({ data, size = 200 }) => {
  const center = size / 2;
  const radius = size * 0.4;
  const angleStep = (2 * Math.PI) / data.length;
  
  const getPoint = (value, index) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };
  
  const gridLevels = [25, 50, 75, 100];
  
  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* Grid */}
      {gridLevels.map(level => {
        const r = (level / 100) * radius;
        const points = data.map((_, i) => {
          const angle = angleStep * i - Math.PI / 2;
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(' ');
        return (
          <polygon
            key={level}
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-surface-700"
          />
        );
      })}
      
      {/* Axes */}
      {data.map((item, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return (
          <g key={i}>
            <line
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeWidth="1"
              className="text-surface-700"
            />
            <text
              x={center + (radius + 20) * Math.cos(angle)}
              y={center + (radius + 20) * Math.sin(angle)}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-surface-400 text-xs"
            >
              {item.label}
            </text>
          </g>
        );
      })}
      
      {/* Data polygon */}
      <motion.polygon
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        points={data.map((item, i) => {
          const pt = getPoint(item.value, i);
          return `${pt.x},${pt.y}`;
        }).join(' ')}
        fill="rgba(99, 102, 241, 0.2)"
        stroke="#6366f1"
        strokeWidth="2"
      />
      
      {/* Data points */}
      {data.map((item, i) => {
        const pt = getPoint(item.value, i);
        return (
          <motion.circle
            key={i}
            initial={{ r: 0 }}
            animate={{ r: 4 }}
            transition={{ delay: i * 0.1 }}
            cx={pt.x}
            cy={pt.y}
            fill="#6366f1"
          />
        );
      })}
    </svg>
  );
};

// Distribution pie chart
const DistributionPie = ({ data, size = 120 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const center = size / 2;
  const radius = size * 0.4;
  
  let currentAngle = -Math.PI / 2;
  
  return (
    <svg width={size} height={size}>
      {data.map((item, i) => {
        const percentage = total > 0 ? item.value / total : 0;
        const angle = percentage * 2 * Math.PI;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle = endAngle;
        
        const x1 = center + radius * Math.cos(startAngle);
        const y1 = center + radius * Math.sin(startAngle);
        const x2 = center + radius * Math.cos(endAngle);
        const y2 = center + radius * Math.sin(endAngle);
        
        const largeArc = angle > Math.PI ? 1 : 0;
        
        return (
          <motion.path
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={item.color}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          />
        );
      })}
      <circle cx={center} cy={center} r={radius * 0.5} fill="currentColor" className="text-surface-900" />
      <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" className="fill-surface-200 text-lg font-bold">
        {total}
      </text>
    </svg>
  );
};

// Performance badge
const PerformanceBadge = ({ score }) => {
  let badge = { icon: Star, label: 'Standard', color: 'text-surface-400', bg: 'bg-surface-700' };
  
  if (score >= 90) {
    badge = { icon: Trophy, label: 'Excellence', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
  } else if (score >= 75) {
    badge = { icon: Medal, label: 'Performant', color: 'text-green-400', bg: 'bg-green-500/20' };
  } else if (score >= 50) {
    badge = { icon: Zap, label: 'En progrès', color: 'text-blue-400', bg: 'bg-blue-500/20' };
  } else if (score >= 25) {
    badge = { icon: AlertTriangle, label: 'À améliorer', color: 'text-orange-400', bg: 'bg-orange-500/20' };
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
      className="card p-4 hover:bg-surface-800/50 transition-colors"
    >
      <div 
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Rank */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
          rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
          rank === 2 ? 'bg-gray-400/20 text-gray-300' :
          rank === 3 ? 'bg-orange-500/20 text-orange-400' :
          'bg-surface-700 text-surface-400'
        }`}>
          {rank}
        </div>

        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
          {member.firstName?.[0]}{member.lastName?.[0]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-surface-100 truncate">{member.fullName}</h3>
          <p className="text-sm text-surface-500">{member.email}</p>
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
        <button className="p-2 hover:bg-surface-700 rounded-lg transition-colors">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-surface-700">
              <div className="bg-surface-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-surface-100">{metrics.totalTasks}</div>
                <div className="text-xs text-surface-500">Tâches assignées</div>
              </div>
              <div className="bg-surface-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{metrics.completedTasks}</div>
                <div className="text-xs text-surface-500">Terminées</div>
              </div>
              <div className="bg-surface-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{metrics.inProgressTasks}</div>
                <div className="text-xs text-surface-500">En cours</div>
              </div>
              <div className="bg-surface-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{metrics.overdueTasks}</div>
                <div className="text-xs text-surface-500">En retard</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-surface-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-surface-400">Taux de complétion</span>
                  <span className="font-semibold text-surface-200">{metrics.completionRate}%</span>
                </div>
                <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${metrics.completionRate}%` }}
                  />
                </div>
              </div>
              <div className="bg-surface-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-surface-400">Progression moyenne</span>
                  <span className="font-semibold text-surface-200">{metrics.averageProgress}%</span>
                </div>
                <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
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
          <p className="text-surface-400">Calcul des performances en cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="card p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-200 mb-2">Erreur</h3>
          <p className="text-surface-400 mb-4">{error}</p>
          <button onClick={loadEvaluation} className="btn-primary">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const { teamMetrics, members } = data || { teamMetrics: {}, members: [] };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to={`/workspace/${workspaceId}`}
            className="p-2 hover:bg-surface-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-surface-100 flex items-center gap-3">
              <Award className="w-7 h-7 text-primary-400" />
              Évaluation de l'équipe
            </h1>
            <p className="text-surface-400 mt-1">Performance des membres basée sur les tâches assignées</p>
          </div>
        </div>
        <button 
          onClick={loadEvaluation}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Team Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4 bg-gradient-to-br from-primary-600/20 to-purple-600/20 border-primary-500/30"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-surface-400">Performance moyenne</p>
              <p className="text-2xl font-bold text-surface-100">{teamMetrics.avgPerformance}%</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-surface-400">Membres</p>
              <p className="text-2xl font-bold text-surface-100">{teamMetrics.totalMembers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/20 rounded-xl">
              <Target className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-surface-400">Tâches totales</p>
              <p className="text-2xl font-bold text-surface-100">{teamMetrics.totalTasks}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-surface-400">Terminées</p>
              <p className="text-2xl font-bold text-surface-100">{teamMetrics.totalCompleted}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <Clock className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-surface-400">En retard</p>
              <p className="text-2xl font-bold text-surface-100">{teamMetrics.totalOverdue}</p>
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
            className="card p-5"
          >
            <h3 className="text-sm font-medium text-surface-300 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary-400" />
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
            className="card p-5"
          >
            <h3 className="text-sm font-medium text-surface-300 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyan-400" />
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
                  <span className="text-surface-400">Terminées ({teamMetrics.totalCompleted})</span>
                </div>
              )}
              {(teamMetrics.totalTasks - teamMetrics.totalCompleted - teamMetrics.totalOverdue) > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-surface-400">En cours ({teamMetrics.totalTasks - teamMetrics.totalCompleted - teamMetrics.totalOverdue})</span>
                </div>
              )}
              {teamMetrics.totalOverdue > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-surface-400">En retard ({teamMetrics.totalOverdue})</span>
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
              className="card p-5"
            >
              <h3 className="text-sm font-medium text-surface-300 mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
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
      <div className="card p-4">
        <h3 className="text-sm font-medium text-surface-300 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Calcul de la performance
        </h3>
        <div className="flex flex-wrap items-center gap-6 text-sm text-surface-400">
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
          <h2 className="text-lg font-semibold text-surface-200 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary-400" />
            Classement des membres
          </h2>
          <span className="text-sm text-surface-500">
            Trié par performance décroissante
          </span>
        </div>

        {members.length === 0 ? (
          <div className="card p-8 text-center">
            <Users className="w-12 h-12 text-surface-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-surface-300 mb-2">Aucun membre</h3>
            <p className="text-surface-500">Il n'y a pas encore de membres dans cet espace de travail.</p>
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
