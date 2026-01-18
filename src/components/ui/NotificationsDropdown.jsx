import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { notificationApi } from '../../lib/api';

export default function NotificationsDropdown({ onClose }) {
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await notificationApi.getAll({ limit: 10 });
      return response.data;
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.notifications-dropdown')) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="notifications-dropdown absolute right-0 top-full mt-2 w-96 bg-surface-800 border border-surface-700 rounded-2xl shadow-2xl overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-700">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary-400" />
          <span className="font-semibold text-surface-100">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary-600 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
          >
            <CheckCheck className="w-4 h-4" />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="w-10 h-10 text-surface-600 mb-3" />
            <p className="text-sm text-surface-500">Aucune notification</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-surface-700/50 hover:bg-surface-700/30 transition-colors ${
                !notification.isRead ? 'bg-primary-600/5' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-200 mb-1">
                    {notification.title}
                  </p>
                  {notification.message && (
                    <p className="text-xs text-surface-500 line-clamp-2">
                      {notification.message}
                    </p>
                  )}
                  <p className="text-xs text-surface-600 mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>
                {!notification.isRead && (
                  <button
                    onClick={() => markAsReadMutation.mutate(notification.id)}
                    className="p-1.5 rounded-lg hover:bg-surface-700 text-surface-500"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-surface-700">
          <button className="w-full text-sm text-primary-400 hover:text-primary-300 font-medium">
            Voir toutes les notifications
          </button>
        </div>
      )}
    </motion.div>
  );
}
