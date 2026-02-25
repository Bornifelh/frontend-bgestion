import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, BarChart3, Users, Calendar, RefreshCw, AlertTriangle,
  CheckCircle, Clock, TrendingUp, Activity
} from 'lucide-react';
import { reportApi } from '../lib/api';

export default function Reports() {
  const { workspaceId } = useParams();
  const [activeTab, setActiveTab] = useState('workload');
  const [workload, setWorkload] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [activitySummary, setActivitySummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, [workspaceId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [wRes, dRes, aRes] = await Promise.all([
        reportApi.getWorkload(workspaceId),
        reportApi.getDeadlines(workspaceId),
        reportApi.getActivitySummary(workspaceId),
      ]);
      setWorkload(wRes.data || []);
      setDeadlines(dRes.data || []);
      setActivitySummary(aRes.data || {});
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'workload', label: 'Charge de travail', icon: Users },
    { id: 'deadlines', label: 'Respect des délais', icon: Calendar },
    { id: 'activity', label: 'Activité', icon: Activity },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/workspace/${workspaceId}`} className="p-2 hover:bg-surface-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-surface-100 flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-primary-400" />
              Rapports avancés
            </h1>
            <p className="text-surface-400 mt-1">Analyses détaillées de votre workspace</p>
          </div>
        </div>
        <button onClick={loadAll} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-800/50 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-surface-700 text-surface-100' : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Workload Tab */}
      {activeTab === 'workload' && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700">
                  <th className="text-left p-4 text-surface-400 font-medium">Membre</th>
                  <th className="text-center p-4 text-surface-400 font-medium">Tâches totales</th>
                  <th className="text-center p-4 text-surface-400 font-medium">Terminées</th>
                  <th className="text-center p-4 text-surface-400 font-medium">En retard</th>
                  <th className="text-center p-4 text-surface-400 font-medium">Temps passé</th>
                  <th className="text-left p-4 text-surface-400 font-medium">Progression</th>
                </tr>
              </thead>
              <tbody>
                {workload.map((member) => {
                  const progress = member.total_tasks > 0 ? Math.round((member.completed_tasks / member.total_tasks) * 100) : 0;
                  const hours = Math.floor(member.total_time_minutes / 60);
                  const minutes = Math.round(member.total_time_minutes % 60);
                  return (
                    <tr key={member.id} className="border-b border-surface-800 hover:bg-surface-800/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs font-semibold">
                            {member.first_name?.[0]}{member.last_name?.[0]}
                          </div>
                          <span className="text-surface-200">{member.first_name} {member.last_name}</span>
                        </div>
                      </td>
                      <td className="text-center p-4 text-surface-300 font-medium">{member.total_tasks}</td>
                      <td className="text-center p-4"><span className="text-green-400">{member.completed_tasks}</span></td>
                      <td className="text-center p-4"><span className={member.overdue_tasks > 0 ? 'text-red-400 font-medium' : 'text-surface-500'}>{member.overdue_tasks}</span></td>
                      <td className="text-center p-4 text-surface-400">{hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-surface-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              className={`h-full rounded-full ${progress >= 80 ? 'bg-green-500' : progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            />
                          </div>
                          <span className="text-xs text-surface-400 w-10 text-right">{progress}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {workload.length === 0 && (
              <div className="p-8 text-center text-surface-500">Aucune donnée disponible</div>
            )}
          </div>
        </div>
      )}

      {/* Deadlines Tab */}
      {activeTab === 'deadlines' && (
        <div className="space-y-4">
          {deadlines.map((board) => {
            const complianceRate = board.total_with_deadline > 0
              ? Math.round((board.on_time / board.total_with_deadline) * 100)
              : 100;
            return (
              <motion.div key={board.board_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-surface-200">{board.board_name}</h3>
                  <span className={`text-sm font-medium ${complianceRate >= 80 ? 'text-green-400' : complianceRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {complianceRate}% à temps
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-surface-800/50 rounded-lg">
                    <p className="text-lg font-bold text-surface-200">{board.total_with_deadline}</p>
                    <p className="text-xs text-surface-500">Avec échéance</p>
                  </div>
                  <div className="text-center p-3 bg-green-500/10 rounded-lg">
                    <p className="text-lg font-bold text-green-400">{board.on_time}</p>
                    <p className="text-xs text-surface-500">À temps</p>
                  </div>
                  <div className="text-center p-3 bg-red-500/10 rounded-lg">
                    <p className="text-lg font-bold text-red-400">{board.overdue}</p>
                    <p className="text-xs text-surface-500">En retard</p>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-surface-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${complianceRate}%` }}
                    className={`h-full rounded-full ${complianceRate >= 80 ? 'bg-green-500' : complianceRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  />
                </div>
              </motion.div>
            );
          })}
          {deadlines.length === 0 && (
            <div className="card p-8 text-center text-surface-500">Aucune donnée sur les échéances</div>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && activitySummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* By User */}
          <div className="card p-5">
            <h3 className="text-sm font-medium text-surface-300 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-400" /> Activité par membre
            </h3>
            <div className="space-y-3">
              {(activitySummary.byUser || []).map((u) => {
                const maxCount = Math.max(...(activitySummary.byUser.map(x => x.count) || [1]));
                return (
                  <div key={u.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-surface-300">{u.first_name} {u.last_name}</span>
                      <span className="text-surface-400">{u.count} actions</span>
                    </div>
                    <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(u.count / maxCount) * 100}%` }}
                        className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Action */}
          <div className="card p-5">
            <h3 className="text-sm font-medium text-surface-300 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Types d'actions
            </h3>
            <div className="space-y-2">
              {(activitySummary.byAction || []).slice(0, 10).map((a, i) => (
                <div key={a.action} className="flex items-center justify-between p-2 bg-surface-800/30 rounded-lg">
                  <span className="text-sm text-surface-300">{getActionLabel(a.action)}</span>
                  <span className="text-sm font-medium text-surface-400">{a.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Activity Chart */}
          <div className="card p-5 md:col-span-2">
            <h3 className="text-sm font-medium text-surface-300 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" /> Activité journalière (30 derniers jours)
            </h3>
            <div className="flex items-end gap-1 h-32">
              {(activitySummary.daily || []).reverse().map((d, i) => {
                const maxCount = Math.max(...(activitySummary.daily.map(x => x.count) || [1]));
                const height = (d.count / maxCount) * 100;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center" title={`${d.date}: ${d.count} actions`}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(height, 3)}%` }}
                      transition={{ delay: i * 0.02 }}
                      className="w-full rounded-t bg-primary-500/60 hover:bg-primary-400 transition-colors"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getActionLabel(action) {
  const labels = {
    'item_created': 'Items créés',
    'item_updated': 'Items modifiés',
    'item_deleted': 'Items supprimés',
    'value_updated': 'Valeurs modifiées',
    'comment_added': 'Commentaires ajoutés',
    'subtask_added': 'Sous-tâches ajoutées',
    'subtask_completed': 'Sous-tâches terminées',
    'board_created': 'Boards créés',
    'column_created': 'Colonnes créées',
  };
  return labels[action] || action;
}
