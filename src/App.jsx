import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ChangePassword from './pages/auth/ChangePassword';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import Board from './pages/Board';
import Settings from './pages/Settings';
import Members from './pages/Members';
import Budgets from './pages/Budgets';
import BudgetDetails from './pages/BudgetDetails';
import TeamEvaluation from './pages/TeamEvaluation';

// Tickets
import SubmitTicket from './pages/tickets/SubmitTicket';
import AdminTickets from './pages/tickets/AdminTickets';

// SDSI (Schéma Directeur des Systèmes d'Information)
import SDSIDashboard from './pages/sdsi/SDSIDashboard';
import SDSIProjects from './pages/sdsi/SDSIProjects';
import SDSIProjectDetails from './pages/sdsi/SDSIProjectDetails';
import SDSIApplications from './pages/sdsi/SDSIApplications';
import SDSIKPIs from './pages/sdsi/SDSIKPIs';
import SDSIResources from './pages/sdsi/SDSIResources';
import SDSIAxes from './pages/sdsi/SDSIAxes';
import PermissionsSettings from './pages/settings/PermissionsSettings';

function ProtectedRoute({ children, allowPasswordChange = false }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-surface-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to password change if required (unless we're already on that page)
  if (user?.mustChangePassword && !allowPasswordChange && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <Login />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <AuthLayout>
              <Register />
            </AuthLayout>
          </PublicRoute>
        }
      />
      
      {/* Change password route (for invited users with temp password) */}
      <Route
        path="/change-password"
        element={
          <ProtectedRoute allowPasswordChange>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="workspace/:workspaceId" element={<Workspace />} />
        <Route path="workspace/:workspaceId/members" element={<Members />} />
        <Route path="workspace/:workspaceId/budgets" element={<Budgets />} />
        <Route path="workspace/:workspaceId/budget/:budgetId" element={<BudgetDetails />} />
        <Route path="workspace/:workspaceId/evaluation" element={<TeamEvaluation />} />
        
        {/* Tickets */}
        <Route path="workspace/:workspaceId/tickets" element={<SubmitTicket />} />
        <Route path="workspace/:workspaceId/tickets/admin" element={<AdminTickets />} />
        
        <Route path="board/:boardId" element={<Board />} />
        
        {/* SDSI Routes - Simplified */}
        <Route path="workspace/:workspaceId/sdsi" element={<SDSIDashboard />} />
        <Route path="workspace/:workspaceId/sdsi/axes" element={<SDSIAxes />} />
        <Route path="workspace/:workspaceId/sdsi/projects" element={<SDSIProjects />} />
        <Route path="workspace/:workspaceId/sdsi/project/:projectId" element={<SDSIProjectDetails />} />
        <Route path="workspace/:workspaceId/sdsi/resources" element={<SDSIResources />} />
        <Route path="workspace/:workspaceId/sdsi/applications" element={<SDSIApplications />} />
        <Route path="workspace/:workspaceId/sdsi/kpis" element={<SDSIKPIs />} />
        <Route path="workspace/:workspaceId/permissions" element={<PermissionsSettings />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
