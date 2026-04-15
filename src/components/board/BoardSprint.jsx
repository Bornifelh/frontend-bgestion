import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Play, CheckCircle2, Layers, ArrowRight, Calendar,
  Target, Trash2, ChevronDown, ChevronRight, Clock, MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { sprintApi } from '../../lib/api';
import { useBoardStore } from '../../stores/boardStore';
import toast from 'react-hot-toast';

export default function BoardSprint() {
  const { currentBoard, items } = useBoardStore();
  const [sprints, setSprints] = useState([]);
  const [backlogItems, setBacklogItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [newSprint, setNewSprint] = useState({ name: '', goal: '', startDate: '', endDate: '' });
  const [expandedSprints, setExpandedSprints] = useState({});
  const [sprintItems, setSprintItems] = useState({});

  useEffect(() => {
    if (currentBoard?.id) loadData();
  }, [currentBoard?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sprintsRes, backlogRes] = await Promise.all([
        sprintApi.getByBoard(currentBoard.id),
        sprintApi.getBacklog(currentBoard.id),
      ]);
      setSprints(sprintsRes.data || []);
      setBacklogItems(backlogRes.data || []);

      // Load items for each sprint
      const itemsMap = {};
      for (const sprint of (sprintsRes.data || [])) {
        try {
          const res = await sprintApi.getItems(sprint.id);
          itemsMap[sprint.id] = res.data || [];
        } catch { itemsMap[sprint.id] = []; }
      }
      setSprintItems(itemsMap);
    } catch (error) {
      console.error('Error loading sprints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSprint = async () => {
    if (!newSprint.name.trim()) return;
    try {
      const { data } = await sprintApi.create({
        boardId: currentBoard.id,
        ...newSprint,
      });
      setSprints(prev => [data, ...prev]);
      setNewSprint({ name: '', goal: '', startDate: '', endDate: '' });
      setShowCreateSprint(false);
      toast.success('Sprint créé');
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleStartSprint = async (sprintId) => {
    try {
      const { data } = await sprintApi.start(sprintId);
      setSprints(prev => prev.map(s => s.id === sprintId ? data : s));
      toast.success('Sprint démarré');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const handleCompleteSprint = async (sprintId) => {
    if (!confirm('Terminer ce sprint ? Les items non terminés retourneront au backlog.')) return;
    try {
      await sprintApi.complete(sprintId, { moveToBacklog: true });
      loadData();
      toast.success('Sprint terminé');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleAddToSprint = async (sprintId, itemId) => {
    try {
      await sprintApi.addItems(sprintId, [itemId]);
      setBacklogItems(prev => prev.filter(i => i.id !== itemId));
      const item = backlogItems.find(i => i.id === itemId);
      setSprintItems(prev => ({
        ...prev,
        [sprintId]: [...(prev[sprintId] || []), item],
      }));
      toast.success('Item ajouté au sprint');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleRemoveFromSprint = async (sprintId, itemId) => {
    try {
      await sprintApi.removeItem(sprintId, itemId);
      const item = sprintItems[sprintId]?.find(i => i.id === itemId);
      setSprintItems(prev => ({
        ...prev,
        [sprintId]: (prev[sprintId] || []).filter(i => i.id !== itemId),
      }));
      if (item) setBacklogItems(prev => [...prev, item]);
      toast.success('Item retiré du sprint');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10';
      case 'completed': return 'text-blue-400 bg-blue-400/10';
      case 'cancelled': return 'text-red-400 bg-red-400/10';
      default: return 'text-surface-400 bg-surface-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'completed': return 'Terminé';
      case 'planning': return 'Planification';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Sprints Panel */}
      <div className="lg:col-span-2 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-surface-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-400" />
            Sprints
          </h2>
          <button onClick={() => setShowCreateSprint(true)} className="btn btn-primary text-sm">
            <Plus className="w-4 h-4" /> Nouveau Sprint
          </button>
        </div>

        {/* Create Sprint Form */}
        <AnimatePresence>
          {showCreateSprint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="card p-4 space-y-3"
            >
              <input
                type="text"
                value={newSprint.name}
                onChange={(e) => setNewSprint(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nom du sprint..."
                className="input"
                autoFocus
              />
              <textarea
                value={newSprint.goal}
                onChange={(e) => setNewSprint(prev => ({ ...prev, goal: e.target.value }))}
                placeholder="Objectif du sprint (optionnel)..."
                className="input resize-none"
                rows={2}
              />
              <div className="flex gap-3">
                <input type="date" value={newSprint.startDate} onChange={(e) => setNewSprint(prev => ({ ...prev, startDate: e.target.value }))} className="input flex-1" />
                <input type="date" value={newSprint.endDate} onChange={(e) => setNewSprint(prev => ({ ...prev, endDate: e.target.value }))} className="input flex-1" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCreateSprint(false)} className="btn btn-ghost text-sm">Annuler</button>
                <button onClick={handleCreateSprint} className="btn btn-primary text-sm">Créer</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sprint List */}
        {sprints.map((sprint) => {
          const sItems = sprintItems[sprint.id] || [];
          const isExpanded = expandedSprints[sprint.id] !== false;

          return (
            <motion.div key={sprint.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-hidden">
              {/* Sprint Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <button onClick={() => setExpandedSprints(prev => ({ ...prev, [sprint.id]: !isExpanded }))} className="text-surface-400">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-surface-100">{sprint.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sprint.status)}`}>
                        {getStatusLabel(sprint.status)}
                      </span>
                      <span className="text-sm text-surface-500">{sItems.length} items</span>
                    </div>
                    {sprint.goal && <p className="text-sm text-surface-400 mt-0.5">{sprint.goal}</p>}
                    {sprint.start_date && sprint.end_date && (
                      <p className="text-xs text-surface-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(sprint.start_date), 'dd MMM', { locale: fr })} - {format(new Date(sprint.end_date), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sprint.status === 'planning' && (
                    <button onClick={() => handleStartSprint(sprint.id)} className="btn btn-ghost text-green-400 text-sm" title="Démarrer">
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {sprint.status === 'active' && (
                    <button onClick={() => handleCompleteSprint(sprint.id)} className="btn btn-ghost text-blue-400 text-sm" title="Terminer">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={async () => {
                    if (!confirm('Supprimer ce sprint ?')) return;
                    await sprintApi.delete(sprint.id);
                    setSprints(prev => prev.filter(s => s.id !== sprint.id));
                    toast.success('Sprint supprimé');
                  }} className="btn btn-ghost text-red-400 text-sm">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sprint Items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-surface-700/50"
                  >
                    <div className="p-2 space-y-1">
                      {sItems.length > 0 ? sItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between px-3 py-2 hover:bg-surface-800/50 rounded-lg group">
                          <span className="text-sm text-surface-200">{item.name}</span>
                          <button
                            onClick={() => handleRemoveFromSprint(sprint.id, item.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-surface-500 hover:text-red-400"
                            title="Retirer du sprint"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )) : (
                        <p className="text-center text-surface-500 py-4 text-sm">Aucun item dans ce sprint</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {sprints.length === 0 && (
          <div className="card p-8 text-center">
            <Layers className="w-12 h-12 text-surface-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-surface-300 mb-2">Aucun sprint</h3>
            <p className="text-surface-500">Créez votre premier sprint pour organiser votre travail en itérations.</p>
          </div>
        )}
      </div>

      {/* Backlog Panel */}
      <div className="space-y-4 overflow-y-auto">
        <h2 className="text-lg font-semibold text-surface-100 flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-400" />
          Backlog
          <span className="text-sm font-normal text-surface-500">({backlogItems.length})</span>
        </h2>

        <div className="space-y-1.5">
          {backlogItems.map((item) => {
            const activeSprint = sprints.find(s => s.status === 'active' || s.status === 'planning');
            return (
              <div key={item.id} className="flex items-center justify-between p-3 bg-surface-800/30 rounded-lg group hover:bg-surface-800/50 transition-colors">
                <span className="text-sm text-surface-200 flex-1 truncate">{item.name}</span>
                {activeSprint && (
                  <button
                    onClick={() => handleAddToSprint(activeSprint.id, item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-primary-400 hover:text-primary-300"
                    title={`Ajouter à ${activeSprint.name}`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}

          {backlogItems.length === 0 && (
            <div className="text-center py-8">
              <p className="text-surface-500 text-sm">Backlog vide</p>
              <p className="text-surface-600 text-xs mt-1">Tous les items sont assignés à un sprint</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
