import { useState, useEffect, useRef } from 'react';
import {
  User, Lock, Bell, Palette, Save, Check, Moon, Sun, Monitor,
  Mail, MessageSquare, AlertTriangle, CheckCircle, Globe,
  Building2, Puzzle, Server, Monitor as MonitorIcon, Ticket,
  Wallet, BarChart3, Users, ClipboardList, Shield, Cpu, HardDrive,
  Wifi, Printer, Database, Network, Box, FileText, MapPin, Phone,
  Image, ChevronRight, ToggleLeft, ToggleRight, Info, Zap, Settings2,
  UserPlus, Search, MoreHorizontal, X, Eye, EyeOff, Key, Ban,
  UserCheck, Copy, RefreshCw, Trash2, Edit3, ShieldCheck, Crown,
  FolderOpen, LayoutDashboard, ChevronDown, Plus, Minus,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { userApi, authApi } from '../lib/api';
import toast from 'react-hot-toast';

const MODULE_LIST = [
  {
    id: 'project_management',
    name: 'Gestion de Projet',
    description: 'Boards, Kanban, Timeline, Calendrier, Gantt et suivi des taches',
    icon: ClipboardList,
    color: '#173D68',
    alwaysOn: true,
    category: 'core',
  },
  {
    id: 'it_asset_management',
    name: 'Gestion du Materiel Informatique',
    description: 'Inventaire du parc informatique, suivi des equipements, licences logicielles, maintenance et cycle de vie des actifs (similaire a GLPI)',
    icon: Cpu,
    color: '#0891b2',
    category: 'it',
    subModules: [
      { id: 'it_computers', name: 'Ordinateurs & Serveurs', icon: Server },
      { id: 'it_network', name: 'Equipements reseau', icon: Network },
      { id: 'it_peripherals', name: 'Peripheriques', icon: Printer },
      { id: 'it_software', name: 'Licences logicielles', icon: Database },
      { id: 'it_consumables', name: 'Consommables', icon: Box },
      { id: 'it_maintenance', name: 'Contrats & Maintenance', icon: FileText },
    ],
  },
  {
    id: 'tickets',
    name: 'Tickets & Support',
    description: 'Systeme de ticketing pour le support interne et la gestion des demandes',
    icon: Ticket,
    color: '#F36F21',
    category: 'support',
  },
  {
    id: 'sdsi',
    name: 'Schema Directeur SI',
    description: 'Pilotage strategique du systeme d\'information, axes, projets et KPIs',
    icon: Shield,
    color: '#7c3aed',
    category: 'strategy',
  },
  {
    id: 'budgets',
    name: 'Gestion Budgetaire',
    description: 'Suivi des budgets par projet, centre de cout et previsions financieres',
    icon: Wallet,
    color: '#059669',
    category: 'finance',
  },
  {
    id: 'reports',
    name: 'Rapports & Analytics',
    description: 'Tableaux de bord personnalises, rapports d\'avancement et metriques',
    icon: BarChart3,
    color: '#2563eb',
    category: 'analytics',
  },
  {
    id: 'team_evaluation',
    name: 'Evaluations d\'equipe',
    description: 'Evaluations de performance, competences et suivi des objectifs',
    icon: Users,
    color: '#d97706',
    category: 'hr',
  },
  {
    id: 'time_tracking',
    name: 'Suivi du Temps',
    description: 'Saisie des temps passes, feuilles de temps et rapports de charge',
    icon: Globe,
    color: '#0d9488',
    category: 'operations',
  },
];

const CATEGORY_LABELS = {
  core: 'Modules principaux',
  it: 'Infrastructure IT',
  support: 'Support',
  strategy: 'Strategie',
  finance: 'Finance',
  analytics: 'Analyses',
  hr: 'Ressources Humaines',
  operations: 'Operations',
};

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true, pushNotifications: true, mentionNotifications: true,
    taskAssigned: true, taskCompleted: true, comments: true, deadlineReminder: true, weeklyDigest: false,
  });
  const [companyData, setCompanyData] = useState({
    name: '', address: '', phone: '', email: '', website: '', siret: '', sector: '', logo: null,
  });
  const [modules, setModules] = useState({
    project_management: true, it_asset_management: false, tickets: true, sdsi: false,
    budgets: true, reports: true, team_evaluation: false, time_tracking: true,
  });
  const [expandedModule, setExpandedModule] = useState(null);

  // === User management state ===
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUserForm, setNewUserForm] = useState({ firstName: '', lastName: '', email: '', role: 'user' });
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [userModuleAccess, setUserModuleAccess] = useState({});
  const [configModalUser, setConfigModalUser] = useState(null);
  const [configTab, setConfigTab] = useState('profile');
  const [allWorkspaces, setAllWorkspaces] = useState([]);
  const [wsBoardsMap, setWsBoardsMap] = useState({});
  const [userAccess, setUserAccess] = useState({ workspaces: [], boards: [] });
  const [expandedWs, setExpandedWs] = useState({});
  const [accessLoading, setAccessLoading] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', role: 'user' });

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await userApi.adminGetAll({ search: userSearch || undefined, status: userFilter === 'all' ? undefined : userFilter });
      setAllUsers(res.data || []);
      const saved = localStorage.getItem('globalUserModuleAccess');
      if (saved) try { setUserModuleAccess(JSON.parse(saved)); } catch (_) {}
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Acces reserve aux administrateurs');
      }
    }
    setUsersLoading(false);
  };

  const openConfigModal = async (u) => {
    setConfigModalUser(u);
    setConfigTab('profile');
    setEditForm({ firstName: u.firstName, lastName: u.lastName, role: u.role });
    setAccessLoading(true);
    try {
      const [wsRes, accessRes] = await Promise.all([
        userApi.adminGetWorkspaces(),
        userApi.adminGetAccess(u.id),
      ]);
      setAllWorkspaces(wsRes.data || []);
      setUserAccess(accessRes.data || { workspaces: [], boards: [] });
    } catch (_) {}
    setAccessLoading(false);
  };

  const loadBoardsForWs = async (wsId) => {
    if (wsBoardsMap[wsId]) return;
    try {
      const res = await userApi.adminGetBoards(wsId);
      setWsBoardsMap(prev => ({ ...prev, [wsId]: res.data || [] }));
    } catch (_) {}
  };

  const isUserInWorkspace = (wsId) => userAccess.workspaces.some(w => w.workspaceId === wsId);
  const userHasBoardAccess = (boardId) => userAccess.boards.some(b => b.boardId === boardId);

  const toggleWorkspaceAccess = async (wsId) => {
    if (!configModalUser) return;
    const inWs = isUserInWorkspace(wsId);
    try {
      if (inWs) {
        await userApi.adminRemoveFromWorkspace(configModalUser.id, wsId);
        setUserAccess(prev => ({
          workspaces: prev.workspaces.filter(w => w.workspaceId !== wsId),
          boards: prev.boards.filter(b => !(wsBoardsMap[wsId] || []).some(bb => bb.id === b.boardId)),
        }));
        toast.success('Acces espace retire');
      } else {
        await userApi.adminAddToWorkspace(configModalUser.id, wsId, {});
        setUserAccess(prev => ({
          ...prev,
          workspaces: [...prev.workspaces, { workspaceId: wsId, role: 'member' }],
        }));
        toast.success('Acces espace accorde');
      }
      loadUsers();
    } catch (_) { toast.error('Erreur'); }
  };

  const toggleBoardAccess = async (boardId) => {
    if (!configModalUser) return;
    const has = userHasBoardAccess(boardId);
    try {
      if (has) {
        await userApi.adminRemoveBoardPermission(configModalUser.id, boardId);
        setUserAccess(prev => ({
          ...prev,
          boards: prev.boards.filter(b => b.boardId !== boardId),
        }));
      } else {
        await userApi.adminSetBoardPermission(configModalUser.id, boardId, { permissionLevel: 'edit' });
        setUserAccess(prev => ({
          ...prev,
          boards: [...prev.boards, { boardId, permissionLevel: 'edit' }],
        }));
      }
    } catch (_) { toast.error('Erreur'); }
  };

  const handleSaveEditForm = async () => {
    if (!configModalUser) return;
    try {
      await userApi.adminUpdate(configModalUser.id, editForm);
      setConfigModalUser(prev => ({ ...prev, ...editForm }));
      loadUsers();
      toast.success('Profil mis a jour');
    } catch (_) { toast.error('Erreur'); }
  };

  const handleCreateUser = async () => {
    if (!newUserForm.email || !newUserForm.firstName || !newUserForm.lastName) { toast.error('Veuillez remplir tous les champs'); return; }
    try {
      const res = await userApi.adminCreate(newUserForm);
      setCreatedCredentials({ email: res.data.email, tempPassword: res.data.tempPassword });
      setNewUserForm({ firstName: '', lastName: '', email: '', role: 'user' });
      loadUsers();
      toast.success('Utilisateur cree avec succes');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la creation');
    }
  };

  const handleUpdateUser = async (userId, data) => {
    try {
      await userApi.adminUpdate(userId, data);
      loadUsers();
      setEditingUser(null);
      toast.success('Utilisateur mis a jour');
    } catch (err) { toast.error('Erreur lors de la mise a jour'); }
  };

  const handleToggleActive = async (u) => {
    await handleUpdateUser(u.id, { isActive: !u.isActive });
  };

  const handleResetPassword = async (userId) => {
    try {
      const res = await userApi.adminResetPassword(userId);
      setCreatedCredentials({ email: allUsers.find(u => u.id === userId)?.email, tempPassword: res.data.tempPassword, isReset: true });
      toast.success('Mot de passe reinitialise');
    } catch (err) { toast.error('Erreur'); }
  };

  const handleToggleUserModule = (userId, moduleId) => {
    setUserModuleAccess(prev => {
      const userAccess = prev[userId] || {};
      const updated = { ...prev, [userId]: { ...userAccess, [moduleId]: !userAccess[moduleId] } };
      localStorage.setItem('globalUserModuleAccess', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('moduleAccessUpdated', { detail: updated }));
      return updated;
    });
  };

  useEffect(() => {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) try { setNotificationSettings(JSON.parse(saved)); } catch (e) {}
    const savedCompany = localStorage.getItem('companySettings');
    if (savedCompany) try { setCompanyData(JSON.parse(savedCompany)); } catch (e) {}
    const savedModules = localStorage.getItem('moduleSettings');
    if (savedModules) try { setModules(JSON.parse(savedModules)); } catch (e) {}
  }, []);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
  }, [activeTab, userSearch, userFilter]);

  const isAdmin = user?.role === 'admin';

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Securite', icon: Lock },
    ...(isAdmin ? [{ id: 'users', label: 'Utilisateurs', icon: Users }] : []),
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Apparence', icon: Palette },
    { id: 'company', label: 'Entreprise', icon: Building2 },
    { id: 'modules', label: 'Modules', icon: Puzzle },
  ];

  const handleProfileSave = async () => {
    setIsLoading(true);
    try {
      const response = await userApi.updateProfile(profileData);
      updateUser(response.data);
      toast.success('Profil mis a jour');
    } catch (error) { toast.error('Erreur lors de la mise a jour'); }
    finally { setIsLoading(false); }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (passwordData.newPassword.length < 6) { toast.error('Le mot de passe doit contenir au moins 6 caracteres'); return; }
    setIsLoading(true);
    try {
      await authApi.changePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
      toast.success('Mot de passe modifie');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) { toast.error(error.response?.data?.error || 'Erreur'); }
    finally { setIsLoading(false); }
  };

  const handleNotificationSave = () => { localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings)); toast.success('Preferences enregistrees'); };
  const handleCompanySave = () => { localStorage.setItem('companySettings', JSON.stringify(companyData)); toast.success('Parametres entreprise enregistres'); };
  const handleModulesSave = () => {
    localStorage.setItem('moduleSettings', JSON.stringify(modules));
    window.dispatchEvent(new CustomEvent('modulesUpdated', { detail: modules }));
    toast.success('Configuration des modules enregistree');
  };

  const toggleModule = (moduleId) => {
    const mod = MODULE_LIST.find(m => m.id === moduleId);
    if (mod?.alwaysOn) return;
    setModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const enabledCount = Object.values(modules).filter(Boolean).length;

  const Toggle = ({ checked, onChange, disabled }) => (
    <button
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${checked ? 'bg-[#F36F21]' : 'bg-gray-300'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
    </button>
  );

  const inputClass = "w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F36F21]/20 focus:border-[#F36F21] transition-colors";

  return (
    <div className={`mx-auto ${activeTab === 'users' ? 'max-w-6xl' : 'max-w-5xl'}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#173D68]/10 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-[#173D68]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#173D68]">Parametres</h1>
            <p className="text-sm text-gray-500">Gerez votre compte, votre entreprise et vos preferences</p>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <nav className="w-52 space-y-1 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                activeTab === tab.id
                  ? 'bg-[#F36F21]/10 text-[#F36F21] font-semibold'
                  : 'text-gray-500 hover:text-[#173D68] hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4.5 h-4.5" />
              <span>{tab.label}</span>
              {tab.id === 'modules' && (
                <span className="ml-auto text-[10px] font-bold bg-[#F36F21]/10 text-[#F36F21] px-1.5 py-0.5 rounded-full">{enabledCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ===== PROFIL ===== */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#173D68] mb-6">Informations du profil</h2>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-[#173D68] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Photo de profil</p>
                    <p className="text-sm text-gray-400 mb-2">JPG, PNG ou GIF. Max 2MB.</p>
                    <button className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Changer</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Prenom</label>
                    <input type="text" value={profileData.firstName} onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
                    <input type="text" value={profileData.lastName} onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input type="email" value={user?.email} disabled className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`} />
                </div>
                <div className="flex justify-end">
                  <button onClick={handleProfileSave} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 hover:opacity-90 transition-colors" style={{ backgroundColor: '#F36F21' }}>
                    {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" /><span>Enregistrer</span></>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== SECURITE ===== */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#173D68] mb-6">Changer le mot de passe</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe actuel</label>
                  <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
                  <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className={inputClass} />
                  <p className="text-xs text-gray-400 mt-1">Minimum 6 caracteres</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
                  <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className={inputClass} />
                </div>
                <div className="pt-2">
                  <button onClick={handlePasswordChange} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 hover:opacity-90 transition-colors" style={{ backgroundColor: '#F36F21' }}>
                    {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Lock className="w-4 h-4" /><span>Changer le mot de passe</span></>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== UTILISATEURS (Admin only) ===== */}
          {activeTab === 'users' && isAdmin && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#173D68] to-[#1E5090] rounded-xl p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5" /> Gestion des utilisateurs</h2>
                    <p className="text-sm text-white/60 mt-0.5">Creez, modifiez et gerez les acces de tous les utilisateurs</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold">{allUsers.length}</p>
                      <p className="text-xs text-white/60">utilisateurs</p>
                    </div>
                    <button onClick={() => { setShowCreateUser(true); setCreatedCredentials(null); }} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                      <UserPlus className="w-4 h-4" /> Nouveau
                    </button>
                  </div>
                </div>
              </div>

              {/* Credentials display after creation/reset */}
              {createdCredentials && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Key className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">{createdCredentials.isReset ? 'Mot de passe reinitialise' : 'Utilisateur cree'}</p>
                        <p className="text-xs text-emerald-600 mt-1">Communiquez ces identifiants a l'utilisateur. Le mot de passe devra etre change a la premiere connexion.</p>
                        <div className="mt-3 bg-white rounded-lg p-3 border border-emerald-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Email</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-medium text-gray-800">{createdCredentials.email}</span>
                              <button onClick={() => { navigator.clipboard.writeText(createdCredentials.email); toast.success('Copie'); }} className="p-1 hover:bg-gray-100 rounded"><Copy className="w-3.5 h-3.5 text-gray-400" /></button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Mot de passe temporaire</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-medium text-gray-800">{createdCredentials.tempPassword}</span>
                              <button onClick={() => { navigator.clipboard.writeText(createdCredentials.tempPassword); toast.success('Copie'); }} className="p-1 hover:bg-gray-100 rounded"><Copy className="w-3.5 h-3.5 text-gray-400" /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setCreatedCredentials(null)} className="p-1 hover:bg-emerald-100 rounded-lg"><X className="w-4 h-4 text-emerald-500" /></button>
                  </div>
                </div>
              )}

              {/* Create user form */}
              {showCreateUser && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#173D68] flex items-center gap-2"><UserPlus className="w-4 h-4" /> Creer un utilisateur</h3>
                    <button onClick={() => setShowCreateUser(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Prenom *</label>
                      <input type="text" value={newUserForm.firstName} onChange={e => setNewUserForm(p => ({ ...p, firstName: e.target.value }))} className={inputClass} placeholder="Jean" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
                      <input type="text" value={newUserForm.lastName} onChange={e => setNewUserForm(p => ({ ...p, lastName: e.target.value }))} className={inputClass} placeholder="Dupont" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                      <input type="email" value={newUserForm.email} onChange={e => setNewUserForm(p => ({ ...p, email: e.target.value }))} className={inputClass} placeholder="jean.dupont@entreprise.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                      <select value={newUserForm.role} onChange={e => setNewUserForm(p => ({ ...p, role: e.target.value }))} className={inputClass}>
                        <option value="user">Utilisateur</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                    <button onClick={() => setShowCreateUser(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button>
                    <button onClick={handleCreateUser} disabled={!newUserForm.email || !newUserForm.firstName || !newUserForm.lastName} className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors" style={{ backgroundColor: '#F36F21' }}>Creer l'utilisateur</button>
                  </div>
                </div>
              )}

              {/* Search & Filters */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Rechercher un utilisateur..." className={`${inputClass} pl-10`} />
                </div>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  {[{ id: 'all', label: 'Tous' }, { id: 'active', label: 'Actifs' }, { id: 'inactive', label: 'Inactifs' }].map(f => (
                    <button key={f.id} onClick={() => setUserFilter(f.id)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${userFilter === f.id ? 'bg-white text-[#173D68] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{f.label}</button>
                  ))}
                </div>
              </div>

              {/* Users table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                {usersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-[#F36F21] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-3 w-[30%]">Utilisateur</th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-3 w-[14%]">Role</th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-3 w-[12%]">Statut</th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-3 w-[10%]">Espaces</th>
                        <th className="text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-3 w-[16%]">Configurer</th>
                        <th className="text-right text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-3 w-[18%]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Aucun utilisateur trouve</td></tr>
                      ) : allUsers.map((u) => (
                        <tr key={u.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${!u.isActive ? 'opacity-60' : ''}`}>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${u.id === user?.id ? 'ring-2 ring-[#F36F21] ring-offset-1' : ''}`} style={{ backgroundColor: u.isActive ? '#173D68' : '#9ca3af' }}>
                                {u.firstName?.[0]}{u.lastName?.[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{u.firstName} {u.lastName}</p>
                                <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            {editingUser === u.id ? (
                              <select defaultValue={u.role} onChange={e => handleUpdateUser(u.id, { role: e.target.value })} className="text-xs px-2 py-1 border rounded-lg">
                                <option value="user">Utilisateur</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                {u.role === 'admin' ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                {u.role === 'admin' ? 'Admin' : 'Utilisateur'}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full whitespace-nowrap ${u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                              {u.isActive ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs text-gray-500 whitespace-nowrap">{u.workspaceCount}</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button onClick={() => openConfigModal(u)} className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-white rounded-lg hover:opacity-90 transition-colors whitespace-nowrap" style={{ backgroundColor: '#F36F21' }}>
                              <Shield className="w-3 h-3" /> Configurer
                            </button>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-0.5 justify-end">
                              {u.id !== user?.id && (
                                <>
                                  <button onClick={() => handleResetPassword(u.id)} title="Reinitialiser le mot de passe" className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"><Key className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => setEditingUser(editingUser === u.id ? null : u.id)} title="Modifier le role" className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleToggleActive(u)} title={u.isActive ? 'Desactiver' : 'Reactiver'} className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'hover:bg-red-50 text-gray-400 hover:text-red-600' : 'hover:bg-emerald-50 text-gray-400 hover:text-emerald-600'}`}>
                                    {u.isActive ? <Ban className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                  </button>
                                </>
                              )}
                              {u.id === user?.id && <span className="text-[10px] text-gray-400 italic px-1">Vous</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

            </div>
          )}

          {/* ===== USER CONFIG MODAL ===== */}
          {configModalUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfigModalUser(null)}>
              <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Modal header */}
                <div className="flex items-center gap-4 p-5 border-b border-gray-100 bg-gradient-to-r from-[#173D68] to-[#1E5090] text-white rounded-t-2xl">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                    {configModalUser.firstName?.[0]}{configModalUser.lastName?.[0]}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-lg">{configModalUser.firstName} {configModalUser.lastName}</h2>
                    <p className="text-sm text-white/60">{configModalUser.email}</p>
                  </div>
                  <button onClick={() => setConfigModalUser(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {/* Modal tabs */}
                <div className="flex border-b border-gray-100 px-5 bg-gray-50/50">
                  {[
                    { id: 'profile', label: 'Profil & Role', icon: User },
                    { id: 'modules', label: 'Modules', icon: Puzzle },
                    { id: 'access', label: 'Espaces & Boards', icon: FolderOpen },
                  ].map(t => (
                    <button key={t.id} onClick={() => setConfigTab(t.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${configTab === t.id ? 'border-[#F36F21] text-[#F36F21]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                      <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                  ))}
                </div>

                {/* Modal content */}
                <div className="flex-1 overflow-y-auto p-5">

                  {/* -- Profile tab -- */}
                  {configTab === 'profile' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Prenom</label>
                          <input type="text" value={editForm.firstName} onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))} className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
                          <input type="text" value={editForm.lastName} onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))} className={inputClass} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                        <input type="email" value={configModalUser.email} disabled className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                        <div className="flex gap-3">
                          {[{ id: 'user', label: 'Utilisateur', icon: User, desc: 'Acces standard' }, { id: 'admin', label: 'Administrateur', icon: Crown, desc: 'Acces complet' }].map(r => (
                            <button key={r.id} onClick={() => setEditForm(p => ({ ...p, role: r.id }))} className={`flex-1 p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${editForm.role === r.id ? 'border-[#F36F21] bg-[#F36F21]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${editForm.role === r.id ? 'bg-[#F36F21]/10' : 'bg-gray-100'}`}>
                                <r.icon className={`w-4 h-4 ${editForm.role === r.id ? 'text-[#F36F21]' : 'text-gray-400'}`} />
                              </div>
                              <div className="text-left">
                                <p className={`text-sm font-semibold ${editForm.role === r.id ? 'text-[#F36F21]' : 'text-gray-600'}`}>{r.label}</p>
                                <p className="text-[10px] text-gray-400">{r.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <button onClick={handleSaveEditForm} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors" style={{ backgroundColor: '#F36F21' }}>
                          <Save className="w-4 h-4" /> Enregistrer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* -- Modules tab -- */}
                  {configTab === 'modules' && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 mb-3">Definissez quels modules cet utilisateur peut voir et utiliser.</p>
                      {MODULE_LIST.filter(m => modules[m.id]).map(mod => {
                        const access = userModuleAccess[configModalUser.id] || {};
                        const hasAccess = mod.alwaysOn || !!access[mod.id];
                        return (
                          <div key={mod.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${hasAccess ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50/50'}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${mod.color}15` }}>
                                <mod.icon className="w-4 h-4" style={{ color: mod.color }} />
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${hasAccess ? 'text-gray-800' : 'text-gray-400'}`}>{mod.name}</p>
                                <p className="text-[10px] text-gray-400">{mod.description.substring(0, 50)}...</p>
                              </div>
                            </div>
                            <Toggle checked={hasAccess} onChange={() => handleToggleUserModule(configModalUser.id, mod.id)} disabled={mod.alwaysOn} />
                          </div>
                        );
                      })}
                      <div className="mt-3 bg-amber-50 rounded-lg p-3 flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700">Seuls les modules actifs globalement sont configures ici.</p>
                      </div>
                    </div>
                  )}

                  {/* -- Access tab (Workspaces & Boards) -- */}
                  {configTab === 'access' && (
                    <div className="space-y-3">
                      {accessLoading ? (
                        <div className="flex items-center justify-center py-10">
                          <div className="w-6 h-6 border-2 border-[#F36F21] border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-gray-400 mb-1">Attribuez les espaces de travail et les boards auxquels cet utilisateur a acces.</p>

                          {allWorkspaces.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">Aucun espace de travail</div>
                          ) : allWorkspaces.map(ws => {
                            const inWs = isUserInWorkspace(ws.id);
                            const isExp = expandedWs[ws.id];
                            const boards = wsBoardsMap[ws.id] || [];

                            return (
                              <div key={ws.id} className={`rounded-xl border transition-all ${inWs ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-white'}`}>
                                <div className="flex items-center gap-3 p-3">
                                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: ws.color || '#6366f1' }}>
                                    {ws.name?.[0]?.toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[#173D68] truncate">{ws.name}</p>
                                    <p className="text-[10px] text-gray-400">{ws.boardCount} board{ws.boardCount !== 1 ? 's' : ''} · {ws.memberCount} membre{ws.memberCount !== 1 ? 's' : ''}</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const next = !isExp;
                                      setExpandedWs(p => ({ ...p, [ws.id]: next }));
                                      if (next) loadBoardsForWs(ws.id);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                                  >
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isExp ? 'rotate-180' : ''}`} />
                                  </button>
                                  <Toggle checked={inWs} onChange={() => toggleWorkspaceAccess(ws.id)} />
                                </div>

                                {isExp && (
                                  <div className="border-t border-gray-100 px-3 pb-3">
                                    {!inWs ? (
                                      <p className="text-xs text-gray-400 py-3 text-center">Activez l'acces a l'espace pour gerer les boards</p>
                                    ) : boards.length === 0 ? (
                                      <p className="text-xs text-gray-400 py-3 text-center">Aucun board dans cet espace</p>
                                    ) : (
                                      <div className="pt-2 space-y-1">
                                        <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2 px-1">Boards accessibles</p>
                                        {boards.map(b => {
                                          const has = userHasBoardAccess(b.id);
                                          return (
                                            <div key={b.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${has ? 'bg-white border border-emerald-100' : 'bg-gray-50 border border-transparent hover:bg-gray-100'}`}>
                                              <div className="w-6 h-4 rounded-sm flex-shrink-0" style={{ backgroundColor: b.color || '#6366f1' }} />
                                              <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-medium truncate ${has ? 'text-gray-800' : 'text-gray-500'}`}>{b.name}</p>
                                                <p className="text-[10px] text-gray-400">{b.itemCount} element{b.itemCount !== 1 ? 's' : ''}</p>
                                              </div>
                                              <button
                                                onClick={() => toggleBoardAccess(b.id)}
                                                className={`p-1.5 rounded-lg transition-colors ${has ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}
                                              >
                                                {has ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          <div className="mt-3 bg-blue-50 rounded-lg p-3 flex items-start gap-2">
                            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-blue-700">L'acces a un espace permet de voir l'espace dans la barre laterale. Les permissions par board permettent un controle fin sur les donnees visibles.</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== NOTIFICATIONS ===== */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#173D68] mb-6">Preferences de notifications</h2>
              <div className="space-y-0">
                {[
                  { key: 'emailNotifications', label: 'Notifications par email', desc: 'Recevez des emails pour les mises a jour importantes', icon: Mail },
                  { key: 'pushNotifications', label: 'Notifications push', desc: 'Notifications en temps reel dans l\'application', icon: Bell },
                  { key: 'mentionNotifications', label: 'Mentions', desc: 'Quand quelqu\'un vous mentionne dans un commentaire', icon: MessageSquare },
                  { key: 'taskAssigned', label: 'Taches assignees', desc: 'Quand une tache vous est assignee', icon: User },
                  { key: 'taskCompleted', label: 'Taches terminees', desc: 'Quand une tache que vous suivez est terminee', icon: CheckCircle },
                  { key: 'deadlineReminder', label: 'Rappels d\'echeance', desc: 'Rappels pour les taches dont l\'echeance approche', icon: AlertTriangle },
                  { key: 'weeklyDigest', label: 'Resume hebdomadaire', desc: 'Recevez un resume de votre activite chaque semaine', icon: Globe },
                ].map(({ key, label, desc, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{label}</p>
                        <p className="text-xs text-gray-400">{desc}</p>
                      </div>
                    </div>
                    <Toggle checked={notificationSettings[key]} onChange={(v) => setNotificationSettings({ ...notificationSettings, [key]: v })} />
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={handleNotificationSave} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors" style={{ backgroundColor: '#F36F21' }}>
                  <Save className="w-4 h-4" /><span>Enregistrer</span>
                </button>
              </div>
            </div>
          )}

          {/* ===== APPARENCE ===== */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#173D68] mb-5">Theme</h2>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'light', label: 'Clair', icon: Sun },
                    { id: 'dark', label: 'Sombre', icon: Moon },
                    { id: 'system', label: 'Systeme', icon: Monitor },
                  ].map((theme) => (
                    <button key={theme.id} className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${theme.id === 'light' ? 'border-[#F36F21] bg-[#F36F21]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <theme.icon className={`w-6 h-6 ${theme.id === 'light' ? 'text-[#F36F21]' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${theme.id === 'light' ? 'text-[#F36F21]' : 'text-gray-500'}`}>{theme.label}</span>
                      {theme.id === 'light' && <Check className="w-4 h-4 text-[#F36F21]" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#173D68] mb-5">Couleur d'accent</h2>
                <div className="flex flex-wrap gap-3">
                  {[
                    { name: 'Orange Infratex', value: '#F36F21' },
                    { name: 'Navy', value: '#173D68' },
                    { name: 'Violet', value: '#8b5cf6' },
                    { name: 'Rose', value: '#ec4899' },
                    { name: 'Cyan', value: '#06b6d4' },
                    { name: 'Emeraude', value: '#10b981' },
                    { name: 'Ambre', value: '#f59e0b' },
                  ].map((color) => (
                    <button key={color.value} className={`w-10 h-10 rounded-xl transition-all relative ${color.value === '#F36F21' ? 'ring-2 ring-[#F36F21] ring-offset-2' : 'hover:scale-110'}`} style={{ backgroundColor: color.value }} title={color.name}>
                      {color.value === '#F36F21' && <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== ENTREPRISE ===== */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-lg bg-[#173D68]/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#173D68]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#173D68]">Parametrage de l'entreprise</h2>
                    <p className="text-xs text-gray-400">Informations generales de votre organisation</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Logo */}
                  <div className="flex items-center gap-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-16 h-16 rounded-xl bg-white border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                      <Image className="w-6 h-6 text-gray-300" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">Logo de l'entreprise</p>
                      <p className="text-xs text-gray-400 mb-2">PNG, SVG ou JPG. Recommande : 200x200px</p>
                      <button className="px-3 py-1.5 text-xs font-medium text-white rounded-lg hover:opacity-90 transition-colors" style={{ backgroundColor: '#F36F21' }}>Telecharger</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de l'entreprise *</label>
                      <input type="text" value={companyData.name} onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })} placeholder="Infratex SARL" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Secteur d'activite</label>
                      <select value={companyData.sector} onChange={(e) => setCompanyData({ ...companyData, sector: e.target.value })} className={inputClass}>
                        <option value="">Selectionner...</option>
                        <option value="it">Technologies de l'information</option>
                        <option value="construction">Construction / BTP</option>
                        <option value="consulting">Conseil</option>
                        <option value="finance">Finance / Banque</option>
                        <option value="industry">Industrie</option>
                        <option value="health">Sante</option>
                        <option value="education">Education</option>
                        <option value="public">Secteur public</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse</label>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <input type="text" value={companyData.address} onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })} placeholder="123 Rue Principale, Ville, Pays" className={inputClass} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Telephone</label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input type="tel" value={companyData.phone} onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })} placeholder="+33 1 23 45 67 89" className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email de contact</label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input type="email" value={companyData.email} onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })} placeholder="contact@entreprise.com" className={inputClass} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Site web</label>
                      <input type="url" value={companyData.website} onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })} placeholder="https://www.entreprise.com" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">SIRET / Identifiant fiscal</label>
                      <input type="text" value={companyData.siret} onChange={(e) => setCompanyData({ ...companyData, siret: e.target.value })} placeholder="123 456 789 00010" className={inputClass} />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button onClick={handleCompanySave} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors" style={{ backgroundColor: '#F36F21' }}>
                      <Save className="w-4 h-4" /><span>Enregistrer</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== MODULES ===== */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
              {/* Summary bar */}
              <div className="bg-gradient-to-r from-[#173D68] to-[#1E5090] rounded-xl p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Puzzle className="w-5 h-5" />
                      Gestion des Modules
                    </h2>
                    <p className="text-sm text-white/60 mt-0.5">Activez ou desactivez les fonctionnalites de votre plateforme</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold">{enabledCount}</p>
                      <p className="text-xs text-white/60">modules actifs</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-[#F36F21]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Configuration des modules</p>
                  <p className="text-xs text-amber-600 mt-0.5">Les modules desactives ne seront plus visibles dans la navigation. Les donnees existantes sont conservees.</p>
                </div>
              </div>

              {/* Module cards */}
              <div className="space-y-3">
                {MODULE_LIST.map((mod) => {
                  const isEnabled = modules[mod.id] ?? false;
                  const isExpanded = expandedModule === mod.id;
                  const hasSubModules = mod.subModules && mod.subModules.length > 0;

                  return (
                    <div key={mod.id} className={`bg-white rounded-xl border transition-all ${isEnabled ? 'border-gray-200 shadow-sm' : 'border-gray-100'}`}>
                      <div className="flex items-center gap-4 p-4">
                        {/* Icon */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isEnabled ? '' : 'opacity-40'}`} style={{ backgroundColor: `${mod.color}15` }}>
                          <mod.icon className="w-5 h-5" style={{ color: mod.color }} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold text-sm ${isEnabled ? 'text-[#173D68]' : 'text-gray-400'}`}>{mod.name}</h3>
                            {mod.alwaysOn && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#173D68]/10 text-[#173D68] rounded">requis</span>
                            )}
                            {mod.id === 'it_asset_management' && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-700 rounded">nouveau</span>
                            )}
                            <span className="px-1.5 py-0.5 text-[9px] font-medium bg-gray-100 text-gray-400 rounded">{CATEGORY_LABELS[mod.category]}</span>
                          </div>
                          <p className={`text-xs mt-0.5 ${isEnabled ? 'text-gray-500' : 'text-gray-400'}`}>{mod.description}</p>
                        </div>

                        {/* Expand button (if submodules) */}
                        {hasSubModules && isEnabled && (
                          <button onClick={() => setExpandedModule(isExpanded ? null : mod.id)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        )}

                        {/* Toggle */}
                        <Toggle checked={isEnabled} onChange={() => toggleModule(mod.id)} disabled={mod.alwaysOn} />
                      </div>

                      {/* Sub-modules */}
                      {hasSubModules && isEnabled && isExpanded && (
                        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Sous-modules inclus</p>
                          <div className="grid grid-cols-2 gap-2">
                            {mod.subModules.map((sub) => (
                              <div key={sub.id} className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-gray-100">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${mod.color}10` }}>
                                  <sub.icon className="w-3.5 h-3.5" style={{ color: mod.color }} />
                                </div>
                                <span className="text-xs font-medium text-gray-700">{sub.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <button onClick={handleModulesSave} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors" style={{ backgroundColor: '#F36F21' }}>
                  <Save className="w-4 h-4" /><span>Sauvegarder la configuration</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
