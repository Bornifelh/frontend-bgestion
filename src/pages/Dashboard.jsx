import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useAuthStore } from '../stores/authStore';
import { activityApi, workspaceApi, boardApi, favoriteApi } from '../lib/api';
import CreateWorkspaceModal from '../components/modals/CreateWorkspaceModal';
import CreateBoardModal from '../components/modals/CreateBoardModal';

function BoardTile({ board, navigate }) {
  const bg = board.color || '#0079BF';
  return (
    <button
      type="button"
      onClick={() => navigate(`/board/${board.id}`)}
      className="group relative flex h-24 w-[180px] shrink-0 flex-col justify-start overflow-hidden rounded-lg p-3 text-left shadow-sm transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-trello-blue focus-visible:ring-offset-2"
      style={{ backgroundColor: bg }}
    >
      <span className="line-clamp-2 text-sm font-semibold text-white drop-shadow-sm">
        {board.name}
      </span>
    </button>
  );
}

function CreateBoardTile({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-24 w-[180px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-trello-border bg-trello-list/60 text-sm font-medium text-navy-600 transition hover:bg-trello-list-hover hover:text-navy-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-trello-blue focus-visible:ring-offset-2"
    >
      <Plus className="h-6 w-6 text-navy-500" />
      <span>Créer un board</span>
    </button>
  );
}

function favEntityType(f) {
  return f.entity_type ?? f.entityType;
}

function favEntityId(f) {
  return f.entity_id ?? f.entityId;
}

function favEntityName(f) {
  return f.entity_name ?? f.entityName;
}

function favEntityColor(f) {
  return f.entity_color ?? f.entityColor;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces);
  const user = useAuthStore((state) => state.user);

  const [workspaceBoards, setWorkspaceBoards] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);

  const heyName =
    user?.firstName ||
    user?.email?.split('@')[0] ||
    displayName.split(' ')[0] ||
    'there';

  const boardsById = useMemo(() => {
    const map = {};
    Object.values(workspaceBoards).forEach((boards) => {
      (boards || []).forEach((b) => {
        map[b.id] = b;
      });
    });
    return map;
  }, [workspaceBoards]);

  const starredBoards = useMemo(() => {
    return favorites
      .filter((f) => favEntityType(f) === 'board')
      .map((f) => ({
        id: favEntityId(f),
        name: favEntityName(f) || 'Board',
        color: favEntityColor(f),
      }));
  }, [favorites]);

  const recentlyViewedBoards = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const a of recentActivities) {
      const bid = a.boardId;
      if (!bid || seen.has(bid)) continue;
      seen.add(bid);
      const full = boardsById[bid];
      list.push(
        full || {
          id: bid,
          name: a.boardName || 'Board',
          color: null,
        }
      );
      if (list.length >= 12) break;
    }
    return list;
  }, [recentActivities, boardsById]);

  const refreshWorkspaces = useCallback(async () => {
    try {
      const { data } = await workspaceApi.getAll();
      setWorkspaces(data || []);
    } catch {
      /* ignore */
    }
  }, [setWorkspaces]);

  const reloadBoardsForWorkspace = useCallback(async (workspaceId) => {
    if (!workspaceId) return;
    try {
      const { data } = await boardApi.getByWorkspace(workspaceId);
      setWorkspaceBoards((prev) => ({
        ...prev,
        [workspaceId]: data || [],
      }));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await favoriteApi.getAll();
        if (!cancelled) setFavorites(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setFavorites([]);
      }

      try {
        const { data } = await activityApi.getMy({ limit: 40 });
        if (!cancelled) setRecentActivities(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setRecentActivities([]);
      }

      if (workspaces.length === 0) {
        if (!cancelled) setWorkspaceBoards({});
        return;
      }

      const results = await Promise.all(
        workspaces.map(async (ws) => {
          try {
            const { data } = await boardApi.getByWorkspace(ws.id);
            return [ws.id, data || []];
          } catch {
            return [ws.id, []];
          }
        })
      );

      if (!cancelled) {
        setWorkspaceBoards(Object.fromEntries(results));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [workspaces]);

  const openCreateBoard = (workspaceId) => {
    setSelectedWorkspaceId(workspaceId);
    setShowCreateBoard(true);
  };

  const handleCloseCreateBoard = () => {
    setShowCreateBoard(false);
    const wsId = selectedWorkspaceId;
    if (wsId) reloadBoardsForWorkspace(wsId);
  };

  const sectionTitleClass = 'text-xs font-semibold uppercase tracking-wide text-navy-600';

  return (
    <div className="min-h-full bg-trello-bg p-6 text-navy-900">
      <h1 className="text-2xl font-semibold text-navy-900">Hey {heyName}!</h1>

      <section className="mt-8">
        <h2 className={sectionTitleClass}>Starred boards</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {starredBoards.length === 0 ? (
            <p className="text-sm text-navy-600">Aucun board favori pour le moment.</p>
          ) : (
            starredBoards.map((board) => (
              <BoardTile key={board.id} board={board} navigate={navigate} />
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className={sectionTitleClass}>Recently viewed</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {recentlyViewedBoards.length === 0 ? (
            <p className="text-sm text-navy-600">
              Ouvrez un board pour le voir apparaître ici.
            </p>
          ) : (
            recentlyViewedBoards.map((board) => (
              <BoardTile key={board.id} board={board} navigate={navigate} />
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={sectionTitleClass}>YOUR WORKSPACES</h2>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="text-sm font-medium text-navy-700 underline-offset-2 hover:text-trello-blue hover:underline"
          >
            + Create workspace
          </button>
        </div>

        {workspaces.length === 0 ? (
          <div className="mt-6 rounded-lg border border-trello-border bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-navy-600">
              Vous n&apos;avez pas encore d&apos;espace de travail.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-trello-blue px-4 py-2 text-sm font-medium text-white hover:bg-trello-blue-dark"
            >
              <Plus className="h-4 w-4" />
              Créer un workspace
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-10">
            {workspaces.map((workspace) => {
              const wsId = workspace.id;
              const boards = workspaceBoards[wsId] || [];
              const letter = (workspace.name || 'W').charAt(0).toUpperCase();
              const headerBg = workspace.color || '#0079BF';

              return (
                <div key={wsId}>
                  <div className="flex flex-wrap items-center gap-3 border-b border-trello-border pb-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-sm font-bold text-white"
                      style={{ backgroundColor: headerBg }}
                    >
                      {letter}
                    </div>
                    <span className="min-w-0 flex-1 text-base font-semibold text-navy-900 truncate">
                      {workspace.name}
                    </span>
                    <nav className="flex flex-wrap items-center gap-4 text-sm">
                      <Link
                        to={`/workspace/${wsId}`}
                        className="text-navy-600 hover:text-trello-blue hover:underline"
                      >
                        Boards
                      </Link>
                      <Link
                        to={`/workspace/${wsId}/members`}
                        className="text-navy-600 hover:text-trello-blue hover:underline"
                      >
                        Members
                      </Link>
                      <Link
                        to={`/workspace/${wsId}/permissions`}
                        className="text-navy-600 hover:text-trello-blue hover:underline"
                      >
                        Settings
                      </Link>
                    </nav>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {boards.map((board) => (
                      <BoardTile key={board.id} board={board} navigate={navigate} />
                    ))}
                    <CreateBoardTile onClick={() => openCreateBoard(wsId)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          refreshWorkspaces();
        }}
      />
      <CreateBoardModal
        isOpen={showCreateBoard}
        onClose={handleCloseCreateBoard}
        workspaceId={selectedWorkspaceId}
      />
    </div>
  );
}
