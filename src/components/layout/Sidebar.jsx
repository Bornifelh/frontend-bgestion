import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
  Sparkles,
  LogOut,
  Users,
  Wallet,
  Map,
  Server,
  TrendingUp,
  Shield,
  Award,
  Ticket,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useAuthStore } from '../../stores/authStore';
import CreateWorkspaceModal from '../modals/CreateWorkspaceModal';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const { user, logout } = useAuthStore();
  const [expandedWorkspaces, setExpandedWorkspaces] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  const toggleWorkspace = (workspaceId) => {
    setExpandedWorkspaces((prev) => ({
      ...prev,
      [workspaceId]: !prev[workspaceId],
    }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <aside className="sidebar">
        {/* Logo */}
        <div className="p-6 border-b border-surface-800">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl gradient-text">
              GesProjet
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          {/* Main nav */}
          <div className="mb-6">
            <Link
              to="/"
              className={`sidebar-item ${isActive('/') ? 'active' : ''}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Tableau de bord</span>
            </Link>
          </div>

          {/* Workspaces */}
          <div className="px-4 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
                Espaces de travail
              </span>
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-1 rounded-lg hover:bg-surface-800 text-surface-500 hover:text-surface-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {workspaces.map((workspace) => (
              <div key={workspace.id}>
                <button
                  onClick={() => toggleWorkspace(workspace.id)}
                  className="w-full sidebar-item justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{workspace.icon}</span>
                    <span className="truncate">{workspace.name}</span>
                  </div>
                  {expandedWorkspaces[workspace.id] ? (
                    <ChevronDown className="w-4 h-4 text-surface-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-surface-500" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedWorkspaces[workspace.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <Link
                        to={`/workspace/${workspace.id}`}
                        className={`sidebar-item pl-12 text-sm ${
                          location.pathname === `/workspace/${workspace.id}`
                            ? 'active'
                            : ''
                        }`}
                      >
                        <FolderKanban className="w-4 h-4" />
                        <span>Boards</span>
                      </Link>
                      <Link
                        to={`/workspace/${workspace.id}/members`}
                        className={`sidebar-item pl-12 text-sm ${
                          location.pathname === `/workspace/${workspace.id}/members`
                            ? 'active'
                            : ''
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        <span>Membres</span>
                      </Link>
                      <Link
                        to={`/workspace/${workspace.id}/evaluation`}
                        className={`sidebar-item pl-12 text-sm ${
                          location.pathname === `/workspace/${workspace.id}/evaluation`
                            ? 'active'
                            : ''
                        }`}
                      >
                        <Award className="w-4 h-4" />
                        <span>Évaluation équipe</span>
                      </Link>
                      <Link
                        to={`/workspace/${workspace.id}/tickets`}
                        className={`sidebar-item pl-12 text-sm ${
                          location.pathname === `/workspace/${workspace.id}/tickets`
                            ? 'active'
                            : ''
                        }`}
                      >
                        <Ticket className="w-4 h-4" />
                        <span>Mes tickets</span>
                      </Link>
                      <Link
                        to={`/workspace/${workspace.id}/tickets/admin`}
                        className={`sidebar-item pl-12 text-sm ${
                          location.pathname === `/workspace/${workspace.id}/tickets/admin`
                            ? 'active'
                            : ''
                        }`}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Gestion tickets</span>
                      </Link>
                      <Link
                        to={`/workspace/${workspace.id}/permissions`}
                        className={`sidebar-item pl-12 text-sm ${
                          location.pathname === `/workspace/${workspace.id}/permissions`
                            ? 'active'
                            : ''
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                        <span>Permissions</span>
                      </Link>
                      <Link
                        to={`/workspace/${workspace.id}/budgets`}
                        className={`sidebar-item pl-12 text-sm ${
                          location.pathname.startsWith(`/workspace/${workspace.id}/budget`)
                            ? 'active'
                            : ''
                        }`}
                      >
                        <Wallet className="w-4 h-4" />
                        <span>Budgets</span>
                      </Link>
                      
                      {/* SDSI Section - Simplified */}
                      <div className="mt-2 pt-2 border-t border-surface-800/50">
                        <span className="text-xs text-surface-500 pl-12 block mb-1">Schéma Directeur SI</span>
                        <Link
                          to={`/workspace/${workspace.id}/sdsi`}
                          className={`sidebar-item pl-12 text-sm ${
                            location.pathname === `/workspace/${workspace.id}/sdsi`
                              ? 'active'
                              : ''
                          }`}
                        >
                          <Map className="w-4 h-4" />
                          <span>Tableau de bord</span>
                        </Link>
                        <Link
                          to={`/workspace/${workspace.id}/sdsi/projects`}
                          className={`sidebar-item pl-12 text-sm ${
                            location.pathname.includes(`/workspace/${workspace.id}/sdsi/project`)
                              ? 'active'
                              : ''
                          }`}
                        >
                          <FolderKanban className="w-4 h-4" />
                          <span>Portefeuille projets</span>
                        </Link>
                        <Link
                          to={`/workspace/${workspace.id}/sdsi/resources`}
                          className={`sidebar-item pl-12 text-sm ${
                            location.pathname === `/workspace/${workspace.id}/sdsi/resources`
                              ? 'active'
                              : ''
                          }`}
                        >
                          <Users className="w-4 h-4" />
                          <span>Ressources</span>
                        </Link>
                        <Link
                          to={`/workspace/${workspace.id}/sdsi/applications`}
                          className={`sidebar-item pl-12 text-sm ${
                            location.pathname === `/workspace/${workspace.id}/sdsi/applications`
                              ? 'active'
                              : ''
                          }`}
                        >
                          <Server className="w-4 h-4" />
                          <span>Applications</span>
                        </Link>
                        <Link
                          to={`/workspace/${workspace.id}/sdsi/kpis`}
                          className={`sidebar-item pl-12 text-sm ${
                            location.pathname === `/workspace/${workspace.id}/sdsi/kpis`
                              ? 'active'
                              : ''
                          }`}
                        >
                          <TrendingUp className="w-4 h-4" />
                          <span>Indicateurs</span>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-surface-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50">
            <div className="avatar">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-200 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-surface-500 truncate">{user?.email}</p>
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/settings"
                className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-surface-200 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
