import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  MoreHorizontal,
  Trash2,
  ArrowUpRight,
  LayoutGrid,
  Users,
  Calendar,
} from 'lucide-react';
import { boardApi } from '../lib/api';
import { useWorkspaceStore } from '../stores/workspaceStore';
import CreateBoardModal from '../components/modals/CreateBoardModal';
import toast from 'react-hot-toast';

const boardColors = [
  '#F36F21', '#173D68', '#0079BF', '#61BD4F', '#EB5A46',
  '#C377E0', '#00C2E0', '#FF9F1A', '#344563', '#519839',
];

export default function Workspace() {
  const { workspace, workspaceId } = useOutletContext();
  const navigate = useNavigate();
  const { setBoards, boards } = useWorkspaceStore();
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  const { data: boardsData, isLoading } = useQuery({
    queryKey: ['boards', workspaceId],
    queryFn: async () => {
      const response = await boardApi.getByWorkspace(workspaceId);
      return response.data;
    },
  });

  useEffect(() => {
    if (boardsData) setBoards(boardsData);
  }, [boardsData, setBoards]);

  const handleDeleteBoard = async (boardId, e) => {
    e.stopPropagation();
    if (!confirm('Supprimer ce board ?')) return;
    try {
      await boardApi.delete(boardId);
      toast.success('Board supprime');
    } catch {
      toast.error('Erreur');
    }
    setActiveMenu(null);
  };

  return (
    <div>
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F36F21]/10 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-[#F36F21]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#173D68]">{boards.length}</p>
              <p className="text-xs text-gray-500">Boards</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#173D68]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#173D68]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#173D68]">{workspace?.memberCount || 0}</p>
              <p className="text-xs text-gray-500">Membres</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#173D68]">
                {boards.reduce((sum, b) => sum + (b.itemCount || 0), 0)}
              </p>
              <p className="text-xs text-gray-500">Taches</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section title */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[#173D68]">Vos boards</h2>
        <button
          onClick={() => setShowCreateBoard(true)}
          className="btn btn-sm text-white font-medium px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: '#F36F21' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Nouveau board
        </button>
      </div>

      {/* Board grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl animate-pulse bg-gray-200" />
          ))}
        </div>
      ) : boards.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[#F36F21]/10 flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="w-8 h-8 text-[#F36F21]" />
          </div>
          <h3 className="text-lg font-semibold text-[#173D68] mb-2">
            Aucun board
          </h3>
          <p className="text-sm text-gray-400 mb-5 max-w-sm mx-auto">
            Creez votre premier board pour organiser vos taches et suivre vos projets.
          </p>
          <button
            onClick={() => setShowCreateBoard(true)}
            className="btn text-white font-medium px-4 py-2 rounded-lg"
            style={{ backgroundColor: '#F36F21' }}
          >
            <Plus className="w-4 h-4" />
            Creer un board
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boards.map((board, index) => {
            const color = board.color || boardColors[index % boardColors.length];
            return (
              <div
                key={board.id}
                className="h-32 rounded-xl cursor-pointer relative group overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                }}
                onClick={() => navigate(`/board/${board.id}`)}
              >
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />

                {/* Decorative circles */}
                <div
                  className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20"
                  style={{ backgroundColor: 'white' }}
                />
                <div
                  className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-10"
                  style={{ backgroundColor: 'white' }}
                />

                {/* Content */}
                <div className="relative p-4 h-full flex flex-col justify-between">
                  <div>
                    <h3 className="text-white font-bold text-base leading-tight line-clamp-2">
                      {board.icon && <span className="mr-1.5">{board.icon}</span>}
                      {board.name}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-white/70 text-xs">
                        {board.itemCount || 0} taches
                      </span>
                      <span className="text-white/50 text-xs">
                        {board.groupCount || 0} groupes
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowUpRight className="w-4 h-4 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === board.id ? null : board.id);
                        }}
                        className="p-1 rounded text-white/50 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/20 transition-all"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {activeMenu === board.id && (
                  <div
                    className="absolute bottom-full right-2 mb-1 z-50 dropdown"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => handleDeleteBoard(board.id, e)}
                      className="dropdown-item text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Create new board */}
          <button
            onClick={() => setShowCreateBoard(true)}
            className="h-32 rounded-xl border-2 border-dashed border-gray-300 
                       flex flex-col items-center justify-center gap-2 text-gray-400
                       hover:border-[#F36F21] hover:text-[#F36F21] hover:bg-[#F36F21]/5 
                       transition-all duration-200"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">Nouveau board</span>
          </button>
        </div>
      )}

      <CreateBoardModal
        isOpen={showCreateBoard}
        onClose={() => setShowCreateBoard(false)}
        workspaceId={workspaceId}
      />
    </div>
  );
}
