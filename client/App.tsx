import * as React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth-context";
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
import ProductDashboard from "@/pages/ProductDashboard";
import AlertsNotifications from "@/pages/AlertsNotifications";
import PlaceholderPage from "@/pages/PlaceholderPage";
import LeadDashboard from "@/pages/LeadDashboard";
import CreateLead from "@/pages/CreateLead";
import LeadDetails from "@/pages/LeadDetails";
import LeadEdit from "@/pages/LeadEdit";
import NotFound from "@/pages/NotFound";

// Protected Route Component
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Auth Guard Component
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
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
              <AdminPanel />
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
        path="/sales/leads"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <LeadDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/leads/new"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <CreateLead />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/leads/:id"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <LeadDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/leads/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["admin", "sales"]}>
            <DashboardLayout>
              <LeadEdit />
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
              <ProductDashboard />
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
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
