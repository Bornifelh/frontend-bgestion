import { useState, useEffect, useMemo } from 'react';
import {
  Cpu, Server, Monitor, Printer, Database, Network, Box, FileText,
  Plus, Search, Download, Edit2, Trash2, Eye, AlertTriangle, CheckCircle, Clock,
  HardDrive, Shield, Tag, MapPin, Calendar, Hash, X, BarChart3, Wrench,
  ClipboardCheck, ChevronRight, User, FolderKanban, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { memberApi, boardApi, itemApi, itAssetApi } from '../lib/api';

const CURRENCY = 'F CFA';
const fmt = (v) => `${Number(v).toLocaleString('fr-FR')} ${CURRENCY}`;

const ASSET_CATEGORIES = [
  { id: 'all', label: 'Tous', icon: Cpu, color: '#173D68' },
  { id: 'computers', label: 'Ordinateurs', icon: Monitor, color: '#0891b2' },
  { id: 'servers', label: 'Serveurs', icon: Server, color: '#7c3aed' },
  { id: 'network', label: 'Reseau', icon: Network, color: '#2563eb' },
  { id: 'peripherals', label: 'Peripheriques', icon: Printer, color: '#d97706' },
  { id: 'software', label: 'Logiciels', icon: Database, color: '#059669' },
  { id: 'consumables', label: 'Consommables', icon: Box, color: '#dc2626' },
];

const STATUS_OPTIONS = [
  { id: 'in_use', label: 'En service', color: '#22c55e', icon: CheckCircle },
  { id: 'in_stock', label: 'En stock', color: '#3b82f6', icon: Box },
  { id: 'maintenance', label: 'Maintenance', color: '#f59e0b', icon: Clock },
  { id: 'retired', label: 'Reforme', color: '#ef4444', icon: AlertTriangle },
];

const MAINT_TYPES = [
  { id: 'preventive', label: 'Preventif', color: '#3b82f6' },
  { id: 'corrective', label: 'Correctif', color: '#f59e0b' },
  { id: 'repair', label: 'Reparation', color: '#ef4444' },
  { id: 'upgrade', label: 'Mise a jour', color: '#8b5cf6' },
];

const WORKFLOW_STEPS = [
  { id: 'attribution', label: 'Attribution', color: '#F36F21', icon: User, description: 'Ticket cree, en attente d\'affectation a un technicien' },
  { id: 'prise_en_compte', label: 'Pris en compte', color: '#3b82f6', icon: ClipboardCheck, description: 'Le technicien a accepte l\'intervention' },
  { id: 'traitement', label: 'Reparation / Analyse', color: '#7c3aed', icon: Wrench, description: 'Intervention en cours (diagnostic, reparation, mise a jour...)' },
  { id: 'livraison', label: 'Livraison', color: '#22c55e', icon: CheckCircle, description: 'Equipement pret, en attente de restitution ou restitue' },
];

const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-[#F36F21]/20 focus:border-[#F36F21] outline-none transition-colors";

export default function ITAssetManagement() {
  const [assets, setAssets] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [activeView, setActiveView] = useState('inventory');
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [editingMaint, setEditingMaint] = useState(null);
  const [maintSearch, setMaintSearch] = useState('');
  const [wsMembers, setWsMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const workspaces = useWorkspaceStore((s) => s.workspaces);

  const loadAssets = async () => {
    try {
      const res = await itAssetApi.getAssets();
      setAssets(res.data || []);
    } catch (_) {}
  };

  const loadMaintenance = async () => {
    try {
      const res = await itAssetApi.getMaintenance();
      setMaintenanceRecords(res.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadAssets(), loadMaintenance()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      const all = [];
      const seen = new Set();
      for (const ws of workspaces) {
        try {
          const res = await memberApi.getByWorkspace(ws.id);
          (res.data || []).forEach(m => {
            const uid = m.userId || m.id;
            if (!seen.has(uid)) { seen.add(uid); all.push(m); }
          });
        } catch (_) {}
      }
      setWsMembers(all);
    };
    if (workspaces.length) fetchMembers();
  }, [workspaces]);

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      if (activeCategory !== 'all' && a.category !== activeCategory) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (searchQuery) { const q = searchQuery.toLowerCase(); return a.name.toLowerCase().includes(q) || a.serial.toLowerCase().includes(q) || a.assignee.toLowerCase().includes(q) || a.location.toLowerCase().includes(q); }
      return true;
    });
  }, [assets, activeCategory, searchQuery, statusFilter]);

  const getMemberName = (memberId) => {
    const m = wsMembers.find(x => (x.userId || x.id) === memberId);
    return m ? (m.fullName || `${m.firstName} ${m.lastName}`) : '';
  };
  const getMemberInitials = (memberId) => {
    const m = wsMembers.find(x => (x.userId || x.id) === memberId);
    return m ? `${m.firstName?.[0] || ''}${m.lastName?.[0] || ''}` : '?';
  };

  const filteredMaint = useMemo(() => {
    if (!maintSearch) return maintenanceRecords;
    const q = maintSearch.toLowerCase();
    return maintenanceRecords.filter(m => {
      const name = getMemberName(m.assignedTo);
      return m.assetName?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q) || name.toLowerCase().includes(q);
    });
  }, [maintenanceRecords, maintSearch, wsMembers]);

  const maintByStep = useMemo(() => {
    const map = {};
    WORKFLOW_STEPS.forEach(s => { map[s.id] = []; });
    filteredMaint.forEach(m => {
      if (map[m.step]) map[m.step].push(m);
      else if (map.attribution) map.attribution.push(m);
    });
    return map;
  }, [filteredMaint]);

  const stats = useMemo(() => {
    const total = assets.length;
    const inUse = assets.filter(a => a.status === 'in_use').length;
    const inStock = assets.filter(a => a.status === 'in_stock').length;
    const maint = assets.filter(a => a.status === 'maintenance').length;
    const totalValue = assets.reduce((sum, a) => sum + (a.value || 0), 0);
    const pendingMaint = maintenanceRecords.filter(m => m.step !== 'livraison').length;
    return { total, inUse, inStock, maint, totalValue, pendingMaint };
  }, [assets, maintenanceRecords]);

  const getCat = (id) => ASSET_CATEGORIES.find(c => c.id === id) || ASSET_CATEGORIES[0];
  const getStat = (id) => STATUS_OPTIONS.find(s => s.id === id) || STATUS_OPTIONS[0];
  const getMaintType = (id) => MAINT_TYPES.find(t => t.id === id) || MAINT_TYPES[0];
  const getStep = (id) => WORKFLOW_STEPS.find(s => s.id === id) || WORKFLOW_STEPS[0];
  const getNextStep = (currentStep) => {
    const idx = WORKFLOW_STEPS.findIndex(s => s.id === currentStep);
    return idx < WORKFLOW_STEPS.length - 1 ? WORKFLOW_STEPS[idx + 1] : null;
  };

  const advanceStep = async (maintId) => {
    const m = maintenanceRecords.find(x => x.id === maintId);
    if (!m) return;
    const next = getNextStep(m.step);
    if (!next) return;

    const updates = { step: next.id };
    if (next.id === 'livraison') updates.completedDate = new Date().toISOString().split('T')[0];

    try {
      await itAssetApi.updateMaintenance(maintId, updates);

      if (m.linkedItemId) {
        try {
          const typeLbl = MAINT_TYPES.find(t => t.id === m.type)?.label || m.type;
          const newName = `[IT] ${typeLbl} — ${m.assetName || 'Equipement'} (${next.label})`;
          await itemApi.update(m.linkedItemId, { name: newName });
        } catch (_) {}
      }

      toast.success('Etape avancee');
      await loadMaintenance();
    } catch (_) {
      toast.error('Erreur');
    }
  };

  const handleSaveAsset = async (data) => {
    try {
      if (data.id) {
        await itAssetApi.updateAsset(data.id, data);
        toast.success('Equipement mis a jour');
      } else {
        await itAssetApi.createAsset(data);
        toast.success('Equipement enregistre');
      }
      await loadAssets();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur lors de l\'enregistrement');
    }
    setEditingAsset(null);
    setShowCreateModal(false);
  };

  const handleDeleteAsset = async (id) => {
    if (!confirm('Supprimer cet equipement ?')) return;
    try {
      await itAssetApi.deleteAsset(id);
      toast.success('Equipement supprime');
      await loadAssets();
    } catch (_) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSaveMaint = async (data) => {
    try {
      if (data.id) {
        await itAssetApi.updateMaintenance(data.id, data);
        toast.success('Intervention mise a jour');
      } else {
        const payload = { ...data, step: data.step || 'attribution' };

        if (data.boardId) {
          try {
            const stepLabel = WORKFLOW_STEPS.find(s => s.id === (data.step || 'attribution'))?.label || 'Attribution';
            const typeLbl = MAINT_TYPES.find(t => t.id === data.type)?.label || data.type;
            const itemName = `[IT] ${typeLbl} — ${data.assetName || 'Equipement'} (${stepLabel})`;
            const res = await itemApi.create({ boardId: data.boardId, name: itemName });
            payload.linkedItemId = res.data.id;
          } catch (e) {
            console.error('Erreur creation item board:', e);
          }
        }

        await itAssetApi.createMaintenance(payload);
        toast.success('Intervention creee');
      }
      await loadMaintenance();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur');
    }
    setShowMaintModal(false);
    setEditingMaint(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-[#F36F21] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center"><Cpu className="w-5 h-5 text-cyan-700" /></div>
          <div>
            <h1 className="text-xl font-bold text-[#173D68]">Gestion du Materiel Informatique</h1>
            <p className="text-sm text-gray-500">Inventaire, suivi des equipements, entretien et reparations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeView === 'maintenance' && (
            <button onClick={() => { setEditingMaint(null); setShowMaintModal(true); }} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors" style={{ backgroundColor: '#F36F21' }}>
              <Plus className="w-4 h-4" /> Nouvelle intervention
            </button>
          )}
          {activeView === 'inventory' && (
            <button onClick={() => { setEditingAsset(null); setShowCreateModal(true); }} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors" style={{ backgroundColor: '#F36F21' }}>
              <Plus className="w-4 h-4" /> Nouvel equipement
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Total actifs', value: stats.total, icon: HardDrive, color: '#173D68', bg: '#173D68' },
          { label: 'En service', value: stats.inUse, icon: CheckCircle, color: '#22c55e', bg: '#22c55e' },
          { label: 'En stock', value: stats.inStock, icon: Box, color: '#3b82f6', bg: '#3b82f6' },
          { label: 'Maintenance', value: stats.maint, icon: Clock, color: '#f59e0b', bg: '#f59e0b' },
          { label: 'Interventions', value: stats.pendingMaint, icon: Wrench, color: '#7c3aed', bg: '#7c3aed' },
          { label: 'Valeur totale', value: fmt(stats.totalValue), icon: BarChart3, color: '#F36F21', bg: '#F36F21', isText: true },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{s.label}</span>
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${s.bg}15` }}><s.icon className="w-3 h-3" style={{ color: s.color }} /></div>
            </div>
            <p className={`font-bold ${s.isText ? 'text-base' : 'text-xl'}`} style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* View switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <button onClick={() => setActiveView('inventory')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === 'inventory' ? 'bg-white shadow-sm text-[#173D68]' : 'text-gray-500 hover:text-gray-700'}`}>
          <HardDrive className="w-4 h-4" /> Inventaire
        </button>
        <button onClick={() => setActiveView('maintenance')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === 'maintenance' ? 'bg-white shadow-sm text-[#173D68]' : 'text-gray-500 hover:text-gray-700'}`}>
          <Wrench className="w-4 h-4" /> Entretien / Reparation
          {stats.pendingMaint > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F36F21]/10 text-[#F36F21] font-bold">{stats.pendingMaint}</span>}
        </button>
      </div>

      {/* ============ INVENTORY VIEW ============ */}
      {activeView === 'inventory' && (
        <>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg overflow-x-auto">
            {ASSET_CATEGORIES.map(cat => {
              const count = cat.id === 'all' ? assets.length : assets.filter(a => a.category === cat.id).length;
              return (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat.id ? 'bg-white shadow-sm text-[#173D68]' : 'text-gray-500 hover:text-gray-700'}`}>
                  <cat.icon className="w-3.5 h-3.5" />{cat.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeCategory === cat.id ? 'bg-[#F36F21]/10 text-[#F36F21]' : 'bg-gray-200 text-gray-500'}`}>{count}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`${inputCls} pl-10`} />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls} style={{ width: 'auto' }}>
              <option value="all">Tous les statuts</option>
              {STATUS_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"><Download className="w-4 h-4" /> Exporter</button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Equipement', 'N° Serie', 'Categorie', 'Statut', 'Emplacement', 'Assigne a', 'Valeur', 'Actions'].map(h => (
                    <th key={h} className={`${h === 'Actions' ? 'text-right' : 'text-left'} px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => {
                  const cat = getCat(asset.category);
                  const status = getStat(asset.status);
                  const wDate = asset.warranty !== '-' ? new Date(asset.warranty) : null;
                  const wExpired = wDate && wDate < new Date();
                  return (
                    <tr key={asset.id} className="border-b border-gray-100 last:border-0 hover:bg-[#F36F21]/[0.02] transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cat.color}15` }}><cat.icon className="w-4 h-4" style={{ color: cat.color }} /></div>
                          <div>
                            <p className="font-medium text-[#173D68] text-sm">{asset.name}</p>
                            <p className="text-[11px] text-gray-400">{asset.brand} — {asset.model}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded">{asset.serial}</span></td>
                      <td className="px-4 py-3"><span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>{cat.label}</span></td>
                      <td className="px-4 py-3"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} /><span className="text-xs font-medium text-gray-700">{status.label}</span></div></td>
                      <td className="px-4 py-3"><div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" /><span className="text-xs text-gray-600">{asset.location}</span></div></td>
                      <td className="px-4 py-3"><span className="text-xs text-gray-600">{asset.assignee}</span></td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-gray-700">{fmt(asset.value)}</span>
                        {wExpired && <AlertTriangle className="w-3 h-3 text-red-500 inline ml-1" title="Garantie expiree" />}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setSelectedAsset(asset)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#173D68]" title="Voir"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingAsset(asset)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#F36F21]" title="Modifier"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteAsset(asset.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500" title="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredAssets.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">Aucun equipement trouve</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ============ MAINTENANCE VIEW — WORKFLOW KANBAN ============ */}
      {activeView === 'maintenance' && (
        <>
          {/* Workflow progress legend */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#173D68]">Workflow d'intervention</h3>
              <div className="relative max-w-xs flex-1 ml-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input type="text" placeholder="Rechercher..." value={maintSearch} onChange={(e) => setMaintSearch(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-[#F36F21]/20 focus:border-[#F36F21] outline-none" />
              </div>
            </div>
            <div className="flex items-center gap-0">
              {WORKFLOW_STEPS.map((step, i) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: step.color }}>
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800">{step.label}</p>
                      <p className="text-[10px] text-gray-400 truncate">{step.description}</p>
                    </div>
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-300 mx-2 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Kanban columns */}
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
            {WORKFLOW_STEPS.map((step) => {
              const cards = maintByStep[step.id] || [];
              const StepIcon = step.icon;
              return (
                <div key={step.id} className="flex-1 min-w-[260px] max-w-[320px] flex flex-col">
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: step.color }} />
                    <span className="text-sm font-bold text-[#173D68]">{step.label}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{cards.length}</span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 space-y-2 bg-gray-50 rounded-xl p-2 border border-gray-100 min-h-[300px]">
                    {cards.map((m) => {
                      const mType = getMaintType(m.type);
                      const nextStep = getNextStep(m.step);
                      return (
                        <div key={m.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md hover:border-[#F36F21]/30 transition-all">
                          {/* Type badge */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${mType.color}15`, color: mType.color }}>{mType.label}</span>
                            <div className="flex items-center gap-0.5">
                              <button onClick={() => { setEditingMaint(m); setShowMaintModal(true); }} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-[#F36F21]"><Edit2 className="w-3 h-3" /></button>
                              <button onClick={async () => { if (confirm('Supprimer ?')) { try { await itAssetApi.deleteMaintenance(m.id); toast.success('Supprime'); await loadMaintenance(); } catch(_) { toast.error('Erreur'); } } }} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>

                          {/* Asset name */}
                          <h4 className="font-semibold text-[#173D68] text-sm mb-1">{m.assetName}</h4>
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{m.description}</p>

                          {/* Meta */}
                          <div className="space-y-1 mb-3">
                            {m.assignedTo && (
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                <div className="w-4 h-4 rounded-full bg-[#173D68] flex items-center justify-center text-white text-[7px] font-bold flex-shrink-0">
                                  {getMemberInitials(m.assignedTo)}
                                </div>
                                <span className="font-medium">{getMemberName(m.assignedTo) || 'Utilisateur'}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(m.scheduledDate).toLocaleDateString('fr-FR')}</span>
                            </div>
                            {m.linkedBoardId && (
                              <Link to={`/board/${m.linkedBoardId}`} className="flex items-center gap-1.5 text-[11px] text-[#F36F21] hover:underline">
                                <FolderKanban className="w-3 h-3" />
                                <span>Voir dans le Board</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            )}
                            {m.cost > 0 && (
                              <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600">
                                <Tag className="w-3 h-3" />
                                <span>{fmt(m.cost)}</span>
                              </div>
                            )}
                            {m.completedDate && (
                              <div className="flex items-center gap-1.5 text-[11px] text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                <span>Livre le {new Date(m.completedDate).toLocaleDateString('fr-FR')}</span>
                              </div>
                            )}
                          </div>

                          {m.notes && <p className="text-[10px] text-gray-400 italic mb-2 border-t border-gray-100 pt-1.5">{m.notes}</p>}

                          {/* Advance button */}
                          {nextStep && (
                            <button
                              onClick={() => advanceStep(m.id)}
                              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-colors text-white"
                              style={{ backgroundColor: nextStep.color }}
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                              Passer a : {nextStep.label}
                            </button>
                          )}
                          {!nextStep && (
                            <div className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg bg-green-50 text-green-700">
                              <CheckCircle className="w-3.5 h-3.5" /> Termine
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {cards.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <StepIcon className="w-6 h-6 text-gray-300 mb-2" />
                        <p className="text-[11px] text-gray-400">Aucune intervention</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ============ DETAIL MODAL ============ */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAsset(null)}>
          <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${getCat(selectedAsset.category).color}15` }}>
                  {(() => { const C = getCat(selectedAsset.category).icon; return <C className="w-5 h-5" style={{ color: getCat(selectedAsset.category).color }} />; })()}
                </div>
                <div><h2 className="font-semibold text-[#173D68]">{selectedAsset.name}</h2><p className="text-xs text-gray-400">{selectedAsset.brand} — {selectedAsset.model}</p></div>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'N° Serie', value: selectedAsset.serial, icon: Hash },
                  { label: 'Statut', value: getStat(selectedAsset.status).label, icon: Shield, color: getStat(selectedAsset.status).color },
                  { label: 'Emplacement', value: selectedAsset.location, icon: MapPin },
                  { label: 'Assigne a', value: selectedAsset.assignee, icon: User },
                  { label: 'Date d\'achat', value: new Date(selectedAsset.purchaseDate).toLocaleDateString('fr-FR'), icon: Calendar },
                  { label: 'Fin de garantie', value: selectedAsset.warranty !== '-' ? new Date(selectedAsset.warranty).toLocaleDateString('fr-FR') : 'N/A', icon: Shield },
                  { label: 'Categorie', value: getCat(selectedAsset.category).label, icon: Tag },
                  { label: 'Valeur', value: fmt(selectedAsset.value), icon: BarChart3 },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg">
                    <item.icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div><p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{item.label}</p><p className="text-sm font-medium text-gray-800" style={item.color ? { color: item.color } : {}}>{item.value}</p></div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setSelectedAsset(null)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Fermer</button>
                <button onClick={() => { setEditingAsset(selectedAsset); setSelectedAsset(null); }} className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90" style={{ backgroundColor: '#F36F21' }}>Modifier</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ CREATE / EDIT ASSET MODAL ============ */}
      {(showCreateModal || editingAsset) && (
        <AssetFormModal
          asset={editingAsset}
          onClose={() => { setShowCreateModal(false); setEditingAsset(null); }}
          onSave={handleSaveAsset}
        />
      )}

      {/* ============ MAINTENANCE MODAL ============ */}
      {showMaintModal && (
        <MaintenanceFormModal
          record={editingMaint}
          assets={assets}
          members={wsMembers}
          workspaces={workspaces}
          onClose={() => { setShowMaintModal(false); setEditingMaint(null); }}
          onSave={handleSaveMaint}
        />
      )}
    </div>
  );
}

function AssetFormModal({ asset, onClose, onSave }) {
  const [form, setForm] = useState({
    name: asset?.name || '', serial: asset?.serial || '', category: asset?.category || 'computers',
    status: asset?.status || 'in_stock', brand: asset?.brand || '', model: asset?.model || '',
    location: asset?.location || '', assignee: asset?.assignee || '', purchaseDate: asset?.purchaseDate || '',
    warranty: asset?.warranty || '', value: asset?.value || 0,
  });
  const upd = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F36F21]/10 flex items-center justify-center">{asset ? <Edit2 className="w-5 h-5 text-[#F36F21]" /> : <Plus className="w-5 h-5 text-[#F36F21]" />}</div>
            <h2 className="font-semibold text-[#173D68]">{asset ? 'Modifier l\'equipement' : 'Nouvel equipement'}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Nom *</label><input type="text" value={form.name} onChange={e => upd('name', e.target.value)} placeholder="Dell OptiPlex 7090" className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">N° Serie *</label><input type="text" value={form.serial} onChange={e => upd('serial', e.target.value)} placeholder="DL-2024-XXXX" className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Categorie *</label>
              <select value={form.category} onChange={e => upd('category', e.target.value)} className={inputCls}>{ASSET_CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Statut *</label>
              <select value={form.status} onChange={e => upd('status', e.target.value)} className={inputCls}>{STATUS_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Marque</label><input type="text" value={form.brand} onChange={e => upd('brand', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Modele</label><input type="text" value={form.model} onChange={e => upd('model', e.target.value)} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Emplacement</label><input type="text" value={form.location} onChange={e => upd('location', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Assigne a</label><input type="text" value={form.assignee} onChange={e => upd('assignee', e.target.value)} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Date d'achat</label><input type="date" value={form.purchaseDate} onChange={e => upd('purchaseDate', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Fin de garantie</label><input type="date" value={form.warranty} onChange={e => upd('warranty', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Valeur ({CURRENCY})</label><input type="number" value={form.value} onChange={e => upd('value', Number(e.target.value))} className={inputCls} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button>
            <button onClick={() => onSave({ ...form, id: asset?.id })} disabled={!form.name || !form.serial} className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#F36F21' }}>
              {asset ? 'Enregistrer' : 'Creer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MaintenanceFormModal({ record, assets, members = [], workspaces = [], onClose, onSave }) {
  const [form, setForm] = useState({
    assetId: record?.assetId || (assets[0]?.id || ''), assetName: record?.assetName || (assets[0]?.name || ''),
    type: record?.type || 'preventive', step: record?.step || 'attribution',
    description: record?.description || '', assignedTo: record?.assignedTo || '',
    workspaceId: record?.workspaceId || '', boardId: record?.boardId || '',
    scheduledDate: record?.scheduledDate || new Date().toISOString().split('T')[0],
    completedDate: record?.completedDate || '', cost: record?.cost || 0, notes: record?.notes || '',
    createdAt: record?.createdAt || new Date().toISOString().split('T')[0],
  });
  const [boards, setBoards] = useState([]);
  const [loadingBoards, setLoadingBoards] = useState(false);

  const upd = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleAssetChange = (assetId) => {
    const a = assets.find(x => x.id === assetId);
    setForm(prev => ({ ...prev, assetId, assetName: a?.name || '' }));
  };

  const handleWorkspaceChange = async (wsId) => {
    setForm(prev => ({ ...prev, workspaceId: wsId, boardId: '' }));
    setBoards([]);
    if (!wsId) return;
    setLoadingBoards(true);
    try {
      const res = await boardApi.getByWorkspace(wsId);
      setBoards(res.data || []);
    } catch (_) {}
    setLoadingBoards(false);
  };

  useEffect(() => {
    if (record?.workspaceId) handleWorkspaceChange(record.workspaceId);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Wrench className="w-5 h-5 text-amber-600" /></div>
            <h2 className="font-semibold text-[#173D68]">{record ? 'Modifier l\'intervention' : 'Nouvelle intervention'}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Equipement concerne *</label>
            <select value={form.assetId} onChange={e => handleAssetChange(e.target.value)} className={inputCls}>
              {assets.length === 0 && <option value="">Aucun equipement</option>}
              {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.serial})</option>)}
            </select>
          </div>

          {/* Workspace / Board selection */}
          <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <FolderKanban className="w-4 h-4 text-[#173D68]" />
              <span className="text-sm font-semibold text-[#173D68]">Lier a un espace de travail</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Espace de travail</label>
                <select value={form.workspaceId} onChange={e => handleWorkspaceChange(e.target.value)} className={inputCls}>
                  <option value="">— Aucun —</option>
                  {workspaces.map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Board</label>
                <select value={form.boardId} onChange={e => upd('boardId', e.target.value)} className={inputCls} disabled={!form.workspaceId || loadingBoards}>
                  <option value="">— Aucun —</option>
                  {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {loadingBoards && <p className="text-[10px] text-gray-400 mt-0.5">Chargement...</p>}
              </div>
            </div>
            {form.boardId && (
              <p className="text-[10px] text-blue-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Une tache sera automatiquement creee dans ce board
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Type d'intervention *</label>
              <select value={form.type} onChange={e => upd('type', e.target.value)} className={inputCls}>
                {MAINT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Etape du workflow</label>
              <select value={form.step} onChange={e => upd('step', e.target.value)} className={inputCls}>
                {WORKFLOW_STEPS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Workflow visual indicator */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Progression du workflow</p>
            <div className="flex items-center gap-1">
              {WORKFLOW_STEPS.map((s, i) => {
                const stepIdx = WORKFLOW_STEPS.findIndex(w => w.id === form.step);
                const isActive = i === stepIdx;
                const isDone = i < stepIdx;
                return (
                  <div key={s.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${isActive ? 'text-white ring-2 ring-offset-1' : isDone ? 'text-white' : 'text-gray-400 bg-gray-200'}`}
                        style={isActive ? { backgroundColor: s.color, ringColor: s.color } : isDone ? { backgroundColor: s.color } : {}}
                      >
                        {isDone ? '✓' : i + 1}
                      </div>
                      <span className={`text-[9px] mt-1 font-medium ${isActive ? 'text-gray-800' : isDone ? 'text-gray-600' : 'text-gray-400'}`}>{s.label}</span>
                    </div>
                    {i < WORKFLOW_STEPS.length - 1 && (
                      <div className={`h-0.5 w-full mx-0.5 rounded ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
            <textarea value={form.description} onChange={e => upd('description', e.target.value)} rows={3} placeholder="Decrivez l'intervention..." className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Attribuer a (utilisateur) *</label>
            {members.length > 0 ? (
              <div className="space-y-1 max-h-36 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-100">
                {members.map((m) => {
                  const uid = m.userId || m.id;
                  const name = m.fullName || `${m.firstName} ${m.lastName}`;
                  const selected = form.assignedTo === uid;
                  return (
                    <button key={uid} type="button" onClick={() => upd('assignedTo', uid)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${selected ? 'bg-[#F36F21]/10 border border-[#F36F21]/30 ring-1 ring-[#F36F21]/20' : 'bg-white border border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${selected ? 'bg-[#F36F21] text-white' : 'bg-[#173D68] text-white'}`}>
                        {m.firstName?.[0]}{m.lastName?.[0]}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className={`font-medium truncate ${selected ? 'text-[#F36F21]' : 'text-gray-800'}`}>{name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{m.email}</p>
                      </div>
                      {selected && <CheckCircle className="w-4 h-4 text-[#F36F21] flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic py-2">Aucun membre disponible</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cout ({CURRENCY})</label>
            <input type="number" value={form.cost} onChange={e => upd('cost', Number(e.target.value))} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Date prevue</label><input type="date" value={form.scheduledDate} onChange={e => upd('scheduledDate', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Date de realisation</label><input type="date" value={form.completedDate} onChange={e => upd('completedDate', e.target.value)} className={inputCls} /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => upd('notes', e.target.value)} rows={2} placeholder="Notes supplementaires..." className={`${inputCls} resize-none`} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button>
            <button onClick={() => onSave({ ...form, id: record?.id })} disabled={!form.description || !form.assetId || !form.assignedTo} className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#F36F21' }}>
              {record ? 'Enregistrer' : 'Creer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
