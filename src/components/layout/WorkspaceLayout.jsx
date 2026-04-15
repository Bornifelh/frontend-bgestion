import { useEffect } from 'react';
import { useParams, useLocation, Link, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MoreHorizontal,
  LayoutDashboard,
  BarChart3,
  Wallet,
  Clock,
  Ticket,
  Settings,
} from 'lucide-react';
import { workspaceApi } from '../../lib/api';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { joinWorkspace, leaveWorkspace } from '../../lib/socket';

const tabs = [
  { id: 'boards', label: 'Boards', icon: LayoutDashboard, path: '' },
  { id: 'reports', label: 'Rapports', icon: BarChart3, path: '/reports' },
  { id: 'budgets', label: 'Budgets', icon: Wallet, path: '/budgets' },
  { id: 'time', label: 'Temps', icon: Clock, path: '/time-report' },
  { id: 'tickets', label: 'Tickets', icon: Ticket, path: '/tickets' },
  { id: 'settings', label: 'Parametres', icon: Settings, path: '/permissions' },
];

export default function WorkspaceLayout() {
  const { workspaceId } = useParams();
  const location = useLocation();
  const { setCurrentWorkspace } = useWorkspaceStore();

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const response = await workspaceApi.getOne(workspaceId);
      return response.data;
    },
  });

  useEffect(() => {
    if (workspace) {
      setCurrentWorkspace(workspace);
      joinWorkspace(workspaceId);
    }
    return () => leaveWorkspace(workspaceId);
  }, [workspace, workspaceId, setCurrentWorkspace]);

  const getActiveTab = () => {
    const path = location.pathname;
    const base = `/workspace/${workspaceId}`;
    if (path === base) return 'boards';
    for (const tab of tabs) {
      if (tab.path && path.startsWith(base + tab.path)) return tab.id;
    }
    return 'boards';
  };

  const activeTab = getActiveTab();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#F36F21] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Workspace non trouve</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-48px)]">
      {/* Workspace header - Infratex navy gradient */}
      <div className="bg-gradient-to-r from-[#173D68] to-[#1E5090] px-6 py-5">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg flex-shrink-0"
            style={{ backgroundColor: workspace.color || '#F36F21' }}
          >
            {workspace.icon || (workspace.name || 'W')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-white truncate">{workspace.name}</h1>
            {workspace.description && (
              <p className="text-sm text-white/60 truncate mt-0.5">{workspace.description}</p>
            )}
          </div>
          <button className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs - orange accent on active */}
      <div className="flex items-center gap-0 px-6 bg-white border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              to={`/workspace/${workspaceId}${tab.path}`}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? 'border-[#F36F21] text-[#F36F21]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-6">
        <Outlet context={{ workspace, workspaceId }} />
      </div>
    </div>
  );
}
