import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, User } from 'lucide-react';

const TABS = [
  { id: 'pending', label: 'En attente' },
  { id: 'approved', label: 'Approuvees' },
  { id: 'rejected', label: 'Rejetees' },
];

export default function Approvals() {
  const [activeTab, setActiveTab] = useState('pending');

  const emptyMessage =
    activeTab === 'pending'
      ? 'Aucune approbation en attente'
      : activeTab === 'approved'
        ? 'Aucune approbation approuvee'
        : 'Aucune approbation rejetee';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Mes Approbations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Demandes en attente de votre validation
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="zoho-tabs px-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`zoho-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="border-t border-gray-200">
          <div className="grid grid-cols-[1fr_1.2fr_1fr_1fr_120px] gap-0 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
            <span>Date</span>
            <span>Demandeur</span>
            <span>Type</span>
            <span>Projet</span>
            <span>Statut</span>
          </div>

          <div className="px-5 py-16 flex flex-col items-center justify-center text-center">
            <div className="flex items-center justify-center gap-3 mb-3 text-gray-400">
              {activeTab === 'pending' && <Clock className="w-8 h-8" strokeWidth={1.5} />}
              {activeTab === 'approved' && (
                <CheckCircle2 className="w-8 h-8 text-blue-500/70" strokeWidth={1.5} />
              )}
              {activeTab === 'rejected' && (
                <XCircle className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
              )}
              <User className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-gray-500">{emptyMessage}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
