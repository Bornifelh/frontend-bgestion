import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { itemApi } from '../../../lib/api';
import { useBoardStore } from '../../../stores/boardStore';
import toast from 'react-hot-toast';

export default function StatusCell({ item, column, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const updateItemValue = useBoardStore((state) => state.updateItemValue);

  // Handle both value formats: direct ID or object with labelId
  const valueId = typeof value === 'object' ? value?.labelId : value;
  const selectedLabel = column.labels?.find((l) => l.id === valueId);

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
    
    // Add slight delay to prevent immediate close
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

  const handleSelect = async (label) => {
    try {
      // Store just the label ID
      const response = await itemApi.updateValue(item.id, column.id, label.id);
      updateItemValue(item.id, column.id, label.id);
      
      // Also update progress if it was auto-updated
      if (response.data?.progressUpdate) {
        const { columnId: progressColId, value: progressValue } = response.data.progressUpdate;
        updateItemValue(item.id, progressColId, progressValue);
      }
      
      toast.success('Statut mis à jour');
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
      className="fixed z-[100] min-w-[180px] py-2 bg-surface-800 border border-surface-700 rounded-xl shadow-2xl"
      style={{ top: menuPosition.top, left: menuPosition.left }}
    >
      <div className="px-3 py-2 text-xs font-medium text-surface-500 uppercase tracking-wider">
        Sélectionner un statut
      </div>
      {column.labels?.map((label) => (
        <button
          key={label.id}
          onClick={() => handleSelect(label)}
          className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-surface-700 transition-colors"
        >
          <span
            className="px-3 py-1 rounded-md text-sm font-medium"
            style={{
              backgroundColor: `${label.color}25`,
              color: label.color,
            }}
          >
            {label.label || label.name}
          </span>
          {valueId === label.id && (
            <Check className="w-4 h-4 text-primary-400" />
          )}
        </button>
      ))}
      {(!column.labels || column.labels.length === 0) && (
        <div className="px-3 py-2 text-sm text-surface-500">
          Aucun statut défini
        </div>
      )}
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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer group w-full"
        style={{
          backgroundColor: selectedLabel ? `${selectedLabel.color}20` : 'rgba(71, 85, 105, 0.3)',
          color: selectedLabel?.color || '#94a3b8',
          border: selectedLabel ? `1px solid ${selectedLabel.color}40` : '1px dashed #475569',
        }}
      >
        <span className="text-sm font-medium truncate flex-1 text-left">
          {selectedLabel?.label || selectedLabel?.name || 'Sélectionner'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Render menu in a portal to avoid overflow issues */}
      <AnimatePresence>
        {isOpen && createPortal(menu, document.body)}
      </AnimatePresence>
    </div>
  );
}
