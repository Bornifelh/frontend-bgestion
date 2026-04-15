import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Shield, Users, UserPlus, Settings, ChevronRight, Plus, X,
  Check, Search, Edit2, Trash2, Lock, Unlock, History,
  FolderKanban, LayoutGrid, MoreHorizontal, Mail, RefreshCw,
  Crown, ShieldCheck, Eye, Clock, Activity, Cpu,
} from 'lucide-react';
import { permissionApi, memberApi } from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const PERMISSION_LEVELS = [
  { id: 'view', label: 'Lecture', color: '#6b7280', description: 'Peut voir' },
  { id: 'edit', label: 'Edition', color: '#3b82f6', description: 'Peut modifier' },
  { id: 'admin', label: 'Admin', color: '#8b5cf6', description: 'Controle total' },
];

const TABS = [
  { id: 'members', label: 'Membres', icon: Users },
  { id: 'roles', label: 'Roles', icon: Shield },
  { id: 'groups', label: 'Groupes', icon: Users },
  { id: 'audit', label: 'Audit', icon: History },
];

const roleLabels = { owner: 'Proprietaire', admin: 'Administrateur', member: 'Membre', viewer: 'Observateur' };
const roleIcons = { owner: Crown, admin: ShieldCheck, member: Shield, viewer: Eye };

export default function PermissionsSettings() {
  const { workspaceId } = useParams();
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [roleDropdown, setRoleDropdown] = useState(null);
  const [moduleAccess, setModuleAccess] = useState({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`itAccess_${workspaceId}`);
      if (saved) setModuleAccess(JSON.parse(saved));
    } catch (_) {}
  }, [workspaceId]);

  const toggleModuleAccess = (memberId, module) => {
    setModuleAccess(prev => {
      const next = { ...prev };
      if (!next[module]) next[module] = {};
      next[module][memberId] = !next[module][memberId];
      localStorage.setItem(`itAccess_${workspaceId}`, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('moduleAccessUpdated', { detail: { workspaceId, access: next } }));
      return next;
    });
  };

  const hasMemberModuleAccess = (memberId, module) => {
    return !!moduleAccess?.[module]?.[memberId];
  };

  useEffect(() => { loadData(); }, [workspaceId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersRes, invitationsRes, rolesRes, groupsRes, permsRes] = await Promise.all([
        memberApi.getByWorkspace(workspaceId),
        memberApi.getInvitations(workspaceId).catch(() => ({ data: [] })),
        permissionApi.getRoles(workspaceId),
        permissionApi.getGroups(workspaceId),
        permissionApi.getPermissions(),
      ]);
      setMembers(membersRes.data);
      setInvitations(invitationsRes.data || []);
      setRoles(rolesRes.data);
      setGroups(groupsRes.data);
      setPermissions(permsRes.data.byCategory || {});
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const { data } = await permissionApi.getAuditLogs(workspaceId, { limit: 100 });
      setAuditLogs(data);
    } catch (error) {
      console.error('Audit load error:', error);
    }
  };

  useEffect(() => { if (activeTab === 'audit') loadAuditLogs(); }, [activeTab]);

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await memberApi.updateRole(workspaceId, memberId, { role: newRole });
      toast.success('Role mis a jour');
      setRoleDropdown(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Etes-vous sur de vouloir retirer ce membre ?')) return;
    try {
      await memberApi.remove(workspaceId, memberId);
      toast.success('Membre retire');
      setActiveMenu(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      await memberApi.cancelInvitation(invitationId);
      toast.success('Invitation annulee');
      loadData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      await memberApi.resendInvitation(invitationId);
      toast.success('Invitation renvoyee');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const filteredMembers = members.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.email?.toLowerCase().includes(q) || m.fullName?.toLowerCase().includes(q);
  });

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
      <div>
        <h1 className="text-xl font-bold text-[#173D68] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#173D68]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#173D68]" />
          </div>
          Gestion des Permissions
        </h1>
        <p className="text-sm text-gray-500 mt-1 ml-12">Gerez les acces, les membres et les roles des utilisateurs</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white shadow-sm text-[#173D68]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.id === 'members' && <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-[#F36F21]/10 text-[#F36F21] font-bold">{members.length}</span>}
          </button>
        ))}
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Rechercher un membre..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-[#F36F21]/20 focus:border-[#F36F21] outline-none transition-colors" />
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: '#F36F21' }}
            >
              <UserPlus className="w-4 h-4" />
              Inviter un membre
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role workspace</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Roles personnalises</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    <div className="flex items-center justify-center gap-1"><Cpu className="w-3 h-3" />Parc Info</div>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Activite</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#173D68] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{member.fullName}</p>
                          <p className="text-sm text-gray-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => member.role !== 'owner' && setRoleDropdown(roleDropdown === member.id ? null : member.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            member.role === 'owner' ? 'bg-[#F36F21]/10 text-[#F36F21]' :
                            member.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                            member.role === 'viewer' ? 'bg-gray-100 text-gray-500' :
                            'bg-blue-50 text-blue-600'
                          } ${member.role !== 'owner' ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                        >
                          {React.createElement(roleIcons[member.role] || Shield, { className: 'w-3 h-3' })}
                          {roleLabels[member.role] || member.role}
                        </button>
                        {roleDropdown === member.id && (
                          <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1 min-w-[180px]">
                            {['admin', 'member', 'viewer'].map((role) => (
                              <button
                                key={role}
                                onClick={() => handleUpdateRole(member.id, role)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${member.role === role ? 'bg-[#F36F21]/5 text-[#F36F21]' : 'text-gray-700'}`}
                              >
                                {React.createElement(roleIcons[role], { className: 'w-4 h-4' })}
                                {roleLabels[role]}
                                {member.role === role && <Check className="w-3.5 h-3.5 ml-auto" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {member.customRoles?.map(role => (
                          <span key={role.id} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${role.color}15`, color: role.color }}>
                            {role.name}
                          </span>
                        )) || <span className="text-gray-400 text-sm">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleModuleAccess(member.userId || member.id, 'it_asset_management')}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          hasMemberModuleAccess(member.userId || member.id, 'it_asset_management') ? 'bg-[#F36F21]' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform ${
                          hasMemberModuleAccess(member.userId || member.id, 'it_asset_management') ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          <span>{member.stats?.itemsCreated || 0} items</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{member.lastLogin ? formatDistanceToNow(new Date(member.lastLogin), { addSuffix: true, locale: fr }) : 'Jamais connecte'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setSelectedItem(member); setShowUserModal(true); }}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#173D68] transition-colors"
                          title="Gerer les permissions"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        {member.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="Retirer du workspace"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredMembers.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-12">Aucun membre trouve</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pending invitations */}
          {invitations.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-amber-800">Invitations en attente ({invitations.length})</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{invitation.email}</p>
                        <p className="text-xs text-gray-400">
                          Expire {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        invitation.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                        invitation.role === 'viewer' ? 'bg-gray-100 text-gray-500' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {roleLabels[invitation.role] || invitation.role}
                      </span>
                      <button onClick={() => handleResendInvitation(invitation.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#173D68] transition-colors" title="Renvoyer">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleCancelInvitation(invitation.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Annuler">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setSelectedItem(null); setShowRoleModal(true); }} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors" style={{ backgroundColor: '#F36F21' }}>
              <Plus className="w-4 h-4" /> Nouveau role
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div key={role.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-[#F36F21]/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${role.color}15` }}>
                      <Shield className="w-5 h-5" style={{ color: role.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#173D68]">{role.name}</h3>
                      <p className="text-sm text-gray-400">{role.userCount} utilisateur(s)</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setSelectedItem(role); setShowRoleModal(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={async () => { if (confirm('Supprimer ce role ?')) { await permissionApi.deleteRole(role.id); loadData(); toast.success('Role supprime'); } }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {role.description && <p className="text-sm text-gray-500 mb-3">{role.description}</p>}
                <div className="flex flex-wrap gap-1">
                  {role.permissions?.slice(0, 5).map(perm => (
                    <span key={perm} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{perm}</span>
                  ))}
                  {role.permissions?.length > 5 && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">+{role.permissions.length - 5}</span>
                  )}
                </div>
              </div>
            ))}
            {roles.length === 0 && (
              <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun role personnalise</p>
                <p className="text-sm text-gray-400 mt-1">Creez des roles pour gerer finement les permissions</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setSelectedItem(null); setShowGroupModal(true); }} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors" style={{ backgroundColor: '#F36F21' }}>
              <Plus className="w-4 h-4" /> Nouveau groupe
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <div key={group.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-[#F36F21]/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${group.color}15` }}>
                      <Users className="w-5 h-5" style={{ color: group.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#173D68]">{group.name}</h3>
                      <p className="text-sm text-gray-400">{group.memberCount} membre(s)</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setSelectedItem(group); setShowGroupModal(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={async () => { if (confirm('Supprimer ce groupe ?')) { await permissionApi.deleteGroup(group.id); loadData(); toast.success('Groupe supprime'); } }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {group.description && <p className="text-sm text-gray-500 mb-3">{group.description}</p>}
                <div className="flex -space-x-2">
                  {group.members?.slice(0, 5).map((m) => (
                    <div key={m.id} className="w-7 h-7 rounded-full bg-[#173D68] flex items-center justify-center text-white text-[9px] font-semibold ring-2 ring-white" title={`${m.firstName} ${m.lastName}`}>
                      {m.firstName?.[0]}{m.lastName?.[0]}
                    </div>
                  ))}
                  {group.memberCount > 5 && (
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-[9px] font-semibold ring-2 ring-white">+{group.memberCount - 5}</div>
                  )}
                </div>
              </div>
            ))}
            {groups.length === 0 && (
              <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun groupe</p>
                <p className="text-sm text-gray-400 mt-1">Creez des groupes pour gerer les acces en masse</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-[#173D68]">Journal d'audit des permissions</h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {auditLogs.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mt-0.5">
                        <History className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-gray-800">
                          <span className="font-medium text-[#173D68]">{log.performer?.name || 'Systeme'}</span>
                          {' '}{getActionLabel(log.action)}{' '}
                          {log.target && <span className="font-medium text-[#173D68]">{log.target.name}</span>}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(log.createdAt).toLocaleString('fr-FR')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400">Aucune activite enregistree</div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showRoleModal && (
        <RoleModal workspaceId={workspaceId} role={selectedItem} permissions={permissions} onClose={() => { setShowRoleModal(false); setSelectedItem(null); }} onSave={() => { loadData(); setShowRoleModal(false); setSelectedItem(null); }} />
      )}
      {showGroupModal && (
        <GroupModal workspaceId={workspaceId} group={selectedItem} members={members} onClose={() => { setShowGroupModal(false); setSelectedItem(null); }} onSave={() => { loadData(); setShowGroupModal(false); setSelectedItem(null); }} />
      )}
      {showUserModal && selectedItem && (
        <UserPermissionsModal workspaceId={workspaceId} user={selectedItem} roles={roles} moduleAccess={moduleAccess} onToggleModuleAccess={toggleModuleAccess} onClose={() => { setShowUserModal(false); setSelectedItem(null); }} onSave={() => { loadData(); setShowUserModal(false); setSelectedItem(null); }} />
      )}
      {showInviteModal && (
        <InviteMemberModal workspaceId={workspaceId} onClose={() => setShowInviteModal(false)} onSuccess={() => { loadData(); }} />
      )}

      {/* Click-away handler for dropdowns */}
      {(roleDropdown || activeMenu) && (
        <div className="fixed inset-0 z-10" onClick={() => { setRoleDropdown(null); setActiveMenu(null); }} />
      )}
    </div>
  );
}

function getActionLabel(action) {
  const labels = {
    role_created: 'a cree le role', role_updated: 'a modifie le role', role_deleted: 'a supprime le role',
    role_assigned: 'a assigne un role a', role_removed: 'a retire un role de',
    permission_granted: 'a accorde une permission a', permission_revoked: 'a revoque une permission de',
  };
  return labels[action] || action;
}

function InviteMemberModal({ workspaceId, onClose, onSuccess }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isLoading, setIsLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  const resetForm = () => { setFirstName(''); setLastName(''); setEmail(''); setRole('member'); setCreatedUser(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !firstName.trim() || !lastName.trim()) return;
    setIsLoading(true);
    try {
      const response = await memberApi.invite(workspaceId, { email, role, firstName, lastName });
      onSuccess();
      if (response.data.tempPassword) {
        setCreatedUser({ email, firstName, lastName, tempPassword: response.data.tempPassword, role });
        toast.success('Compte utilisateur cree avec succes');
      } else {
        toast.success('Membre ajoute au workspace');
        handleClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Erreur lors de l'envoi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => { resetForm(); onClose(); };

  const copyCredentials = () => {
    if (createdUser) {
      navigator.clipboard.writeText(`Email: ${createdUser.email}\nMot de passe temporaire: ${createdUser.tempPassword}`);
      toast.success('Identifiants copies');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F36F21]/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[#F36F21]" />
            </div>
            <h2 className="text-lg font-semibold text-[#173D68]">{createdUser ? 'Compte cree' : 'Ajouter un membre'}</h2>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        {createdUser ? (
          <div className="p-5 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-700 text-sm font-medium mb-1">Compte cree avec succes</p>
              <p className="text-gray-600 text-sm">L'utilisateur devra changer son mot de passe a la premiere connexion.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nom complet</label>
                <p className="text-gray-800 font-medium">{createdUser.firstName} {createdUser.lastName}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <p className="text-gray-800 font-mono bg-gray-50 px-3 py-2 rounded-lg text-sm">{createdUser.email}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Mot de passe temporaire</label>
                <p className="text-[#F36F21] font-mono bg-gray-50 px-3 py-2 rounded-lg text-lg tracking-wider">{createdUser.tempPassword}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  createdUser.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                  createdUser.role === 'viewer' ? 'bg-gray-100 text-gray-500' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  {React.createElement(roleIcons[createdUser.role] || Shield, { className: 'w-3 h-3' })}
                  {roleLabels[createdUser.role]}
                </span>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-amber-700 text-sm">Communiquez ces identifiants de maniere securisee. Le mot de passe ne sera plus affiche.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={copyCredentials} className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Copier</button>
              <button onClick={handleClose} className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#F36F21' }}>Fermer</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prenom *</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jean" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#F36F21]/20 focus:border-[#F36F21] outline-none" required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom *</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dupont" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#F36F21]/20 focus:border-[#F36F21] outline-none" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jean.dupont@exemple.com" className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#F36F21]/20 focus:border-[#F36F21] outline-none" required />
              <p className="text-xs text-gray-400 mt-1">Un mot de passe temporaire sera genere automatiquement</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
              <div className="grid grid-cols-3 gap-2">
                {['admin', 'member', 'viewer'].map((r) => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                      role === r ? 'border-[#F36F21] bg-[#F36F21]/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {React.createElement(roleIcons[r], { className: `w-5 h-5 ${role === r ? 'text-[#F36F21]' : 'text-gray-400'}` })}
                    <span className={`text-xs font-medium ${role === r ? 'text-[#F36F21]' : 'text-gray-500'}`}>{roleLabels[r]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={handleClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button>
              <button type="submit" disabled={isLoading || !email.trim() || !firstName.trim() || !lastName.trim()} className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#F36F21' }}>
                {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'Creer le compte'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function RoleModal({ workspaceId, role, permissions, onClose, onSave }) {
  const [form, setForm] = useState({
    name: role?.name || '', description: role?.description || '',
    color: role?.color || '#F36F21', permissions: role?.permissions || [],
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (role) { await permissionApi.updateRole(role.id, form); toast.success('Role mis a jour'); }
      else { await permissionApi.createRole({ ...form, workspaceId }); toast.success('Role cree'); }
      onSave();
    } catch (error) { toast.error('Erreur'); } finally { setSaving(false); }
  };

  const togglePermission = (code) => {
    setForm(prev => ({ ...prev, permissions: prev.permissions.includes(code) ? prev.permissions.filter(p => p !== code) : [...prev.permissions, code] }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-[#173D68]">{role ? 'Modifier le role' : 'Nouveau role'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#F36F21]/20 focus:border-[#F36F21] outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur</label>
              <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-full h-10 rounded-lg cursor-pointer border border-gray-200" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#F36F21]/20 focus:border-[#F36F21] outline-none h-20 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
            <div className="space-y-4">
              {Object.entries(permissions).map(([category, perms]) => (
                <div key={category} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <h4 className="font-medium text-[#173D68] mb-3 capitalize">{category}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map(perm => (
                      <label key={perm.code} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors">
                        <input type="checkbox" checked={form.permissions.includes(perm.code)} onChange={() => togglePermission(perm.code)} className="w-4 h-4 rounded border-gray-300 text-[#F36F21] focus:ring-[#F36F21]" />
                        <span className="text-sm text-gray-700">{perm.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button>
            <button type="submit" disabled={saving || !form.name} className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#F36F21' }}>
              {saving ? 'Enregistrement...' : role ? 'Mettre a jour' : 'Creer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GroupModal({ workspaceId, group, members, onClose, onSave }) {
  const [form, setForm] = useState({
    name: group?.name || '', description: group?.description || '',
    color: group?.color || '#173D68', memberIds: group?.members?.map(m => m.id) || [],
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (group) { await permissionApi.updateGroup(group.id, form); toast.success('Groupe mis a jour'); }
      else { await permissionApi.createGroup({ ...form, workspaceId }); toast.success('Groupe cree'); }
      onSave();
    } catch (error) { toast.error('Erreur'); } finally { setSaving(false); }
  };

  const toggleMember = (memberId) => {
    setForm(prev => ({ ...prev, memberIds: prev.memberIds.includes(memberId) ? prev.memberIds.filter(id => id !== memberId) : [...prev.memberIds, memberId] }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-[#173D68]">{group ? 'Modifier le groupe' : 'Nouveau groupe'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#F36F21]/20 focus:border-[#F36F21] outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur</label>
              <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-full h-10 rounded-lg cursor-pointer border border-gray-200" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#F36F21]/20 focus:border-[#F36F21] outline-none h-20 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Membres</label>
            <div className="max-h-48 overflow-y-auto space-y-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
              {members.map((member, index) => (
                <label key={member.id || `member-${index}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors">
                  <input type="checkbox" checked={member.id ? form.memberIds.includes(member.id) : false} onChange={() => member.id && toggleMember(member.id)} className="w-4 h-4 rounded border-gray-300 text-[#F36F21] focus:ring-[#F36F21]" />
                  <div className="w-6 h-6 rounded-full bg-[#173D68] flex items-center justify-center text-white text-[9px] font-semibold">{member.firstName?.[0]}{member.lastName?.[0]}</div>
                  <span className="text-sm text-gray-700">{member.fullName}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Annuler</button>
            <button type="submit" disabled={saving || !form.name} className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#F36F21' }}>
              {saving ? 'Enregistrement...' : group ? 'Mettre a jour' : 'Creer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserPermissionsModal({ workspaceId, user, roles, moduleAccess = {}, onToggleModuleAccess, onClose, onSave }) {
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user?.id && workspaceId) loadUserPermissions(); }, [user, workspaceId]);

  const loadUserPermissions = async () => {
    if (!user?.id || !workspaceId) return;
    try {
      const { data } = await permissionApi.getUserPermissions(user.id, workspaceId);
      setUserRoles(data.roles?.map(r => r.id) || []);
    } catch (error) { console.error('Load error:', error); } finally { setLoading(false); }
  };

  const toggleRole = async (roleId) => {
    if (!user?.id) return;
    try {
      if (userRoles.includes(roleId)) {
        await permissionApi.removeRole(user.id, roleId, workspaceId);
        setUserRoles(prev => prev.filter(id => id !== roleId));
        toast.success('Role retire');
      } else {
        await permissionApi.assignRole(user.id, { workspaceId, roleId });
        setUserRoles(prev => [...prev, roleId]);
        toast.success('Role assigne');
      }
    } catch (error) { toast.error('Erreur'); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#173D68] flex items-center justify-center text-white text-xs font-semibold">{user.firstName?.[0]}{user.lastName?.[0]}</div>
            <div>
              <h2 className="font-semibold text-[#173D68]">{user.fullName}</h2>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Role workspace</h3>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              user.role === 'owner' ? 'bg-[#F36F21]/10 text-[#F36F21]' :
              user.role === 'admin' ? 'bg-purple-50 text-purple-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              {roleLabels[user.role] || user.role}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Roles personnalises</h3>
            {loading ? (
              <div className="flex justify-center p-4"><div className="w-6 h-6 border-2 border-[#F36F21] border-t-transparent rounded-full animate-spin" /></div>
            ) : roles.length > 0 ? (
              <div className="space-y-2">
                {roles.map(role => (
                  <label key={role.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer border border-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                      <span className="text-gray-800">{role.name}</span>
                    </div>
                    <input type="checkbox" checked={userRoles.includes(role.id)} onChange={() => toggleRole(role.id)} className="w-5 h-5 rounded border-gray-300 text-[#F36F21] focus:ring-[#F36F21]" />
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Aucun role personnalise disponible</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Acces aux modules</h3>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer border border-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-800">Parc Informatique</span>
                    <p className="text-[10px] text-gray-400">Inventaire, maintenance, reparations</p>
                  </div>
                </div>
                <button
                  onClick={() => onToggleModuleAccess?.(user.userId || user.id, 'it_asset_management')}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    moduleAccess?.it_asset_management?.[user.userId || user.id] ? 'bg-[#F36F21]' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform ${
                    moduleAccess?.it_asset_management?.[user.userId || user.id] ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
            </div>
          </div>
          <button onClick={onClose} className="w-full px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#F36F21' }}>Termine</button>
        </div>
      </div>
    </div>
  );
}
