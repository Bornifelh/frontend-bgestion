import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Loader2,
  AlertCircle,
  ListTodo,
  ChevronRight,
  LayoutList,
} from 'lucide-react';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { workspaceApi, boardApi } from '../lib/api';

export default function GlobalTasks() {
  const navigate = useNavigate();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);

  const [boardGroups, setBoardGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBoardGroups = useCallback(async (isAborted = () => false) => {
    let list = useWorkspaceStore.getState().workspaces;
    if (!list?.length) {
      const { data } = await workspaceApi.getAll();
      if (isAborted()) return null;
      const next = Array.isArray(data) ? data : [];
      setWorkspaces(next);
      list = next;
    }

    const slice = list.slice(0, 5);
    if (slice.length === 0) {
      return [];
    }

    const responses = await Promise.all(
      slice.map((ws) => boardApi.getByWorkspace(ws.id))
    );
    if (isAborted()) return null;

    return slice.map((ws, idx) => ({
      workspaceId: ws.id,
      workspaceName: ws.name,
      boards: (responses[idx].data || []).map((b) => ({
        id: b.id,
        name: b.name,
        taskCount:
          typeof b.itemCount === 'number'
            ? b.itemCount
            : parseInt(b.itemCount, 10) || 0,
      })),
    }));
  }, [setWorkspaces]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const groups = await loadBoardGroups(() => cancelled);
        if (cancelled || groups === null) return;
        setBoardGroups(groups);
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.response?.data?.error ||
              e?.message ||
              'Impossible de charger les donnees.'
          );
          setBoardGroups([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadBoardGroups]);

  const handleRetry = () => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const groups = await loadBoardGroups(() => false);
        if (groups === null) return;
        setBoardGroups(groups);
      } catch (e) {
        setError(
          e?.response?.data?.error ||
            e?.message ||
            'Impossible de charger les donnees.'
        );
        setBoardGroups([]);
      } finally {
        setLoading(false);
      }
    })();
  };

  const showEmptyWorkspaces =
    !loading && !error && workspaces.length === 0 && boardGroups.length === 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <ListTodo className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              Taches
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Vue globale de toutes vos taches
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm">Chargement des boards...</p>
          </div>
        )}

        {!loading && error && (
          <div className="p-8 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="btn btn-primary btn-sm"
            >
              Reessayer
            </button>
          </div>
        )}

        {!loading && !error && showEmptyWorkspaces && (
          <div className="text-center py-16 px-6">
            <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-base font-medium text-gray-800 mb-1">
              Aucun espace de travail
            </h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Creez un espace de travail pour commencer a suivre vos taches sur
              vos boards.
            </p>
          </div>
        )}

        {!loading && !error && !showEmptyWorkspaces && (
          <div className="divide-y divide-gray-100">
            {boardGroups.map((group) => (
              <section key={group.workspaceId} className="bg-white">
                <div className="border-l-4 border-l-blue-500 bg-blue-50/40 px-4 py-3 flex items-center gap-2">
                  <LayoutList className="w-4 h-4 text-blue-600 shrink-0" />
                  <h2 className="text-sm font-semibold text-gray-800">
                    {group.workspaceName}
                  </h2>
                </div>

                {group.boards.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-gray-500 pl-8">
                    Aucun board dans cet espace.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50/80 text-left text-gray-500 border-b border-gray-100">
                          <th className="font-medium px-4 py-2.5 pl-8">
                            Board
                          </th>
                          <th className="font-medium px-4 py-2.5 w-32 text-right">
                            Taches
                          </th>
                          <th className="font-medium px-4 py-2.5 w-28 text-right">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {group.boards.map((board) => (
                          <tr
                            key={board.id}
                            className="hover:bg-gray-50/60 transition-colors"
                          >
                            <td className="px-4 py-3 pl-8">
                              <span className="text-gray-800 font-medium">
                                {board.name}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                              {board.taskCount}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                className="btn btn-primary btn-sm inline-flex items-center gap-1"
                                onClick={() => navigate(`/board/${board.id}`)}
                              >
                                Voir
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
