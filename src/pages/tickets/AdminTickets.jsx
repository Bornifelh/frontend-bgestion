import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Ticket, Users, Clock, CheckCircle, AlertTriangle, X, Plus,
  FileText, MapPin, Monitor, Calendar, User, Layers, Send,
  XCircle, Loader2, RefreshCw, Filter, Search, ArrowRight,
  BarChart3, Target, Zap, UserPlus
} from 'lucide-react';
import { ticketApi, boardApi, memberApi } from '../../lib/api';
import toast from 'react-hot-toast';

const priorityConfig = {
  low: { label: 'Basse', color: 'bg-gray-400', text: 'text-gray-600' },
  medium: { label: 'Moyenne', color: 'bg-blue-500', text: 'text-blue-600' },
  high: { label: 'Haute', color: 'bg-[#F36F21]', text: 'text-[#F36F21]' },
  critical: { label: 'Critique', color: 'bg-red-500', text: 'text-red-600' },
};

const urgencyConfig = {
  low: { label: 'Faible', color: 'bg-gray-400' },
  normal: { label: 'Normal', color: 'bg-blue-500' },
  high: { label: 'Urgent', color: 'bg-[#F36F21]' },
  critical: { label: 'Critique', color: 'bg-red-500' },
};

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-amber-500', icon: Clock },
  assigned: { label: 'Assigne', color: 'bg-blue-500', icon: UserPlus },
  in_progress: { label: 'En cours', color: 'bg-[#F36F21]', icon: Loader2 },
  resolved: { label: 'Resolu', color: 'bg-emerald-500', icon: CheckCircle },
  closed: { label: 'Ferme', color: 'bg-gray-500', icon: CheckCircle },
  cancelled: { label: 'Annule', color: 'bg-red-500', icon: XCircle },
};

export default function AdminTickets() {
  const { workspaceId } = useParams();

  const [categories, setCategories] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [boards, setBoards] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ status: '', category: '', priority: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [assignForm, setAssignForm] = useState({ boardId: '', assignedTo: '', dueDate: '', createItem: true });

  useEffect(() => { loadData(); }, [workspaceId, filters]);

  const loadData = async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const [categoriesRes, ticketsRes, statsRes, boardsRes, membersRes] = await Promise.all([
        ticketApi.getCategories(),
        ticketApi.getByWorkspace(workspaceId, filters),
        ticketApi.getStats(workspaceId),
        boardApi.getByWorkspace(workspaceId),
        memberApi.getByWorkspace(workspaceId),
      ]);
      setCategories(categoriesRes.data);
      setTickets(ticketsRes.data);
      setStats(statsRes.data);
      setBoards(boardsRes.data);
      setMembers(membersRes.data);
    } catch (error) {
      if (error.response?.status === 403) setAccessDenied(true);
      else toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      await ticketApi.assign(selectedTicket.id, assignForm);
      toast.success('Ticket assigne avec succes !');
      setShowAssignModal(false);
      setAssignForm({ boardId: '', assignedTo: '', dueDate: '', createItem: true });
      setSelectedTicket(null);
      loadData();
    } catch (error) {
      toast.error('Erreur lors de l\'assignation');
    }
  };

  const handleUpdateStatus = async (ticketId, status, resolutionNotes = null) => {
    try {
      await ticketApi.updateStatus(ticketId, { status, resolutionNotes });
      toast.success('Statut mis a jour');
      loadData();
      if (selectedTicket?.id === ticketId) setSelectedTicket(null);
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.ticketNumber.toLowerCase().includes(q) || t.submitterName?.toLowerCase().includes(q);
    }
    return true;
  });

  const getCategoryInfo = (cat) => categories.find(c => c.id === cat) || { name: cat, icon: '📋' };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#F36F21] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
        <h2 className="text-xl font-semibold text-[#173D68] mb-2">Acces restreint</h2>
        <p className="text-gray-500 mb-4">Vous devez etre administrateur pour acceder a cette page.</p>
        <Link to={`/workspace/${workspaceId}/tickets`} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#F36F21' }}>
          <Ticket className="w-4 h-4" /> Mes tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#173D68] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#173D68]/10 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-[#173D68]" />
            </div>
            Gestion des tickets
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-12">Administration et assignation des demandes d'intervention</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-6 gap-3">
          <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
            <p className="text-xl font-bold text-[#173D68]">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm border-l-4 border-l-amber-400">
            <p className="text-xl font-bold text-amber-500">{stats.pending}</p>
            <p className="text-xs text-gray-500">En attente</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm border-l-4 border-l-blue-400">
            <p className="text-xl font-bold text-blue-500">{stats.assigned}</p>
            <p className="text-xs text-gray-500">Assignes</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm border-l-4 border-l-[#F36F21]">
            <p className="text-xl font-bold text-[#F36F21]">{stats.in_progress}</p>
            <p className="text-xs text-gray-500">En cours</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm border-l-4 border-l-emerald-400">
            <p className="text-xl font-bold text-emerald-500">{stats.resolved}</p>
            <p className="text-xs text-gray-500">Resolus</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm border-l-4 border-l-red-400">
            <p className="text-xl font-bold text-red-500">{stats.critical}</p>
            <p className="text-xs text-gray-500">Critiques</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Filtres:</span>
          </div>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input py-1.5 px-3 text-sm w-40">
            <option value="">Tous statuts</option>
            {Object.entries(statusConfig).map(([key, config]) => (<option key={key} value={key}>{config.label}</option>))}
          </select>
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="input py-1.5 px-3 text-sm w-40">
            <option value="">Toutes categories</option>
            {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
          </select>
          <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} className="input py-1.5 px-3 text-sm w-40">
            <option value="">Toutes priorites</option>
            {Object.entries(priorityConfig).map(([key, config]) => (<option key={key} value={key}>{config.label}</option>))}
          </select>
          <div className="flex-1" />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher..." className="input py-1.5 pl-9 pr-3 text-sm w-64" />
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Ticket</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Demandeur</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Categorie</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Priorite</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Assigne a</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => {
                const cat = getCategoryInfo(ticket.category);
                const StatusIcon = statusConfig[ticket.status]?.icon || Clock;
                return (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.icon}</span>
                        <div>
                          <p className="font-mono text-xs text-gray-400">{ticket.ticketNumber}</p>
                          <p className="font-medium text-gray-800 text-sm max-w-[200px] truncate">{ticket.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-sm text-gray-700">{ticket.submitterName}</p>
                      <p className="text-xs text-gray-400">{ticket.submitterEmail}</p>
                    </td>
                    <td className="p-3"><span className="text-sm text-gray-500">{cat.name}</span></td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${priorityConfig[ticket.priority]?.color} text-white`}>{priorityConfig[ticket.priority]?.label}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${statusConfig[ticket.status]?.color} text-white flex items-center gap-1 w-fit`}>
                        <StatusIcon className="w-3 h-3" />{statusConfig[ticket.status]?.label}
                      </span>
                    </td>
                    <td className="p-3">
                      {ticket.assignedToName ? (
                        <span className="text-sm text-[#F36F21] font-medium">{ticket.assignedToName}</span>
                      ) : (
                        <span className="text-sm text-gray-400">Non assigne</span>
                      )}
                    </td>
                    <td className="p-3 text-sm text-gray-500">{new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        {ticket.status === 'pending' && (
                          <button onClick={() => { setSelectedTicket(ticket); setShowAssignModal(true); }} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white rounded" style={{ backgroundColor: '#F36F21' }}>
                            <UserPlus className="w-3 h-3" /> Assigner
                          </button>
                        )}
                        {ticket.status === 'assigned' && (
                          <button onClick={() => handleUpdateStatus(ticket.id, 'in_progress')} className="px-2 py-1 text-xs font-medium text-amber-600 bg-amber-50 rounded hover:bg-amber-100">Demarrer</button>
                        )}
                        {ticket.status === 'in_progress' && (
                          <button onClick={() => handleUpdateStatus(ticket.id, 'resolved')} className="px-2 py-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100">Resoudre</button>
                        )}
                        <button onClick={() => setSelectedTicket(ticket)} className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded hover:bg-gray-200">Details</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="8" className="p-8 text-center text-gray-400">Aucun ticket trouve</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAssignModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-semibold text-[#173D68] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#F36F21]" /> Assigner le ticket
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAssign} className="p-5 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="font-mono text-xs text-gray-400">{selectedTicket.ticketNumber}</p>
                <p className="font-medium text-gray-800">{selectedTicket.title}</p>
                <p className="text-xs text-gray-400 mt-1">De: {selectedTicket.submitterName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1"><Layers className="w-3 h-3 inline mr-1" />Tableau de destination</label>
                <select value={assignForm.boardId} onChange={(e) => setAssignForm({ ...assignForm, boardId: e.target.value })} className="input">
                  <option value="">Selectionner un tableau...</option>
                  {boards.map((board) => (<option key={board.id} value={board.id}>{board.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1"><User className="w-3 h-3 inline mr-1" />Assigner a</label>
                <select value={assignForm.assignedTo} onChange={(e) => setAssignForm({ ...assignForm, assignedTo: e.target.value })} className="input">
                  <option value="">Selectionner un membre...</option>
                  {members.map((member) => (<option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1"><Calendar className="w-3 h-3 inline mr-1" />Date limite</label>
                <input type="date" value={assignForm.dueDate} onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })} className="input" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={assignForm.createItem} onChange={(e) => setAssignForm({ ...assignForm, createItem: e.target.checked })} className="rounded border-gray-300 text-[#F36F21]" />
                <span className="text-gray-700 text-sm">Creer un element dans le tableau</span>
              </label>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#F36F21' }}>
                  <ArrowRight className="w-4 h-4" /> Assigner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && !showAssignModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTicket(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getCategoryInfo(selectedTicket.category).icon}</span>
                <span className="font-mono text-gray-400">{selectedTicket.ticketNumber}</span>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${statusConfig[selectedTicket.status]?.color} text-white`}>{statusConfig[selectedTicket.status]?.label}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${priorityConfig[selectedTicket.priority]?.color} text-white`}>{priorityConfig[selectedTicket.priority]?.label}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${urgencyConfig[selectedTicket.urgency]?.color} text-white`}>{urgencyConfig[selectedTicket.urgency]?.label}</span>
                </div>
                <h3 className="text-lg font-semibold text-[#173D68]">{selectedTicket.title}</h3>
              </div>
              {selectedTicket.description && (
                <div><p className="text-sm text-gray-400 mb-1">Description</p><p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p></div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-400">Demandeur</p><p className="text-gray-700">{selectedTicket.submitterName}</p><p className="text-xs text-gray-400">{selectedTicket.submitterEmail}</p></div>
                <div><p className="text-gray-400">Cree le</p><p className="text-gray-700">{new Date(selectedTicket.createdAt).toLocaleString('fr-FR')}</p></div>
                {selectedTicket.location && (<div><p className="text-gray-400">Localisation</p><p className="text-gray-700">{selectedTicket.location}</p></div>)}
                {selectedTicket.equipment && (<div><p className="text-gray-400">Equipement</p><p className="text-gray-700">{selectedTicket.equipment}</p></div>)}
                {selectedTicket.assignedToName && (<div><p className="text-gray-400">Assigne a</p><p className="text-[#F36F21] font-medium">{selectedTicket.assignedToName}</p></div>)}
                {selectedTicket.boardName && (<div><p className="text-gray-400">Tableau</p><p className="text-gray-700">{selectedTicket.boardName}</p></div>)}
              </div>
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                {selectedTicket.status === 'pending' && (
                  <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white rounded" style={{ backgroundColor: '#F36F21' }}>
                    <UserPlus className="w-3 h-3" /> Assigner
                  </button>
                )}
                {selectedTicket.status === 'assigned' && (
                  <button onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')} className="px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 rounded hover:bg-amber-100">Demarrer</button>
                )}
                {selectedTicket.status === 'in_progress' && (
                  <button onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100">
                    <CheckCircle className="w-3 h-3" /> Marquer resolu
                  </button>
                )}
                {selectedTicket.status === 'resolved' && (
                  <button onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200">Cloturer</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
