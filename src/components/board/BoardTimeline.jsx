import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useBoardStore } from '../../stores/boardStore';
import { dependencyApi } from '../../lib/api';

const ZOOM_LEVELS = {
  day: { label: 'Jour', days: 1, width: 120 },
  week: { label: 'Semaine', days: 7, width: 80 },
  month: { label: 'Mois', days: 30, width: 40 },
  quarter: { label: 'Trimestre', days: 90, width: 20 },
};

export default function BoardTimeline() {
  const { currentBoard, items, columns, groups } = useBoardStore();
  const [zoomLevel, setZoomLevel] = useState('week');
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d; });
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [boardDependencies, setBoardDependencies] = useState([]);

  useEffect(() => {
    const updateWidth = () => { if (containerRef.current) setContainerWidth(containerRef.current.clientWidth); };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    if (currentBoard?.id) dependencyApi.getByBoard(currentBoard.id).then(res => setBoardDependencies(res.data || [])).catch(() => {});
  }, [currentBoard?.id]);

  const dateColumns = useMemo(() => columns?.filter(c => c.type === 'date') || [], [columns]);
  const startDateColumn = dateColumns.find(c => { const name = (c.name || '').toLowerCase(); return name.includes('début') || name.includes('start') || name.includes('lancement'); }) || dateColumns[0];
  const endDateColumn = dateColumns.find(c => { const name = (c.name || '').toLowerCase(); return name.includes('fin') || name.includes('end') || name.includes('deadline') || name.includes('limite') || name.includes('échéance'); }) || dateColumns[1] || startDateColumn;
  const statusColumn = columns?.find(c => c.type === 'status');

  const timelineItems = useMemo(() => {
    if (!items || !startDateColumn) return [];
    return items.map(item => {
      const startValue = item.values?.[startDateColumn.id];
      const endValue = endDateColumn ? item.values?.[endDateColumn.id] : null;
      const statusValue = statusColumn ? item.values?.[statusColumn.id] : null;
      let start = startValue ? new Date(startValue) : null;
      let end = endValue ? new Date(endValue) : null;
      if (!start || isNaN(start.getTime())) return null;
      if (!end || isNaN(end.getTime())) { end = new Date(start); end.setDate(end.getDate() + 1); }
      let color = '#173D68';
      if (statusValue && statusColumn?.config?.options) { const option = statusColumn.config.options.find(o => o.value === statusValue); if (option?.color) color = option.color; }
      const group = groups?.find(g => g.id === item.groupId);
      return { id: item.id, name: item.name, start, end, color, status: statusValue, groupName: group?.name || 'Sans groupe', groupId: item.groupId, isOverdue: end < new Date() && statusValue !== 'done' && statusValue !== 'completed' };
    }).filter(Boolean).sort((a, b) => a.start - b.start);
  }, [items, startDateColumn, endDateColumn, statusColumn, groups]);

  const zoom = ZOOM_LEVELS[zoomLevel];
  const daysToShow = Math.ceil(containerWidth / zoom.width) + 7;

  const dates = useMemo(() => {
    const result = [];
    const current = new Date(startDate);
    for (let i = 0; i < daysToShow; i++) { result.push(new Date(current)); current.setDate(current.getDate() + 1); }
    return result;
  }, [startDate, daysToShow]);

  const endOfRange = dates[dates.length - 1];

  const groupedItems = useMemo(() => {
    const grouped = {};
    timelineItems.forEach(item => {
      if (!grouped[item.groupId]) grouped[item.groupId] = { name: item.groupName, items: [] };
      grouped[item.groupId].items.push(item);
    });
    return Object.entries(grouped);
  }, [timelineItems]);

  const getBarPosition = (item) => {
    const rangeStart = startDate.getTime();
    const rangeEnd = endOfRange.getTime();
    const totalMs = rangeEnd - rangeStart;
    const itemStartMs = Math.max(item.start.getTime(), rangeStart);
    const itemEndMs = Math.min(item.end.getTime(), rangeEnd);
    if (itemEndMs < rangeStart || itemStartMs > rangeEnd) return { visible: false };
    const left = ((itemStartMs - rangeStart) / totalMs) * 100;
    const width = ((itemEndMs - itemStartMs) / totalMs) * 100;
    return { visible: true, left: `${Math.max(0, left)}%`, width: `${Math.min(100 - left, width)}%` };
  };

  const navigate = (direction) => { const d = new Date(startDate); d.setDate(d.getDate() + direction * zoom.days * 7); setStartDate(d); };
  const goToToday = () => { const d = new Date(); d.setDate(d.getDate() - 3); setStartDate(d); };
  const formatDate = (date) => date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const isToday = (date) => date.toDateString() === new Date().toDateString();
  const isWeekend = (date) => { const day = date.getDay(); return day === 0 || day === 6; };

  if (!startDateColumn) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Calendar className="w-12 h-12 mb-4 text-gray-300" />
        <p className="text-lg font-semibold text-[#173D68]">Vue Timeline non disponible</p>
        <p className="text-sm mt-2 text-gray-500">Ajoutez une colonne de type "Date" pour utiliser la vue Timeline.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <button onClick={goToToday} className="px-3 py-1.5 text-sm font-medium text-[#F36F21] bg-[#F36F21]/5 rounded-lg hover:bg-[#F36F21]/10 transition-colors">Aujourd'hui</button>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft className="w-5 h-5" /></button>
            <span className="px-3 text-sm text-[#173D68] font-medium min-w-[180px] text-center">{formatDate(startDate)} - {formatDate(endOfRange)}</span>
            <button onClick={() => navigate(1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { const levels = Object.keys(ZOOM_LEVELS); const idx = levels.indexOf(zoomLevel); if (idx > 0) setZoomLevel(levels[idx - 1]); }} disabled={zoomLevel === 'day'} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-40">
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {Object.entries(ZOOM_LEVELS).map(([key, value]) => (
              <button key={key} onClick={() => setZoomLevel(key)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${zoomLevel === key ? 'bg-white text-[#173D68] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {value.label}
              </button>
            ))}
          </div>
          <button onClick={() => { const levels = Object.keys(ZOOM_LEVELS); const idx = levels.indexOf(zoomLevel); if (idx < levels.length - 1) setZoomLevel(levels[idx + 1]); }} disabled={zoomLevel === 'quarter'} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-40">
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div ref={containerRef} className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex" style={{ minWidth: `${dates.length * zoom.width}px` }}>
            <div className="w-48 shrink-0 p-3 border-r border-gray-200 bg-gray-50">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Taches</span>
            </div>
            <div className="flex">
              {dates.map((date, idx) => (
                <div key={idx} style={{ width: zoom.width }} className={`shrink-0 p-2 text-center border-r border-gray-100 ${isToday(date) ? 'bg-[#F36F21]/5' : isWeekend(date) ? 'bg-gray-50' : ''}`}>
                  <div className={`text-xs ${isToday(date) ? 'text-[#F36F21] font-bold' : 'text-gray-500'}`}>{date.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                  <div className={`text-sm ${isToday(date) ? 'text-[#F36F21] font-bold' : 'text-gray-700'}`}>{date.getDate()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ minWidth: `${dates.length * zoom.width}px` }}>
          {groupedItems.map(([groupId, group]) => (
            <div key={groupId}>
              <div className="flex border-b border-gray-200 bg-gray-50">
                <div className="w-48 shrink-0 p-3 border-r border-gray-200">
                  <span className="text-sm font-semibold text-[#173D68]">{group.name}</span>
                  <span className="text-xs text-gray-400 ml-2">({group.items.length})</span>
                </div>
                <div className="flex-1" />
              </div>
              {group.items.map((item) => {
                const position = getBarPosition(item);
                if (!position.visible) return null;
                return (
                  <div key={item.id} className="flex border-b border-gray-100 hover:bg-[#F36F21]/[0.02] transition-colors">
                    <div className="w-48 shrink-0 p-3 border-r border-gray-200 flex items-center gap-2">
                      {item.isOverdue && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
                      <span className="text-sm text-gray-700 truncate" title={item.name}>{item.name}</span>
                    </div>
                    <div className="flex-1 relative h-12">
                      {dates.some(d => isToday(d)) && (
                        <div className="absolute top-0 bottom-0 w-0.5 bg-[#F36F21] z-10" style={{ left: `${((new Date().getTime() - startDate.getTime()) / (endOfRange.getTime() - startDate.getTime())) * 100}%` }} />
                      )}
                      <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        className="absolute top-2 h-8 rounded-md flex items-center px-2 text-xs font-medium text-white shadow-sm cursor-pointer hover:brightness-110 transition-all"
                        style={{ left: position.left, width: position.width, backgroundColor: item.color, transformOrigin: 'left' }}
                        title={`${item.name}: ${formatDate(item.start)} - ${formatDate(item.end)}`}
                      >
                        <span className="truncate">{item.name}</span>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {timelineItems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Clock className="w-8 h-8 mb-2 text-gray-300" />
              <p className="text-sm">Aucun item avec des dates a afficher</p>
            </div>
          )}

          {boardDependencies.length > 0 && timelineItems.length > 0 && (
            <DependencyArrows dependencies={boardDependencies} timelineItems={timelineItems} startDate={startDate} endOfRange={endOfRange} groupedItems={groupedItems} />
          )}
        </div>
      </div>
    </div>
  );
}

function DependencyArrows({ dependencies, timelineItems, startDate, endOfRange, groupedItems }) {
  const itemPositions = useMemo(() => {
    const positions = {};
    let rowIndex = 0;
    const ROW_HEIGHT = 48;
    const HEADER_HEIGHT = 40;
    groupedItems.forEach(([, group]) => {
      rowIndex++;
      group.items.forEach((item) => {
        const rangeStart = startDate.getTime();
        const rangeEnd = endOfRange.getTime();
        const totalMs = rangeEnd - rangeStart;
        const itemEndMs = Math.min(item.end.getTime(), rangeEnd);
        const itemStartMs = Math.max(item.start.getTime(), rangeStart);
        if (itemEndMs >= rangeStart && itemStartMs <= rangeEnd) {
          positions[item.id] = { y: HEADER_HEIGHT + rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2, rightPct: ((itemEndMs - rangeStart) / totalMs) * 100, leftPct: ((itemStartMs - rangeStart) / totalMs) * 100 };
        }
        rowIndex++;
      });
    });
    return positions;
  }, [groupedItems, startDate, endOfRange]);

  const arrows = useMemo(() => {
    return dependencies.filter(dep => itemPositions[dep.item_id] && itemPositions[dep.depends_on_id]).map(dep => ({ id: dep.id, from: itemPositions[dep.depends_on_id], to: itemPositions[dep.item_id] }));
  }, [dependencies, itemPositions]);

  if (arrows.length === 0) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ left: 192, width: 'calc(100% - 192px)', height: '100%' }}>
      <defs>
        <marker id="dep-arrow" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#F36F21" />
        </marker>
      </defs>
      {arrows.map((arrow) => (
        <line key={arrow.id} x1={`${arrow.from.rightPct}%`} y1={arrow.from.y} x2={`${arrow.to.leftPct}%`} y2={arrow.to.y} stroke="#F36F21" strokeWidth="2" strokeDasharray={arrow.from.y === arrow.to.y ? "0" : "6 3"} opacity="0.6" markerEnd="url(#dep-arrow)" />
      ))}
    </svg>
  );
}
