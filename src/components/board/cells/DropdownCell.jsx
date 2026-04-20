import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import { itemApi, columnApi } from '../../../lib/api';
import { useBoardStore } from '../../../stores/boardStore';
import toast from 'react-hot-toast';

export default function DropdownCell({ item, column, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [newOption, setNewOption] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const addInputRef = useRef(null);
  const updateItemValue = useBoardStore((state) => state.updateItemValue);
  const updateColumn = useBoardStore((state) => state.updateColumn);

  const options = column.settings?.options || [];
  const selectedValue = typeof value === 'object' ? value?.text || value?.value : value;
  const selectedOption = options.find((o) => o === selectedValue || o.value === selectedValue);
  const displayValue = typeof selectedOption === 'object' ? selectedOption.label || selectedOption.value : selectedOption;

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
        setShowAdd(false);
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

  useEffect(() => {
    if (showAdd && addInputRef.current) addInputRef.current.focus();
  }, [showAdd]);

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
    setIsOpen((prev) => !prev);
  }, []);

  const handleSelect = async (opt) => {
    const val = typeof opt === 'object' ? opt.value : opt;
    try {
      await itemApi.updateValue(item.id, column.id, { text: val });
      updateItemValue(item.id, column.id, { text: val });
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
    setIsOpen(false);
  };

  const handleClear = async (e) => {
    e.stopPropagation();
    try {
      await itemApi.updateValue(item.id, column.id, { text: '' });
      updateItemValue(item.id, column.id, { text: '' });
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
    setIsOpen(false);
  };

  const handleAddOption = async () => {
    const trimmed = newOption.trim();
    if (!trimmed) return;
    const existing = options.map((o) => (typeof o === 'object' ? o.value : o));
    if (existing.includes(trimmed)) {
      toast.error('Cette option existe déjà');
      return;
    }

    const updatedOptions = [...options, trimmed];
    const updatedSettings = { ...column.settings, options: updatedOptions };
    try {
      await columnApi.update(column.id, { settings: updatedSettings });
      if (updateColumn) updateColumn(column.id, { settings: updatedSettings });
      setNewOption('');
      setShowAdd(false);
      toast.success('Option ajoutée');
    } catch {
      toast.error("Erreur lors de l'ajout de l'option");
    }
  };

  const COLORS = [
    '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1',
  ];

  const getColor = (opt) => {
    const label = typeof opt === 'object' ? opt.value : opt;
    const idx = options.indexOf(opt);
    return COLORS[idx % COLORS.length];
  };

  const menu = isOpen && (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="fixed z-[100] min-w-[200px] max-w-[280px] py-2 bg-surface-800 border border-surface-700 rounded-xl shadow-2xl"
      style={{ top: menuPosition.top, left: menuPosition.left }}
    >
      <div className="px-3 py-2 text-xs font-medium text-surface-500 uppercase tracking-wider">
        Sélectionner une valeur
      </div>

      {selectedValue && (
        <button
          onClick={handleClear}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-700 transition-colors text-red-400 text-sm"
        >
          <X className="w-3.5 h-3.5" />
          Effacer
        </button>
      )}

      {options.map((opt, i) => {
        const label = typeof opt === 'object' ? opt.label || opt.value : opt;
        const val = typeof opt === 'object' ? opt.value : opt;
        const color = getColor(opt);
        return (
          <button
            key={i}
            onClick={() => handleSelect(opt)}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-surface-700 transition-colors"
          >
            <span
              className="px-3 py-1 rounded-md text-sm font-medium truncate"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {label}
            </span>
            {selectedValue === val && <Check className="w-4 h-4 text-primary-400 flex-shrink-0" />}
          </button>
        );
      })}

      {options.length === 0 && !showAdd && (
        <div className="px-3 py-2 text-sm text-surface-500">Aucune option définie</div>
      )}

      <div className="border-t border-surface-700 mt-1 pt-1">
        {showAdd ? (
          <div className="flex items-center gap-2 px-3 py-2">
            <input
              ref={addInputRef}
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddOption();
                if (e.key === 'Escape') { setShowAdd(false); setNewOption(''); }
              }}
              className="flex-1 bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-sm text-surface-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Nouvelle option..."
            />
            <button onClick={handleAddOption} className="text-primary-400 hover:text-primary-300">
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-400 hover:bg-surface-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter une option
          </button>
        )}
      </div>
    </motion.div>
  );

  const color = displayValue ? getColor(selectedOption) : null;

  return (
    <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        ref={buttonRef}
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:scale-105 active:scale-95 cursor-pointer group w-full"
        style={{
          backgroundColor: color ? `${color}20` : 'rgba(71, 85, 105, 0.3)',
          color: color || '#94a3b8',
          border: color ? `1px solid ${color}40` : '1px dashed #475569',
        }}
      >
        <span className="text-sm font-medium truncate flex-1 text-left">
          {displayValue || 'Sélectionner'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && createPortal(menu, document.body)}
      </AnimatePresence>
    </div>
  );
}
