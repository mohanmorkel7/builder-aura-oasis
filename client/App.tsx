import * as React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth-context";

// Error Boundary for Auth errors
class AuthErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Auth Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Authentication Error
            </h1>
            <p className="text-gray-600 mb-4">
              There was an issue with authentication. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
import DashboardLayout from "@/components/DashboardLayout";
import Login from "@/pages/Login";
import Overview from "@/pages/Overview";
import AdminPanel from "@/pages/AdminPanel";
import TemplateCreator from "@/pages/TemplateCreator";
import UserManagement from "@/pages/UserManagement";
import UserDetails from "@/pages/UserDetails";
import AddUser from "@/pages/AddUser";
import AddClient from "@/pages/AddClient";
import ClientDetails from "@/pages/ClientDetails";
import NewDeployment from "@/pages/NewDeployment";
import DeploymentDetails from "@/pages/DeploymentDetails";
import DeploymentEdit from "@/pages/DeploymentEdit";
import TemplateEdit from "@/pages/TemplateEdit";
import UserEdit from "@/pages/UserEdit";
import ClientEdit from "@/pages/ClientEdit";
import FollowUpNew from "@/pages/FollowUpNew";
import AdminReports from "@/pages/AdminReports";
import SalesDashboard from "@/pages/SalesDashboard";
import ProductManagement from "@/pages/ProductManagement";
import ProductWorkflow from "@/pages/ProductWorkflow";
import AlertsNotifications from "@/pages/AlertsNotifications";
import PlaceholderPage from "@/pages/PlaceholderPage";
import LeadDashboard from "@/pages/LeadDashboard";
import CreateLead from "@/pages/CreateLead";
import LeadDetails from "@/pages/LeadDetails";
import LeadEdit from "@/pages/LeadEdit";
import ProposalNew from "@/pages/ProposalNew";
import ProposalList from "@/pages/ProposalList";
import FollowUpTracker from "@/pages/FollowUpTracker";
import PipelineSettings from "@/pages/PipelineSettings";
import Tickets from "@/pages/Tickets";
import AdminTemplates from "@/pages/AdminTemplates";
import FinOpsDashboard from "@/pages/FinOpsDashboard";
import NotFound from "@/pages/NotFound";

// Protected Route Component
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  try {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    // Handle case where AuthProvider is not available (e.g., during HMR)
    console.error("ProtectedRoute AuthProvider error:", error);
    return <Navigate to="/login" replace />;
  }
}

// Auth Guard Component
function AuthGuard({ children }: { children: React.ReactNode }) {
  try {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      );
    }

    if (user) {
      return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    // Handle case where AuthProvider is not available (e.g., during HMR)
    console.error("AuthGuard AuthProvider error:", error);
    return <>{children}</>;
  }
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <AuthGuard>
            <Login />
          </AuthGuard>
        }
      />

      {/* Protected Routes with Layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Overview />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AdminTemplates />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/templates"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AdminTemplates />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/templates/new"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <TemplateCreator />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tickets"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Tickets />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <UserManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users/new"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AddUser />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users/:id"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <UserDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <UserEdit />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/templates/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <TemplateEdit />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout>
              <AdminReports />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/finops"
        element={
          <ProtectedRoute allowedRoles={["admin", "finance"]}>
            <DashboardLayout>
              <FinOpsDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <SalesDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/client/:id"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <ClientDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/new-client"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <AddClient />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/client/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <ClientEdit />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/client/:id/followup/new"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <FollowUpNew />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/followup/new"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <FollowUpNew />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/follow-up"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <FollowUpNew />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales", "product"]}>
            <DashboardLayout>
              <LeadDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads/new"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <CreateLead />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads/:id"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales", "product"]}>
            <DashboardLayout>
              <LeadDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <LeadEdit />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads/:id/follow-up"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales", "product"]}>
            <DashboardLayout>
              <FollowUpNew />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/proposals"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales", "product"]}>
            <DashboardLayout>
              <ProposalList />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/proposals/new"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <ProposalNew />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/follow-ups"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales", "product"]}>
            <DashboardLayout>
              <FollowUpTracker />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads/:id/proposal"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales", "product"]}>
            <DashboardLayout>
              <ProposalNew />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads/:id/pipeline-settings"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales", "product"]}>
            <DashboardLayout>
              <PipelineSettings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/reports"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <PlaceholderPage
                title="Sales Reports"
                description="View sales performance metrics and analytics"
              />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/product"
        element={
          <ProtectedRoute allowedRoles={["admin", "product"]}>
            <DashboardLayout>
              <ProductManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/product/deployment/new"
        element={
          <ProtectedRoute allowedRoles={["admin", "product"]}>
            <DashboardLayout>
              <NewDeployment />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/product/deployment/:id"
        element={
          <ProtectedRoute allowedRoles={["admin", "product"]}>
            <DashboardLayout>
              <DeploymentDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/product/deployment/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["admin", "product"]}>
            <DashboardLayout>
              <DeploymentEdit />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/product/pipeline"
        element={
          <ProtectedRoute allowedRoles={["admin", "product"]}>
            <DashboardLayout>
              <PlaceholderPage
                title="Release Pipeline"
                description="Monitor and manage the product release pipeline"
              />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/product/health"
        element={
          <ProtectedRoute allowedRoles={["admin", "product"]}>
            <DashboardLayout>
              <PlaceholderPage
                title="System Health"
                description="Monitor system performance and health metrics"
              />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <AlertsNotifications />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <PlaceholderPage
                title="Alert Details"
                description="View detailed information about this alert or notification"
              />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 Page */}
      <Route
        path="*"
        element={
          <DashboardLayout>
            <NotFound />
          </DashboardLayout>
        }
      />
    </Routes>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </AuthErrorBoundary>
    </QueryClientProvider>
  );
}
