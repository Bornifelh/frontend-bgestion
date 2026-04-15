import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Plus,
  HelpCircle,
  Settings,
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
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-12 px-6">
          {/* Left: Board name if on board page */}
          <div className="flex items-center gap-3">
            {isBoardPage && currentBoard && (
              <div className="flex items-center gap-2">
                <span className="text-lg">{currentBoard.icon}</span>
                <h1 className="font-medium text-sm text-gray-800">
                  {currentBoard.name}
                </h1>
              </div>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="text-xs text-gray-400 hidden md:inline">Rechercher</span>
            </button>

            {/* Help */}
            <button className="p-2 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button className="p-2 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <Settings className="w-4 h-4" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <NotificationsDropdown onClose={() => setShowNotifications(false)} />
                )}
              </AnimatePresence>
            </div>

            {/* Add Task (board pages) */}
            {isBoardPage && (
              <button
                onClick={() => setShowCreateItem(true)}
                className="ml-2 btn btn-primary btn-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ajouter</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />

      {isBoardPage && (
        <CreateItemModal
          isOpen={showCreateItem}
          onClose={() => setShowCreateItem(false)}
        />
      )}
    </>
  );
}
