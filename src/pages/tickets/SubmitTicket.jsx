import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Ticket, Send, Clock, CheckCircle, AlertTriangle, X, Plus,
  FileText, MapPin, Monitor, Calendar, ChevronDown, Eye, Edit2,
  XCircle, Loader2, ArrowLeft, RefreshCw, Settings
} from 'lucide-react';
import { ticketApi, workspaceApi, memberApi } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
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
  assigned: { label: 'Assigne', color: 'bg-blue-500', icon: CheckCircle },
  in_progress: { label: 'En cours', color: 'bg-[#F36F21]', icon: Loader2 },
  resolved: { label: 'Resolu', color: 'bg-emerald-500', icon: CheckCircle },
  closed: { label: 'Ferme', color: 'bg-gray-500', icon: CheckCircle },
  cancelled: { label: 'Annule', color: 'bg-red-500', icon: XCircle },
};

export default function SubmitTicket() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [categories, setCategories] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filter, setFilter] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', category: 'general', priority: 'medium',
    urgency: 'normal', location: '', equipment: '', requestedDate: '',
  });

  useEffect(() => {
    loadData();
    checkAdminStatus();
  }, [workspaceId]);

  const checkAdminStatus = async () => {
    try {
      const { data } = await memberApi.getByWorkspace(workspaceId);
      const currentMember = data.find(m => m.userId === user?.id);
      setIsAdmin(currentMember?.role === 'owner' || currentMember?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, ticketsRes] = await Promise.all([
        ticketApi.getCategories(),
        ticketApi.getMyTickets(),
      ]);
      setCategories(categoriesRes.data);
      setMyTickets(ticketsRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Le titre est requis'); return; }
    setSubmitting(true);
    try {
      await ticketApi.create({ ...form, workspaceId });
      toast.success('Ticket soumis avec succes !');
      setShowForm(false);
      setForm({ title: '', description: '', category: 'general', priority: 'medium', urgency: 'normal', location: '', equipment: '', requestedDate: '' });
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTicket = async (ticketId) => {
    if (!confirm('Voulez-vous annuler ce ticket ?')) return;
    try {
      await ticketApi.cancel(ticketId);
      toast.success('Ticket annule');
      loadData();
      setSelectedTicket(null);
    } catch (error) {
      toast.error('Impossible d\'annuler ce ticket');
    }
  };

  const filteredTickets = myTickets.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['pending', 'assigned', 'in_progress'].includes(t.status);
    if (filter === 'resolved') return ['resolved', 'closed'].includes(t.status);
    return t.status === filter;
  });

  const getCategoryInfo = (cat) => categories.find(c => c.id === cat) || { name: cat, icon: '📋' };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#F36F21] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#173D68] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F36F21]/10 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-[#F36F21]" />
            </div>
            Mes tickets d'intervention
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-12">Soumettez vos demandes d'intervention technique</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link to={`/workspace/${workspaceId}/tickets/admin`} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              <Settings className="w-4 h-4" /> Gestion tickets
            </Link>
          )}
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#F36F21' }}>
            <Plus className="w-4 h-4" /> Nouveau ticket
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-[#173D68]">{myTickets.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm border-l-4 border-l-amber-400">
          <p className="text-2xl font-bold text-amber-500">{myTickets.filter(t => t.status === 'pending').length}</p>
          <p className="text-xs text-gray-500">En attente</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm border-l-4 border-l-blue-400">
          <p className="text-2xl font-bold text-blue-500">{myTickets.filter(t => ['assigned', 'in_progress'].includes(t.status)).length}</p>
          <p className="text-xs text-gray-500">En cours</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm border-l-4 border-l-emerald-400">
          <p className="text-2xl font-bold text-emerald-500">{myTickets.filter(t => ['resolved', 'closed'].includes(t.status)).length}</p>
          <p className="text-xs text-gray-500">Resolus</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        {[
          { id: 'all', label: 'Tous' },
          { id: 'active', label: 'Actifs' },
          { id: 'pending', label: 'En attente' },
          { id: 'resolved', label: 'Resolus' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === f.id
                ? 'bg-[#F36F21]/10 text-[#F36F21]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={loadData} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => {
            const cat = getCategoryInfo(ticket.category);
            const StatusIcon = statusConfig[ticket.status]?.icon || Clock;
            return (
              <div
                key={ticket.id}
                className="bg-white rounded-xl p-4 border border-gray-200 hover:border-[#F36F21]/30 hover:shadow-sm transition-all cursor-pointer group"
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{cat.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">{ticket.ticketNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${statusConfig[ticket.status]?.color} text-white flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[ticket.status]?.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${priorityConfig[ticket.priority]?.color} text-white`}>
                        {priorityConfig[ticket.priority]?.label}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-800 group-hover:text-[#173D68] transition-colors">{ticket.title}</h3>
                    {ticket.description && (
                      <p className="text-sm text-gray-400 line-clamp-2 mt-1">{ticket.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      {ticket.location && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ticket.location}</span>
                      )}
                      {ticket.assignedToName && (
                        <span className="text-[#F36F21] font-medium">Assigne a: {ticket.assignedToName}</span>
                      )}
                    </div>
                  </div>
                  <Eye className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <Ticket className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Aucun ticket trouve</p>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg mx-auto mt-4" style={{ backgroundColor: '#F36F21' }}>
              <Plus className="w-4 h-4" /> Creer un ticket
            </button>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-semibold text-[#173D68] flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F36F21]/10 flex items-center justify-center">
                  <Ticket className="w-4 h-4 text-[#F36F21]" />
                </div>
                Nouveau ticket d'intervention
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la demande *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="Ex: Probleme d'imprimante bureau 201" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description detaillee</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-[100px]" placeholder="Decrivez votre probleme en detail..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
                    {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorite</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input">
                    {Object.entries(priorityConfig).map(([key, config]) => (<option key={key} value={key}>{config.label}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgence</label>
                  <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })} className="input">
                    {Object.entries(urgencyConfig).map(([key, config]) => (<option key={key} value={key}>{config.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date souhaitee</label>
                  <input type="date" value={form.requestedDate} onChange={(e) => setForm({ ...form, requestedDate: e.target.value })} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1"><MapPin className="w-3 h-3 inline mr-1" />Localisation</label>
                  <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input" placeholder="Ex: Bureau 201, Batiment A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1"><Monitor className="w-3 h-3 inline mr-1" />Equipement concerne</label>
                  <input type="text" value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} className="input" placeholder="Ex: PC-2024-001" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#F36F21' }}>
                  {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" />Envoi...</>) : (<><Send className="w-4 h-4" />Soumettre</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTicket(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getCategoryInfo(selectedTicket.category).icon}</span>
                <span className="font-mono text-gray-400">{selectedTicket.ticketNumber}</span>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${statusConfig[selectedTicket.status]?.color} text-white`}>{statusConfig[selectedTicket.status]?.label}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${priorityConfig[selectedTicket.priority]?.color} text-white`}>{priorityConfig[selectedTicket.priority]?.label}</span>
                </div>
                <h3 className="text-lg font-semibold text-[#173D68]">{selectedTicket.title}</h3>
              </div>
              {selectedTicket.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedTicket.location && (<div><p className="text-gray-400">Localisation</p><p className="text-gray-700">{selectedTicket.location}</p></div>)}
                {selectedTicket.equipment && (<div><p className="text-gray-400">Equipement</p><p className="text-gray-700">{selectedTicket.equipment}</p></div>)}
                <div><p className="text-gray-400">Cree le</p><p className="text-gray-700">{new Date(selectedTicket.createdAt).toLocaleString('fr-FR')}</p></div>
                {selectedTicket.assignedToName && (<div><p className="text-gray-400">Assigne a</p><p className="text-[#F36F21] font-medium">{selectedTicket.assignedToName}</p></div>)}
              </div>
              {selectedTicket.status === 'pending' && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button onClick={() => handleCancelTicket(selectedTicket.id)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                    <XCircle className="w-4 h-4" /> Annuler le ticket
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
