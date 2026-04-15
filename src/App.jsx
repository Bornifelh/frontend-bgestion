import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';
import WorkspaceLayout from './components/layout/WorkspaceLayout';
import ErrorBoundary from './components/ErrorBoundary';

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ChangePassword = lazy(() => import('./pages/auth/ChangePassword'));

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Workspace = lazy(() => import('./pages/Workspace'));
const Board = lazy(() => import('./pages/Board'));
const Settings = lazy(() => import('./pages/Settings'));
const Members = lazy(() => import('./pages/Members'));
const Budgets = lazy(() => import('./pages/Budgets'));
const BudgetDetails = lazy(() => import('./pages/BudgetDetails'));
const TeamEvaluation = lazy(() => import('./pages/TeamEvaluation'));
const TimeReport = lazy(() => import('./pages/TimeReport'));
const CustomDashboard = lazy(() => import('./pages/CustomDashboard'));
const Reports = lazy(() => import('./pages/Reports'));

const GlobalReports = lazy(() => import('./pages/GlobalReports'));
const GlobalTasks = lazy(() => import('./pages/GlobalTasks'));
const GlobalIssues = lazy(() => import('./pages/GlobalIssues'));
const GlobalTimesheets = lazy(() => import('./pages/GlobalTimesheets'));
const Collaboration = lazy(() => import('./pages/Collaboration'));
const Approvals = lazy(() => import('./pages/Approvals'));

const SubmitTicket = lazy(() => import('./pages/tickets/SubmitTicket'));
const AdminTickets = lazy(() => import('./pages/tickets/AdminTickets'));

const SDSIDashboard = lazy(() => import('./pages/sdsi/SDSIDashboard'));
const SDSIProjects = lazy(() => import('./pages/sdsi/SDSIProjects'));
const SDSIProjectDetails = lazy(() => import('./pages/sdsi/SDSIProjectDetails'));
const SDSIApplications = lazy(() => import('./pages/sdsi/SDSIApplications'));
const SDSIKPIs = lazy(() => import('./pages/sdsi/SDSIKPIs'));
const SDSIResources = lazy(() => import('./pages/sdsi/SDSIResources'));
const SDSIAxes = lazy(() => import('./pages/sdsi/SDSIAxes'));
const PermissionsSettings = lazy(() => import('./pages/settings/PermissionsSettings'));
const ITAssetManagement = lazy(() => import('./pages/ITAssetManagement'));

function ProtectedRoute({ children, allowPasswordChange = false }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

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

const PageLoader = () => (
  <div className="flex h-full min-h-[200px] items-center justify-center">
    <div className="flex flex-col items-center gap-2">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#F36F21] border-t-transparent" />
      <span className="text-xs text-gray-400">Chargement...</span>
    </div>
  </div>
);

const SuspenseFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7]">
    <div className="flex flex-col items-center gap-3">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#F36F21] border-t-transparent" />
      <span className="text-sm text-gray-500">Chargement...</span>
    </div>
  </div>
);

function SuspendedRoute({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          <Route
            path="/login"
            element={<PublicRoute><AuthLayout><Login /></AuthLayout></PublicRoute>}
          />
          <Route
            path="/register"
            element={<PublicRoute><AuthLayout><Register /></AuthLayout></PublicRoute>}
          />
          <Route
            path="/change-password"
            element={<ProtectedRoute allowPasswordChange><ChangePassword /></ProtectedRoute>}
          />

          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<SuspendedRoute><Dashboard /></SuspendedRoute>} />

            {/* Global pages */}
            <Route path="reports" element={<SuspendedRoute><GlobalReports /></SuspendedRoute>} />
            <Route path="tasks" element={<SuspendedRoute><GlobalTasks /></SuspendedRoute>} />
            <Route path="issues" element={<SuspendedRoute><GlobalIssues /></SuspendedRoute>} />
            <Route path="timesheets" element={<SuspendedRoute><GlobalTimesheets /></SuspendedRoute>} />
            <Route path="collaboration" element={<SuspendedRoute><Collaboration /></SuspendedRoute>} />
            <Route path="approvals" element={<SuspendedRoute><Approvals /></SuspendedRoute>} />

            {/* Workspace pages */}
            <Route path="workspace/:workspaceId" element={<WorkspaceLayout />}>
              <Route index element={<SuspendedRoute><Workspace /></SuspendedRoute>} />
              <Route path="members" element={<SuspendedRoute><Members /></SuspendedRoute>} />
              <Route path="budgets" element={<SuspendedRoute><Budgets /></SuspendedRoute>} />
              <Route path="budget/:budgetId" element={<SuspendedRoute><BudgetDetails /></SuspendedRoute>} />
              <Route path="evaluation" element={<SuspendedRoute><TeamEvaluation /></SuspendedRoute>} />
              <Route path="time-report" element={<SuspendedRoute><TimeReport /></SuspendedRoute>} />
              <Route path="dashboard" element={<SuspendedRoute><CustomDashboard /></SuspendedRoute>} />
              <Route path="reports" element={<SuspendedRoute><Reports /></SuspendedRoute>} />
              <Route path="tickets" element={<SuspendedRoute><SubmitTicket /></SuspendedRoute>} />
              <Route path="tickets/admin" element={<SuspendedRoute><AdminTickets /></SuspendedRoute>} />
              <Route path="sdsi" element={<SuspendedRoute><SDSIDashboard /></SuspendedRoute>} />
              <Route path="sdsi/axes" element={<SuspendedRoute><SDSIAxes /></SuspendedRoute>} />
              <Route path="sdsi/projects" element={<SuspendedRoute><SDSIProjects /></SuspendedRoute>} />
              <Route path="sdsi/project/:projectId" element={<SuspendedRoute><SDSIProjectDetails /></SuspendedRoute>} />
              <Route path="sdsi/resources" element={<SuspendedRoute><SDSIResources /></SuspendedRoute>} />
              <Route path="sdsi/applications" element={<SuspendedRoute><SDSIApplications /></SuspendedRoute>} />
              <Route path="sdsi/kpis" element={<SuspendedRoute><SDSIKPIs /></SuspendedRoute>} />
              <Route path="permissions" element={<SuspendedRoute><PermissionsSettings /></SuspendedRoute>} />
            </Route>

            <Route path="board/:boardId" element={<SuspendedRoute><Board /></SuspendedRoute>} />
            <Route path="it-assets" element={<SuspendedRoute><ITAssetManagement /></SuspendedRoute>} />
            <Route path="settings" element={<SuspendedRoute><Settings /></SuspendedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
