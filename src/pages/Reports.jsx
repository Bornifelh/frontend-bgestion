import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart3, Users, Calendar, RefreshCw, AlertTriangle,
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
    { id: 'deadlines', label: 'Respect des delais', icon: Calendar },
    { id: 'activity', label: 'Activite', icon: Activity },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#F36F21] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white shadow-sm text-[#173D68]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        <button onClick={loadAll} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Workload Tab */}
      {activeTab === 'workload' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Membre</th>
                  <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Taches totales</th>
                  <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Terminees</th>
                  <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">En retard</th>
                  <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Temps passe</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Progression</th>
                </tr>
              </thead>
              <tbody>
                {workload.map((member) => {
                  const progress = member.total_tasks > 0 ? Math.round((member.completed_tasks / member.total_tasks) * 100) : 0;
                  const hours = Math.floor(member.total_time_minutes / 60);
                  const minutes = Math.round(member.total_time_minutes % 60);
                  return (
                    <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#173D68] flex items-center justify-center text-white text-xs font-semibold">
                            {member.first_name?.[0]}{member.last_name?.[0]}
                          </div>
                          <span className="text-gray-800 font-medium">{member.first_name} {member.last_name}</span>
                        </div>
                      </td>
                      <td className="text-center p-4 text-[#173D68] font-bold">{member.total_tasks}</td>
                      <td className="text-center p-4"><span className="text-green-600 font-medium">{member.completed_tasks}</span></td>
                      <td className="text-center p-4"><span className={member.overdue_tasks > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>{member.overdue_tasks}</span></td>
                      <td className="text-center p-4 text-gray-500">{hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${progress}%`,
                                backgroundColor: progress >= 80 ? '#22c55e' : progress >= 50 ? '#F36F21' : '#ef4444',
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-right font-medium">{progress}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {workload.length === 0 && (
              <div className="p-12 text-center">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">Aucune donnee disponible</p>
              </div>
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
              <div key={board.board_id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#173D68]">{board.board_name}</h3>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    complianceRate >= 80 ? 'bg-green-50 text-green-600' :
                    complianceRate >= 50 ? 'bg-orange-50 text-[#F36F21]' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {complianceRate}% a temps
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-[#173D68]/5 rounded-lg border border-[#173D68]/10">
                    <p className="text-lg font-bold text-[#173D68]">{board.total_with_deadline}</p>
                    <p className="text-xs text-gray-500">Avec echeance</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-lg font-bold text-green-600">{board.on_time}</p>
                    <p className="text-xs text-gray-500">A temps</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-lg font-bold text-red-600">{board.overdue}</p>
                    <p className="text-xs text-gray-500">En retard</p>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${complianceRate}%`,
                      backgroundColor: complianceRate >= 80 ? '#22c55e' : complianceRate >= 50 ? '#F36F21' : '#ef4444',
                    }}
                  />
                </div>
              </div>
            );
          })}
          {deadlines.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">Aucune donnee sur les echeances</p>
            </div>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && activitySummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* By User */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#173D68] mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#173D68]/10 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-[#173D68]" />
              </div>
              Activite par membre
            </h3>
            <div className="space-y-3">
              {(activitySummary.byUser || []).map((u) => {
                const maxCount = Math.max(...(activitySummary.byUser.map(x => x.count) || [1]));
                return (
                  <div key={u.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{u.first_name} {u.last_name}</span>
                      <span className="text-gray-500">{u.count} actions</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(u.count / maxCount) * 100}%`,
                          background: 'linear-gradient(to right, #F36F21, #173D68)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Action */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#173D68] mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#F36F21]/10 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-[#F36F21]" />
              </div>
              Types d'actions
            </h3>
            <div className="space-y-2">
              {(activitySummary.byAction || []).slice(0, 10).map((a) => (
                <div key={a.action} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-sm text-gray-700">{getActionLabel(a.action)}</span>
                  <span className="text-sm font-bold text-[#173D68] bg-[#173D68]/5 px-2 py-0.5 rounded">{a.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Activity Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 md:col-span-2 shadow-sm">
            <h3 className="text-sm font-semibold text-[#173D68] mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-green-600" />
              </div>
              Activite journaliere (30 derniers jours)
            </h3>
            <div className="flex items-end gap-1 h-32">
              {(activitySummary.daily || []).reverse().map((d, i) => {
                const maxCount = Math.max(...(activitySummary.daily.map(x => x.count) || [1]));
                const height = (d.count / maxCount) * 100;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center group" title={`${d.date}: ${d.count} actions`}>
                    <div
                      className="w-full rounded-t transition-colors hover:opacity-80"
                      style={{
                        height: `${Math.max(height, 3)}%`,
                        backgroundColor: height > 70 ? '#F36F21' : height > 30 ? '#173D68' : '#C1C7D0',
                      }}
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
    'item_created': 'Items crees',
    'item_updated': 'Items modifies',
    'item_deleted': 'Items supprimes',
    'value_updated': 'Valeurs modifiees',
    'comment_added': 'Commentaires ajoutes',
    'subtask_added': 'Sous-taches ajoutees',
    'subtask_completed': 'Sous-taches terminees',
    'board_created': 'Boards crees',
    'column_created': 'Colonnes creees',
  };
  return labels[action] || action;
}
