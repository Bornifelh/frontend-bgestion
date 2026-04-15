import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, RefreshCw, Users, BarChart3, Calendar } from 'lucide-react';
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-[#F36F21] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
        <div className="w-8 h-8 rounded-lg bg-[#173D68]/10 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-[#173D68]" />
        </div>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input w-auto" />
        <span className="text-gray-400 font-medium">a</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input w-auto" />
        <button onClick={loadReport} className="px-3 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#F36F21' }}>Filtrer</button>
      </div>

      {/* Summary Cards */}
      {report?.totals && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm bg-gradient-to-br from-[#F36F21]/5 to-[#173D68]/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F36F21]/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#F36F21]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Temps total</p>
                <p className="text-xl font-bold text-[#173D68]">{formatMinutes(report.totals.total_minutes)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Entrees</p>
                <p className="text-xl font-bold text-[#173D68]">{report.totals.total_entries}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Membres actifs</p>
                <p className="text-xl font-bold text-[#173D68]">{report.totals.active_members}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F36F21]/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#F36F21]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Facturable</p>
                <p className="text-xl font-bold text-[#173D68]">{formatMinutes(report.totals.billable_minutes)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Member */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#173D68] mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#173D68]/10 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-[#173D68]" />
            </div>
            Par membre
          </h3>
          <div className="space-y-3">
            {report?.byMember?.map((m) => {
              const maxMinutes = Math.max(...(report.byMember.map(x => x.total_minutes) || [1]));
              return (
                <div key={m.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{m.first_name} {m.last_name}</span>
                    <span className="text-gray-500 font-medium">{formatMinutes(m.total_minutes)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(m.total_minutes / maxMinutes) * 100}%`,
                        background: 'linear-gradient(to right, #F36F21, #173D68)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {(!report?.byMember || report.byMember.length === 0) && (
              <p className="text-center text-gray-400 py-4">Aucune donnee</p>
            )}
          </div>
        </div>

        {/* By Board */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#173D68] mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#F36F21]/10 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-[#F36F21]" />
            </div>
            Par board
          </h3>
          <div className="space-y-3">
            {report?.byBoard?.map((b) => {
              const maxMinutes = Math.max(...(report.byBoard.map(x => x.total_minutes) || [1]));
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{b.name}</span>
                    <span className="text-gray-500 font-medium">{formatMinutes(b.total_minutes)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(b.total_minutes / maxMinutes) * 100}%`,
                        background: 'linear-gradient(to right, #173D68, #1E5090)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {(!report?.byBoard || report.byBoard.length === 0) && (
              <p className="text-center text-gray-400 py-4">Aucune donnee</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
