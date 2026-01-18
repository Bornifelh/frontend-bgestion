import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus,
  MoreHorizontal,
  Users,
  Settings,
  Trash2,
  ArrowRight,
  FolderKanban,
} from 'lucide-react';
import { workspaceApi, boardApi } from '../lib/api';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { joinWorkspace, leaveWorkspace } from '../lib/socket';
import CreateBoardModal from '../components/modals/CreateBoardModal';
import toast from 'react-hot-toast';

export default function Workspace() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { setCurrentWorkspace, setBoards, boards } = useWorkspaceStore();
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  // Fetch workspace
  const { data: workspace, isLoading: workspaceLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const response = await workspaceApi.getOne(workspaceId);
      return response.data;
    },
  });

  // Fetch boards
  const { data: boardsData, isLoading: boardsLoading } = useQuery({
    queryKey: ['boards', workspaceId],
    queryFn: async () => {
      const response = await boardApi.getByWorkspace(workspaceId);
      return response.data;
    },
  });

  useEffect(() => {
    if (workspace) {
      setCurrentWorkspace(workspace);
      joinWorkspace(workspaceId);
    }
    return () => {
      leaveWorkspace(workspaceId);
    };
  }, [workspace, workspaceId, setCurrentWorkspace]);

  useEffect(() => {
    if (boardsData) {
      setBoards(boardsData);
    }
  }, [boardsData, setBoards]);

  const handleDeleteBoard = async (boardId, e) => {
    e.stopPropagation();
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce board ?')) return;

    try {
      await boardApi.delete(boardId);
      toast.success('Board supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
    setActiveMenu(null);
  };

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-16">
        <p className="text-surface-400">Workspace non trouvé</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${workspace.color}20` }}
            >
              {workspace.icon}
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-surface-100">
                {workspace.name}
              </h1>
              <p className="text-surface-400">{workspace.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary">
              <Users className="w-4 h-4" />
              <span>{workspace.memberCount} membres</span>
            </button>
            <button className="btn btn-ghost">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Boards section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-semibold text-surface-100">
            Boards
          </h2>
          <button
            onClick={() => setShowCreateBoard(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau board</span>
          </button>
        </div>

        {boardsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="card h-48 animate-pulse bg-surface-800/50"
              />
            ))}
          </div>
        ) : boards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card text-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
              <FolderKanban className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-xl font-display font-semibold text-surface-100 mb-2">
              Créez votre premier board
            </h3>
            <p className="text-surface-400 max-w-md mx-auto mb-6">
              Les boards vous permettent d'organiser vos tâches et de suivre
              l'avancement de vos projets.
            </p>
            <button
              onClick={() => setShowCreateBoard(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Créer un board</span>
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board, index) => (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card p-6 hover:border-primary-500/50 transition-all group cursor-pointer relative"
                onClick={() => navigate(`/board/${board.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${board.color}20` }}
                  >
                    {board.icon}
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === board.id ? null : board.id);
                      }}
                      className="p-2 rounded-lg hover:bg-surface-700 text-surface-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {activeMenu === board.id && (
                      <div className="dropdown right-0">
                        <button
                          onClick={(e) => handleDeleteBoard(board.id, e)}
                          className="dropdown-item text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-surface-100 mb-1 flex items-center gap-2">
                  {board.name}
                  <ArrowRight className="w-4 h-4 text-surface-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-sm text-surface-500 mb-4 line-clamp-2">
                  {board.description || 'Aucune description'}
                </p>
                <div className="flex items-center gap-4 text-xs text-surface-500">
                  <span>{board.itemCount || 0} items</span>
                  <span>{board.groupCount || 0} groupes</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <CreateBoardModal
        isOpen={showCreateBoard}
        onClose={() => setShowCreateBoard(false)}
        workspaceId={workspaceId}
      />
    </div>
  );
}
