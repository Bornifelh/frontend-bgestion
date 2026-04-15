import { Clock, Calendar } from 'lucide-react';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function GlobalTimesheets() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Feuilles de temps</h1>
        <p className="mt-1 text-sm text-gray-500">
          Suivi du temps passe sur vos projets
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <div className="flex items-center gap-2 mb-4 text-gray-700">
          <Calendar className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold text-gray-900">Vue hebdomadaire</h2>
        </div>

        <div className="border border-gray-200 rounded-md overflow-hidden">
          <div
            className="grid bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide"
            style={{ gridTemplateColumns: '140px repeat(5, 1fr)' }}
          >
            <div className="px-3 py-2.5 border-r border-gray-200">Projet / tache</div>
            {WEEK_DAYS.map((d) => (
              <div key={d} className="px-2 py-2.5 text-center border-r border-gray-200 last:border-r-0">
                {d}
              </div>
            ))}
          </div>
          {[1, 2, 3].map((row) => (
            <div
              key={row}
              className="grid border-b border-gray-200 last:border-b-0 text-sm text-gray-400"
              style={{ gridTemplateColumns: '140px repeat(5, 1fr)' }}
            >
              <div className="px-3 py-6 border-r border-gray-200 bg-gray-50/30" />
              {WEEK_DAYS.map((d) => (
                <div
                  key={`${row}-${d}`}
                  className="min-h-[56px] border-r border-gray-200 last:border-r-0 bg-white hover:bg-gray-50/80"
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-start gap-3">
          <div className="rounded-md bg-blue-50 p-2">
            <Clock className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total heures cette semaine
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 tabular-nums">0 h</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-start gap-3">
          <div className="rounded-md bg-blue-50 p-2">
            <Calendar className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total heures ce mois
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 tabular-nums">0 h</p>
          </div>
        </div>
      </div>
    </div>
  );
}
