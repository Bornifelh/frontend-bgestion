import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Users,
  UserPlus,
  Settings,
  ChevronRight,
  Plus,
  X,
  Check,
  Search,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  History,
  FolderKanban,
  LayoutGrid,
} from 'lucide-react';
import { permissionApi, memberApi } from '../../lib/api';
import toast from 'react-hot-toast';

const PERMISSION_LEVELS = [
  { id: 'view', label: 'Lecture', color: '#6b7280', description: 'Peut voir' },
  { id: 'edit', label: 'Édition', color: '#3b82f6', description: 'Peut modifier' },
  { id: 'admin', label: 'Admin', color: '#8b5cf6', description: 'Contrôle total' },
];

const TABS = [
  { id: 'members', label: 'Membres', icon: Users },
  { id: 'roles', label: 'Rôles', icon: Shield },
  { id: 'groups', label: 'Groupes', icon: Users },
  { id: 'audit', label: 'Audit', icon: History },
];

export default function PermissionsSettings() {
  const { workspaceId } = useParams();
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersRes, rolesRes, groupsRes, permsRes] = await Promise.all([
        memberApi.getByWorkspace(workspaceId),
        permissionApi.getRoles(workspaceId),
        permissionApi.getGroups(workspaceId),
        permissionApi.getPermissions(),
      ]);
      
      setMembers(membersRes.data);
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

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const filteredMembers = members.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.email?.toLowerCase().includes(q) || 
           m.fullName?.toLowerCase().includes(q);
  });

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
      <div>
        <h1 className="text-2xl font-display font-bold text-surface-100">
          Gestion des Permissions
        </h1>
        <p className="text-surface-400 mt-1">
          Gérez les accès et les rôles des utilisateurs de votre espace de travail
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-800 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
              <input
                type="text"
                placeholder="Rechercher un membre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-700">
                  <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Utilisateur</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Rôle workspace</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-surface-400">Rôles personnalisés</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-surface-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="border-b border-surface-800 last:border-0 hover:bg-surface-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-surface-200">{member.fullName}</p>
                          <p className="text-sm text-surface-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.role === 'owner' ? 'bg-amber-500/20 text-amber-400' :
                        member.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-surface-700 text-surface-300'
                      }`}>
                        {member.role === 'owner' ? 'Propriétaire' :
                         member.role === 'admin' ? 'Administrateur' : 'Membre'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {member.customRoles?.map(role => (
                          <span
                            key={role.id}
                            className="px-2 py-0.5 rounded-full text-xs"
                            style={{ backgroundColor: `${role.color}20`, color: role.color }}
                          >
                            {role.name}
                          </span>
                        )) || <span className="text-surface-500 text-sm">Aucun</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedItem(member);
                          setShowUserModal(true);
                        }}
                        className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-surface-200"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSelectedItem(null);
                setShowRoleModal(true);
              }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Nouveau rôle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${role.color}20` }}
                    >
                      <Shield className="w-5 h-5" style={{ color: role.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-100">{role.name}</h3>
                      <p className="text-sm text-surface-500">{role.userCount} utilisateur(s)</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setSelectedItem(role);
                        setShowRoleModal(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Supprimer ce rôle ?')) {
                          await permissionApi.deleteRole(role.id);
                          loadData();
                          toast.success('Rôle supprimé');
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-surface-700 text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {role.description && (
                  <p className="text-sm text-surface-400 mb-3">{role.description}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {role.permissions?.slice(0, 5).map(perm => (
                    <span key={perm} className="text-xs px-2 py-0.5 bg-surface-700 text-surface-300 rounded-full">
                      {perm}
                    </span>
                  ))}
                  {role.permissions?.length > 5 && (
                    <span className="text-xs px-2 py-0.5 bg-surface-700 text-surface-400 rounded-full">
                      +{role.permissions.length - 5}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}

            {roles.length === 0 && (
              <div className="col-span-full card p-12 text-center">
                <Shield className="w-12 h-12 text-surface-600 mx-auto mb-4" />
                <p className="text-surface-400">Aucun rôle personnalisé</p>
                <p className="text-sm text-surface-500 mt-1">
                  Créez des rôles pour gérer finement les permissions
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSelectedItem(null);
                setShowGroupModal(true);
              }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Nouveau groupe
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${group.color}20` }}
                    >
                      <Users className="w-5 h-5" style={{ color: group.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-100">{group.name}</h3>
                      <p className="text-sm text-surface-500">{group.memberCount} membre(s)</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setSelectedItem(group);
                        setShowGroupModal(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Supprimer ce groupe ?')) {
                          await permissionApi.deleteGroup(group.id);
                          loadData();
                          toast.success('Groupe supprimé');
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-surface-700 text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {group.description && (
                  <p className="text-sm text-surface-400 mb-3">{group.description}</p>
                )}
                <div className="flex -space-x-2">
                  {group.members?.slice(0, 5).map((m, i) => (
                    <div
                      key={m.id}
                      className="avatar avatar-sm ring-2 ring-surface-900"
                      title={`${m.firstName} ${m.lastName}`}
                    >
                      {m.firstName?.[0]}{m.lastName?.[0]}
                    </div>
                  ))}
                  {group.memberCount > 5 && (
                    <div className="avatar avatar-sm ring-2 ring-surface-900 bg-surface-700 text-surface-400">
                      +{group.memberCount - 5}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {groups.length === 0 && (
              <div className="col-span-full card p-12 text-center">
                <Users className="w-12 h-12 text-surface-600 mx-auto mb-4" />
                <p className="text-surface-400">Aucun groupe</p>
                <p className="text-sm text-surface-500 mt-1">
                  Créez des groupes pour gérer les accès en masse
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-surface-700">
            <h3 className="font-semibold text-surface-200">Journal d'audit des permissions</h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {auditLogs.length > 0 ? (
              <div className="divide-y divide-surface-800">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-surface-800/30">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center mt-0.5">
                          <History className="w-4 h-4 text-surface-400" />
                        </div>
                        <div>
                          <p className="text-surface-200">
                            <span className="font-medium">{log.performer?.name || 'Système'}</span>
                            {' '}{getActionLabel(log.action)}{' '}
                            {log.target && (
                              <span className="font-medium">{log.target.name}</span>
                            )}
                          </p>
                          <p className="text-xs text-surface-500 mt-1">
                            {new Date(log.createdAt).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-surface-500">
                Aucune activité enregistrée
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showRoleModal && (
          <RoleModal
            workspaceId={workspaceId}
            role={selectedItem}
            permissions={permissions}
            onClose={() => {
              setShowRoleModal(false);
              setSelectedItem(null);
            }}
            onSave={() => {
              loadData();
              setShowRoleModal(false);
              setSelectedItem(null);
            }}
          />
        )}

        {showGroupModal && (
          <GroupModal
            workspaceId={workspaceId}
            group={selectedItem}
            members={members}
            onClose={() => {
              setShowGroupModal(false);
              setSelectedItem(null);
            }}
            onSave={() => {
              loadData();
              setShowGroupModal(false);
              setSelectedItem(null);
            }}
          />
        )}

        {showUserModal && selectedItem && (
          <UserPermissionsModal
            workspaceId={workspaceId}
            user={selectedItem}
            roles={roles}
            onClose={() => {
              setShowUserModal(false);
              setSelectedItem(null);
            }}
            onSave={() => {
              loadData();
              setShowUserModal(false);
              setSelectedItem(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function getActionLabel(action) {
  const labels = {
    role_created: 'a créé le rôle',
    role_updated: 'a modifié le rôle',
    role_deleted: 'a supprimé le rôle',
    role_assigned: 'a assigné un rôle à',
    role_removed: 'a retiré un rôle de',
    permission_granted: 'a accordé une permission à',
    permission_revoked: 'a révoqué une permission de',
  };
  return labels[action] || action;
}

function RoleModal({ workspaceId, role, permissions, onClose, onSave }) {
  const [form, setForm] = useState({
    name: role?.name || '',
    description: role?.description || '',
    color: role?.color || '#6366f1',
    permissions: role?.permissions || [],
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (role) {
        await permissionApi.updateRole(role.id, form);
        toast.success('Rôle mis à jour');
      } else {
        await permissionApi.createRole({ ...form, workspaceId });
        toast.success('Rôle créé');
      }
      onSave();
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (code) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(code)
        ? prev.permissions.filter(p => p !== code)
        : [...prev.permissions, code],
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-surface-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-surface-800">
          <h2 className="text-xl font-semibold text-surface-100">
            {role ? 'Modifier le rôle' : 'Nouveau rôle'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-800 text-surface-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Nom *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Couleur</label>
              <input
                type="color"
                value={form.color}
                onChange={e => setForm({ ...form, color: e.target.value })}
                className="w-full h-10 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="input w-full h-20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-3">Permissions</label>
            <div className="space-y-4">
              {Object.entries(permissions).map(([category, perms]) => (
                <div key={category} className="p-4 bg-surface-800/50 rounded-xl">
                  <h4 className="font-medium text-surface-200 mb-3 capitalize">{category}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map(perm => (
                      <label
                        key={perm.code}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={form.permissions.includes(perm.code)}
                          onChange={() => togglePermission(perm.code)}
                          className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-500"
                        />
                        <span className="text-sm text-surface-300">{perm.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Annuler
            </button>
            <button type="submit" disabled={saving || !form.name} className="btn-primary flex-1">
              {saving ? 'Enregistrement...' : role ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function GroupModal({ workspaceId, group, members, onClose, onSave }) {
  const [form, setForm] = useState({
    name: group?.name || '',
    description: group?.description || '',
    color: group?.color || '#6366f1',
    memberIds: group?.members?.map(m => m.id) || [],
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (group) {
        await permissionApi.updateGroup(group.id, form);
        toast.success('Groupe mis à jour');
      } else {
        await permissionApi.createGroup({ ...form, workspaceId });
        toast.success('Groupe créé');
      }
      onSave();
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setSaving(false);
    }
  };

  const toggleMember = (memberId) => {
    setForm(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(memberId)
        ? prev.memberIds.filter(id => id !== memberId)
        : [...prev.memberIds, memberId],
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-surface-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-surface-800">
          <h2 className="text-xl font-semibold text-surface-100">
            {group ? 'Modifier le groupe' : 'Nouveau groupe'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-800 text-surface-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Nom *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Couleur</label>
              <input
                type="color"
                value={form.color}
                onChange={e => setForm({ ...form, color: e.target.value })}
                className="w-full h-10 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="input w-full h-20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-3">Membres</label>
            <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-surface-800/50 rounded-xl">
              {members.map((member, index) => (
                <label
                  key={member.id || `member-${index}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={member.id ? form.memberIds.includes(member.id) : false}
                    onChange={() => member.id && toggleMember(member.id)}
                    className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-500"
                  />
                  <div className="avatar avatar-sm">
                    {member.firstName?.[0]}{member.lastName?.[0]}
                  </div>
                  <span className="text-sm text-surface-300">{member.fullName}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Annuler
            </button>
            <button type="submit" disabled={saving || !form.name} className="btn-primary flex-1">
              {saving ? 'Enregistrement...' : group ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function UserPermissionsModal({ workspaceId, user, roles, onClose, onSave }) {
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id && workspaceId) {
      loadUserPermissions();
    }
  }, [user, workspaceId]);

  const loadUserPermissions = async () => {
    if (!user?.id || !workspaceId) return;
    try {
      const { data } = await permissionApi.getUserPermissions(user.id, workspaceId);
      setUserRoles(data.roles?.map(r => r.id) || []);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (roleId) => {
    if (!user?.id) return;
    try {
      if (userRoles.includes(roleId)) {
        await permissionApi.removeRole(user.id, roleId, workspaceId);
        setUserRoles(prev => prev.filter(id => id !== roleId));
        toast.success('Rôle retiré');
      } else {
        await permissionApi.assignRole(user.id, { workspaceId, roleId });
        setUserRoles(prev => [...prev, roleId]);
        toast.success('Rôle assigné');
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-surface-900 rounded-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-surface-800">
          <div className="flex items-center gap-3">
            <div className="avatar">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div>
              <h2 className="font-semibold text-surface-100">{user.fullName}</h2>
              <p className="text-sm text-surface-500">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-800 text-surface-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-surface-300 mb-3">Rôle workspace</h3>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              user.role === 'owner' ? 'bg-amber-500/20 text-amber-400' :
              user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
              'bg-surface-700 text-surface-300'
            }`}>
              {user.role === 'owner' ? 'Propriétaire' :
               user.role === 'admin' ? 'Administrateur' : 'Membre'}
            </span>
          </div>

          <div>
            <h3 className="text-sm font-medium text-surface-300 mb-3">Rôles personnalisés</h3>
            {loading ? (
              <div className="flex justify-center p-4">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : roles.length > 0 ? (
              <div className="space-y-2">
                {roles.map(role => (
                  <label
                    key={role.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-800/50 hover:bg-surface-800 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <span className="text-surface-200">{role.name}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={userRoles.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                      className="w-5 h-5 rounded border-surface-600 bg-surface-800 text-primary-500"
                    />
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-surface-500 text-sm">Aucun rôle personnalisé disponible</p>
            )}
          </div>

          <button onClick={onClose} className="btn-primary w-full">
            Terminé
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
