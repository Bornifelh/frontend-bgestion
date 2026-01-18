import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import Header from './Header';
import { workspaceApi } from '../../lib/api';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { initSocket, disconnectSocket } from '../../lib/socket';

export default function Layout() {
  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces);

  // Fetch workspaces
  const { data: workspacesData } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const response = await workspaceApi.getAll();
      return response.data;
    },
  });

  useEffect(() => {
    if (workspacesData) {
      setWorkspaces(workspacesData);
    }
  }, [workspacesData, setWorkspaces]);

  // Initialize socket
  useEffect(() => {
    const socket = initSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <div className="min-h-screen bg-surface-950 bg-grid">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />
      
      <Sidebar />
      
      <div className="pl-64">
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
