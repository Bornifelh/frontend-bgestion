import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Plus,
  Filter,
  ChevronDown,
  Command,
} from 'lucide-react';
import { useBoardStore } from '../../stores/boardStore';
import NotificationsDropdown from '../ui/NotificationsDropdown';
import GlobalSearch from '../ui/GlobalSearch';
import CreateItemModal from '../modals/CreateItemModal';

export default function Header() {
  const location = useLocation();
  const currentBoard = useBoardStore((state) => state.currentBoard);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreateItem, setShowCreateItem] = useState(false);

  const isBoardPage = location.pathname.startsWith('/board/');

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface-950/80 backdrop-blur-xl border-b border-surface-800">
        <div className="flex items-center justify-between h-16 px-6">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {isBoardPage && currentBoard && (
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentBoard.icon}</span>
                <div>
                  <h1 className="font-display font-semibold text-lg text-surface-100">
                    {currentBoard.name}
                  </h1>
                  {currentBoard.description && (
                    <p className="text-xs text-surface-500">
                      {currentBoard.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Search button */}
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-800/50 hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors group"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm hidden md:inline">Rechercher...</span>
              <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 bg-surface-700/50 group-hover:bg-surface-700 rounded text-xs text-surface-500">
                <Command className="w-3 h-3" />K
              </kbd>
            </button>

            {/* Filters (only on board page) */}
            {isBoardPage && (
              <button className="btn btn-ghost">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filtres</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <NotificationsDropdown
                    onClose={() => setShowNotifications(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Create item button (only on board page) */}
            {isBoardPage && (
              <button
                onClick={() => setShowCreateItem(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nouvel item</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearch 
        isOpen={showSearch} 
        onClose={() => setShowSearch(false)} 
      />

      {isBoardPage && (
        <CreateItemModal
          isOpen={showCreateItem}
          onClose={() => setShowCreateItem(false)}
        />
      )}
    </>
  );
}
