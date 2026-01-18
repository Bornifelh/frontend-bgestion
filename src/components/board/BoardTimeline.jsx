import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Calendar,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useBoardStore } from '../../stores/boardStore';

const ZOOM_LEVELS = {
  day: { label: 'Jour', days: 1, width: 120 },
  week: { label: 'Semaine', days: 7, width: 80 },
  month: { label: 'Mois', days: 30, width: 40 },
  quarter: { label: 'Trimestre', days: 90, width: 20 },
};

export default function BoardTimeline() {
  const { items, columns, groups } = useBoardStore();
  const [zoomLevel, setZoomLevel] = useState('week');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  });
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Find date columns
  const dateColumns = useMemo(() => {
    return columns?.filter(c => c.type === 'date') || [];
  }, [columns]);

  const startDateColumn = dateColumns.find(c => {
    const name = (c.name || '').toLowerCase();
    return name.includes('début') || 
           name.includes('start') ||
           name.includes('lancement');
  }) || dateColumns[0];
  
  const endDateColumn = dateColumns.find(c => {
    const name = (c.name || '').toLowerCase();
    return name.includes('fin') || 
           name.includes('end') ||
           name.includes('deadline') ||
           name.includes('limite') ||
           name.includes('échéance');
  }) || dateColumns[1] || startDateColumn;

  // Get status column for coloring
  const statusColumn = columns?.find(c => c.type === 'status');

  // Process items for timeline
  const timelineItems = useMemo(() => {
    if (!items || !startDateColumn) return [];

    return items
      .map(item => {
        const startValue = item.values?.[startDateColumn.id];
        const endValue = endDateColumn ? item.values?.[endDateColumn.id] : null;
        const statusValue = statusColumn ? item.values?.[statusColumn.id] : null;
        
        let start = startValue ? new Date(startValue) : null;
        let end = endValue ? new Date(endValue) : null;

        // If no start date, skip
        if (!start || isNaN(start.getTime())) return null;

        // If no end date, default to start + 1 day
        if (!end || isNaN(end.getTime())) {
          end = new Date(start);
          end.setDate(end.getDate() + 1);
        }

        // Find status color
        let color = '#6366f1';
        if (statusValue && statusColumn?.config?.options) {
          const option = statusColumn.config.options.find(o => o.value === statusValue);
          if (option?.color) color = option.color;
        }

        const group = groups?.find(g => g.id === item.groupId);

        return {
          id: item.id,
          name: item.name,
          start,
          end,
          color,
          status: statusValue,
          groupName: group?.name || 'Sans groupe',
          groupId: item.groupId,
          isOverdue: end < new Date() && statusValue !== 'done' && statusValue !== 'completed',
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);
  }, [items, startDateColumn, endDateColumn, statusColumn, groups]);

  // Calculate date range
  const zoom = ZOOM_LEVELS[zoomLevel];
  const daysToShow = Math.ceil(containerWidth / zoom.width) + 7;
  
  const dates = useMemo(() => {
    const result = [];
    const current = new Date(startDate);
    for (let i = 0; i < daysToShow; i++) {
      result.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [startDate, daysToShow]);

  const endOfRange = dates[dates.length - 1];

  // Group items by group
  const groupedItems = useMemo(() => {
    const grouped = {};
    timelineItems.forEach(item => {
      if (!grouped[item.groupId]) {
        grouped[item.groupId] = {
          name: item.groupName,
          items: [],
        };
      }
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
    
    if (itemEndMs < rangeStart || itemStartMs > rangeEnd) {
      return { visible: false };
    }

    const left = ((itemStartMs - rangeStart) / totalMs) * 100;
    const width = ((itemEndMs - itemStartMs) / totalMs) * 100;

    return {
      visible: true,
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(100 - left, width)}%`,
    };
  };

  const navigate = (direction) => {
    const newDate = new Date(startDate);
    const days = direction * zoom.days * 7;
    newDate.setDate(newDate.getDate() + days);
    setStartDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    today.setDate(today.getDate() - 3);
    setStartDate(today);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric',
      month: 'short',
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  if (!startDateColumn) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-surface-400">
        <Calendar className="w-12 h-12 mb-4 text-surface-600" />
        <p className="text-lg font-medium text-surface-300">Vue Timeline non disponible</p>
        <p className="text-sm mt-2">
          Ajoutez une colonne de type "Date" pour utiliser la vue Timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-surface-800">
        <div className="flex items-center gap-4">
          <button onClick={goToToday} className="btn btn-secondary text-sm">
            Aujourd'hui
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-surface-700 text-surface-400"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3 text-sm text-surface-300 min-w-[180px] text-center">
              {formatDate(startDate)} - {formatDate(endOfRange)}
            </span>
            <button
              onClick={() => navigate(1)}
              className="p-2 rounded-lg hover:bg-surface-700 text-surface-400"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const levels = Object.keys(ZOOM_LEVELS);
              const idx = levels.indexOf(zoomLevel);
              if (idx > 0) setZoomLevel(levels[idx - 1]);
            }}
            disabled={zoomLevel === 'day'}
            className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 disabled:opacity-50"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="flex gap-1 bg-surface-800 rounded-lg p-1">
            {Object.entries(ZOOM_LEVELS).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setZoomLevel(key)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  zoomLevel === key
                    ? 'bg-surface-700 text-surface-100'
                    : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                {value.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              const levels = Object.keys(ZOOM_LEVELS);
              const idx = levels.indexOf(zoomLevel);
              if (idx < levels.length - 1) setZoomLevel(levels[idx + 1]);
            }}
            disabled={zoomLevel === 'quarter'}
            className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 disabled:opacity-50"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div ref={containerRef} className="flex-1 overflow-auto">
        {/* Header with dates */}
        <div className="sticky top-0 z-10 bg-surface-900 border-b border-surface-800">
          <div className="flex" style={{ minWidth: `${dates.length * zoom.width}px` }}>
            <div className="w-48 shrink-0 p-3 border-r border-surface-800 bg-surface-900">
              <span className="text-sm font-medium text-surface-400">Tâches</span>
            </div>
            <div className="flex">
              {dates.map((date, idx) => (
                <div
                  key={idx}
                  style={{ width: zoom.width }}
                  className={`shrink-0 p-2 text-center border-r border-surface-800 ${
                    isToday(date) ? 'bg-primary-500/10' : isWeekend(date) ? 'bg-surface-800/30' : ''
                  }`}
                >
                  <div className={`text-xs ${isToday(date) ? 'text-primary-400 font-bold' : 'text-surface-400'}`}>
                    {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </div>
                  <div className={`text-sm ${isToday(date) ? 'text-primary-400 font-bold' : 'text-surface-300'}`}>
                    {date.getDate()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ minWidth: `${dates.length * zoom.width}px` }}>
          {groupedItems.map(([groupId, group]) => (
            <div key={groupId}>
              {/* Group header */}
              <div className="flex border-b border-surface-800 bg-surface-800/30">
                <div className="w-48 shrink-0 p-3 border-r border-surface-800">
                  <span className="text-sm font-medium text-surface-200">{group.name}</span>
                  <span className="text-xs text-surface-500 ml-2">({group.items.length})</span>
                </div>
                <div className="flex-1" />
              </div>

              {/* Items */}
              {group.items.map((item) => {
                const position = getBarPosition(item);
                if (!position.visible) return null;

                return (
                  <div key={item.id} className="flex border-b border-surface-800 hover:bg-surface-800/20">
                    <div className="w-48 shrink-0 p-3 border-r border-surface-800 flex items-center gap-2">
                      {item.isOverdue && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                      <span className="text-sm text-surface-200 truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex-1 relative h-12">
                      {/* Today line */}
                      {dates.some(d => isToday(d)) && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-primary-500 z-10"
                          style={{
                            left: `${((new Date().getTime() - startDate.getTime()) / (endOfRange.getTime() - startDate.getTime())) * 100}%`,
                          }}
                        />
                      )}
                      
                      {/* Bar */}
                      <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        className="absolute top-2 h-8 rounded-md flex items-center px-2 text-xs font-medium text-white shadow-sm cursor-pointer hover:brightness-110 transition-all"
                        style={{
                          left: position.left,
                          width: position.width,
                          backgroundColor: item.color,
                          transformOrigin: 'left',
                        }}
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
            <div className="flex flex-col items-center justify-center h-48 text-surface-400">
              <Clock className="w-8 h-8 mb-2 text-surface-600" />
              <p className="text-sm">Aucun item avec des dates à afficher</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
