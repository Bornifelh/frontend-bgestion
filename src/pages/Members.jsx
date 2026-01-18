import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  ShieldCheck,
  Eye,
  Crown,
  MoreHorizontal,
  Trash2,
  RefreshCw,
  X,
  Clock,
  Activity,
} from 'lucide-react';
import { memberApi } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const roleIcons = {
  owner: Crown,
  admin: ShieldCheck,
  member: Shield,
  viewer: Eye,
};

const roleLabels = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  member: 'Membre',
  viewer: 'Observateur',
};

const roleColors = {
  owner: 'text-yellow-400 bg-yellow-400/10',
  admin: 'text-purple-400 bg-purple-400/10',
  member: 'text-blue-400 bg-blue-400/10',
  viewer: 'text-surface-400 bg-surface-400/10',
};

export default function Members() {
  const { workspaceId } = useParams();
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  // Fetch members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members', workspaceId],
    queryFn: async () => {
      const response = await memberApi.getByWorkspace(workspaceId);
      return response.data;
    },
  });

  // Fetch invitations
  const { data: invitations = [] } = useQuery({
    queryKey: ['invitations', workspaceId],
    queryFn: async () => {
      const response = await memberApi.getInvitations(workspaceId);
      return response.data;
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }) =>
      memberApi.updateRole(workspaceId, memberId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries(['members', workspaceId]);
      toast.success('Rôle mis à jour');
      setSelectedRole(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erreur');
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (memberId) => memberApi.remove(workspaceId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries(['members', workspaceId]);
      toast.success('Membre retiré');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erreur');
    },
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: (invitationId) => memberApi.cancelInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['invitations', workspaceId]);
      toast.success('Invitation annulée');
    },
  });

  // Resend invitation mutation
  const resendInvitationMutation = useMutation({
    mutationFn: (invitationId) => memberApi.resendInvitation(invitationId),
    onSuccess: () => {
      toast.success('Invitation renvoyée');
    },
  });

  const handleRemoveMember = (memberId) => {
    if (confirm('Êtes-vous sûr de vouloir retirer ce membre ?')) {
      removeMemberMutation.mutate(memberId);
    }
    setActiveMenu(null);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-100 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-400" />
            Gestion des membres
          </h1>
          <p className="text-surface-400 mt-1">
            {members.length} membre{members.length > 1 ? 's' : ''} dans ce workspace
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="btn btn-primary"
        >
          <UserPlus className="w-4 h-4" />
          <span>Inviter</span>
        </button>
      </motion.div>

      {/* Members list */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-surface-100 mb-4">Membres</h2>
        
        {membersLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member, index) => {
              const RoleIcon = roleIcons[member.role];
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-surface-800/50 hover:bg-surface-800 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="avatar">
                      {member.firstName?.[0]}
                      {member.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-surface-100">
                        {member.fullName}
                      </p>
                      <p className="text-sm text-surface-500">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-4 text-sm text-surface-500">
                      <span className="flex items-center gap-1">
                        <Activity className="w-4 h-4" />
                        {member.stats.itemsCreated} items
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {member.lastLogin
                          ? formatDistanceToNow(new Date(member.lastLogin), {
                              addSuffix: true,
                              locale: fr,
                            })
                          : 'Jamais connecté'}
                      </span>
                    </div>

                    {/* Role badge */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          member.role !== 'owner' &&
                          setSelectedRole(
                            selectedRole === member.id ? null : member.id
                          )
                        }
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                          roleColors[member.role]
                        } ${member.role !== 'owner' ? 'cursor-pointer hover:opacity-80' : ''}`}
                      >
                        <RoleIcon className="w-4 h-4" />
                        {roleLabels[member.role]}
                      </button>

                      <AnimatePresence>
                        {selectedRole === member.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="dropdown right-0 top-full mt-2"
                          >
                            {['admin', 'member', 'viewer'].map((role) => {
                              const Icon = roleIcons[role];
                              return (
                                <button
                                  key={role}
                                  onClick={() =>
                                    updateRoleMutation.mutate({
                                      memberId: member.id,
                                      role,
                                    })
                                  }
                                  className={`dropdown-item ${
                                    member.role === role ? 'bg-surface-700' : ''
                                  }`}
                                >
                                  <Icon className="w-4 h-4" />
                                  {roleLabels[role]}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Actions */}
                    {member.role !== 'owner' && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenu(
                              activeMenu === member.id ? null : member.id
                            )
                          }
                          className="p-2 rounded-lg hover:bg-surface-700 text-surface-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                          {activeMenu === member.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="dropdown right-0 top-full mt-2"
                            >
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="dropdown-item text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                                Retirer
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-surface-100 mb-4">
            Invitations en attente
          </h2>
          <div className="space-y-2">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 rounded-xl bg-surface-800/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-surface-400" />
                  </div>
                  <div>
                    <p className="font-medium text-surface-200">
                      {invitation.email}
                    </p>
                    <p className="text-sm text-surface-500">
                      Expire{' '}
                      {formatDistanceToNow(new Date(invitation.expiresAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      roleColors[invitation.role]
                    }`}
                  >
                    {roleLabels[invitation.role]}
                  </span>
                  <button
                    onClick={() =>
                      resendInvitationMutation.mutate(invitation.id)
                    }
                    className="p-2 rounded-lg hover:bg-surface-700 text-surface-400"
                    title="Renvoyer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      cancelInvitationMutation.mutate(invitation.id)
                    }
                    className="p-2 rounded-lg hover:bg-surface-700 text-red-400"
                    title="Annuler"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        workspaceId={workspaceId}
      />
    </div>
  );
}

function InviteMemberModal({ isOpen, onClose, workspaceId }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await memberApi.invite(workspaceId, { email, role });
      queryClient.invalidateQueries(['members', workspaceId]);
      queryClient.invalidateQueries(['invitations', workspaceId]);
      toast.success('Invitation envoyée');
      onClose();
      setEmail('');
      setRole('member');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="modal-content max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-surface-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary-400" />
              </div>
              <h2 className="text-lg font-semibold text-surface-100">
                Inviter un membre
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-700 text-surface-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="collegue@exemple.com"
                className="input"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Rôle
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['admin', 'member', 'viewer'].map((r) => {
                  const Icon = roleIcons[r];
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        role === r
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-surface-700 hover:border-surface-600'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          role === r ? 'text-primary-400' : 'text-surface-400'
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          role === r ? 'text-primary-300' : 'text-surface-400'
                        }`}
                      >
                        {roleLabels[r]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Envoyer l\'invitation'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
