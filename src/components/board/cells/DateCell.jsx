import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  CalendarDays,
  AlertCircle
} from 'lucide-react';
import { 
  format, 
  isValid, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  isPast,
  isFuture,
  differenceInDays
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { itemApi } from '../../../lib/api';
import { useBoardStore } from '../../../stores/boardStore';
import toast from 'react-hot-toast';

const WEEKDAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

const QUICK_OPTIONS = [
  { label: "Aujourd'hui", getValue: () => new Date() },
  { label: 'Demain', getValue: () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }},
  { label: 'Dans 1 semaine', getValue: () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  }},
  { label: 'Dans 2 semaines', getValue: () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d;
  }},
  { label: 'Fin du mois', getValue: () => endOfMonth(new Date()) },
];

export default function DateCell({ item, column, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [includeTime, setIncludeTime] = useState(false);
  const [timeValue, setTimeValue] = useState('09:00');
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const updateItemValue = useBoardStore((state) => state.updateItemValue);

  // Handle both value formats: direct string or object with date property
  const rawDate = typeof value === 'object' ? value?.date : value;
  const dateValue = rawDate ? new Date(rawDate) : null;
  const isValidDate = dateValue && isValid(dateValue) && !isNaN(dateValue.getTime());

  useEffect(() => {
    if (isValidDate) {
      setCurrentMonth(dateValue);
      if (dateValue.getHours() !== 0 || dateValue.getMinutes() !== 0) {
        setIncludeTime(true);
        setTimeValue(format(dateValue, 'HH:mm'));
      }
    }
  }, [isValidDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    console.log('DateCell handleOpen called', { isOpen, item: item?.id });
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: Math.min(rect.bottom + 4, window.innerHeight - 420),
        left: Math.min(rect.left, window.innerWidth - 320),
      });
    }
    setIsOpen(!isOpen);
  };

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Add padding days from previous month
    const startDay = start.getDay();
    const paddingStart = startDay === 0 ? 6 : startDay - 1; // Monday = 0
    const prevMonthDays = [];
    for (let i = paddingStart - 1; i >= 0; i--) {
      const d = new Date(start);
      d.setDate(d.getDate() - i - 1);
      prevMonthDays.push({ date: d, isCurrentMonth: false });
    }
    
    // Add padding days from next month
    const endDay = end.getDay();
    const paddingEnd = endDay === 0 ? 0 : 7 - endDay;
    const nextMonthDays = [];
    for (let i = 1; i <= paddingEnd; i++) {
      const d = new Date(end);
      d.setDate(d.getDate() + i);
      nextMonthDays.push({ date: d, isCurrentMonth: false });
    }
    
    return [
      ...prevMonthDays,
      ...days.map(d => ({ date: d, isCurrentMonth: true })),
      ...nextMonthDays,
    ];
  }, [currentMonth]);

  const handleDateSelect = async (date) => {
    let finalDate = date;
    
    if (includeTime && timeValue) {
      const [hours, minutes] = timeValue.split(':').map(Number);
      finalDate = new Date(date);
      finalDate.setHours(hours, minutes, 0, 0);
    }

    const dateString = finalDate.toISOString();

    try {
      await itemApi.updateValue(item.id, column.id, dateString);
      updateItemValue(item.id, column.id, dateString);
      toast.success('Date mise à jour');
      setIsOpen(false);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleClear = async (e) => {
    e.stopPropagation();
    try {
      await itemApi.updateValue(item.id, column.id, null);
      updateItemValue(item.id, column.id, null);
      toast.success('Date effacée');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getDateStatus = () => {
    if (!isValidDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isToday(dateValue)) return { label: "Aujourd'hui", color: '#3b82f6' };
    if (isPast(dateValue)) {
      const days = differenceInDays(today, dateValue);
      return { label: `${days}j en retard`, color: '#ef4444', isLate: true };
    }
    
    const days = differenceInDays(dateValue, today);
    if (days === 1) return { label: 'Demain', color: '#f97316' };
    if (days <= 7) return { label: `Dans ${days}j`, color: '#eab308' };
    
    return null;
  };

  const dateStatus = getDateStatus();

  const menuContent = (
    <motion.div
      key="date-cell-menu"
      ref={menuRef}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="fixed z-[9999] w-80 bg-surface-800 border border-surface-700 rounded-xl shadow-2xl overflow-hidden"
      style={{ top: menuPosition.top, left: menuPosition.left }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-surface-700">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1.5 hover:bg-surface-700 rounded-lg text-surface-400 hover:text-surface-200"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-surface-200">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </span>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1.5 hover:bg-surface-700 rounded-lg text-surface-400 hover:text-surface-200"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="p-2">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-surface-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map(({ date, isCurrentMonth }, index) => {
            const isSelected = isValidDate && isSameDay(date, dateValue);
            const isTodayDate = isToday(date);
            const isPastDate = isPast(date) && !isTodayDate;

            return (
              <button
                key={index}
                onClick={() => handleDateSelect(date)}
                className={`
                  w-full aspect-square flex items-center justify-center text-sm rounded-lg transition-all
                  ${isCurrentMonth ? 'text-surface-200' : 'text-surface-600'}
                  ${isSelected ? 'bg-primary-500 text-white font-medium' : 'hover:bg-surface-700'}
                  ${isTodayDate && !isSelected ? 'ring-1 ring-primary-500 text-primary-400' : ''}
                  ${isPastDate && !isSelected ? 'text-surface-500' : ''}
                `}
              >
                {format(date, 'd')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time toggle */}
      <div className="px-3 py-2 border-t border-surface-700">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-2 text-sm text-surface-300">
            <Clock className="w-4 h-4" />
            Inclure l'heure
          </span>
          <input
            type="checkbox"
            checked={includeTime}
            onChange={(e) => setIncludeTime(e.target.checked)}
            className="w-4 h-4 rounded border-surface-600 bg-surface-700 text-primary-500"
          />
        </label>
        {includeTime && (
          <input
            type="time"
            value={timeValue}
            onChange={(e) => setTimeValue(e.target.value)}
            className="mt-2 w-full px-3 py-1.5 bg-surface-700 border-none rounded-lg text-sm text-surface-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        )}
      </div>

      {/* Quick options */}
      <div className="px-3 py-2 border-t border-surface-700">
        <p className="text-xs text-surface-500 mb-2">Raccourcis</p>
        <div className="flex flex-wrap gap-1">
          {QUICK_OPTIONS.map((option, i) => (
            <button
              key={i}
              onClick={() => handleDateSelect(option.getValue())}
              className="px-2 py-1 text-xs bg-surface-700 hover:bg-surface-600 text-surface-300 rounded-lg transition-colors"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear button */}
      {isValidDate && (
        <div className="p-2 border-t border-surface-700">
          <button
            onClick={handleClear}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Effacer la date
          </button>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="relative" style={{ pointerEvents: 'auto' }}>
      <button
        type="button"
        ref={buttonRef}
        onClick={handleOpen}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full flex items-center gap-2 text-sm group rounded-md hover:bg-surface-700/50 px-1.5 py-1 transition-colors cursor-pointer bg-transparent border-none text-left relative z-10"
        style={{ pointerEvents: 'auto' }}
      >
        {isValidDate ? (
          <>
            <Calendar 
              className={`w-4 h-4 flex-shrink-0 ${dateStatus?.isLate ? 'text-red-400' : 'text-primary-400'}`} 
            />
            <div className="flex-1 min-w-0">
              <span className={`${dateStatus?.isLate ? 'text-red-300' : 'text-surface-200'}`}>
                {format(dateValue, 'd MMM yyyy', { locale: fr })}
              </span>
              {includeTime && (
                <span className="text-surface-500 ml-1">
                  {format(dateValue, 'HH:mm')}
                </span>
              )}
            </div>
            {dateStatus && (
              <span 
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ 
                  backgroundColor: `${dateStatus.color}20`, 
                  color: dateStatus.color 
                }}
              >
                {dateStatus.label}
              </span>
            )}
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-surface-600 flex-shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-surface-500" />
            </span>
          </>
        ) : (
          <>
            <CalendarDays className="w-4 h-4 text-surface-500" />
            <span className="text-surface-500">Définir une date</span>
          </>
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && menuContent}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
