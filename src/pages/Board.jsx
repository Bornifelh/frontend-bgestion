import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { boardApi } from "../lib/api";
import { useBoardStore } from "../stores/boardStore";
import { joinBoard, leaveBoard } from "../lib/socket";
import BoardTable from "../components/board/BoardTable";
import BoardToolbar from "../components/board/BoardToolbar";
import BoardKanban from "../components/board/BoardKanban";
import BoardCalendar from "../components/board/BoardCalendar";
import BoardCharts from "../components/board/BoardCharts";
import BoardTimeline from "../components/board/BoardTimeline";

export default function Board() {
  const { boardId } = useParams();
  const { setBoard, clearBoard, activeView } = useBoardStore();

  // Fetch board
  const { data: boardData, isLoading } = useQuery({
    queryKey: ["board", boardId],
    queryFn: async () => {
      const response = await boardApi.getOne(boardId);
      return response.data;
    },
  });

  useEffect(() => {
    if (boardData) {
      setBoard(boardData);
      joinBoard(boardId);
    }
    return () => {
      clearBoard();
      leaveBoard(boardId);
    };
  }, [boardData, boardId, setBoard, clearBoard]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-8rem)]">
      <BoardToolbar />

      <div className="mt-4 h-full overflow-auto">
        {activeView === "table" && <BoardTable />}
        {activeView === "kanban" && <BoardKanban />}
        {activeView === "calendar" && <BoardCalendar />}
        {activeView === "timeline" && <BoardTimeline />}
        {activeView === "chart" && <BoardCharts />}
      </div>
    </motion.div>
  );
}
