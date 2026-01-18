import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Minus, Plus, TrendingUp } from 'lucide-react';
import { itemApi } from '../../../lib/api';
import { useBoardStore } from '../../../stores/boardStore';
import toast from 'react-hot-toast';

const PROGRESS_PRESETS = [0, 25, 50, 75, 100];

export default function ProgressCell({ item, column, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [localProgress, setLocalProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const sliderRef = useRef(null);
  const updateItemValue = useBoardStore((state) => state.updateItemValue);

  // Handle both value formats - memoize to prevent unnecessary recalculations
  const progress = useMemo(() => {
    return typeof value === 'object' ? (value?.progress ?? 0) : (parseInt(value) || 0);
  }, [value]);

  useEffect(() => {
    setLocalProgress(progress);
  }, [progress]);

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
    
    console.log('ProgressCell handleOpen called', { isOpen, item: item?.id });
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - 260),
      });
    }
    setIsOpen(!isOpen);
  };

  const saveProgress = async (newProgress) => {
    const clampedProgress = Math.max(0, Math.min(100, newProgress));
    try {
      await itemApi.updateValue(item.id, column.id, { progress: clampedProgress });
      updateItemValue(item.id, column.id, { progress: clampedProgress });
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      setLocalProgress(progress);
    }
  };

  const handleSliderChange = (e) => {
    const newValue = parseInt(e.target.value);
    setLocalProgress(newValue);
  };

  const handleSliderRelease = () => {
    if (localProgress !== progress) {
      saveProgress(localProgress);
    }
    setIsDragging(false);
  };

  const handleIncrement = () => {
    const newProgress = Math.min(100, localProgress + 5);
    setLocalProgress(newProgress);
    saveProgress(newProgress);
  };

  const handleDecrement = () => {
    const newProgress = Math.max(0, localProgress - 5);
    setLocalProgress(newProgress);
    saveProgress(newProgress);
  };

  const handlePresetClick = (preset) => {
    setLocalProgress(preset);
    saveProgress(preset);
  };

  const getProgressColor = (p = localProgress) => {
    if (p >= 100) return { bg: '#22c55e', text: '#22c55e', bgLight: 'rgba(34, 197, 94, 0.2)' };
    if (p >= 75) return { bg: '#84cc16', text: '#84cc16', bgLight: 'rgba(132, 204, 22, 0.2)' };
    if (p >= 50) return { bg: '#eab308', text: '#eab308', bgLight: 'rgba(234, 179, 8, 0.2)' };
    if (p >= 25) return { bg: '#f97316', text: '#f97316', bgLight: 'rgba(249, 115, 22, 0.2)' };
    return { bg: '#ef4444', text: '#ef4444', bgLight: 'rgba(239, 68, 68, 0.2)' };
  };

  const getStatusLabel = (p = localProgress) => {
    if (p >= 100) return 'Terminé';
    if (p >= 75) return 'Presque fini';
    if (p >= 50) return 'En cours';
    if (p >= 25) return 'Démarré';
    if (p > 0) return 'Début';
    return 'Non démarré';
  };

  const colors = getProgressColor();

  const menuContent = (
    <motion.div
      key="progress-cell-menu"
      ref={menuRef}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="fixed z-[9999] w-60 bg-surface-800 border border-surface-700 rounded-xl shadow-2xl overflow-hidden"
      style={{ top: menuPosition.top, left: menuPosition.left }}
    >
      {/* Header with current status */}
      <div className="p-3 border-b border-surface-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-surface-200">Progression</span>
          <span 
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: colors.bgLight, color: colors.text }}
          >
            {getStatusLabel()}
          </span>
        </div>
        
        {/* Big percentage display */}
        <div className="flex items-center justify-center gap-2 py-2">
          <button
            onClick={handleDecrement}
            className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-surface-200 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                strokeWidth="6"
                fill="none"
                className="stroke-surface-700"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - localProgress / 100)}`}
                strokeLinecap="round"
                style={{ stroke: colors.bg }}
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-surface-100">{localProgress}%</span>
            </div>
          </div>
          <button
            onClick={handleIncrement}
            className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-surface-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slider */}
      <div className="px-3 py-2">
        <input
          ref={sliderRef}
          type="range"
          min="0"
          max="100"
          value={localProgress}
          onChange={handleSliderChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={handleSliderRelease}
          onTouchEnd={handleSliderRelease}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${colors.bg} 0%, ${colors.bg} ${localProgress}%, #374151 ${localProgress}%, #374151 100%)`,
          }}
        />
      </div>

      {/* Presets */}
      <div className="p-2 border-t border-surface-700">
        <p className="text-xs text-surface-500 mb-2 px-1">Valeurs rapides</p>
        <div className="flex gap-1">
          {PROGRESS_PRESETS.map((preset) => {
            const presetColors = getProgressColor(preset);
            const isActive = localProgress === preset;
            return (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  isActive 
                    ? 'ring-2 ring-offset-2 ring-offset-surface-800' 
                    : 'hover:opacity-80'
                }`}
                style={{ 
                  backgroundColor: presetColors.bgLight, 
                  color: presetColors.text,
                  ringColor: isActive ? presetColors.bg : 'transparent',
                }}
              >
                {preset}%
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="p-2 border-t border-surface-700 flex gap-2">
        <button
          onClick={() => handlePresetClick(0)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-surface-400 hover:text-surface-200 hover:bg-surface-700 rounded-lg transition-colors"
        >
          <Circle className="w-3.5 h-3.5" />
          Réinitialiser
        </button>
        <button
          onClick={() => handlePresetClick(100)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Terminer
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="relative" style={{ pointerEvents: 'auto' }}>
      <button
        type="button"
        ref={buttonRef}
        onClick={handleOpen}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full flex items-center gap-2 group bg-transparent border-none cursor-pointer relative z-10"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Progress bar */}
        <div className="flex-1 h-2.5 bg-surface-700 rounded-full overflow-hidden relative">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: colors.bg }}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
          {/* Animated shine effect */}
          {progress > 0 && progress < 100 && (
            <div 
              className="absolute inset-0 overflow-hidden rounded-full"
              style={{ width: `${progress}%` }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                style={{ animationDuration: '2s' }}
              />
            </div>
          )}
        </div>
        
        {/* Percentage */}
        <span 
          className="text-xs font-medium w-10 text-right transition-colors"
          style={{ color: colors.text }}
        >
          {progress}%
        </span>

        {/* Completed icon */}
        {progress >= 100 && (
          <CheckCircle2 className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
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
