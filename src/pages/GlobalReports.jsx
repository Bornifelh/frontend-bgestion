import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  ArrowRight,
  FolderKanban,
} from 'lucide-react';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { workspaceApi, reportApi } from '../lib/api';

function statusLabel(key) {
  if (key === 'done' || key === 'completed') return 'Terminé';
  if (key === 'in_progress') return 'En cours';
  if (key === 'blocked') return 'Bloqué';
  if (key === 'todo') return 'À faire';
  return key === 'unset' ? 'Non défini' : key;
}

function priorityLabel(key) {
  if (key === 'critical') return 'Critique';
  if (key === 'high') return 'Haute';
  if (key === 'medium') return 'Moyenne';
  if (key === 'low') return 'Basse';
  return key === 'unset' ? 'Non défini' : key;
}

function priorityColor(key) {
  if (key === 'critical') return '#dc2626';
  if (key === 'high') return '#ef4444';
  if (key === 'medium') return '#f59e0b';
  if (key === 'low') return '#6b7280';
  return '#94a3b8';
}

function statusColor(key) {
  if (key === 'done' || key === 'completed') return '#22c55e';
  if (key === 'in_progress') return '#2563eb';
  if (key === 'blocked') return '#ef4444';
  if (key === 'todo') return '#6b7280';
  return '#94a3b8';
}

function SimpleStatBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span className="font-medium text-gray-800">{count}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function GlobalReports() {
  const navigate = useNavigate();
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const [loading, setLoading] = useState(true);
  const [aggregated, setAggregated] = useState({
    totalTasks: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0,
    byStatus: {},
    byPriority: {},
  });

  const loadAggregatedStats = useCallback(async () => {
    if (workspaces.length === 0) {
      setAggregated({
        totalTasks: 0,
        completed: 0,
        inProgress: 0,
        overdue: 0,
        byStatus: {},
        byPriority: {},
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    const slice = workspaces.slice(0, 3);
    const next = {
      totalTasks: 0,
      completed: 0,
      inProgress: 0,
      overdue: 0,
      byStatus: {},
      byPriority: {},
    };

    await Promise.all(
      slice.map(async (ws) => {
        try {
          const { data } = await workspaceApi.getStats(ws.id);
          next.totalTasks += data.totalItems || 0;
          const st = data.itemsByStatus || {};
          next.completed += (st.done || 0) + (st.completed || 0);
          next.inProgress += st.in_progress || 0;
          Object.entries(st).forEach(([k, v]) => {
            next.byStatus[k] = (next.byStatus[k] || 0) + Number(v);
          });
          Object.entries(data.itemsByPriority || {}).forEach(([k, v]) => {
            next.byPriority[k] = (next.byPriority[k] || 0) + Number(v);
          });
        } catch {
          /* ignore */
        }
      }),
    );

    await Promise.all(
      slice.map(async (ws) => {
        try {
          const { data } = await reportApi.getDeadlines(ws.id);
          (data || []).forEach((row) => {
            next.overdue += parseInt(row.overdue, 10) || 0;
          });
        } catch {
          /* ignore */
        }
      }),
    );

    setAggregated(next);
    setLoading(false);
  }, [workspaces]);

  useEffect(() => {
    loadAggregatedStats();
  }, [loadAggregatedStats]);

  const statusEntries = Object.entries(aggregated.byStatus).filter(([, v]) => v > 0);
  const priorityEntries = Object.entries(aggregated.byPriority).filter(([, v]) => v > 0);
  const statusTotal = statusEntries.reduce((acc, [, v]) => acc + v, 0);
  const priorityTotal = priorityEntries.reduce((acc, [, v]) => acc + v, 0);

  const hasBreakdownCharts =
    statusEntries.length > 0 || priorityEntries.length > 0;

  const summaryCards = [
    {
      key: 'total',
      label: 'Total tâches',
      value: aggregated.totalTasks,
      indicatorClass: 'bg-blue-500',
    },
    {
      key: 'done',
      label: 'Terminées',
      value: aggregated.completed,
      indicatorClass: 'bg-green-500',
    },
    {
      key: 'progress',
      label: 'En cours',
      value: aggregated.inProgress,
      indicatorClass: 'bg-blue-600',
    },
    {
      key: 'late',
      label: 'En retard',
      value: aggregated.overdue,
      indicatorClass: 'bg-red-500',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Rapports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Analyses et statistiques de vos projets
          </p>
        </div>
        {workspaces.length > 0 && (
          <button
            type="button"
            onClick={() => loadAggregatedStats()}
            className="btn btn-ghost btn-sm"
            disabled={loading}
          >
            Actualiser
          </button>
        )}
      </header>

      {workspaces.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center py-14">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-4 border border-gray-200">
            <FolderKanban className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Aucun espace de travail
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Créez un projet pour afficher des rapports et indicateurs consolidés.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-primary btn-sm"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {summaryCards.map((card) => (
                  <div
                    key={card.key}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${card.indicatorClass}`}
                        aria-hidden
                      />
                      <span className="text-sm text-gray-500">{card.label}</span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900 tabular-nums">
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>

              {hasBreakdownCharts && (
                <section className="mb-8">
                  <h2 className="text-sm font-semibold text-gray-900 mb-3">
                    Synthèse (3 premiers projets)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {statusEntries.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4 border-l-4 border-l-blue-500">
                        <div className="flex items-center gap-2 mb-4">
                          <PieChart className="w-4 h-4 text-blue-600" />
                          <h3 className="text-sm font-medium text-gray-800">
                            Par statut
                          </h3>
                        </div>
                        {statusEntries.map(([key, count]) => (
                          <SimpleStatBar
                            key={key}
                            label={statusLabel(key)}
                            count={count}
                            total={statusTotal}
                            color={statusColor(key)}
                          />
                        ))}
                      </div>
                    )}
                    {priorityEntries.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4 border-l-4 border-l-blue-500">
                        <div className="flex items-center gap-2 mb-4">
                          <BarChart3 className="w-4 h-4 text-blue-600" />
                          <h3 className="text-sm font-medium text-gray-800">
                            Par priorité
                          </h3>
                        </div>
                        {priorityEntries.map(([key, count]) => (
                          <SimpleStatBar
                            key={key}
                            label={priorityLabel(key)}
                            count={count}
                            total={priorityTotal}
                            color={priorityColor(key)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )}

              <section>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    Rapports par projet
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {workspaces.map((ws) => (
                    <div
                      key={ws.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 border border-gray-200 bg-gray-50"
                        style={
                          ws.color ? { backgroundColor: `${ws.color}18` } : undefined
                        }
                      >
                        {ws.icon || '📁'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {ws.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {ws.description || 'Rapports détaillés et charge d’équipe'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/workspace/${ws.id}/reports`)}
                        className="btn btn-primary btn-sm shrink-0 inline-flex items-center gap-1"
                      >
                        Ouvrir
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
