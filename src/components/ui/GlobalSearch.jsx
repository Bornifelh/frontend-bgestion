import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, FolderKanban, FileText, Users, Building2, 
  ArrowRight, Clock, Command
} from 'lucide-react';
import { searchApi } from '../../lib/api';
import { useDebounce } from '../../hooks/useDebounce';

export default function GlobalSearch({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ items: [], boards: [], workspaces: [], members: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  
  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search when query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults({ items: [], boards: [], workspaces: [], members: [] });
    }
  }, [debouncedQuery]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      const allResults = getAllResults();
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (allResults[selectedIndex]) {
            handleSelect(allResults[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results]);

  const getAllResults = () => [
    ...results.items,
    ...results.boards,
    ...results.workspaces,
    ...results.members,
  ];

  const performSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const { data } = await searchApi.global({ q: searchQuery, limit: 8 });
      setResults(data.grouped);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    // Save to recent searches
    const newRecent = [
      { ...item, searchedAt: new Date().toISOString() },
      ...recentSearches.filter(r => r.id !== item.id).slice(0, 4),
    ];
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));

    // Navigate based on type
    switch (item.type) {
      case 'item':
        navigate(`/board/${item.boardId}`);
        break;
      case 'board':
        navigate(`/board/${item.id}`);
        break;
      case 'workspace':
        navigate(`/workspace/${item.id}`);
        break;
      case 'member':
        // Could navigate to member profile
        break;
    }
    
    onClose();
    setQuery('');
  };

  const getIcon = (type) => {
    switch (type) {
      case 'item': return FileText;
      case 'board': return FolderKanban;
      case 'workspace': return Building2;
      case 'member': return Users;
      default: return FileText;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'item': return 'Item';
      case 'board': return 'Board';
      case 'workspace': return 'Espace';
      case 'member': return 'Membre';
      default: return type;
    }
  };

  if (!isOpen) return null;

  const allResults = getAllResults();
  const hasResults = allResults.length > 0;
  const showRecent = !query && recentSearches.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-[10vh]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="bg-surface-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-surface-700 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-700">
            <Search className={`w-5 h-5 ${loading ? 'text-primary-400 animate-pulse' : 'text-surface-400'}`} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher items, boards, membres..."
              className="flex-1 bg-transparent border-none outline-none text-surface-100 placeholder-surface-500"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 hover:bg-surface-700 rounded">
                <X className="w-4 h-4 text-surface-400" />
              </button>
            )}
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-surface-800 rounded text-xs text-surface-500">
              <Command className="w-3 h-3" />K
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {/* Loading */}
            {loading && (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}

            {/* Recent searches */}
            {showRecent && !loading && (
              <div className="p-3">
                <p className="px-3 py-2 text-xs font-medium text-surface-500 uppercase tracking-wider">
                  Recherches récentes
                </p>
                {recentSearches.map((item, index) => {
                  const Icon = getIcon(item.type);
                  return (
                    <button
                      key={`recent-${item.id}`}
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-800 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-surface-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-surface-200 truncate">{item.name}</p>
                        <p className="text-xs text-surface-500">{getTypeLabel(item.type)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Search results */}
            {hasResults && !loading && (
              <div className="p-3">
                {/* Items */}
                {results.items.length > 0 && (
                  <div className="mb-4">
                    <p className="px-3 py-2 text-xs font-medium text-surface-500 uppercase tracking-wider">
                      Items ({results.items.length})
                    </p>
                    {results.items.map((item, index) => (
                      <SearchResultItem
                        key={item.id}
                        item={item}
                        icon={FileText}
                        subtitle={item.boardName}
                        isSelected={selectedIndex === index}
                        onClick={() => handleSelect(item)}
                      />
                    ))}
                  </div>
                )}

                {/* Boards */}
                {results.boards.length > 0 && (
                  <div className="mb-4">
                    <p className="px-3 py-2 text-xs font-medium text-surface-500 uppercase tracking-wider">
                      Boards ({results.boards.length})
                    </p>
                    {results.boards.map((item, index) => (
                      <SearchResultItem
                        key={item.id}
                        item={item}
                        icon={FolderKanban}
                        subtitle={item.workspaceName}
                        isSelected={selectedIndex === results.items.length + index}
                        onClick={() => handleSelect(item)}
                        iconEmoji={item.icon}
                      />
                    ))}
                  </div>
                )}

                {/* Workspaces */}
                {results.workspaces.length > 0 && (
                  <div className="mb-4">
                    <p className="px-3 py-2 text-xs font-medium text-surface-500 uppercase tracking-wider">
                      Espaces de travail ({results.workspaces.length})
                    </p>
                    {results.workspaces.map((item, index) => (
                      <SearchResultItem
                        key={item.id}
                        item={item}
                        icon={Building2}
                        isSelected={selectedIndex === results.items.length + results.boards.length + index}
                        onClick={() => handleSelect(item)}
                        iconEmoji={item.icon}
                      />
                    ))}
                  </div>
                )}

                {/* Members */}
                {results.members.length > 0 && (
                  <div>
                    <p className="px-3 py-2 text-xs font-medium text-surface-500 uppercase tracking-wider">
                      Membres ({results.members.length})
                    </p>
                    {results.members.map((item, index) => (
                      <SearchResultItem
                        key={item.id}
                        item={item}
                        icon={Users}
                        subtitle={item.email}
                        isSelected={selectedIndex === results.items.length + results.boards.length + results.workspaces.length + index}
                        onClick={() => handleSelect(item)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No results */}
            {!hasResults && query.length >= 2 && !loading && (
              <div className="p-8 text-center">
                <Search className="w-10 h-10 text-surface-600 mx-auto mb-3" />
                <p className="text-surface-400">Aucun résultat pour "{query}"</p>
                <p className="text-sm text-surface-500 mt-1">
                  Essayez avec d'autres termes
                </p>
              </div>
            )}

            {/* Initial state */}
            {!hasResults && !showRecent && query.length < 2 && !loading && (
              <div className="p-8 text-center">
                <Search className="w-10 h-10 text-surface-600 mx-auto mb-3" />
                <p className="text-surface-400">Tapez pour rechercher</p>
                <p className="text-sm text-surface-500 mt-1">
                  Minimum 2 caractères
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-surface-800 bg-surface-800/50 text-xs text-surface-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-surface-700 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-surface-700 rounded">↓</kbd>
                naviguer
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-surface-700 rounded">↵</kbd>
                sélectionner
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface-700 rounded">esc</kbd>
              fermer
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SearchResultItem({ item, icon: Icon, subtitle, isSelected, onClick, iconEmoji }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left group ${
        isSelected ? 'bg-primary-500/20' : 'hover:bg-surface-800'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        isSelected ? 'bg-primary-500/30' : 'bg-surface-800'
      }`}>
        {iconEmoji ? (
          <span className="text-lg">{iconEmoji}</span>
        ) : (
          <Icon className={`w-4 h-4 ${isSelected ? 'text-primary-400' : 'text-surface-400'}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`truncate ${isSelected ? 'text-primary-200' : 'text-surface-200'}`}>
          {item.name}
        </p>
        {subtitle && (
          <p className="text-xs text-surface-500 truncate">{subtitle}</p>
        )}
      </div>
      <ArrowRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${
        isSelected ? 'text-primary-400 opacity-100' : 'text-surface-500'
      }`} />
    </button>
  );
}
