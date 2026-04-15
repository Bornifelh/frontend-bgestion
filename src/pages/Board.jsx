import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Star,
  Filter,
  Share2,
  Table,
  Kanban,
  Calendar,
  GanttChart,
  BarChart3,
  Layers,
} from "lucide-react";
import toast from "react-hot-toast";
import { boardApi, memberApi, favoriteApi } from "../lib/api";
import { useBoardStore } from "../stores/boardStore";
import { joinBoard, leaveBoard } from "../lib/socket";
import BoardTable from "../components/board/BoardTable";
import BoardToolbar from "../components/board/BoardToolbar";
import BoardKanban from "../components/board/BoardKanban";
import BoardCalendar from "../components/board/BoardCalendar";
import BoardCharts from "../components/board/BoardCharts";
import BoardTimeline from "../components/board/BoardTimeline";
import BoardSprint from "../components/board/BoardSprint";

const VIEW_TABS = [
  { id: "table", label: "Table", Icon: Table },
  { id: "kanban", label: "Kanban", Icon: Kanban },
  { id: "calendar", label: "Calendar", Icon: Calendar },
  { id: "timeline", label: "Timeline", Icon: GanttChart },
  { id: "chart", label: "Chart", Icon: BarChart3 },
  { id: "sprint", label: "Sprint", Icon: Layers },
];

export default function Board() {
  const { boardId } = useParams();
  const prevBoardIdRef = useRef(null);
  const {
    setBoard,
    clearBoard,
    prepareTransition,
    activeView,
    setActiveView,
    currentBoard,
    isTransitioning,
    isBoardFavorite,
    setIsBoardFavorite,
  } = useBoardStore();

  const { data: boardData, isLoading, isFetching } = useQuery({
    queryKey: ["board", boardId],
    queryFn: async () => {
      const response = await boardApi.getOne(boardId);
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const displayBoard = currentBoard || boardData;
  const workspaceId = displayBoard?.workspaceId;

  const { data: workspaceMembers = [] } = useQuery({
    queryKey: ["workspace-members-header", workspaceId],
    queryFn: async () => {
      const res = await memberApi.getByWorkspace(workspaceId);
      return res.data || [];
    },
    enabled: Boolean(workspaceId),
  });

  useEffect(() => {
    if (prevBoardIdRef.current && prevBoardIdRef.current !== boardId) {
      leaveBoard(prevBoardIdRef.current);
      prepareTransition(boardId);
    }
    prevBoardIdRef.current = boardId;
    joinBoard(boardId);
  }, [boardId, prepareTransition]);

  useEffect(() => {
    if (boardData && boardData.id === boardId) {
      setBoard(boardData);
    }
  }, [boardData, boardId, setBoard]);

  useEffect(() => {
    return () => {
      const bid = prevBoardIdRef.current;
      if (bid) leaveBoard(bid);
      clearBoard();
    };
  }, [clearBoard]);

  useEffect(() => {
    if (!boardData?.id) return;
    favoriteApi
      .check("board", boardData.id)
      .then((res) => setIsBoardFavorite(res.data?.isFavorite || false))
      .catch(() => {});
  }, [boardData?.id, setIsBoardFavorite]);

  const toggleStar = async () => {
    const id = displayBoard?.id;
    if (!id) return;
    try {
      if (isBoardFavorite) {
        await favoriteApi.remove("board", id);
        setIsBoardFavorite(false);
        toast.success("Retire des favoris");
      } else {
        await favoriteApi.add("board", id);
        setIsBoardFavorite(true);
        toast.success("Ajoute aux favoris");
      }
    } catch {
      toast.error("Erreur");
    }
  };

  const openToolbarFilters = () => {
    document.getElementById("board-toolbar-filter-btn")?.click();
  };

  const shareBoard = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: displayBoard?.name || "Board", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Lien copie dans le presse-papiers");
      }
    } catch (e) {
      if (e?.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Lien copie dans le presse-papiers");
        } catch {
          toast.error("Impossible de partager");
        }
      }
    }
  };

  const showSkeleton = isLoading && !currentBoard;
  const showOverlay = isTransitioning || (isFetching && currentBoard?.id !== boardId);

  if (showSkeleton) {
    return (
      <div className="flex h-[calc(100vh-7rem)] flex-col">
        <div className="flex min-h-[3.25rem] shrink-0 items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-[#173D68] to-[#1E5090]">
          <div className="h-5 w-32 animate-pulse rounded bg-white/20" />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-7 w-16 animate-pulse rounded-md bg-white/10" />
            ))}
          </div>
        </div>
        <div className="flex-1 bg-[#F4F5F7] p-4">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-white shadow-sm" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const visibleMembers = (workspaceMembers || []).slice(0, 8);

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-0 flex-col">
      {/* Board Header - Infratex gradient */}
      <div className="flex min-h-[3.25rem] shrink-0 flex-wrap items-center gap-2 px-4 py-2.5 text-white shadow-sm bg-gradient-to-r from-[#173D68] to-[#1E5090]">
        <div className="flex min-w-0 max-w-full flex-1 flex-wrap items-center gap-2 sm:gap-3">
          {/* Board name + icon */}
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-xl leading-none" aria-hidden>
              {displayBoard?.icon || "📋"}
            </span>
            <h1 className="truncate text-lg font-bold tracking-tight text-white">
              {displayBoard?.name || "Board"}
            </h1>
          </div>

          {/* Star */}
          <button
            type="button"
            onClick={toggleStar}
            className="shrink-0 rounded-md p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title={isBoardFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            aria-pressed={isBoardFavorite}
          >
            <Star className={`h-4 w-4 ${isBoardFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
          </button>

          {/* View Tabs */}
          <nav className="flex flex-wrap items-center gap-0.5 rounded-lg bg-white/10 p-0.5 backdrop-blur-sm" aria-label="Vues du board">
            {VIEW_TABS.map(({ id, label, Icon }) => {
              const active = activeView === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveView(id)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all sm:text-sm ${
                    active
                      ? "bg-[#F36F21] text-white shadow-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={openToolbarFilters}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden md:inline">Filtres</span>
          </button>

          {visibleMembers.length > 0 && (
            <div className="flex items-center pl-1" aria-label="Membres du workspace">
              {visibleMembers.map((m, i) => {
                const initials = `${m.firstName?.[0] || ""}${m.lastName?.[0] || ""}`.toUpperCase() || "?";
                return (
                  <div
                    key={m.id || i}
                    className="-ml-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#173D68] bg-white/20 text-[10px] font-bold text-white first:ml-0"
                    title={m.fullName || m.email}
                  >
                    {initials}
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={shareBoard}
            className="flex items-center gap-1.5 rounded-md border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 transition-colors"
          >
            <Share2 className="h-4 w-4 sm:mr-0.5" />
            <span className="hidden sm:inline">Partager</span>
          </button>
        </div>
      </div>

      <BoardToolbar />

      <div className="relative min-h-0 flex-1 overflow-auto bg-[#F4F5F7]">
        {showOverlay && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#F4F5F7]/60 backdrop-blur-[1px]">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#F36F21] border-t-transparent" />
          </div>
        )}
        {activeView === "table" && <BoardTable />}
        {activeView === "kanban" && <BoardKanban />}
        {activeView === "calendar" && <BoardCalendar />}
        {activeView === "timeline" && <BoardTimeline />}
        {activeView === "chart" && <BoardCharts />}
        {activeView === "sprint" && <BoardSprint />}
      </div>
    </div>
  );
}
