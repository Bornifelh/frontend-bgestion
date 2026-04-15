import { AlertTriangle, Bug } from 'lucide-react';

export default function GlobalIssues() {
  const columns = ['ID', 'Titre', 'Projet', 'Priorite', 'Statut', 'Assigne a'];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Issues</h1>
          <p className="mt-1 text-sm text-gray-500">Suivi des problemes et bugs</p>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Bug className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
          <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-20 text-center text-gray-500 border-b border-gray-100"
                >
                  Aucun issue signale
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
