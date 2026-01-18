import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket, Send, Clock, CheckCircle, AlertTriangle, X, Plus,
  FileText, MapPin, Monitor, Calendar, ChevronDown, Eye, Edit2,
  XCircle, Loader2, ArrowLeft, RefreshCw, Settings
} from 'lucide-react';
import { ticketApi, workspaceApi, memberApi } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
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
  assigned: { label: 'Assigné', color: 'bg-blue-500', icon: CheckCircle },
  in_progress: { label: 'En cours', color: 'bg-amber-500', icon: Loader2 },
  resolved: { label: 'Résolu', color: 'bg-emerald-500', icon: CheckCircle },
  closed: { label: 'Fermé', color: 'bg-surface-500', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-red-500', icon: XCircle },
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
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    urgency: 'normal',
    location: '',
    equipment: '',
    requestedDate: '',
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
    if (!form.title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    setSubmitting(true);
    try {
      await ticketApi.create({
        ...form,
        workspaceId,
      });
      toast.success('Ticket soumis avec succès !');
      setShowForm(false);
      setForm({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium',
        urgency: 'normal',
        location: '',
        equipment: '',
        requestedDate: '',
      });
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
      toast.success('Ticket annulé');
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
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
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
            Mes tickets d'intervention
          </h1>
          <p className="text-surface-400 mt-1">Soumettez vos demandes d'intervention technique</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link 
              to={`/workspace/${workspaceId}/tickets/admin`}
              className="btn btn-secondary"
            >
              <Settings className="w-4 h-4" />
              Gestion tickets
            </Link>
          )}
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Nouveau ticket
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-surface-100">{myTickets.length}</p>
          <p className="text-xs text-surface-500">Total</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">
            {myTickets.filter(t => t.status === 'pending').length}
          </p>
          <p className="text-xs text-surface-500">En attente</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">
            {myTickets.filter(t => ['assigned', 'in_progress'].includes(t.status)).length}
          </p>
          <p className="text-xs text-surface-500">En cours</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-emerald-400">
            {myTickets.filter(t => ['resolved', 'closed'].includes(t.status)).length}
          </p>
          <p className="text-xs text-surface-500">Résolus</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b border-surface-800 pb-2">
        {[
          { id: 'all', label: 'Tous' },
          { id: 'active', label: 'Actifs' },
          { id: 'pending', label: 'En attente' },
          { id: 'resolved', label: 'Résolus' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              filter === f.id
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={loadData} className="btn btn-sm btn-ghost">
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
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4 hover:bg-surface-800/50 transition-colors cursor-pointer group"
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{cat.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-surface-500">{ticket.ticketNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${statusConfig[ticket.status]?.color} text-white flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[ticket.status]?.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${priorityConfig[ticket.priority]?.color} text-white`}>
                        {priorityConfig[ticket.priority]?.label}
                      </span>
                    </div>
                    <h3 className="font-medium text-surface-200 group-hover:text-surface-100 transition-colors">
                      {ticket.title}
                    </h3>
                    {ticket.description && (
                      <p className="text-sm text-surface-500 line-clamp-2 mt-1">{ticket.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      {ticket.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {ticket.location}
                        </span>
                      )}
                      {ticket.assignedToName && (
                        <span className="text-primary-400">
                          Assigné à: {ticket.assignedToName}
                        </span>
                      )}
                    </div>
                  </div>
                  <Eye className="w-5 h-5 text-surface-600 group-hover:text-surface-400 transition-colors" />
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="card p-12 text-center">
            <Ticket className="w-12 h-12 mx-auto text-surface-600 mb-3" />
            <p className="text-surface-500">Aucun ticket trouvé</p>
            <button onClick={() => setShowForm(true)} className="btn btn-primary mt-4">
              <Plus className="w-4 h-4" />
              Créer un ticket
            </button>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-900 rounded-2xl border border-surface-700 w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-surface-700">
                <h3 className="font-semibold text-surface-100 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary-400" />
                  Nouveau ticket d'intervention
                </h3>
                <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-surface-800 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Title */}
                <div>
                  <label className="block text-sm text-surface-400 mb-1">Titre de la demande *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="input"
                    placeholder="Ex: Problème d'imprimante bureau 201"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-surface-400 mb-1">Description détaillée</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input min-h-[100px]"
                    placeholder="Décrivez votre problème en détail..."
                  />
                </div>

                {/* Category & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-surface-400 mb-1">Catégorie</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="input"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-surface-400 mb-1">Priorité</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="input"
                    >
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Urgency & Requested Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-surface-400 mb-1">Urgence</label>
                    <select
                      value={form.urgency}
                      onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                      className="input"
                    >
                      {Object.entries(urgencyConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-surface-400 mb-1">Date souhaitée</label>
                    <input
                      type="date"
                      value={form.requestedDate}
                      onChange={(e) => setForm({ ...form, requestedDate: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                {/* Location & Equipment */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-surface-400 mb-1">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      Localisation
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="input"
                      placeholder="Ex: Bureau 201, Bâtiment A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-surface-400 mb-1">
                      <Monitor className="w-3 h-3 inline mr-1" />
                      Équipement concerné
                    </label>
                    <input
                      type="text"
                      value={form.equipment}
                      onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                      className="input"
                      placeholder="Ex: PC-2024-001"
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-4 border-t border-surface-800">
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                    Annuler
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary">
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Soumettre
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {selectedTicket && (
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
              
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${statusConfig[selectedTicket.status]?.color} text-white`}>
                      {statusConfig[selectedTicket.status]?.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${priorityConfig[selectedTicket.priority]?.color} text-white`}>
                      {priorityConfig[selectedTicket.priority]?.label}
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
                  <div>
                    <p className="text-surface-500">Créé le</p>
                    <p className="text-surface-300">{new Date(selectedTicket.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                  {selectedTicket.assignedToName && (
                    <div>
                      <p className="text-surface-500">Assigné à</p>
                      <p className="text-primary-400">{selectedTicket.assignedToName}</p>
                    </div>
                  )}
                </div>

                {selectedTicket.status === 'pending' && (
                  <div className="flex justify-end gap-3 pt-4 border-t border-surface-800">
                    <button 
                      onClick={() => handleCancelTicket(selectedTicket.id)} 
                      className="btn btn-secondary text-red-400 hover:bg-red-500/20"
                    >
                      <XCircle className="w-4 h-4" />
                      Annuler le ticket
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
