import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  Menu,
  Search,
  Bell,
  Plus,
  ChevronDown,
  Info,
} from 'lucide-react';
import NotificationsDropdown from '../ui/NotificationsDropdown';
import GlobalSearch from '../ui/GlobalSearch';
import CreateItemModal from '../modals/CreateItemModal';
import { useBoardStore } from '../../stores/boardStore';
import infratexLogo from '../../assets/infratex-logo.png';

export default function TopBar({ onToggleSidebar }) {
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
      <header className="topbar fixed top-0 left-0 right-0 z-40">
        {/* Left */}
        <div className="flex items-center gap-2">
          <button onClick={onToggleSidebar} className="topbar-btn px-2">
            <Menu className="w-4 h-4" />
          </button>

          <Link to="/" className="topbar-btn font-bold text-base gap-1.5">
            <img src={infratexLogo} alt="Infratex" className="w-6 h-6 rounded" />
            <span className="hidden sm:inline">GesProjet</span>
          </Link>

          <Link to="/" className="topbar-btn hidden md:flex">Boards</Link>

          <button
            onClick={() => setShowCreateItem(true)}
            className="topbar-btn bg-white/20 hover:bg-white/30 px-2"
            title="Creer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Center - Board info on board pages */}
        {isBoardPage && currentBoard && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-white">
              <span className="text-lg">{currentBoard.icon}</span>
              <span className="font-bold text-sm">{currentBoard.name}</span>
            </div>
          </div>
        )}
        {!isBoardPage && <div className="flex-1" />}

        {/* Right */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSearch(true)}
            className="topbar-btn"
          >
            <Search className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="topbar-btn relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent-red rounded-full" />
            </button>
            <AnimatePresence>
              {showNotifications && (
                <NotificationsDropdown onClose={() => setShowNotifications(false)} />
              )}
            </AnimatePresence>
          </div>

          <button className="topbar-btn px-1">
            <Info className="w-4 h-4" />
          </button>
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
