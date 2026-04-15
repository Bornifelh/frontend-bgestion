import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, TrendingUp, Activity, Zap, Flame, Layers } from 'lucide-react';
import { useBoardStore } from '../../stores/boardStore';
import { sprintApi } from '../../lib/api';

export default function BoardCharts() {
  const { currentBoard, columns = [], items = [], groups = [] } = useBoardStore();
  const [activeChart, setActiveChart] = useState('status');
  const [velocityData, setVelocityData] = useState([]);
  const [burndownData, setBurndownData] = useState(null);
  const [activeSprints, setActiveSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState(null);

  useEffect(() => {
    if (currentBoard?.id) {
      sprintApi.getVelocity(currentBoard.id).then(res => setVelocityData(res.data || [])).catch(() => {});
      sprintApi.getByBoard(currentBoard.id).then(res => {
        const sprints = res.data || [];
        setActiveSprints(sprints);
        const active = sprints.find(s => s.status === 'active');
        if (active) { setSelectedSprintId(active.id); loadBurndown(active.id); }
      }).catch(() => {});
    }
  }, [currentBoard?.id]);

  const loadBurndown = async (sprintId) => {
    try { const { data } = await sprintApi.getBurndown(sprintId); setBurndownData(data); } catch (error) { console.error('Error loading burndown:', error); }
  };

  const statusColumn = useMemo(() => columns.find(col => col?.type === 'status') || null, [columns]);
  const numberColumns = useMemo(() => columns.filter(col => col?.type === 'number') || [], [columns]);

  const statusDistribution = useMemo(() => {
    if (!statusColumn?.labels || !Array.isArray(statusColumn.labels)) return [];
    return statusColumn.labels.filter(l => l != null).map((label, index) => ({
      id: label.id || `status-${index}`,
      label: label.name || label.label || `Statut ${index + 1}`,
      color: label.color || '#6b7280',
      count: items.filter(item => item?.values?.[statusColumn.id] === label.id).length,
    }));
  }, [statusColumn, items]);

  const groupDistribution = useMemo(() => {
    if (!Array.isArray(groups)) return [];
    return groups.filter(g => g != null).map((group, index) => ({
      id: group.id || `group-${index}`,
      label: group.name || `Groupe ${index + 1}`,
      color: group.color || '#6b7280',
      count: items.filter(item => item?.groupId === group.id).length,
    }));
  }, [groups, items]);

  const stats = useMemo(() => {
    const total = items?.length || 0;
    let completedCount = 0;
    if (statusColumn?.labels && Array.isArray(statusColumn.labels)) {
      const completed = statusColumn.labels.find(l => {
        if (!l) return false;
        const name = String(l.name || l.label || '').toLowerCase();
        return name.includes('terminé') || name.includes('done') || name.includes('complet');
      });
      if (completed) completedCount = items.filter(i => i?.values?.[statusColumn.id] === completed.id).length;
    }
    return { total, completed: completedCount, completionRate: total > 0 ? Math.round((completedCount / total) * 100) : 0, groups: groups?.length || 0 };
  }, [items, groups, statusColumn]);

  const maxCount = useMemo(() => { if (statusDistribution.length === 0) return 1; return Math.max(...statusDistribution.map(s => s.count), 1); }, [statusDistribution]);

  const cumulativeFlowData = useMemo(() => {
    if (!statusColumn?.labels || !Array.isArray(statusColumn.labels) || items.length === 0) return [];
    return statusColumn.labels.filter(l => l != null).map(label => ({
      label: label.name || label.label || 'Statut',
      color: label.color || '#6b7280',
      count: items.filter(item => item?.values?.[statusColumn.id] === label.id).length,
    }));
  }, [statusColumn, items]);

  const chartOptions = [
    { id: 'status', label: 'Par statut', icon: PieChart },
    { id: 'groups', label: 'Par groupe', icon: BarChart3 },
    { id: 'burndown', label: 'Burndown', icon: Flame },
    { id: 'cfd', label: 'Flux cumule', icon: Layers },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Total items</span>
            <div className="w-8 h-8 rounded-lg bg-[#F36F21]/10 flex items-center justify-center"><Activity className="w-4 h-4 text-[#F36F21]" /></div>
          </div>
          <p className="text-2xl font-bold text-[#173D68]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Termines</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-emerald-500" /></div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Taux completion</span>
            <div className="w-8 h-8 rounded-lg bg-[#173D68]/10 flex items-center justify-center"><PieChart className="w-4 h-4 text-[#173D68]" /></div>
          </div>
          <p className="text-2xl font-bold text-[#173D68]">{stats.completionRate}%</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Groupes</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-amber-500" /></div>
          </div>
          <p className="text-2xl font-bold text-[#173D68]">{stats.groups}</p>
        </div>
      </div>

      {/* Chart selector */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {chartOptions.map(opt => (
          <button key={opt.id} onClick={() => setActiveChart(opt.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeChart === opt.id ? 'bg-white text-[#173D68] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <opt.icon className="w-4 h-4" />{opt.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {activeChart === 'status' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-[#173D68] mb-6">Distribution par statut</h3>
            {statusDistribution.length > 0 ? (
              <div className="space-y-4">
                {statusDistribution.map((status, index) => (
                  <div key={status.id || `status-${index}`} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                        <span className="text-gray-700">{status.label}</span>
                      </div>
                      <span className="text-[#173D68] font-bold">{status.count}</span>
                    </div>
                    <div className="h-5 bg-gray-100 rounded-lg overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(status.count / maxCount) * 100}%` }} transition={{ delay: index * 0.1, duration: 0.5 }} className="h-full rounded-lg" style={{ backgroundColor: status.color }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8">Ajoutez une colonne Statut avec des labels</p>
            )}
          </div>
        )}

        {activeChart === 'groups' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-[#173D68] mb-6">Distribution par groupe</h3>
            {groupDistribution.length > 0 ? (
              <div className="space-y-4">
                {groupDistribution.map((group, index) => {
                  const maxGroupCount = Math.max(...groupDistribution.map(g => g.count), 1);
                  return (
                    <div key={group.id || `group-${index}`} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
                          <span className="text-gray-700">{group.label}</span>
                        </div>
                        <span className="text-[#173D68] font-bold">{group.count}</span>
                      </div>
                      <div className="h-5 bg-gray-100 rounded-lg overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(group.count / maxGroupCount) * 100}%` }} transition={{ delay: index * 0.1, duration: 0.5 }} className="h-full rounded-lg" style={{ backgroundColor: group.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8">Ajoutez des groupes pour voir les statistiques</p>
            )}
          </div>
        )}

        {/* Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-[#173D68] mb-6">Repartition</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              {statusDistribution.length > 0 && items.length > 0 ? (
                <>
                  <div className="w-full h-full rounded-full" style={{
                    background: (() => {
                      let gradient = '';
                      let prevPercent = 0;
                      statusDistribution.forEach((status) => {
                        const percentage = (status.count / items.length) * 100;
                        gradient += `${status.color} ${prevPercent}% ${prevPercent + percentage}%, `;
                        prevPercent += percentage;
                      });
                      return `conic-gradient(${gradient.slice(0, -2)})`;
                    })()
                  }} />
                  <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-inner">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#173D68]">{items.length}</p>
                      <p className="text-xs text-gray-500">items</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-sm text-center px-4">Pas de donnees</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {statusDistribution.map((status, index) => (
              <div key={status.id || `legend-${index}`} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                <span className="text-sm text-gray-500">{status.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Burndown Chart */}
      {activeChart === 'burndown' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-[#173D68] flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#F36F21]/10 flex items-center justify-center"><Flame className="w-4 h-4 text-[#F36F21]" /></div>
              Burndown Chart
            </h3>
            {activeSprints.length > 0 && (
              <select value={selectedSprintId || ''} onChange={(e) => { setSelectedSprintId(e.target.value); loadBurndown(e.target.value); }} className="input w-auto text-sm">
                {activeSprints.map(s => (<option key={s.id} value={s.id}>{s.name} ({s.status})</option>))}
              </select>
            )}
          </div>
          {burndownData?.days?.length > 0 ? (
            <div className="relative h-64">
              <svg viewBox="0 0 800 250" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                {[0, 25, 50, 75, 100].map(pct => (
                  <line key={pct} x1="60" y1={20 + (200 * (100 - pct) / 100)} x2="780" y2={20 + (200 * (100 - pct) / 100)} stroke="#e5e7eb" strokeWidth="0.5" />
                ))}
                <line x1="60" y1="20" x2="780" y2="220" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="8 4" />
                {burndownData.days.length > 1 && (
                  <polyline fill="none" stroke="#F36F21" strokeWidth="2.5" points={burndownData.days.map((day, i) => {
                    const x = 60 + (i / (burndownData.days.length - 1)) * 720;
                    const maxItems = burndownData.total_items || 1;
                    const y = 20 + ((1 - (day.remaining / maxItems)) * 200);
                    return `${x},${y}`;
                  }).join(' ')} />
                )}
                {burndownData.days.map((day, i) => {
                  const x = 60 + (i / Math.max(burndownData.days.length - 1, 1)) * 720;
                  const maxItems = burndownData.total_items || 1;
                  const y = 20 + ((1 - (day.remaining / maxItems)) * 200);
                  return <circle key={i} cx={x} cy={y} r="4" fill="#F36F21" />;
                })}
                <text x="30" y="25" fill="#6b7280" fontSize="10" textAnchor="middle">{burndownData.total_items || 0}</text>
                <text x="30" y="225" fill="#6b7280" fontSize="10" textAnchor="middle">0</text>
                {burndownData.days.filter((_, i) => i % Math.max(1, Math.floor(burndownData.days.length / 6)) === 0).map((day, i) => {
                  const origIdx = burndownData.days.indexOf(day);
                  const x = 60 + (origIdx / Math.max(burndownData.days.length - 1, 1)) * 720;
                  return <text key={i} x={x} y="245" fill="#6b7280" fontSize="9" textAnchor="middle">{day.date?.substring(5) || ''}</text>;
                })}
              </svg>
              <div className="flex items-center justify-center gap-6 mt-2">
                <div className="flex items-center gap-2"><div className="w-6 h-0.5 bg-[#F36F21]" /><span className="text-xs text-gray-500">Reel</span></div>
                <div className="flex items-center gap-2"><div className="w-6 h-0.5 border-t-2 border-dashed border-gray-400" /><span className="text-xs text-gray-500">Ideal</span></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Flame className="w-8 h-8 mb-2 text-gray-300" />
              <p className="text-sm">{activeSprints.length === 0 ? 'Creez un sprint pour voir le burndown' : 'Aucune donnee de burndown'}</p>
            </div>
          )}
        </div>
      )}

      {/* Cumulative Flow Diagram */}
      {activeChart === 'cfd' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm col-span-2">
          <h3 className="text-base font-semibold text-[#173D68] mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#173D68]/10 flex items-center justify-center"><Layers className="w-4 h-4 text-[#173D68]" /></div>
            Diagramme de flux cumule
          </h3>
          {cumulativeFlowData.length > 0 && items.length > 0 ? (
            <div>
              <div className="flex h-48 items-end gap-1 rounded-lg overflow-hidden">
                {cumulativeFlowData.map((status, i) => {
                  const height = items.length > 0 ? (status.count / items.length) * 100 : 0;
                  return (
                    <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${Math.max(height, 2)}%` }} transition={{ delay: i * 0.1, duration: 0.5 }} className="flex-1 flex items-end justify-center rounded-t-lg relative group" style={{ backgroundColor: status.color }}>
                      <span className="text-white text-xs font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{status.count}</span>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 justify-center">
                {cumulativeFlowData.map((status, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                    <span className="text-sm text-gray-500">{status.label}: {status.count}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-2xl font-bold text-[#173D68]">{items.length}</p>
                  <p className="text-xs text-gray-500">Total items</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-2xl font-bold text-[#173D68]">{cumulativeFlowData.length}</p>
                  <p className="text-xs text-gray-500">Statuts</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-2xl font-bold text-[#173D68]">{cumulativeFlowData.length > 0 ? Math.round((cumulativeFlowData[cumulativeFlowData.length - 1]?.count || 0) / items.length * 100) : 0}%</p>
                  <p className="text-xs text-gray-500">Dernier statut</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Layers className="w-8 h-8 mb-2 text-gray-300" />
              <p className="text-sm">Ajoutez une colonne Statut pour voir le flux cumule</p>
            </div>
          )}
        </div>
      )}

      {/* Number columns summary */}
      {numberColumns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-[#173D68] mb-4">Colonnes numeriques</h3>
          <div className="grid grid-cols-4 gap-4">
            {numberColumns.map((col, index) => {
              const values = items.map(item => Number(item?.values?.[col.id]) || 0);
              const sum = values.reduce((a, b) => a + b, 0);
              const avg = values.length > 0 ? sum / values.length : 0;
              return (
                <div key={col.id || `numcol-${index}`} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-500 mb-2">{col.title || `Colonne ${index + 1}`}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-gray-400">Total</p><p className="font-bold text-[#173D68]">{sum.toLocaleString()}</p></div>
                    <div><p className="text-gray-400">Moyenne</p><p className="font-bold text-[#173D68]">{avg.toFixed(1)}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Velocity Chart */}
      {velocityData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-[#173D68] mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><Zap className="w-4 h-4 text-amber-500" /></div>
            Velocite des sprints
          </h3>
          <div className="flex items-end gap-4 h-48">
            {velocityData.map((sprint, i) => {
              const maxItems = Math.max(...velocityData.map(s => s.total_items || 1));
              const height = ((sprint.completed_items || 0) / maxItems) * 100;
              return (
                <div key={sprint.id} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-sm font-bold text-[#173D68]">{sprint.completed_items || 0}</span>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(height, 5)}%` }} transition={{ delay: i * 0.1 }} className="w-full rounded-t-lg" style={{ background: 'linear-gradient(to top, #173D68, #F36F21)' }} />
                  <span className="text-xs text-gray-500 truncate max-w-full text-center">{sprint.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
