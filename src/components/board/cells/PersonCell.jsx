import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, UserPlus, Users, Check } from 'lucide-react';
import { memberApi, itemApi } from '../../../lib/api';
import { useBoardStore } from '../../../stores/boardStore';
import toast from 'react-hot-toast';

// Cache for workspace members to persist across re-renders
const membersCache = new Map();

export default function PersonCell({ item, column, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const updateItemValue = useBoardStore((state) => state.updateItemValue);
  const currentBoard = useBoardStore((state) => state.currentBoard);

  // Handle both value formats - memoize to prevent infinite loops
  const selectedUserIds = useMemo(() => {
    return Array.isArray(value) ? value : (value?.userIds || []);
  }, [value]);

  // Load workspace members with caching
  const loadWorkspaceMembers = async (forceReload = false) => {
    const workspaceId = currentBoard?.workspaceId;
    if (!workspaceId) return [];
    
    // Check cache first
    if (!forceReload && membersCache.has(workspaceId)) {
      const cached = membersCache.get(workspaceId);
      setWorkspaceMembers(cached);
      return cached;
    }
    
    if (loading) return workspaceMembers;
    
    setLoading(true);
    try {
      const response = await memberApi.getByWorkspace(workspaceId);
      const members = response.data || [];
      membersCache.set(workspaceId, members);
      setWorkspaceMembers(members);
      return members;
    } catch (error) {
      console.error('Load members error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Initialize from cache or load members
  useEffect(() => {
    const workspaceId = currentBoard?.workspaceId;
    if (workspaceId) {
      if (membersCache.has(workspaceId)) {
        setWorkspaceMembers(membersCache.get(workspaceId));
      } else if (selectedUserIds.length > 0 && !loading) {
        loadWorkspaceMembers();
      }
    }
  }, [currentBoard?.workspaceId]);

  // Compute selected users based on IDs and available members
  const selectedUsers = useMemo(() => {
    if (workspaceMembers.length === 0 || selectedUserIds.length === 0) {
      return [];
    }
    return workspaceMembers.filter(m => selectedUserIds.includes(m.id));
  }, [selectedUserIds, workspaceMembers]);

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
    e.preventDefault();
    e.stopPropagation();
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - 300),
      });
    }
    
    // Load members when opening if not already loaded
    if (workspaceMembers.length === 0 && !loading && currentBoard?.workspaceId) {
      loadWorkspaceMembers();
    }
    
    setIsOpen(!isOpen);
    setSearchQuery('');
  };

  const filteredMembers = workspaceMembers.filter(member => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return member.fullName?.toLowerCase().includes(q) || 
           member.email?.toLowerCase().includes(q);
  });

  const handleToggleUser = async (user) => {
    const isSelected = selectedUserIds.includes(user.id);
    const newUserIds = isSelected
      ? selectedUserIds.filter((id) => id !== user.id)
      : [...selectedUserIds, user.id];

    try {
      // Update store first for immediate UI feedback
      updateItemValue(item.id, column.id, newUserIds);
      // Then persist to backend
      await itemApi.updateValue(item.id, column.id, newUserIds);
      toast.success(isSelected ? 'Membre retiré' : 'Membre assigné');
    } catch (error) {
      // Revert on error
      updateItemValue(item.id, column.id, selectedUserIds);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleRemoveUser = async (userId, e) => {
    e.stopPropagation();
    const newUserIds = selectedUserIds.filter((id) => id !== userId);
    try {
      // Update store first for immediate UI feedback
      updateItemValue(item.id, column.id, newUserIds);
      // Then persist to backend
      await itemApi.updateValue(item.id, column.id, newUserIds);
      toast.success('Membre retiré');
    } catch (error) {
      // Revert on error
      updateItemValue(item.id, column.id, selectedUserIds);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getInitials = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || '?';
  };

  const getAvatarColor = (user) => {
    const colors = [
      '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
      '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'
    ];
    const index = (user.id || user.email || '').charCodeAt(0) % colors.length;
    return colors[index];
  };

  const menuContent = (
    <motion.div
      key="person-cell-menu"
      ref={menuRef}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="fixed z-[9999] w-72 bg-surface-800 border border-surface-700 rounded-xl shadow-2xl overflow-hidden"
      style={{ top: menuPosition.top, left: menuPosition.left }}
    >
      {/* Header */}
      <div className="p-2 border-b border-surface-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            type="text"
            placeholder="Rechercher un membre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-700 border-none rounded-lg text-sm text-surface-200 placeholder-surface-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            autoFocus
          />
        </div>
      </div>

      {/* Selected users summary */}
      {selectedUsers.length > 0 && (
        <div className="px-3 py-2 border-b border-surface-700 bg-surface-850">
          <p className="text-xs text-surface-500 mb-2">
            {selectedUsers.length} assigné{selectedUsers.length > 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-1 px-2 py-1 bg-surface-700 rounded-full text-xs"
              >
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white font-medium"
                  style={{ backgroundColor: getAvatarColor(user) }}
                >
                  {getInitials(user)}
                </div>
                <span className="text-surface-300 max-w-[80px] truncate">
                  {user.firstName || user.email?.split('@')[0]}
                </span>
                <button
                  onClick={(e) => handleRemoveUser(user.id, e)}
                  className="p-0.5 hover:bg-surface-600 rounded-full text-surface-500 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="max-h-56 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredMembers.length > 0 ? (
          filteredMembers.map((member) => {
            const isSelected = selectedUserIds.includes(member.id);
            return (
              <button
                key={member.id}
                onClick={() => handleToggleUser(member)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-700 transition-colors ${
                  isSelected ? 'bg-primary-600/10' : ''
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-medium flex-shrink-0"
                  style={{ backgroundColor: getAvatarColor(member) }}
                >
                  {getInitials(member)}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-surface-200 truncate">
                    {member.fullName || member.email}
                  </p>
                  <p className="text-xs text-surface-500 truncate">
                    {member.role === 'owner' ? 'Propriétaire' : 
                     member.role === 'admin' ? 'Admin' : 'Membre'}
                  </p>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-primary-400 flex-shrink-0" />
                )}
              </button>
            );
          })
        ) : (
          <div className="p-4 text-center text-sm text-surface-500">
            <Users className="w-6 h-6 mx-auto mb-2 text-surface-600" />
            {searchQuery ? 'Aucun membre trouvé' : 'Aucun membre disponible'}
          </div>
        )}
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
        className="w-full flex items-center gap-1 min-h-[32px] cursor-pointer rounded-md hover:bg-surface-700/50 px-1 py-0.5 transition-colors bg-transparent border-none text-left relative z-10"
        style={{ pointerEvents: 'auto' }}
      >
        {selectedUsers.length > 0 ? (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center -space-x-2">
              {selectedUsers.slice(0, 3).map((user, i) => (
                <div
                  key={user.id}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white font-medium ring-2 ring-surface-900 group relative"
                  style={{ 
                    backgroundColor: getAvatarColor(user),
                    zIndex: 3 - i 
                  }}
                  title={user.fullName || user.email}
                >
                  {getInitials(user)}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleRemoveUser(user.id, e)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRemoveUser(user.id, e)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 hidden group-hover:flex transition-opacity cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                  </span>
                </div>
              ))}
              {selectedUsers.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-surface-700 flex items-center justify-center text-[10px] text-surface-400 font-medium ring-2 ring-surface-900">
                  +{selectedUsers.length - 3}
                </div>
              )}
            </div>
            {selectedUsers.length === 1 && (
              <span className="text-xs text-surface-400 truncate max-w-[80px]">
                {selectedUsers[0].firstName || selectedUsers[0].email?.split('@')[0]}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-surface-500 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4" />
            <span>Assigner</span>
          </span>
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
