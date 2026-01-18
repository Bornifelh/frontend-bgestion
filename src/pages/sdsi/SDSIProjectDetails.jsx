import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calendar, User, Target, Flag, AlertTriangle, CheckCircle,
  Clock, Plus, Edit2, Trash2, X, Play, Pause, ChevronRight, FileText,
  TrendingUp, Shield, Users, Layers, BarChart3, DollarSign, RefreshCw, Zap,
  Receipt, Building2, FileSpreadsheet
} from 'lucide-react';
import { sdsiApi } from '../../lib/api';
import toast from 'react-hot-toast';

// Configurations
const statusConfig = {
  planned: { label: 'Planifié', color: 'bg-surface-500', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-blue-500', icon: Play },
  completed: { label: 'Terminé', color: 'bg-emerald-500', icon: CheckCircle },
  on_hold: { label: 'En pause', color: 'bg-amber-500', icon: Pause },
  cancelled: { label: 'Annulé', color: 'bg-red-500', icon: X },
};

const phaseStatusConfig = {
  pending: { label: 'En attente', color: 'bg-surface-600' },
  in_progress: { label: 'En cours', color: 'bg-blue-500' },
  completed: { label: 'Terminé', color: 'bg-emerald-500' },
  on_hold: { label: 'En pause', color: 'bg-amber-500' },
};

const getRiskLevel = (score) => {
  if (score >= 15) return { label: 'Critique', color: 'bg-red-500', text: 'text-red-400' };
  if (score >= 10) return { label: 'Important', color: 'bg-orange-500', text: 'text-orange-400' };
  if (score >= 5) return { label: 'Modéré', color: 'bg-amber-500', text: 'text-amber-400' };
  return { label: 'Négligeable', color: 'bg-emerald-500', text: 'text-emerald-400' };
};

const formatCurrency = (amount) => {
  if (!amount) return '-';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' XAF';
};

export default function SDSIProjectDetails() {
  const { workspaceId, projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('definition');
  
  // Modal states
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Expenses state
  const [expenses, setExpenses] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  // Form states
  const [phaseForm, setPhaseForm] = useState({ name: '', description: '', startDate: '', endDate: '', deliverables: '' });
  const [milestoneForm, setMilestoneForm] = useState({ name: '', description: '', dueDate: '', isCritical: false });
  const [riskForm, setRiskForm] = useState({ name: '', description: '', category: 'operational', probability: 3, impact: 3, mitigationStrategy: '' });
  const [expenseForm, setExpenseForm] = useState({ 
    category: 'other', description: '', amount: '', expenseDate: new Date().toISOString().split('T')[0], 
    vendor: '', invoiceNumber: '', notes: '' 
  });

  useEffect(() => {
    loadProject();
    loadExpenses();
    loadExpenseCategories();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const { data } = await sdsiApi.getProject(projectId);
      setProject(data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const { data } = await sdsiApi.getExpenses(projectId);
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const loadExpenseCategories = async () => {
    try {
      const { data } = await sdsiApi.getExpenseCategories();
      setExpenseCategories(data);
    } catch (error) {
      console.error('Error loading expense categories:', error);
    }
  };

  // CRUD Handlers
  const handleAddPhase = async (e) => {
    e.preventDefault();
    try {
      await sdsiApi.createPhase(projectId, phaseForm);
      toast.success('Phase ajoutée');
      setShowPhaseModal(false);
      setPhaseForm({ name: '', description: '', startDate: '', endDate: '', deliverables: '' });
      loadProject();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleUpdatePhase = async (phaseId, updates) => {
    try {
      await sdsiApi.updatePhase(phaseId, updates);
      loadProject();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDeletePhase = async (phaseId) => {
    if (!confirm('Supprimer cette phase ?')) return;
    try {
      await sdsiApi.deletePhase(phaseId);
      toast.success('Phase supprimée');
      loadProject();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    try {
      await sdsiApi.createMilestone(projectId, milestoneForm);
      toast.success('Jalon ajouté');
      setShowMilestoneModal(false);
      setMilestoneForm({ name: '', description: '', dueDate: '', isCritical: false });
      loadProject();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleUpdateMilestone = async (milestoneId, updates) => {
    try {
      await sdsiApi.updateMilestone(milestoneId, updates);
      loadProject();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!confirm('Supprimer ce jalon ?')) return;
    try {
      await sdsiApi.deleteMilestone(milestoneId);
      toast.success('Jalon supprimé');
      loadProject();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleAddRisk = async (e) => {
    e.preventDefault();
    try {
      await sdsiApi.createRisk(projectId, riskForm);
      toast.success('Risque ajouté');
      setShowRiskModal(false);
      setRiskForm({ name: '', description: '', category: 'operational', probability: 3, impact: 3, mitigationStrategy: '' });
      loadProject();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDeleteRisk = async (riskId) => {
    if (!confirm('Supprimer ce risque ?')) return;
    try {
      await sdsiApi.deleteRisk(riskId);
      toast.success('Risque supprimé');
      loadProject();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  // Expense handlers
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) {
      toast.error('Description et montant requis');
      return;
    }
    try {
      await sdsiApi.addExpense(projectId, {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount)
      });
      toast.success('Dépense ajoutée');
      setShowExpenseModal(false);
      setExpenseForm({ 
        category: 'other', description: '', amount: '', 
        expenseDate: new Date().toISOString().split('T')[0], 
        vendor: '', invoiceNumber: '', notes: '' 
      });
      loadExpenses();
      loadProject(); // Refresh to get updated actual_budget
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm('Supprimer cette dépense ?')) return;
    try {
      await sdsiApi.deleteExpense(expenseId);
      toast.success('Dépense supprimée');
      loadExpenses();
      loadProject();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  // Sync progress automatically
  const [syncing, setSyncing] = useState(false);
  
  const handleSyncProgress = async () => {
    setSyncing(true);
    try {
      const { data } = await sdsiApi.syncProgress(projectId);
      toast.success(`Progression mise à jour: ${data.progress}%`);
      loadProject();
    } catch (error) {
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const handleCheckCompletion = async () => {
    try {
      const { data } = await sdsiApi.checkCompletion(projectId);
      if (data.canComplete) {
        toast.success(data.message || 'Projet marqué comme terminé');
        loadProject();
      } else {
        toast.info(`${data.pendingPhases} phases et ${data.pendingCriticalMilestones} jalons critiques restants`);
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleSyncKPIs = async () => {
    try {
      const { data } = await sdsiApi.syncProjectKPIs(projectId);
      toast.success(`${data.synced} KPIs synchronisés`);
    } catch (error) {
      toast.error('Erreur lors de la synchronisation des KPIs');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="card p-12 text-center">
        <h2 className="text-xl font-medium text-surface-300">Projet non trouvé</h2>
        <Link to={`/workspace/${workspaceId}/sdsi/projects`} className="btn btn-primary mt-4">
          Retour aux projets
        </Link>
      </div>
    );
  }

  const StatusIcon = statusConfig[project.status]?.icon || Clock;
  const budgetProgress = project.estimatedBudget ? ((project.actualBudget || 0) / project.estimatedBudget) * 100 : 0;
  
  // Risk summary
  const riskSummary = {
    critical: project.risks?.filter(r => r.score >= 15).length || 0,
    important: project.risks?.filter(r => r.score >= 10 && r.score < 15).length || 0,
    moderate: project.risks?.filter(r => r.score >= 5 && r.score < 10).length || 0,
    low: project.risks?.filter(r => r.score < 5).length || 0,
  };

  const tabs = [
    { id: 'definition', label: 'Définition', icon: FileText },
    { id: 'gestion', label: 'Gestion', icon: Layers },
    { id: 'budget', label: 'Budget', icon: DollarSign },
    { id: 'suivi', label: 'Suivi', icon: TrendingUp },
  ];
  
  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const expensesByCategory = expenses.reduce((acc, e) => {
    const cat = e.category || 'other';
    acc[cat] = (acc[cat] || 0) + e.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={`/workspace/${workspaceId}/sdsi/projects`}
          className="flex items-center gap-2 text-surface-400 hover:text-surface-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>
        <div className="flex items-center gap-2 px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm font-medium">
          PROJET
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 ${statusConfig[project.status]?.color} text-white rounded-full text-sm font-medium`}>
          <StatusIcon className="w-3 h-3" />
          {statusConfig[project.status]?.label}
        </div>
        <h1 className="text-xl font-display font-bold text-surface-100 flex-1">
          {project.code && <span className="text-surface-500 mr-2">{project.code}</span>}
          {project.name}
        </h1>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncProgress}
            disabled={syncing}
            className="btn btn-sm btn-ghost"
            title="Synchroniser la progression"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </button>
          <button
            onClick={handleSyncKPIs}
            className="btn btn-sm btn-ghost"
            title="Synchroniser les KPIs"
          >
            <TrendingUp className="w-4 h-4" />
            KPIs
          </button>
          {project.status !== 'completed' && (
            <button
              onClick={handleCheckCompletion}
              className="btn btn-sm btn-primary"
              title="Vérifier la complétion"
            >
              <CheckCircle className="w-4 h-4" />
              Terminer
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-surface-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-primary-400 border-primary-500'
                  : 'text-surface-400 border-transparent hover:text-surface-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tab: Définition */}
          {activeTab === 'definition' && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="card p-4 text-center">
                  <p className="text-xs text-surface-400 mb-1">Progression</p>
                  <p className="text-2xl font-bold text-primary-400">{project.progress}%</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-xs text-surface-400 mb-1">Budget</p>
                  <p className="text-lg font-bold text-surface-100">{formatCurrency(project.estimatedBudget)}</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-xs text-surface-400 mb-1">Jalons</p>
                  <p className="text-2xl font-bold text-surface-100">
                    {project.milestones?.filter(m => m.status === 'completed').length || 0}
                    <span className="text-surface-500">/{project.milestones?.length || 0}</span>
                  </p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-xs text-surface-400 mb-1">Avancement</p>
                  <div className="w-full h-2 bg-surface-700 rounded-full mt-2">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="card p-6">
                <h3 className="font-semibold text-surface-100 mb-4">Description du projet</h3>
                <p className="text-surface-300 whitespace-pre-wrap">{project.description || 'Aucune description'}</p>
                
                {project.objectives && (
                  <div className="mt-6">
                    <h4 className="font-medium text-surface-200 mb-2">Objectifs</h4>
                    <p className="text-surface-400 whitespace-pre-wrap">{project.objectives}</p>
                  </div>
                )}
                
                {project.expectedBenefits && (
                  <div className="mt-6">
                    <h4 className="font-medium text-surface-200 mb-2">Bénéfices attendus</h4>
                    <p className="text-surface-400 whitespace-pre-wrap">{project.expectedBenefits}</p>
                  </div>
                )}
              </div>

              {/* Planning Timeline */}
              <div className="card p-6">
                <h3 className="font-semibold text-surface-100 mb-4">Planning</h3>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-surface-500" />
                    <span className="text-surface-400">Début:</span>
                    <span className="text-surface-200">{project.startDate ? new Date(project.startDate).toLocaleDateString('fr-FR') : '-'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-surface-600" />
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-surface-500" />
                    <span className="text-surface-400">Fin:</span>
                    <span className="text-surface-200">{project.endDate ? new Date(project.endDate).toLocaleDateString('fr-FR') : '-'}</span>
                  </div>
                </div>
                
                {/* Gantt-like visualization */}
                {project.phases && project.phases.length > 0 && (
                  <div className="mt-6 space-y-2">
                    {project.phases.map((phase, index) => (
                      <div key={phase.id} className="flex items-center gap-3">
                        <div className="w-32 text-xs text-surface-400 truncate">{phase.name}</div>
                        <div className="flex-1 h-6 bg-surface-800 rounded-lg overflow-hidden relative">
                          <div 
                            className={`h-full ${phaseStatusConfig[phase.status]?.color} transition-all`}
                            style={{ width: `${phase.progress || 0}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                            {phase.progress || 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Tab: Gestion */}
          {activeTab === 'gestion' && (
            <>
              {/* Phases */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-surface-100 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-400" />
                    Phases ({project.phases?.length || 0})
                  </h3>
                  <button onClick={() => setShowPhaseModal(true)} className="btn btn-sm btn-primary">
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>
                
                {project.phases && project.phases.length > 0 ? (
                  <div className="space-y-3">
                    {project.phases.map((phase, index) => (
                      <div key={phase.id} className="p-3 bg-surface-800/50 rounded-lg group">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 text-xs font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-surface-200 truncate">{phase.name}</p>
                            <div className="flex items-center gap-3 text-xs text-surface-500">
                              {phase.startDate && <span>{new Date(phase.startDate).toLocaleDateString('fr-FR')}</span>}
                              {phase.startDate && phase.endDate && <span>→</span>}
                              {phase.endDate && <span>{new Date(phase.endDate).toLocaleDateString('fr-FR')}</span>}
                            </div>
                          </div>
                          <select
                            value={phase.status}
                            onChange={(e) => handleUpdatePhase(phase.id, { status: e.target.value })}
                            className={`px-2 py-1 rounded text-xs ${phaseStatusConfig[phase.status]?.color} text-white border-0`}
                          >
                            {Object.entries(phaseStatusConfig).map(([key, config]) => (
                              <option key={key} value={key}>{config.label}</option>
                            ))}
                          </select>
                          <button onClick={() => handleDeletePhase(phase.id)} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                        
                        {/* Progress bar with input */}
                        <div className="mt-3 flex items-center gap-3">
                          <span className="text-xs text-surface-500 w-20">Progression</span>
                          <div className="flex-1 relative group/progress">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={phase.progress || 0}
                              onChange={(e) => handleUpdatePhase(phase.id, { progress: parseInt(e.target.value) })}
                              className="w-full h-2 bg-surface-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                            />
                            <div 
                              className={`absolute top-0 left-0 h-2 rounded-full pointer-events-none ${phaseStatusConfig[phase.status]?.color}`}
                              style={{ width: `${phase.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-primary-400 w-12 text-right">{phase.progress || 0}%</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleUpdatePhase(phase.id, { progress: 0 })}
                              className="px-2 py-0.5 text-xs bg-surface-700 hover:bg-surface-600 rounded"
                            >
                              0%
                            </button>
                            <button
                              onClick={() => handleUpdatePhase(phase.id, { progress: 50 })}
                              className="px-2 py-0.5 text-xs bg-surface-700 hover:bg-surface-600 rounded"
                            >
                              50%
                            </button>
                            <button
                              onClick={() => handleUpdatePhase(phase.id, { progress: 100, status: 'completed' })}
                              className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded"
                            >
                              100%
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-surface-500 py-6">Aucune phase définie</p>
                )}
              </div>

              {/* Milestones */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-surface-100 flex items-center gap-2">
                    <Flag className="w-5 h-5 text-amber-400" />
                    Jalons ({project.milestones?.length || 0})
                  </h3>
                  <button onClick={() => setShowMilestoneModal(true)} className="btn btn-sm btn-primary">
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>
                
                {project.milestones && project.milestones.length > 0 ? (
                  <div className="space-y-2">
                    {project.milestones.map((milestone) => {
                      const isOverdue = milestone.dueDate && new Date(milestone.dueDate) < new Date() && milestone.status !== 'completed';
                      return (
                        <div key={milestone.id} className={`flex items-center gap-3 p-3 rounded-lg group ${isOverdue ? 'bg-red-500/10 border border-red-500/30' : 'bg-surface-800/50'}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            milestone.status === 'completed' ? 'bg-emerald-500/20' : isOverdue ? 'bg-red-500/20' : 'bg-surface-700'
                          }`}>
                            {milestone.status === 'completed' ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Flag className={`w-4 h-4 ${milestone.isCritical ? 'text-amber-400' : 'text-surface-400'}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-surface-200">{milestone.name}</p>
                              {milestone.isCritical && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded">Critique</span>}
                            </div>
                            {milestone.description && <p className="text-xs text-surface-500 truncate">{milestone.description}</p>}
                          </div>
                          <div className="text-right text-xs">
                            <p className={isOverdue ? 'text-red-400' : 'text-surface-400'}>
                              {milestone.dueDate && new Date(milestone.dueDate).toLocaleDateString('fr-FR')}
                            </p>
                            {isOverdue && <p className="text-red-400 font-medium">En retard</p>}
                          </div>
                          <select
                            value={milestone.status}
                            onChange={(e) => handleUpdateMilestone(milestone.id, { 
                              status: e.target.value,
                              completedDate: e.target.value === 'completed' ? new Date().toISOString().split('T')[0] : null
                            })}
                            className="px-2 py-1 rounded text-xs bg-surface-700 text-surface-200 border-0"
                          >
                            <option value="pending">À venir</option>
                            <option value="in_progress">En cours</option>
                            <option value="completed">Terminé</option>
                          </select>
                          <button onClick={() => handleDeleteMilestone(milestone.id)} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-surface-500 py-6">Aucun jalon défini</p>
                )}
              </div>

              {/* Resources */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-surface-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    Ressources allouées
                  </h3>
                </div>
                
                {project.allocations && project.allocations.length > 0 ? (
                  <div className="space-y-2">
                    {project.allocations.map((alloc) => (
                      <div key={alloc.id} className="flex items-center gap-3 p-3 bg-surface-800/50 rounded-lg">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                          {alloc.resourceName?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-surface-200">{alloc.resourceName}</p>
                          <p className="text-xs text-surface-500">{alloc.role || alloc.resourceType}</p>
                        </div>
                        <span className="text-primary-400 font-bold">{alloc.percentage}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-surface-500 py-6">Aucune ressource allouée</p>
                )}
              </div>
            </>
          )}

          {/* Tab: Budget */}
          {activeTab === 'budget' && (
            <>
              {/* Budget Overview */}
              <div className="grid grid-cols-3 gap-4">
                <div className="card p-4">
                  <p className="text-xs text-surface-400 mb-1">Budget estimé</p>
                  <p className="text-2xl font-bold text-surface-100">{formatCurrency(project.estimatedBudget)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs text-surface-400 mb-1">Dépensé</p>
                  <p className="text-2xl font-bold text-amber-400">{formatCurrency(project.actualBudget || totalExpenses)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs text-surface-400 mb-1">Disponible</p>
                  <p className={`text-2xl font-bold ${((project.estimatedBudget || 0) - (project.actualBudget || totalExpenses)) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formatCurrency((project.estimatedBudget || 0) - (project.actualBudget || totalExpenses))}
                  </p>
                </div>
              </div>

              {/* Budget Progress Bar */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-surface-100">Consommation du budget</h3>
                  <span className={`text-sm font-bold ${budgetProgress > 100 ? 'text-red-400' : budgetProgress > 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {budgetProgress.toFixed(1)}%
                  </span>
                </div>
                <div className="h-4 bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      budgetProgress > 100 ? 'bg-red-500' : budgetProgress > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                  />
                </div>
                {budgetProgress > 100 && (
                  <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Dépassement de {formatCurrency((project.actualBudget || totalExpenses) - (project.estimatedBudget || 0))}
                  </p>
                )}
              </div>

              {/* Expenses by Category */}
              {Object.keys(expensesByCategory).length > 0 && (
                <div className="card p-6">
                  <h3 className="font-semibold text-surface-100 mb-4">Répartition par catégorie</h3>
                  <div className="space-y-3">
                    {Object.entries(expensesByCategory).map(([cat, amount]) => {
                      const catInfo = expenseCategories.find(c => c.id === cat) || { name: cat, icon: '📋' };
                      const percentage = totalExpenses > 0 ? (amount / totalExpenses * 100) : 0;
                      return (
                        <div key={cat} className="flex items-center gap-3">
                          <span className="text-xl">{catInfo.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-surface-300">{catInfo.name}</span>
                              <span className="text-sm text-surface-400">{formatCurrency(amount)}</span>
                            </div>
                            <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                              <div className="h-full bg-primary-500 rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                          <span className="text-xs text-surface-500 w-12 text-right">{percentage.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Expense List */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-surface-100 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-primary-400" />
                    Dépenses ({expenses.length})
                  </h3>
                  <button onClick={() => setShowExpenseModal(true)} className="btn btn-sm btn-primary">
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>

                {loadingExpenses ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : expenses.length > 0 ? (
                  <div className="space-y-2">
                    {expenses.map((expense) => {
                      const catInfo = expenseCategories.find(c => c.id === expense.category) || { name: expense.category, icon: '📋' };
                      return (
                        <div key={expense.id} className="flex items-center gap-3 p-3 bg-surface-800/50 rounded-lg group hover:bg-surface-800 transition-colors">
                          <span className="text-xl">{catInfo.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-surface-200 truncate">{expense.description}</p>
                            <div className="flex items-center gap-3 text-xs text-surface-500">
                              <span>{new Date(expense.expenseDate).toLocaleDateString('fr-FR')}</span>
                              {expense.vendor && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {expense.vendor}
                                  </span>
                                </>
                              )}
                              {expense.invoiceNumber && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <FileSpreadsheet className="w-3 h-3" />
                                    {expense.invoiceNumber}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className="text-primary-400 font-bold whitespace-nowrap">
                            {formatCurrency(expense.amount)}
                          </span>
                          <button 
                            onClick={() => handleDeleteExpense(expense.id)} 
                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Receipt className="w-12 h-12 mx-auto text-surface-600 mb-3" />
                    <p className="text-surface-500">Aucune dépense enregistrée</p>
                    <button 
                      onClick={() => setShowExpenseModal(true)} 
                      className="btn btn-sm btn-primary mt-4"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter une dépense
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Tab: Suivi */}
          {activeTab === 'suivi' && (
            <>
              {/* Progress Sync Panel */}
              <div className="card p-6 border-l-4 border-primary-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-surface-100 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary-400" />
                    Suivi automatique
                  </h3>
                  <button
                    onClick={handleSyncProgress}
                    disabled={syncing}
                    className="btn btn-sm btn-primary"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    Actualiser
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-surface-800/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-primary-400">{project.progress}%</p>
                    <p className="text-xs text-surface-400 mt-1">Progression globale</p>
                  </div>
                  <div className="p-4 bg-surface-800/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-surface-100">
                      {project.phases?.filter(p => p.status === 'completed').length || 0}
                      <span className="text-surface-500 text-lg">/{project.phases?.length || 0}</span>
                    </p>
                    <p className="text-xs text-surface-400 mt-1">Phases terminées</p>
                  </div>
                  <div className="p-4 bg-surface-800/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-surface-100">
                      {project.milestones?.filter(m => m.status === 'completed').length || 0}
                      <span className="text-surface-500 text-lg">/{project.milestones?.length || 0}</span>
                    </p>
                    <p className="text-xs text-surface-400 mt-1">Jalons atteints</p>
                  </div>
                </div>

                {/* Progression par phase */}
                {project.phases && project.phases.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-surface-300 mb-3">Progression des phases</h4>
                    <div className="space-y-2">
                      {project.phases.map((phase) => (
                        <div key={phase.id} className="flex items-center gap-3">
                          <div className="w-28 text-xs text-surface-400 truncate">{phase.name}</div>
                          <div className="flex-1 h-2 bg-surface-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${phaseStatusConfig[phase.status]?.color}`}
                              style={{ width: `${phase.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-surface-300 w-10 text-right">{phase.progress || 0}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Budget */}
              <div className="card p-6">
                <h3 className="font-semibold text-surface-100 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Budget
                </h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-surface-800/50 rounded-lg">
                    <p className="text-xs text-surface-400 mb-1">Budget estimé</p>
                    <p className="text-xl font-bold text-surface-100">{formatCurrency(project.estimatedBudget)}</p>
                  </div>
                  <div className="p-4 bg-surface-800/50 rounded-lg">
                    <p className="text-xs text-surface-400 mb-1">Consommé</p>
                    <p className="text-xl font-bold text-amber-400">{formatCurrency(project.actualBudget)}</p>
                  </div>
                  <div className="p-4 bg-surface-800/50 rounded-lg">
                    <p className="text-xs text-surface-400 mb-1">Reste</p>
                    <p className={`text-xl font-bold ${(project.estimatedBudget - (project.actualBudget || 0)) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {formatCurrency((project.estimatedBudget || 0) - (project.actualBudget || 0))}
                    </p>
                  </div>
                </div>
                <div className="h-3 bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      budgetProgress > 100 ? 'bg-red-500' : budgetProgress > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-surface-500 mt-2 text-center">{budgetProgress.toFixed(1)}% du budget consommé</p>
              </div>

              {/* Risks */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-surface-100 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-400" />
                    Risques ({project.risks?.length || 0})
                  </h3>
                  <button onClick={() => setShowRiskModal(true)} className="btn btn-sm btn-primary">
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>

                {project.risks && project.risks.length > 0 ? (
                  <div className="space-y-2">
                    {project.risks.map((risk) => {
                      const level = getRiskLevel(risk.score);
                      return (
                        <div key={risk.id} className="flex items-center gap-3 p-3 bg-surface-800/50 rounded-lg group">
                          <div className={`w-10 h-10 rounded-lg ${level.color} flex items-center justify-center`}>
                            <span className="text-white font-bold text-sm">{risk.score}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-surface-200">{risk.name}</p>
                            <p className="text-xs text-surface-500">{risk.category} • P:{risk.probability} × I:{risk.impact}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${level.text} bg-surface-700`}>
                            {level.label}
                          </span>
                          <button onClick={() => handleDeleteRisk(risk.id)} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-surface-500 py-6">Aucun risque identifié</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Situation Summary */}
          <div className="card p-4">
            <h4 className="font-medium text-surface-200 mb-4">Situation</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-surface-400 text-sm">Budget</span>
                <div className={`w-3 h-3 rounded-full ${budgetProgress > 100 ? 'bg-red-500' : budgetProgress > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-surface-400 text-sm">Planning</span>
                <div className={`w-3 h-3 rounded-full ${project.progress >= 80 ? 'bg-emerald-500' : project.progress >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-surface-400 text-sm">Risques</span>
                <div className={`w-3 h-3 rounded-full ${riskSummary.critical > 0 ? 'bg-red-500' : riskSummary.important > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              </div>
            </div>
          </div>

          {/* Risk Summary */}
          <div className="card p-4">
            <h4 className="font-medium text-surface-200 mb-4">Risques</h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                  {riskSummary.low}
                </div>
                <p className="text-[10px] text-surface-500 mt-1">Négligeable</p>
              </div>
              <div>
                <div className="w-10 h-10 mx-auto rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                  {riskSummary.moderate}
                </div>
                <p className="text-[10px] text-surface-500 mt-1">Modéré</p>
              </div>
              <div>
                <div className="w-10 h-10 mx-auto rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                  {riskSummary.important}
                </div>
                <p className="text-[10px] text-surface-500 mt-1">Important</p>
              </div>
              <div>
                <div className="w-10 h-10 mx-auto rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
                  {riskSummary.critical}
                </div>
                <p className="text-[10px] text-surface-500 mt-1">Critique</p>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="card p-4">
            <h4 className="font-medium text-surface-200 mb-4">Équipe</h4>
            {project.projectManager && (
              <div className="flex items-center gap-3 mb-3">
                <div className="avatar">{project.projectManager.charAt(0)}</div>
                <div>
                  <p className="text-surface-200 text-sm font-medium">{project.projectManager}</p>
                  <p className="text-surface-500 text-xs">Chef de projet</p>
                </div>
              </div>
            )}
            {project.sponsor && (
              <div className="flex items-center gap-3">
                <div className="avatar avatar-sm bg-amber-500/20 text-amber-400">{project.sponsor.charAt(0)}</div>
                <div>
                  <p className="text-surface-200 text-sm">{project.sponsor}</p>
                  <p className="text-surface-500 text-xs">Sponsor</p>
                </div>
              </div>
            )}
          </div>

          {/* Axis Info */}
          {project.axisName && (
            <div className="card p-4">
              <h4 className="font-medium text-surface-200 mb-3">Axe stratégique</h4>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.axisColor }} />
                <span className="text-surface-300">{project.axisName}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Phase Modal */}
      <AnimatePresence>
        {showPhaseModal && (
          <Modal title="Ajouter une phase" onClose={() => setShowPhaseModal(false)}>
            <form onSubmit={handleAddPhase} className="space-y-4">
              <div>
                <label className="block text-sm text-surface-400 mb-1">Nom *</label>
                <input
                  type="text"
                  value={phaseForm.name}
                  onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-surface-400 mb-1">Description</label>
                <textarea
                  value={phaseForm.description}
                  onChange={(e) => setPhaseForm({ ...phaseForm, description: e.target.value })}
                  className="input min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-surface-400 mb-1">Date début</label>
                  <input type="date" value={phaseForm.startDate} onChange={(e) => setPhaseForm({ ...phaseForm, startDate: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-sm text-surface-400 mb-1">Date fin</label>
                  <input type="date" value={phaseForm.endDate} onChange={(e) => setPhaseForm({ ...phaseForm, endDate: e.target.value })} className="input" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowPhaseModal(false)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary">Ajouter</button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Milestone Modal */}
      <AnimatePresence>
        {showMilestoneModal && (
          <Modal title="Ajouter un jalon" onClose={() => setShowMilestoneModal(false)}>
            <form onSubmit={handleAddMilestone} className="space-y-4">
              <div>
                <label className="block text-sm text-surface-400 mb-1">Nom *</label>
                <input
                  type="text"
                  value={milestoneForm.name}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-surface-400 mb-1">Description</label>
                <textarea
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  className="input min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-sm text-surface-400 mb-1">Date d'échéance</label>
                <input type="date" value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })} className="input" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={milestoneForm.isCritical} onChange={(e) => setMilestoneForm({ ...milestoneForm, isCritical: e.target.checked })} className="rounded" />
                <span className="text-surface-300">Jalon critique</span>
              </label>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowMilestoneModal(false)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary">Ajouter</button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Risk Modal */}
      <AnimatePresence>
        {showRiskModal && (
          <Modal title="Ajouter un risque" onClose={() => setShowRiskModal(false)}>
            <form onSubmit={handleAddRisk} className="space-y-4">
              <div>
                <label className="block text-sm text-surface-400 mb-1">Nom *</label>
                <input
                  type="text"
                  value={riskForm.name}
                  onChange={(e) => setRiskForm({ ...riskForm, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-surface-400 mb-1">Description</label>
                <textarea
                  value={riskForm.description}
                  onChange={(e) => setRiskForm({ ...riskForm, description: e.target.value })}
                  className="input min-h-[60px]"
                />
              </div>
              <div>
                <label className="block text-sm text-surface-400 mb-1">Catégorie</label>
                <select value={riskForm.category} onChange={(e) => setRiskForm({ ...riskForm, category: e.target.value })} className="input">
                  <option value="technical">Technique</option>
                  <option value="operational">Opérationnel</option>
                  <option value="financial">Financier</option>
                  <option value="security">Sécurité</option>
                  <option value="legal">Juridique</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-surface-400 mb-1">Probabilité: {riskForm.probability}</label>
                  <input type="range" min="1" max="5" value={riskForm.probability} onChange={(e) => setRiskForm({ ...riskForm, probability: parseInt(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm text-surface-400 mb-1">Impact: {riskForm.impact}</label>
                  <input type="range" min="1" max="5" value={riskForm.impact} onChange={(e) => setRiskForm({ ...riskForm, impact: parseInt(e.target.value) })} className="w-full" />
                </div>
              </div>
              <div className={`p-3 rounded-lg text-center ${getRiskLevel(riskForm.probability * riskForm.impact).color}`}>
                <span className="text-white font-bold">Score: {riskForm.probability * riskForm.impact}</span>
                <span className="text-white/80 ml-2">({getRiskLevel(riskForm.probability * riskForm.impact).label})</span>
              </div>
              <div>
                <label className="block text-sm text-surface-400 mb-1">Stratégie de mitigation</label>
                <textarea
                  value={riskForm.mitigationStrategy}
                  onChange={(e) => setRiskForm({ ...riskForm, mitigationStrategy: e.target.value })}
                  className="input min-h-[60px]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowRiskModal(false)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary">Ajouter</button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Expense Modal */}
      <AnimatePresence>
        {showExpenseModal && (
          <Modal title="Ajouter une dépense" onClose={() => setShowExpenseModal(false)}>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm text-surface-400 mb-1">Catégorie</label>
                <select 
                  value={expenseForm.category} 
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} 
                  className="input"
                >
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-surface-400 mb-1">Description *</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="input"
                  placeholder="Ex: Licence Microsoft 365"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-surface-400 mb-1">Montant (XAF) *</label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="input"
                    placeholder="0"
                    min="0"
                    step="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-surface-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-surface-400 mb-1">Fournisseur</label>
                  <input
                    type="text"
                    value={expenseForm.vendor}
                    onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                    className="input"
                    placeholder="Ex: Microsoft"
                  />
                </div>
                <div>
                  <label className="block text-sm text-surface-400 mb-1">N° Facture</label>
                  <input
                    type="text"
                    value={expenseForm.invoiceNumber}
                    onChange={(e) => setExpenseForm({ ...expenseForm, invoiceNumber: e.target.value })}
                    className="input"
                    placeholder="Ex: FAC-2026-001"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-surface-400 mb-1">Notes</label>
                <textarea
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="input min-h-[60px]"
                  placeholder="Informations complémentaires..."
                />
              </div>
              
              {/* Preview */}
              {expenseForm.amount && (
                <div className="p-4 bg-surface-800/50 rounded-lg border border-surface-700">
                  <p className="text-xs text-surface-400 mb-1">Aperçu</p>
                  <p className="text-2xl font-bold text-primary-400">{formatCurrency(parseFloat(expenseForm.amount) || 0)}</p>
                  {project.estimatedBudget && (
                    <p className="text-xs text-surface-500 mt-1">
                      Nouveau total: {formatCurrency((project.actualBudget || totalExpenses) + (parseFloat(expenseForm.amount) || 0))} / {formatCurrency(project.estimatedBudget)}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-primary">
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// Modal Component
function Modal({ title, children, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-900 rounded-2xl border border-surface-700 w-full max-w-md"
      >
        <div className="flex items-center justify-between p-4 border-b border-surface-700">
          <h3 className="font-semibold text-surface-100">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-800 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4">{children}</div>
      </motion.div>
    </motion.div>
  );
}
