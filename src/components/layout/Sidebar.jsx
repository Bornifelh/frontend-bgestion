import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Home,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  LogOut,
  Settings,
  Plus,
  Star,
  Cpu,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useAuthStore } from '../../stores/authStore';
import { favoriteApi, boardApi } from '../../lib/api';
import CreateWorkspaceModal from '../modals/CreateWorkspaceModal';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const { user, logout } = useAuthStore();
  const [expandedWorkspaces, setExpandedWorkspaces] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [workspaceBoards, setWorkspaceBoards] = useState({});
  const [enabledModules, setEnabledModules] = useState({});
  const [moduleAccessMap, setModuleAccessMap] = useState({});

  const loadModuleAccess = () => {
    try {
      const saved = localStorage.getItem('globalUserModuleAccess');
      if (saved) {
        const parsed = JSON.parse(saved);
        const accessAll = {};
        Object.entries(parsed).forEach(([uid, mods]) => {
          if (mods && (mods.it_asset_management || mods.project_management)) {
            accessAll[uid] = true;
          }
        });
        setModuleAccessMap(accessAll);
      }
    } catch (_) {}
    // Fallback: also check old per-workspace format
    workspaces.forEach(ws => {
      try {
        const saved = localStorage.getItem(`itAccess_${ws.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.entries(parsed.it_asset_management || {}).forEach(([uid, val]) => {
            if (val) setModuleAccessMap(prev => ({ ...prev, [uid]: true }));
          });
        }
      } catch (_) {}
    });
  };

  useEffect(() => {
    favoriteApi.getAll().then(res => setFavorites(res.data || [])).catch(() => {});
    try {
      const saved = localStorage.getItem('moduleSettings');
      if (saved) setEnabledModules(JSON.parse(saved));
    } catch (e) {}
  }, []);

  useEffect(() => { loadModuleAccess(); }, [workspaces]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'moduleSettings') {
        try { setEnabledModules(JSON.parse(e.newValue)); } catch (err) {}
      }
      if (e.key?.startsWith('itAccess_')) loadModuleAccess();
    };
    const handleModulesUpdated = (e) => { setEnabledModules(e.detail); };
    const handleAccessUpdated = () => { loadModuleAccess(); };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('modulesUpdated', handleModulesUpdated);
    window.addEventListener('moduleAccessUpdated', handleAccessUpdated);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('modulesUpdated', handleModulesUpdated);
      window.removeEventListener('moduleAccessUpdated', handleAccessUpdated);
    };
  }, [workspaces]);

  useEffect(() => {
    Object.keys(expandedWorkspaces).forEach((wsId) => {
      if (expandedWorkspaces[wsId] && !workspaceBoards[wsId]) {
        boardApi.getByWorkspace(wsId)
          .then(res => setWorkspaceBoards(prev => ({ ...prev, [wsId]: res.data || [] })))
          .catch(() => {});
      }
    });
  }, [expandedWorkspaces]);

  const toggleWorkspace = (workspaceId) => {
    setExpandedWorkspaces(prev => ({ ...prev, [workspaceId]: !prev[workspaceId] }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <aside
        className="sidebar"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        {/* Board navigation */}
        <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
          {/* Quick links */}
          <Link to="/" className={`sidebar-item ${isActive('/') ? 'active' : ''}`}>
            <Home className="w-4 h-4" />
            <span>Accueil</span>
          </Link>

          {enabledModules.it_asset_management && (user?.id && moduleAccessMap[user.id]) && (
            <Link to="/it-assets" className={`sidebar-item ${isActive('/it-assets') ? 'active' : ''}`}>
              <Cpu className="w-4 h-4" />
              <span>Parc Informatique</span>
            </Link>
          )}

          {/* Starred / Favorites */}
          {favorites.length > 0 && (
            <>
              <div className="sidebar-section-title">
                <Star className="w-3 h-3 inline mr-1" />
                Favoris
              </div>
              {favorites.slice(0, 5).map((fav) => {
                const favPath = fav.entity_type === 'board' ? `/board/${fav.entity_id}` : `/workspace/${fav.entity_id}`;
                return (
                  <Link key={fav.id} to={favPath} className={`sidebar-item ${location.pathname === favPath ? 'active' : ''}`}>
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="truncate">{fav.entity_name || 'Sans nom'}</span>
                  </Link>
                );
              })}
            </>
          )}

          {/* Workspaces */}
          <div className="sidebar-section-title flex items-center justify-between">
            <span>Espaces de travail</span>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-0.5 rounded text-white/40 hover:text-white hover:bg-white/10"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {workspaces.map((workspace) => (
            <div key={workspace.id}>
              <div className="flex items-center">
                <button
                  onClick={() => toggleWorkspace(workspace.id)}
                  className={`sidebar-item flex-1 ${location.pathname.startsWith(`/workspace/${workspace.id}`) ? 'active' : ''}`}
                >
                  <div
                    className="w-5 h-5 rounded-[3px] text-[10px] font-bold flex items-center justify-center flex-shrink-0 text-white"
                    style={{ backgroundColor: workspace.color || '#0079BF' }}
                  >
                    {(workspace.name || 'W')[0].toUpperCase()}
                  </div>
                  <span className="truncate flex-1">{workspace.name}</span>
                  {expandedWorkspaces[workspace.id] ? (
                    <ChevronDown className="w-3 h-3 flex-shrink-0 text-white/40" />
                  ) : (
                    <ChevronRight className="w-3 h-3 flex-shrink-0 text-white/40" />
                  )}
                </button>
              </div>

              <AnimatePresence>
                {expandedWorkspaces[workspace.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-5 pl-3 border-l border-white/10 py-1">
                      <Link
                        to={`/workspace/${workspace.id}`}
                        className={`sidebar-item text-xs py-1 ${isActive(`/workspace/${workspace.id}`) ? 'text-white' : ''}`}
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Boards</span>
                      </Link>
                      <Link
                        to={`/workspace/${workspace.id}/permissions`}
                        className={`sidebar-item text-xs py-1 ${location.pathname.includes(`/workspace/${workspace.id}/permissions`) ? 'text-white' : ''}`}
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Parametres</span>
                      </Link>

                      {/* Boards list */}
                      <div className="mt-1">
                        <div className="px-4 py-1 text-[10px] font-semibold text-white/30 uppercase">
                          Vos boards
                        </div>
                        {(workspaceBoards[workspace.id] || []).map((board) => (
                          <Link
                            key={board.id}
                            to={`/board/${board.id}`}
                            className={`sidebar-item text-xs py-1 ${isActive(`/board/${board.id}`) ? 'text-white' : ''}`}
                          >
                            <div
                              className="w-5 h-3.5 rounded-sm flex-shrink-0"
                              style={{ backgroundColor: board.color || '#0079BF' }}
                            />
                            <span className="truncate">{board.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        {/* User + collapse */}
        <div className="px-2 py-2 border-t border-white/10">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="avatar avatar-sm flex-shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <span className="text-xs text-white/70 truncate flex-1">
              {user?.firstName} {user?.lastName}
            </span>
            <Link to="/settings" className="p-1 text-white/40 hover:text-white rounded">
              <Settings className="w-3.5 h-3.5" />
            </Link>
            <button onClick={handleLogout} className="p-1 text-white/40 hover:text-accent-red rounded">
              <LogOut className="w-3.5 h-3.5" />
            </button>
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
