import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, TrendingUp, Activity } from 'lucide-react';
import { useBoardStore } from '../../stores/boardStore';

export default function BoardCharts() {
  const { columns = [], items = [], groups = [] } = useBoardStore();
  const [activeChart, setActiveChart] = useState('status');

  // Find status and other columns
  const statusColumn = useMemo(() => {
    return columns.find(col => col?.type === 'status') || null;
  }, [columns]);

  const numberColumns = useMemo(() => {
    return columns.filter(col => col?.type === 'number') || [];
  }, [columns]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    if (!statusColumn?.labels || !Array.isArray(statusColumn.labels)) return [];
    
    return statusColumn.labels
      .filter(label => label != null)
      .map((label, index) => ({
        id: label.id || `status-${index}`,
        label: label.name || label.label || `Statut ${index + 1}`,
        color: label.color || '#6b7280',
        count: items.filter(item => item?.values?.[statusColumn.id] === label.id).length,
      }));
  }, [statusColumn, items]);

  // Items by group
  const groupDistribution = useMemo(() => {
    if (!Array.isArray(groups)) return [];
    
    return groups
      .filter(group => group != null)
      .map((group, index) => ({
        id: group.id || `group-${index}`,
        label: group.name || `Groupe ${index + 1}`,
        color: group.color || '#6b7280',
        count: items.filter(item => item?.groupId === group.id).length,
      }));
  }, [groups, items]);

  // Summary stats
  const stats = useMemo(() => {
    const total = items?.length || 0;
    
    // Find completed status label safely
    let completedCount = 0;
    if (statusColumn?.labels && Array.isArray(statusColumn.labels)) {
      const completed = statusColumn.labels.find(l => {
        if (!l) return false;
        const name = String(l.name || l.label || '').toLowerCase();
        return name.includes('terminé') || name.includes('done') || name.includes('complet');
      });
      if (completed) {
        completedCount = items.filter(i => i?.values?.[statusColumn.id] === completed.id).length;
      }
    }
    
    return {
      total,
      completed: completedCount,
      completionRate: total > 0 ? Math.round((completedCount / total) * 100) : 0,
      groups: groups?.length || 0,
    };
  }, [items, groups, statusColumn]);

  const maxCount = useMemo(() => {
    if (statusDistribution.length === 0) return 1;
    return Math.max(...statusDistribution.map(s => s.count), 1);
  }, [statusDistribution]);

  const chartOptions = [
    { id: 'status', label: 'Par statut', icon: PieChart },
    { id: 'groups', label: 'Par groupe', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-surface-400 text-sm">Total items</span>
            <Activity className="w-4 h-4 text-primary-500" />
          </div>
          <p className="text-3xl font-bold text-surface-100">{stats.total}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-surface-400 text-sm">Terminés</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-400">{stats.completed}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-surface-400 text-sm">Taux completion</span>
            <PieChart className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-400">{stats.completionRate}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-surface-400 text-sm">Groupes</span>
            <BarChart3 className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-amber-400">{stats.groups}</p>
        </motion.div>
      </div>

      {/* Chart selector */}
      <div className="flex gap-2">
        {chartOptions.map(opt => (
          <button
            key={opt.id}
            onClick={() => setActiveChart(opt.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeChart === opt.id
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-surface-400 hover:bg-surface-800'
            }`}
          >
            <opt.icon className="w-4 h-4" />
            {opt.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Status Distribution - Horizontal Bar Chart */}
        {activeChart === 'status' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-6"
          >
            <h3 className="text-lg font-semibold text-surface-100 mb-6">Distribution par statut</h3>
            
            {statusDistribution.length > 0 ? (
              <div className="space-y-4">
                {statusDistribution.map((status, index) => (
                  <div key={status.id || `status-${index}`} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="text-surface-300">{status.label}</span>
                      </div>
                      <span className="text-surface-400">{status.count}</span>
                    </div>
                    <div className="h-6 bg-surface-800 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(status.count / maxCount) * 100}%` }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className="h-full rounded-lg"
                        style={{ backgroundColor: status.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-surface-500 py-8">
                Ajoutez une colonne Statut avec des labels
              </p>
            )}
          </motion.div>
        )}

        {/* Group Distribution */}
        {activeChart === 'groups' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-6"
          >
            <h3 className="text-lg font-semibold text-surface-100 mb-6">Distribution par groupe</h3>
            
            {groupDistribution.length > 0 ? (
              <div className="space-y-4">
                {groupDistribution.map((group, index) => {
                  const maxGroupCount = Math.max(...groupDistribution.map(g => g.count), 1);
                  return (
                    <div key={group.id || `group-${index}`} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                          <span className="text-surface-300">{group.label}</span>
                        </div>
                        <span className="text-surface-400">{group.count}</span>
                      </div>
                      <div className="h-6 bg-surface-800 rounded-lg overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(group.count / maxGroupCount) * 100}%` }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                          className="h-full rounded-lg"
                          style={{ backgroundColor: group.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-surface-500 py-8">
                Ajoutez des groupes pour voir les statistiques
              </p>
            )}
          </motion.div>
        )}

        {/* Pie Chart Visualization */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-surface-100 mb-6">Répartition</h3>
          
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              {/* Simple pie chart using conic gradient */}
              {statusDistribution.length > 0 && items.length > 0 ? (
                <>
                  <div
                    className="w-full h-full rounded-full"
                    style={{
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
                    }}
                  />
                  <div className="absolute inset-4 bg-surface-900 rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-surface-100">{items.length}</p>
                      <p className="text-xs text-surface-500">items</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full rounded-full bg-surface-800 flex items-center justify-center">
                  <span className="text-surface-500 text-sm text-center px-4">Pas de données</span>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {statusDistribution.map((status, index) => (
              <div key={status.id || `legend-${index}`} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <span className="text-sm text-surface-400">{status.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Number columns summary */}
      {numberColumns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-surface-100 mb-4">Colonnes numériques</h3>
          <div className="grid grid-cols-4 gap-4">
            {numberColumns.map((col, index) => {
              const values = items.map(item => Number(item?.values?.[col.id]) || 0);
              const sum = values.reduce((a, b) => a + b, 0);
              const avg = values.length > 0 ? sum / values.length : 0;
              
              return (
                <div key={col.id || `numcol-${index}`} className="p-4 bg-surface-800/50 rounded-lg">
                  <p className="text-sm text-surface-400 mb-2">{col.title || `Colonne ${index + 1}`}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-surface-500">Total</p>
                      <p className="font-bold text-surface-200">{sum.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-surface-500">Moyenne</p>
                      <p className="font-bold text-surface-200">{avg.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
