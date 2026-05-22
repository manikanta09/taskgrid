import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import WorkflowListPage from './pages/workflows/WorkflowListPage';
import WorkflowDetailPage from './pages/workflows/WorkflowDetailPage';
import WorkflowBuilderPage from './pages/workflows/WorkflowBuilderPage';
import TaskQueuePage from './pages/tasks/TaskQueuePage';
import TaskDetailPage from './pages/tasks/TaskDetailPage';
import ApprovalsPage from './pages/approvals/ApprovalsPage';
import AdminPage from './pages/admin/AdminPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="workflows" element={<WorkflowListPage />} />
        <Route path="workflows/new" element={<WorkflowBuilderPage />} />
        <Route path="workflows/:id" element={<WorkflowDetailPage />} />
        <Route path="tasks" element={<TaskQueuePage />} />
        <Route path="tasks/mine" element={<TaskQueuePage />} />
        <Route path="tasks/:id" element={<TaskDetailPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
