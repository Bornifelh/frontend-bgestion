import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Clock, X, List, Play, Flag, ArrowRight } from 'lucide-react';
import { useBoardStore } from '../../stores/boardStore';
import { memberApi } from '../../lib/api';
import EditItemModal from '../modals/EditItemModal';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function BoardCalendar() {
  const { currentBoard, columns, items } = useBoardStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDayItems, setSelectedDayItems] = useState(null);
  const [selectedDayDate, setSelectedDayDate] = useState(null);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);

  // Load workspace members
  useEffect(() => {
    const loadMembers = async () => {
      if (!currentBoard?.workspaceId) return;
      try {
        const response = await memberApi.getByWorkspace(currentBoard.workspaceId);
        setWorkspaceMembers(response.data || []);
      } catch (error) {
        console.error('Failed to load members:', error);
      }
    };
    loadMembers();
  }, [currentBoard?.workspaceId]);

  // Find date columns - try to identify start date and end date (deadline)
  const { startDateColumn, endDateColumn, dateColumns } = useMemo(() => {
    const allDateCols = columns.filter(col => col.type === 'date' || col.type === 'timeline');
    
    // Try to find start and end columns by name
    const startCol = allDateCols.find(col => 
      col.title.toLowerCase().includes('début') || 
      col.title.toLowerCase().includes('start') ||
      col.title.toLowerCase().includes('lancement') ||
      col.title.toLowerCase().includes('création')
    ) || allDateCols[0];
    
    const endCol = allDateCols.find(col => 
      col.title.toLowerCase().includes('fin') || 
      col.title.toLowerCase().includes('end') ||
      col.title.toLowerCase().includes('deadline') ||
      col.title.toLowerCase().includes('échéance') ||
      col.title.toLowerCase().includes('limite')
    ) || allDateCols[1] || allDateCols[0];
    
    return {
      startDateColumn: startCol,
      endDateColumn: endCol !== startCol ? endCol : null,
      dateColumns: allDateCols
    };
  }, [columns]);

  // Get items with timeline data
  const itemsWithTimeline = useMemo(() => {
    return items.map(item => {
      let startDate = null;
      let endDate = null;
      
      // Get start date
      if (startDateColumn) {
        const startValue = item.values?.[startDateColumn.id];
        if (startValue) {
          const parsed = new Date(typeof startValue === 'object' ? startValue.date : startValue);
          if (!isNaN(parsed.getTime())) {
            startDate = parsed;
          }
        }
      }
      
      // Get end date (deadline)
      if (endDateColumn) {
        const endValue = item.values?.[endDateColumn.id];
        if (endValue) {
          const parsed = new Date(typeof endValue === 'object' ? endValue.date : endValue);
          if (!isNaN(parsed.getTime())) {
            endDate = parsed;
          }
        }
      }
      
      // If no end date, use start date as single point
      // If no start date but has end date, use end date as single point
      if (!endDate && startDate) {
        endDate = startDate;
      }
      if (!startDate && endDate) {
        startDate = endDate;
      }
      
      return {
        ...item,
        startDate,
        endDate,
        hasTimeline: startDate !== null && endDate !== null,
        isRange: startDate && endDate && startDate.getTime() !== endDate.getTime()
      };
    });
  }, [items, startDateColumn, endDateColumn]);

  // Items with valid dates for calendar
  const itemsForCalendar = useMemo(() => {
    return itemsWithTimeline.filter(item => item.hasTimeline);
  }, [itemsWithTimeline]);

  // Items without dates
  const itemsWithoutDates = useMemo(() => {
    return itemsWithTimeline.filter(item => !item.hasTimeline);
  }, [itemsWithTimeline]);

  // Calendar grid generation
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Previous month days
    const prevMonth = new Date(year, month, 0);
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false,
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    
    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    
    return days;
  }, [currentDate]);

  // Helper to check if a date is the same day
  const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  // Get items for a specific date with timeline info
  const getItemsForDate = (date) => {
    return itemsForCalendar.filter(item => {
      const start = item.startDate;
      const end = item.endDate;
      
      // Normalize dates to midnight for comparison
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      
      const itemStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const itemEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      
      // Item is active on this day if the day is between start and end
      return dayStart >= itemStart && dayStart <= itemEnd;
    }).map(item => {
      const itemStart = new Date(item.startDate.getFullYear(), item.startDate.getMonth(), item.startDate.getDate());
      const itemEnd = new Date(item.endDate.getFullYear(), item.endDate.getMonth(), item.endDate.getDate());
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      return {
        ...item,
        isStart: isSameDay(item.startDate, date),
        isEnd: isSameDay(item.endDate, date),
        isMiddle: !isSameDay(item.startDate, date) && !isSameDay(item.endDate, date),
        isSingleDay: isSameDay(item.startDate, item.endDate)
      };
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  const navigateMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleItemClick = (item, e) => {
    e.stopPropagation();
    const originalItem = items.find(i => i.id === item.id);
    if (originalItem) {
      setSelectedItem(originalItem);
      setShowEditModal(true);
    }
  };

  const handleDayClick = (date, dayItems) => {
    if (dayItems.length > 0) {
      setSelectedDayItems(dayItems);
      setSelectedDayDate(date);
    }
  };

  const closeDayModal = () => {
    setSelectedDayItems(null);
    setSelectedDayDate(null);
  };

  const getStatusColor = (item) => {
    const statusColumn = columns.find(col => col.type === 'status');
    if (!statusColumn) return '#6366f1';
    const statusValue = item.values?.[statusColumn.id];
    const label = statusColumn.labels?.find(l => l.id === statusValue);
    return label?.color || '#6366f1';
  };

  const getPersonColumn = () => columns.find(col => col.type === 'person');
  
  const getAssignees = (item) => {
    const personCol = getPersonColumn();
    if (!personCol) return [];
    const value = item.values?.[personCol.id];
    const userIds = Array.isArray(value) ? value : (value?.userIds || []);
    return workspaceMembers.filter(m => userIds.includes(m.id));
  };

  if (dateColumns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Calendar className="w-12 h-12 text-surface-600 mb-4" />
        <p className="text-surface-400 mb-2">Ajoutez une colonne "Date" pour utiliser le calendrier</p>
        <p className="text-sm text-surface-500">
          Le calendrier affiche les items ayant une date définie
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-surface-100">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-surface-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-surface-400" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm text-surface-400 hover:text-surface-200 hover:bg-surface-700 rounded-lg transition-colors"
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-surface-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-surface-400" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-surface-500">
            <Play className="w-3 h-3 text-green-500" />
            <span>Début</span>
          </div>
          <div className="flex items-center gap-2 text-surface-500">
            <Flag className="w-3 h-3 text-red-500" />
            <span>Deadline</span>
          </div>
          <span className="text-surface-500">{itemsForCalendar.length} item(s) planifié(s)</span>
          {itemsWithoutDates.length > 0 && (
            <span className="text-amber-500">{itemsWithoutDates.length} sans date</span>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 card p-0 overflow-hidden flex flex-col">
          {/* Days header */}
          <div className="grid grid-cols-7 border-b border-surface-700">
            {DAYS.map(day => (
              <div key={day} className="px-2 py-3 text-center text-sm font-medium text-surface-400 bg-surface-800/50">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 flex-1 auto-rows-fr">
            {calendarDays.map((day, index) => {
              const dayItems = getItemsForDate(day.date);
              const today = isToday(day.date);
              
              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(day.date, dayItems)}
                  className={`min-h-[100px] border-b border-r border-surface-800 p-1 cursor-pointer hover:bg-surface-800/30 transition-colors ${
                    !day.isCurrentMonth ? 'bg-surface-900/50' : ''
                  }`}
                >
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full text-sm mb-1 ${
                    today 
                      ? 'bg-primary-500 text-white font-bold' 
                      : day.isCurrentMonth 
                        ? 'text-surface-300' 
                        : 'text-surface-600'
                  }`}>
                    {day.date.getDate()}
                  </div>
                  
                  <div className="space-y-0.5">
                    {dayItems.slice(0, 4).map((item) => {
                      const color = getStatusColor(item);
                      
                      // Different styles based on timeline position
                      let barStyle = {};
                      let indicatorClass = '';
                      
                      if (item.isSingleDay) {
                        barStyle = {
                          backgroundColor: `${color}30`,
                          borderLeft: `3px solid ${color}`,
                        };
                      } else if (item.isStart) {
                        barStyle = {
                          backgroundColor: `${color}30`,
                          borderLeft: `3px solid ${color}`,
                          borderTopLeftRadius: '4px',
                          borderBottomLeftRadius: '4px',
                          marginRight: '-4px',
                        };
                        indicatorClass = 'start';
                      } else if (item.isEnd) {
                        barStyle = {
                          backgroundColor: `${color}30`,
                          borderRight: `3px solid ${color}`,
                          borderTopRightRadius: '4px',
                          borderBottomRightRadius: '4px',
                          marginLeft: '-4px',
                        };
                        indicatorClass = 'end';
                      } else {
                        barStyle = {
                          backgroundColor: `${color}20`,
                          marginLeft: '-4px',
                          marginRight: '-4px',
                        };
                        indicatorClass = 'middle';
                      }
                      
                      return (
                        <motion.div
                          key={`${item.id}-${day.date.getTime()}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={(e) => handleItemClick(item, e)}
                          className="px-1.5 py-0.5 text-xs cursor-pointer hover:opacity-80 transition-all relative overflow-hidden"
                          style={barStyle}
                        >
                          <div className="flex items-center gap-1 truncate">
                            {item.isStart && !item.isSingleDay && (
                              <Play className="w-2.5 h-2.5 flex-shrink-0 text-green-400" />
                            )}
                            {item.isEnd && !item.isSingleDay && (
                              <Flag className="w-2.5 h-2.5 flex-shrink-0 text-red-400" />
                            )}
                            <span 
                              className="truncate"
                              style={{ color: item.isMiddle ? `${color}90` : color }}
                            >
                              {item.isStart || item.isSingleDay ? item.name : ''}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                    {dayItems.length > 4 && (
                      <div className="text-xs text-primary-400 text-center font-medium hover:underline">
                        +{dayItems.length - 4} autre(s)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar - All items list */}
        <div className="w-80 card p-0 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-surface-700 bg-surface-800/50">
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-surface-400" />
              <span className="font-medium text-surface-200">Toutes les tâches</span>
              <span className="text-xs text-surface-500">({items.length})</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {itemsWithTimeline.map((item) => {
              const assignees = getAssignees(item);
              const color = getStatusColor(item);
              
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    const original = items.find(i => i.id === item.id);
                    setSelectedItem(original);
                    setShowEditModal(true);
                  }}
                  className="p-3 rounded-lg bg-surface-800/50 hover:bg-surface-700/50 cursor-pointer transition-colors group border-l-2"
                  style={{ borderLeftColor: color }}
                >
                  <p className="text-sm font-medium text-surface-200 truncate group-hover:text-surface-100 mb-2">
                    {item.name}
                  </p>
                  
                  {/* Timeline info */}
                  {item.hasTimeline && (
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <div className="flex items-center gap-1 text-green-400">
                        <Play className="w-3 h-3" />
                        <span>{item.startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      {item.isRange && (
                        <>
                          <ArrowRight className="w-3 h-3 text-surface-500" />
                          <div className="flex items-center gap-1 text-red-400">
                            <Flag className="w-3 h-3" />
                            <span>{item.endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  
                  {!item.hasTimeline && (
                    <p className="text-xs text-amber-500/70 mb-2">Sans date</p>
                  )}
                  
                  {/* Assignees */}
                  {assignees.length > 0 && (
                    <div className="flex items-center gap-1">
                      {assignees.slice(0, 3).map((user, i) => (
                        <div
                          key={user.id}
                          className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center text-[8px] text-white font-medium ring-1 ring-surface-800"
                          style={{ marginLeft: i > 0 ? '-4px' : 0 }}
                          title={user.fullName || user.email}
                        >
                          {user.firstName?.[0] || user.email?.[0]?.toUpperCase()}
                        </div>
                      ))}
                      {assignees.length > 3 && (
                        <span className="text-xs text-surface-500 ml-1">
                          +{assignees.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            {items.length === 0 && (
              <div className="text-center text-surface-500 py-8 text-sm">
                Aucun item
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Day detail modal */}
      <AnimatePresence>
        {selectedDayItems && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={closeDayModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-surface-800 border border-surface-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-surface-700">
                <div>
                  <h3 className="font-semibold text-surface-100">
                    {selectedDayDate?.toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h3>
                  <p className="text-sm text-surface-400">{selectedDayItems.length} tâche(s) en cours</p>
                </div>
                <button
                  onClick={closeDayModal}
                  className="p-2 hover:bg-surface-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-surface-400" />
                </button>
              </div>
              
              <div className="p-4 space-y-2 overflow-y-auto max-h-[50vh]">
                {selectedDayItems.map((item) => {
                  const color = getStatusColor(item);
                  const assignees = getAssignees(item);
                  
                  return (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        handleItemClick(item, e);
                        closeDayModal();
                      }}
                      className="p-3 rounded-lg bg-surface-700/50 hover:bg-surface-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {item.isStart && !item.isSingleDay && (
                            <Play className="w-4 h-4 text-green-400" />
                          )}
                          {item.isEnd && !item.isSingleDay && (
                            <Flag className="w-4 h-4 text-red-400" />
                          )}
                          {(item.isMiddle || item.isSingleDay) && (
                            <div 
                              className="w-3 h-3 rounded-full mt-0.5"
                              style={{ backgroundColor: color }}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-surface-200">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-surface-500">
                            {item.isStart && !item.isSingleDay && <span className="text-green-400">Début</span>}
                            {item.isEnd && !item.isSingleDay && <span className="text-red-400">Deadline</span>}
                            {item.isMiddle && <span>En cours</span>}
                            {item.isSingleDay && <span>Échéance</span>}
                            
                            {item.isRange && (
                              <span className="text-surface-600">
                                ({item.startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} 
                                {' → '}
                                {item.endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })})
                              </span>
                            )}
                          </div>
                          
                          {/* Assignees in modal */}
                          {assignees.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              {assignees.map((user) => (
                                <span key={user.id} className="text-xs text-surface-400 bg-surface-600 px-2 py-0.5 rounded-full">
                                  {user.firstName || user.email?.split('@')[0]}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Item Modal */}
      <EditItemModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        workspaceId={currentBoard?.workspaceId}
      />
    </div>
  );
}
