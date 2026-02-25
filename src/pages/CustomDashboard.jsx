import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ArrowLeft, Plus, Trash2, X, RefreshCw,
  BarChart3, Users, Clock, AlertTriangle, Activity, FolderKanban,
  CheckCircle, TrendingUp
} from 'lucide-react';
import { dashboardApi } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const WIDGET_TYPES = [
  { id: 'task_summary', label: 'Résumé des tâches', icon: BarChart3, defaultW: 1, defaultH: 1 },
  { id: 'overdue_tasks', label: 'Tâches en retard', icon: AlertTriangle, defaultW: 1, defaultH: 1 },
  { id: 'members_workload', label: 'Charge par membre', icon: Users, defaultW: 1, defaultH: 2 },
  { id: 'recent_activity', label: 'Activité récente', icon: Activity, defaultW: 1, defaultH: 2 },
  { id: 'boards_overview', label: 'Boards', icon: FolderKanban, defaultW: 1, defaultH: 2 },
];

export default function CustomDashboard() {
  const { workspaceId } = useParams();
  const [widgets, setWidgets] = useState([]);
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddWidget, setShowAddWidget] = useState(false);

  useEffect(() => {
    loadAll();
  }, [workspaceId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [widgetsRes, dataRes] = await Promise.all([
        dashboardApi.getWidgets(workspaceId),
        dashboardApi.getData(workspaceId),
      ]);
      setWidgets(widgetsRes.data || []);
      setDashData(dataRes.data || {});
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const addWidget = async (type) => {
    const wt = WIDGET_TYPES.find(w => w.id === type);
    try {
      const { data } = await dashboardApi.createWidget({
        workspaceId,
        widgetType: type,
        title: wt?.label || type,
        width: wt?.defaultW || 1,
        height: wt?.defaultH || 1,
        positionX: 0,
        positionY: widgets.length,
      });
      setWidgets(prev => [...prev, data]);
      setShowAddWidget(false);
      toast.success('Widget ajouté');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const removeWidget = async (id) => {
    try {
      await dashboardApi.deleteWidget(id);
      setWidgets(prev => prev.filter(w => w.id !== id));
      toast.success('Widget supprimé');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const renderWidget = (widget) => {
    switch (widget.widget_type) {
      case 'task_summary': {
        const s = dashData?.taskSummary || {};
        return (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-400">{s.total_items || 0}</p>
              <p className="text-xs text-surface-400 mt-1">Total</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-400">{s.in_progress || 0}</p>
              <p className="text-xs text-surface-400 mt-1">En cours</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">{s.completed || 0}</p>
              <p className="text-xs text-surface-400 mt-1">Terminées</p>
            </div>
          </div>
        );
      }
      case 'overdue_tasks':
        return (
          <div className="flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className={`w-8 h-8 mx-auto mb-2 ${(dashData?.overdueCount || 0) > 0 ? 'text-red-400' : 'text-green-400'}`} />
              <p className="text-4xl font-bold text-surface-100">{dashData?.overdueCount || 0}</p>
              <p className="text-sm text-surface-400 mt-1">tâches en retard</p>
            </div>
          </div>
        );
      case 'members_workload':
        return (
          <div className="space-y-3">
            {(dashData?.byMember || []).slice(0, 6).map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <span className="text-sm text-surface-300 truncate">{m.first_name} {m.last_name}</span>
                <span className="text-sm font-medium text-primary-400">{m.task_count}</span>
              </div>
            ))}
            {(!dashData?.byMember || dashData.byMember.length === 0) && (
              <p className="text-center text-surface-500 text-sm">Aucune donnée</p>
            )}
          </div>
        );
      case 'recent_activity':
        return (
          <div className="space-y-2">
            {(dashData?.recentActivity || []).slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-surface-700 flex items-center justify-center text-[10px] text-surface-400 flex-shrink-0 mt-0.5">
                  {a.first_name?.[0]}{a.last_name?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-surface-300 truncate">
                    <span className="font-medium">{a.first_name}</span> {a.action}
                  </p>
                  <p className="text-[10px] text-surface-500">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: fr })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );
      case 'boards_overview':
        return (
          <div className="space-y-2">
            {(dashData?.boards || []).slice(0, 8).map((b) => (
              <Link key={b.id} to={`/board/${b.id}`} className="flex items-center justify-between p-2 hover:bg-surface-800/50 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: b.color || '#6366f1' }} />
                  <span className="text-sm text-surface-200 truncate">{b.name}</span>
                </div>
                <span className="text-xs text-surface-500">{b.item_count} items</span>
              </Link>
            ))}
          </div>
        );
      default:
        return <p className="text-surface-500 text-sm">Widget inconnu</p>;
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/workspace/${workspaceId}`} className="p-2 hover:bg-surface-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-surface-100 flex items-center gap-3">
              <LayoutDashboard className="w-7 h-7 text-primary-400" />
              Tableau de bord personnalisé
            </h1>
            <p className="text-surface-400 mt-1">Configurez vos widgets pour un aperçu rapide</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadAll} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          <button onClick={() => setShowAddWidget(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Ajouter un widget
          </button>
        </div>
      </div>

      {/* Add Widget Modal */}
      <AnimatePresence>
        {showAddWidget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setShowAddWidget(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-900 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-surface-100">Ajouter un widget</h2>
                <button onClick={() => setShowAddWidget(false)} className="p-2 hover:bg-surface-700 rounded-lg">
                  <X className="w-5 h-5 text-surface-400" />
                </button>
              </div>
              <div className="space-y-2">
                {WIDGET_TYPES.map((wt) => (
                  <button
                    key={wt.id}
                    onClick={() => addWidget(wt.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-surface-800 rounded-xl transition-colors text-left"
                  >
                    <div className="p-2 bg-primary-500/20 rounded-lg">
                      <wt.icon className="w-5 h-5 text-primary-400" />
                    </div>
                    <span className="text-surface-200">{wt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widgets Grid */}
      {widgets.length === 0 ? (
        <div className="card p-12 text-center">
          <LayoutDashboard className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-surface-300 mb-2">Dashboard vide</h3>
          <p className="text-surface-500 mb-6">Ajoutez des widgets pour personnaliser votre tableau de bord.</p>
          <button onClick={() => setShowAddWidget(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Ajouter un widget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((widget) => (
            <motion.div
              key={widget.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-4 group relative"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-surface-300">{widget.title || widget.widget_type}</h3>
                <button
                  onClick={() => removeWidget(widget.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-surface-500 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {renderWidget(widget)}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
