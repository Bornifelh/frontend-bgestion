import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Clock, X, List, Play, Flag, ArrowRight } from 'lucide-react';
import { useBoardStore } from '../../stores/boardStore';
import { memberApi } from '../../lib/api';
import EditItemModal from '../modals/EditItemModal';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];

export default function BoardCalendar() {
  const { currentBoard, columns, items } = useBoardStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDayItems, setSelectedDayItems] = useState(null);
  const [selectedDayDate, setSelectedDayDate] = useState(null);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);

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

  const { startDateColumn, endDateColumn, dateColumns } = useMemo(() => {
    const allDateCols = columns.filter(col => col.type === 'date' || col.type === 'timeline');
    const startCol = allDateCols.find(col =>
      col.title.toLowerCase().includes('début') || col.title.toLowerCase().includes('start') ||
      col.title.toLowerCase().includes('lancement') || col.title.toLowerCase().includes('création')
    ) || allDateCols[0];
    const endCol = allDateCols.find(col =>
      col.title.toLowerCase().includes('fin') || col.title.toLowerCase().includes('end') ||
      col.title.toLowerCase().includes('deadline') || col.title.toLowerCase().includes('échéance') ||
      col.title.toLowerCase().includes('limite')
    ) || allDateCols[1] || allDateCols[0];
    return { startDateColumn: startCol, endDateColumn: endCol !== startCol ? endCol : null, dateColumns: allDateCols };
  }, [columns]);

  const itemsWithTimeline = useMemo(() => {
    return items.map(item => {
      let startDate = null;
      let endDate = null;
      if (startDateColumn) {
        const startValue = item.values?.[startDateColumn.id];
        if (startValue) { const parsed = new Date(typeof startValue === 'object' ? startValue.date : startValue); if (!isNaN(parsed.getTime())) startDate = parsed; }
      }
      if (endDateColumn) {
        const endValue = item.values?.[endDateColumn.id];
        if (endValue) { const parsed = new Date(typeof endValue === 'object' ? endValue.date : endValue); if (!isNaN(parsed.getTime())) endDate = parsed; }
      }
      if (!endDate && startDate) endDate = startDate;
      if (!startDate && endDate) startDate = endDate;
      return { ...item, startDate, endDate, hasTimeline: startDate !== null && endDate !== null, isRange: startDate && endDate && startDate.getTime() !== endDate.getTime() };
    });
  }, [items, startDateColumn, endDateColumn]);

  const itemsForCalendar = useMemo(() => itemsWithTimeline.filter(item => item.hasTimeline), [itemsWithTimeline]);
  const itemsWithoutDates = useMemo(() => itemsWithTimeline.filter(item => !item.hasTimeline), [itemsWithTimeline]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();
    const days = [];
    const prevMonth = new Date(year, month, 0);
    for (let i = startOffset - 1; i >= 0; i--) days.push({ date: new Date(year, month - 1, prevMonth.getDate() - i), isCurrentMonth: false });
    for (let i = 1; i <= daysInMonth; i++) days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    return days;
  }, [currentDate]);

  const isSameDay = (date1, date2) => date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();

  const getItemsForDate = (date) => {
    return itemsForCalendar.filter(item => {
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const itemStart = new Date(item.startDate.getFullYear(), item.startDate.getMonth(), item.startDate.getDate());
      const itemEnd = new Date(item.endDate.getFullYear(), item.endDate.getMonth(), item.endDate.getDate());
      return dayStart >= itemStart && dayStart <= itemEnd;
    }).map(item => ({
      ...item,
      isStart: isSameDay(item.startDate, date),
      isEnd: isSameDay(item.endDate, date),
      isMiddle: !isSameDay(item.startDate, date) && !isSameDay(item.endDate, date),
      isSingleDay: isSameDay(item.startDate, item.endDate)
    }));
  };

  const isToday = (date) => isSameDay(date, new Date());
  const navigateMonth = (delta) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleItemClick = (item, e) => {
    e.stopPropagation();
    const originalItem = items.find(i => i.id === item.id);
    if (originalItem) { setSelectedItem(originalItem); setShowEditModal(true); }
  };

  const handleDayClick = (date, dayItems) => { if (dayItems.length > 0) { setSelectedDayItems(dayItems); setSelectedDayDate(date); } };
  const closeDayModal = () => { setSelectedDayItems(null); setSelectedDayDate(null); };

  const getStatusColor = (item) => {
    const statusColumn = columns.find(col => col.type === 'status');
    if (!statusColumn) return '#173D68';
    const statusValue = item.values?.[statusColumn.id];
    const label = statusColumn.labels?.find(l => l.id === statusValue);
    return label?.color || '#173D68';
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
        <Calendar className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 mb-2">Ajoutez une colonne "Date" pour utiliser le calendrier</p>
        <p className="text-sm text-gray-400">Le calendrier affiche les items ayant une date definie</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-[#173D68]">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <button onClick={goToToday} className="px-3 py-1.5 text-sm font-medium text-[#F36F21] hover:bg-[#F36F21]/5 rounded-lg transition-colors">
              Aujourd'hui
            </button>
            <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Play className="w-3 h-3 text-green-500" /><span>Debut</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Flag className="w-3 h-3 text-red-500" /><span>Deadline</span>
          </div>
          <span className="text-gray-500 font-medium">{itemsForCalendar.length} planifie(s)</span>
          {itemsWithoutDates.length > 0 && (
            <span className="text-[#F36F21] font-medium">{itemsWithoutDates.length} sans date</span>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {DAYS.map(day => (
              <div key={day} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 flex-1 auto-rows-fr">
            {calendarDays.map((day, index) => {
              const dayItems = getItemsForDate(day.date);
              const today = isToday(day.date);
              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(day.date, dayItems)}
                  className={`min-h-[100px] border-b border-r border-gray-100 p-1 cursor-pointer hover:bg-[#F36F21]/[0.03] transition-colors ${
                    !day.isCurrentMonth ? 'bg-gray-50/50' : ''
                  }`}
                >
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full text-sm mb-1 ${
                    today ? 'bg-[#F36F21] text-white font-bold' : day.isCurrentMonth ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayItems.slice(0, 4).map((item) => {
                      const color = getStatusColor(item);
                      let barStyle = {};
                      if (item.isSingleDay) {
                        barStyle = { backgroundColor: `${color}20`, borderLeft: `3px solid ${color}` };
                      } else if (item.isStart) {
                        barStyle = { backgroundColor: `${color}20`, borderLeft: `3px solid ${color}`, borderTopLeftRadius: '4px', borderBottomLeftRadius: '4px', marginRight: '-4px' };
                      } else if (item.isEnd) {
                        barStyle = { backgroundColor: `${color}20`, borderRight: `3px solid ${color}`, borderTopRightRadius: '4px', borderBottomRightRadius: '4px', marginLeft: '-4px' };
                      } else {
                        barStyle = { backgroundColor: `${color}10`, marginLeft: '-4px', marginRight: '-4px' };
                      }
                      return (
                        <div
                          key={`${item.id}-${day.date.getTime()}`}
                          onClick={(e) => handleItemClick(item, e)}
                          className="px-1.5 py-0.5 text-xs cursor-pointer hover:opacity-80 transition-all relative overflow-hidden"
                          style={barStyle}
                        >
                          <div className="flex items-center gap-1 truncate">
                            {item.isStart && !item.isSingleDay && <Play className="w-2.5 h-2.5 flex-shrink-0 text-green-500" />}
                            {item.isEnd && !item.isSingleDay && <Flag className="w-2.5 h-2.5 flex-shrink-0 text-red-500" />}
                            <span className="truncate font-medium" style={{ color: item.isMiddle ? `${color}90` : color }}>
                              {item.isStart || item.isSingleDay ? item.name : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {dayItems.length > 4 && (
                      <div className="text-xs text-[#F36F21] text-center font-medium hover:underline">+{dayItems.length - 4} autre(s)</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-[#173D68]">Toutes les taches</span>
              <span className="text-xs text-gray-400">({items.length})</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {itemsWithTimeline.map((item) => {
              const assignees = getAssignees(item);
              const color = getStatusColor(item);
              return (
                <div
                  key={item.id}
                  onClick={() => { const original = items.find(i => i.id === item.id); setSelectedItem(original); setShowEditModal(true); }}
                  className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors group border-l-3"
                  style={{ borderLeftWidth: '3px', borderLeftColor: color }}
                >
                  <p className="text-sm font-medium text-gray-800 truncate group-hover:text-[#173D68] mb-2">{item.name}</p>
                  {item.hasTimeline && (
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <div className="flex items-center gap-1 text-green-600">
                        <Play className="w-3 h-3" />
                        <span>{item.startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      {item.isRange && (
                        <>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <div className="flex items-center gap-1 text-red-500">
                            <Flag className="w-3 h-3" />
                            <span>{item.endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {!item.hasTimeline && <p className="text-xs text-[#F36F21] mb-2">Sans date</p>}
                  {assignees.length > 0 && (
                    <div className="flex items-center gap-1">
                      {assignees.slice(0, 3).map((user, i) => (
                        <div key={user.id} className="w-5 h-5 rounded-full bg-[#173D68] flex items-center justify-center text-[8px] text-white font-bold ring-1 ring-white" style={{ marginLeft: i > 0 ? '-4px' : 0 }} title={user.fullName || user.email}>
                          {user.firstName?.[0] || user.email?.[0]?.toUpperCase()}
                        </div>
                      ))}
                      {assignees.length > 3 && <span className="text-xs text-gray-400 ml-1">+{assignees.length - 3}</span>}
                    </div>
                  )}
                </div>
              );
            })}
            {items.length === 0 && <div className="text-center text-gray-400 py-8 text-sm">Aucun item</div>}
          </div>
        </div>
      </div>

      {/* Day detail modal */}
      <AnimatePresence>
        {selectedDayItems && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={closeDayModal}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div>
                  <h3 className="font-semibold text-[#173D68]">
                    {selectedDayDate?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedDayItems.length} tache(s) en cours</p>
                </div>
                <button onClick={closeDayModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="p-4 space-y-2 overflow-y-auto max-h-[50vh]">
                {selectedDayItems.map((item) => {
                  const color = getStatusColor(item);
                  const assignees = getAssignees(item);
                  return (
                    <div key={item.id} onClick={(e) => { handleItemClick(item, e); closeDayModal(); }} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {item.isStart && !item.isSingleDay && <Play className="w-4 h-4 text-green-500" />}
                          {item.isEnd && !item.isSingleDay && <Flag className="w-4 h-4 text-red-500" />}
                          {(item.isMiddle || item.isSingleDay) && <div className="w-3 h-3 rounded-full mt-0.5" style={{ backgroundColor: color }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            {item.isStart && !item.isSingleDay && <span className="text-green-600">Debut</span>}
                            {item.isEnd && !item.isSingleDay && <span className="text-red-500">Deadline</span>}
                            {item.isMiddle && <span>En cours</span>}
                            {item.isSingleDay && <span>Echeance</span>}
                            {item.isRange && (
                              <span className="text-gray-400">
                                ({item.startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → {item.endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })})
                              </span>
                            )}
                          </div>
                          {assignees.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              {assignees.map((user) => (
                                <span key={user.id} className="text-xs text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full">{user.firstName || user.email?.split('@')[0]}</span>
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

      <EditItemModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedItem(null); }} item={selectedItem} workspaceId={currentBoard?.workspaceId} />
    </div>
  );
}
