import { useEffect, useState, useCallback, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import { workspaceApi } from '../../lib/api';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useAuthStore } from '../../stores/authStore';
import { initSocket, disconnectSocket, updateSocketAuth } from '../../lib/socket';

export default function Layout() {
  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const accessToken = useAuthStore((s) => s.accessToken);
  const socketInitRef = useRef(false);

  const { data: workspacesData } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const response = await workspaceApi.getAll();
      return response.data;
    },
  });

  useEffect(() => {
    if (workspacesData) setWorkspaces(workspacesData);
  }, [workspacesData, setWorkspaces]);

  useEffect(() => {
    if (!accessToken) return;

    if (!socketInitRef.current) {
      initSocket();
      socketInitRef.current = true;
    } else {
      updateSocketAuth();
    }

    return () => {
      disconnectSocket();
      socketInitRef.current = false;
    };
  }, [accessToken]);

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible' && accessToken) {
      initSocket();
    }
  }, [accessToken]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', () => accessToken && initSocket());
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', () => accessToken && initSocket());
    };
  }, [handleVisibilityChange, accessToken]);

  return (
    <div className="min-h-screen bg-trello-bg">
      <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        className="pt-12 transition-all duration-200"
        style={{ marginLeft: sidebarOpen ? 260 : 0 }}
      >
        <Outlet />
      </main>
    </div>
  );
}
