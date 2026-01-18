import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket, Users, Clock, CheckCircle, AlertTriangle, X, Plus,
  FileText, MapPin, Monitor, Calendar, User, Layers, Send,
  XCircle, Loader2, RefreshCw, Filter, Search, ArrowRight,
  BarChart3, Target, Zap, UserPlus
} from 'lucide-react';
import { ticketApi, boardApi, memberApi } from '../../lib/api';
import toast from 'react-hot-toast';

const priorityConfig = {
  low: { label: 'Basse', color: 'bg-surface-600', text: 'text-surface-300' },
  medium: { label: 'Moyenne', color: 'bg-blue-500', text: 'text-blue-400' },
  high: { label: 'Haute', color: 'bg-orange-500', text: 'text-orange-400' },
  critical: { label: 'Critique', color: 'bg-red-500', text: 'text-red-400' },
};

const urgencyConfig = {
  low: { label: 'Faible', color: 'bg-surface-600' },
  normal: { label: 'Normal', color: 'bg-blue-500' },
  high: { label: 'Urgent', color: 'bg-orange-500' },
  critical: { label: 'Critique', color: 'bg-red-500' },
};

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-surface-600', icon: Clock },
  assigned: { label: 'Assigné', color: 'bg-blue-500', icon: UserPlus },
  in_progress: { label: 'En cours', color: 'bg-amber-500', icon: Loader2 },
  resolved: { label: 'Résolu', color: 'bg-emerald-500', icon: CheckCircle },
  closed: { label: 'Fermé', color: 'bg-surface-500', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-red-500', icon: XCircle },
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
  const [assignForm, setAssignForm] = useState({
    boardId: '',
    assignedTo: '',
    dueDate: '',
    createItem: true,
  });

  useEffect(() => {
    loadData();
  }, [workspaceId, filters]);

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
      if (error.response?.status === 403) {
        setAccessDenied(true);
      } else {
        toast.error('Erreur lors du chargement');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      await ticketApi.assign(selectedTicket.id, assignForm);
      toast.success('Ticket assigné avec succès !');
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
      toast.success('Statut mis à jour');
      loadData();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.ticketNumber.toLowerCase().includes(q) ||
        t.submitterName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getCategoryInfo = (cat) => categories.find(c => c.id === cat) || { name: cat, icon: '📋' };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
        <h2 className="text-xl font-semibold text-surface-100 mb-2">Accès restreint</h2>
        <p className="text-surface-400 mb-4">
          Vous devez être administrateur pour accéder à cette page.
        </p>
        <Link to={`/workspace/${workspaceId}/tickets`} className="btn btn-primary">
          <Ticket className="w-4 h-4" />
          Mes tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-100 flex items-center gap-3">
            <Ticket className="w-7 h-7 text-primary-400" />
            Gestion des tickets
          </h1>
          <p className="text-surface-400 mt-1">Administration et assignation des demandes d'intervention</p>
        </div>
        <button onClick={loadData} className="btn btn-ghost">
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-6 gap-4">
          <div className="card p-4 text-center border-l-4 border-surface-600">
            <p className="text-2xl font-bold text-surface-100">{stats.total}</p>
            <p className="text-xs text-surface-500">Total</p>
          </div>
          <div className="card p-4 text-center border-l-4 border-amber-500">
            <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
            <p className="text-xs text-surface-500">En attente</p>
          </div>
          <div className="card p-4 text-center border-l-4 border-blue-500">
            <p className="text-2xl font-bold text-blue-400">{stats.assigned}</p>
            <p className="text-xs text-surface-500">Assignés</p>
          </div>
          <div className="card p-4 text-center border-l-4 border-purple-500">
            <p className="text-2xl font-bold text-purple-400">{stats.in_progress}</p>
            <p className="text-xs text-surface-500">En cours</p>
          </div>
          <div className="card p-4 text-center border-l-4 border-emerald-500">
            <p className="text-2xl font-bold text-emerald-400">{stats.resolved}</p>
            <p className="text-xs text-surface-500">Résolus</p>
          </div>
          <div className="card p-4 text-center border-l-4 border-red-500">
            <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
            <p className="text-xs text-surface-500">Critiques</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-surface-500" />
            <span className="text-sm text-surface-400">Filtres:</span>
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="input py-1.5 px-3 text-sm w-40"
          >
            <option value="">Tous statuts</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="input py-1.5 px-3 text-sm w-40"
          >
            <option value="">Toutes catégories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="input py-1.5 px-3 text-sm w-40"
          >
            <option value="">Toutes priorités</option>
            {Object.entries(priorityConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          <div className="flex-1" />

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="input py-1.5 pl-9 pr-3 text-sm w-64"
            />
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-800/50">
            <tr className="text-left text-xs text-surface-400 uppercase">
              <th className="p-3">Ticket</th>
              <th className="p-3">Demandeur</th>
              <th className="p-3">Catégorie</th>
              <th className="p-3">Priorité</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Assigné à</th>
              <th className="p-3">Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => {
                const cat = getCategoryInfo(ticket.category);
                const StatusIcon = statusConfig[ticket.status]?.icon || Clock;
                return (
                  <tr key={ticket.id} className="hover:bg-surface-800/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.icon}</span>
                        <div>
                          <p className="font-mono text-xs text-surface-500">{ticket.ticketNumber}</p>
                          <p className="font-medium text-surface-200 text-sm max-w-[200px] truncate">
                            {ticket.title}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-sm text-surface-300">{ticket.submitterName}</p>
                      <p className="text-xs text-surface-500">{ticket.submitterEmail}</p>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-surface-400">{cat.name}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${priorityConfig[ticket.priority]?.color} text-white`}>
                        {priorityConfig[ticket.priority]?.label}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${statusConfig[ticket.status]?.color} text-white flex items-center gap-1 w-fit`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[ticket.status]?.label}
                      </span>
                    </td>
                    <td className="p-3">
                      {ticket.assignedToName ? (
                        <span className="text-sm text-primary-400">{ticket.assignedToName}</span>
                      ) : (
                        <span className="text-sm text-surface-600">Non assigné</span>
                      )}
                    </td>
                    <td className="p-3 text-sm text-surface-500">
                      {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        {ticket.status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowAssignModal(true);
                            }}
                            className="btn btn-sm btn-primary"
                          >
                            <UserPlus className="w-3 h-3" />
                            Assigner
                          </button>
                        )}
                        {ticket.status === 'assigned' && (
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
                            className="btn btn-sm btn-ghost text-amber-400"
                          >
                            Démarrer
                          </button>
                        )}
                        {ticket.status === 'in_progress' && (
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                            className="btn btn-sm btn-ghost text-emerald-400"
                          >
                            Résoudre
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="btn btn-sm btn-ghost"
                        >
                          Détails
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="p-8 text-center text-surface-500">
                  Aucun ticket trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Modal */}
      <AnimatePresence>
        {showAssignModal && selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAssignModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-900 rounded-2xl border border-surface-700 w-full max-w-md"
            >
              <div className="flex items-center justify-between p-4 border-b border-surface-700">
                <h3 className="font-semibold text-surface-100 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary-400" />
                  Assigner le ticket
                </h3>
                <button onClick={() => setShowAssignModal(false)} className="p-1.5 hover:bg-surface-800 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAssign} className="p-4 space-y-4">
                {/* Ticket info */}
                <div className="p-3 bg-surface-800/50 rounded-lg">
                  <p className="font-mono text-xs text-surface-500">{selectedTicket.ticketNumber}</p>
                  <p className="font-medium text-surface-200">{selectedTicket.title}</p>
                  <p className="text-xs text-surface-500 mt-1">
                    De: {selectedTicket.submitterName}
                  </p>
                </div>

                {/* Board Selection */}
                <div>
                  <label className="block text-sm text-surface-400 mb-1">
                    <Layers className="w-3 h-3 inline mr-1" />
                    Tableau de destination
                  </label>
                  <select
                    value={assignForm.boardId}
                    onChange={(e) => setAssignForm({ ...assignForm, boardId: e.target.value })}
                    className="input"
                  >
                    <option value="">Sélectionner un tableau...</option>
                    {boards.map((board) => (
                      <option key={board.id} value={board.id}>{board.name}</option>
                    ))}
                  </select>
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-sm text-surface-400 mb-1">
                    <User className="w-3 h-3 inline mr-1" />
                    Assigner à
                  </label>
                  <select
                    value={assignForm.assignedTo}
                    onChange={(e) => setAssignForm({ ...assignForm, assignedTo: e.target.value })}
                    className="input"
                  >
                    <option value="">Sélectionner un membre...</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm text-surface-400 mb-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Date limite
                  </label>
                  <input
                    type="date"
                    value={assignForm.dueDate}
                    onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                    className="input"
                  />
                </div>

                {/* Create Item */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignForm.createItem}
                    onChange={(e) => setAssignForm({ ...assignForm, createItem: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-surface-300 text-sm">Créer un élément dans le tableau</span>
                </label>

                <div className="flex justify-end gap-3 pt-4 border-t border-surface-800">
                  <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-secondary">
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <ArrowRight className="w-4 h-4" />
                    Assigner
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {selectedTicket && !showAssignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-900 rounded-2xl border border-surface-700 w-full max-w-lg"
            >
              <div className="flex items-center justify-between p-4 border-b border-surface-700">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getCategoryInfo(selectedTicket.category).icon}</span>
                  <span className="font-mono text-surface-500">{selectedTicket.ticketNumber}</span>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-1.5 hover:bg-surface-800 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${statusConfig[selectedTicket.status]?.color} text-white`}>
                      {statusConfig[selectedTicket.status]?.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${priorityConfig[selectedTicket.priority]?.color} text-white`}>
                      {priorityConfig[selectedTicket.priority]?.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${urgencyConfig[selectedTicket.urgency]?.color} text-white`}>
                      {urgencyConfig[selectedTicket.urgency]?.label}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-surface-100">{selectedTicket.title}</h3>
                </div>

                {selectedTicket.description && (
                  <div>
                    <p className="text-sm text-surface-400 mb-1">Description</p>
                    <p className="text-surface-300 whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-surface-500">Demandeur</p>
                    <p className="text-surface-300">{selectedTicket.submitterName}</p>
                    <p className="text-xs text-surface-500">{selectedTicket.submitterEmail}</p>
                  </div>
                  <div>
                    <p className="text-surface-500">Créé le</p>
                    <p className="text-surface-300">{new Date(selectedTicket.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                  {selectedTicket.location && (
                    <div>
                      <p className="text-surface-500">Localisation</p>
                      <p className="text-surface-300">{selectedTicket.location}</p>
                    </div>
                  )}
                  {selectedTicket.equipment && (
                    <div>
                      <p className="text-surface-500">Équipement</p>
                      <p className="text-surface-300">{selectedTicket.equipment}</p>
                    </div>
                  )}
                  {selectedTicket.assignedToName && (
                    <div>
                      <p className="text-surface-500">Assigné à</p>
                      <p className="text-primary-400">{selectedTicket.assignedToName}</p>
                    </div>
                  )}
                  {selectedTicket.boardName && (
                    <div>
                      <p className="text-surface-500">Tableau</p>
                      <p className="text-surface-300">{selectedTicket.boardName}</p>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-surface-800">
                  {selectedTicket.status === 'pending' && (
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="btn btn-sm btn-primary"
                    >
                      <UserPlus className="w-3 h-3" />
                      Assigner
                    </button>
                  )}
                  {selectedTicket.status === 'assigned' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                      className="btn btn-sm btn-ghost text-amber-400"
                    >
                      Démarrer
                    </button>
                  )}
                  {selectedTicket.status === 'in_progress' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                      className="btn btn-sm btn-ghost text-emerald-400"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Marquer résolu
                    </button>
                  )}
                  {selectedTicket.status === 'resolved' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}
                      className="btn btn-sm btn-ghost"
                    >
                      Clôturer
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
