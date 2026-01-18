import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flag, ChevronDown } from 'lucide-react';
import { itemApi } from '../../../lib/api';
import { useBoardStore } from '../../../stores/boardStore';
import toast from 'react-hot-toast';

const defaultPriorities = [
  { level: 0, label: 'Basse', color: '#22c55e' },
  { level: 1, label: 'Moyenne', color: '#eab308' },
  { level: 2, label: 'Haute', color: '#f97316' },
  { level: 3, label: 'Critique', color: '#ef4444' },
];

export default function PriorityCell({ item, column, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const updateItemValue = useBoardStore((state) => state.updateItemValue);

  const priorities = column.settings?.levels?.map((label, i) => ({
    level: i,
    label,
    color: defaultPriorities[i]?.color || '#6b7280',
  })) || defaultPriorities;

  // Handle both value formats: direct number or object with level property
  const levelValue = typeof value === 'object' ? value?.level : value;
  const selectedPriority = priorities.find((p) => p.level === levelValue);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
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
    
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOpen = useCallback((e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
    setIsOpen(prev => !prev);
  }, []);

  const handleSelect = async (priority) => {
    try {
      await itemApi.updateValue(item.id, column.id, priority.level);
      updateItemValue(item.id, column.id, priority.level);
      toast.success('Priorité mise à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
    setIsOpen(false);
  };

  const menu = isOpen && (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="fixed z-[100] min-w-[160px] py-2 bg-surface-800 border border-surface-700 rounded-xl shadow-2xl"
      style={{ top: menuPosition.top, left: menuPosition.left }}
    >
      <div className="px-3 py-2 text-xs font-medium text-surface-500 uppercase tracking-wider">
        Niveau de priorité
      </div>
      {priorities.map((priority) => (
        <button
          key={priority.level}
          onClick={() => handleSelect(priority)}
          className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-surface-700 transition-colors"
        >
          <span className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: priority.color }}
            />
            <span className="text-sm text-surface-200">{priority.label}</span>
          </span>
          {levelValue === priority.level && (
            <Check className="w-4 h-4 text-primary-400" />
          )}
        </button>
      ))}
    </motion.div>
  );

  return (
    <div 
      className="relative w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        ref={buttonRef}
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer w-full"
        style={{
          backgroundColor: selectedPriority ? `${selectedPriority.color}20` : 'rgba(71, 85, 105, 0.3)',
          border: selectedPriority ? `1px solid ${selectedPriority.color}40` : '1px dashed #475569',
        }}
      >
        {selectedPriority ? (
          <>
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedPriority.color }}
            />
            <span className="text-sm font-medium flex-1 text-left" style={{ color: selectedPriority.color }}>
              {selectedPriority.label}
            </span>
          </>
        ) : (
          <>
            <Flag className="w-4 h-4 text-surface-500 flex-shrink-0" />
            <span className="text-sm text-surface-500 flex-1 text-left">Priorité</span>
          </>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-surface-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && createPortal(menu, document.body)}
      </AnimatePresence>
    </div>
  );
}
