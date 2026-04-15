import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowLeft, RefreshCw, Users, BarChart3, Calendar } from 'lucide-react';
import { timeEntryApi } from '../lib/api';

export default function TimeReport() {
  const { workspaceId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { data } = await timeEntryApi.getReport(workspaceId, params);
      setReport(data);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [workspaceId]);

  const formatMinutes = (minutes) => {
    if (!minutes) return '0h 0m';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h ${m}m`;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
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
              <Clock className="w-7 h-7 text-primary-400" />
              Suivi du temps
            </h1>
            <p className="text-surface-400 mt-1">Rapport détaillé du temps passé par l'équipe</p>
          </div>
        </div>
        <button onClick={loadReport} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Date filters */}
      <div className="card p-4 flex items-center gap-4">
        <Calendar className="w-5 h-5 text-surface-400" />
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input w-auto" />
        <span className="text-surface-500">à</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input w-auto" />
        <button onClick={loadReport} className="btn-primary text-sm">Filtrer</button>
      </div>

      {/* Summary Cards */}
      {report?.totals && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-4 bg-gradient-to-br from-primary-600/20 to-purple-600/20 border-primary-500/30">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-500/20 rounded-xl"><Clock className="w-6 h-6 text-primary-400" /></div>
              <div>
                <p className="text-sm text-surface-400">Temps total</p>
                <p className="text-2xl font-bold text-surface-100">{formatMinutes(report.totals.total_minutes)}</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-xl"><BarChart3 className="w-6 h-6 text-blue-400" /></div>
              <div>
                <p className="text-sm text-surface-400">Entrées</p>
                <p className="text-2xl font-bold text-surface-100">{report.totals.total_entries}</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-xl"><Users className="w-6 h-6 text-green-400" /></div>
              <div>
                <p className="text-sm text-surface-400">Membres actifs</p>
                <p className="text-2xl font-bold text-surface-100">{report.totals.active_members}</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500/20 rounded-xl"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>
                <p className="text-sm text-surface-400">Facturable</p>
                <p className="text-2xl font-bold text-surface-100">{formatMinutes(report.totals.billable_minutes)}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Member */}
        <div className="card p-5">
          <h3 className="text-sm font-medium text-surface-300 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-400" /> Par membre
          </h3>
          <div className="space-y-3">
            {report?.byMember?.map((m) => {
              const maxMinutes = Math.max(...(report.byMember.map(x => x.total_minutes) || [1]));
              return (
                <div key={m.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-surface-300">{m.first_name} {m.last_name}</span>
                    <span className="text-surface-400 font-medium">{formatMinutes(m.total_minutes)}</span>
                  </div>
                  <div className="h-2.5 bg-surface-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(m.total_minutes / maxMinutes) * 100}%` }} className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full" />
                  </div>
                </div>
              );
            })}
            {(!report?.byMember || report.byMember.length === 0) && (
              <p className="text-center text-surface-500 py-4">Aucune donnée</p>
            )}
          </div>
        </div>

        {/* By Board */}
        <div className="card p-5">
          <h3 className="text-sm font-medium text-surface-300 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" /> Par board
          </h3>
          <div className="space-y-3">
            {report?.byBoard?.map((b) => {
              const maxMinutes = Math.max(...(report.byBoard.map(x => x.total_minutes) || [1]));
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-surface-300">{b.name}</span>
                    <span className="text-surface-400 font-medium">{formatMinutes(b.total_minutes)}</span>
                  </div>
                  <div className="h-2.5 bg-surface-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(b.total_minutes / maxMinutes) * 100}%` }} className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
                  </div>
                </div>
              );
            })}
            {(!report?.byBoard || report.byBoard.length === 0) && (
              <p className="text-center text-surface-500 py-4">Aucune donnée</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
