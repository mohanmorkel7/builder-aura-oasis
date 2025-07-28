import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/DashboardLayout';
import Login from '@/pages/Login';
import Overview from '@/pages/Overview';
import AdminPanel from '@/pages/AdminPanel';
import TemplateCreator from '@/pages/TemplateCreator';
import UserManagement from '@/pages/UserManagement';
import SalesDashboard from '@/pages/SalesDashboard';
import ProductDashboard from '@/pages/ProductDashboard';
import AlertsNotifications from '@/pages/AlertsNotifications';
import PlaceholderPage from '@/pages/PlaceholderPage';
import NotFound from '@/pages/NotFound';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
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
      <Route path="/login" element={
        <AuthGuard>
          <Login />
        </AuthGuard>
      } />
      
      {/* Protected Routes with Layout */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Overview />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <AdminPanel />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/admin/templates/new" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <TemplateCreator />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <UserManagement />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/users/new" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <PlaceholderPage
              title="Add New User"
              description="Create a new user account and assign roles"
            />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/users/:id" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <PlaceholderPage
              title="User Details"
              description="View detailed user information and activity"
            />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/users/:id/edit" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <PlaceholderPage
              title="Edit User"
              description="Modify user account details and permissions"
            />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/templates/:id/edit" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <PlaceholderPage
              title="Edit Template"
              description="Modify onboarding template configuration"
            />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/reports" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout>
            <PlaceholderPage
              title="System Reports"
              description="View comprehensive system analytics and reports"
            />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/sales" element={
        <ProtectedRoute allowedRoles={['admin', 'sales']}>
          <DashboardLayout>
            <SalesDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/sales/client/:id" element={
        <ProtectedRoute allowedRoles={['admin', 'sales']}>
          <DashboardLayout>
            <PlaceholderPage 
              title="Client Details" 
              description="View and manage detailed client information and onboarding progress" 
            />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/sales/new-client" element={
        <ProtectedRoute allowedRoles={['admin', 'sales']}>
          <DashboardLayout>
            <PlaceholderPage
              title="Add New Client"
              description="Create a new client profile and start the onboarding process"
            />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/sales/client/:id/edit" element={
        <ProtectedRoute allowedRoles={['admin', 'sales']}>
          <DashboardLayout>
            <PlaceholderPage
              title="Edit Client"
              description="Modify client information and settings"
            />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/sales/followup/new" element={
        <ProtectedRoute allowedRoles={['admin', 'sales']}>
          <DashboardLayout>
            <PlaceholderPage
              title="Schedule Follow-up"
              description="Create a new follow-up task for client management"
            />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/sales/reports" element={
        <ProtectedRoute allowedRoles={['admin', 'sales']}>
          <DashboardLayout>
            <PlaceholderPage
              title="Sales Reports"
              description="View sales performance metrics and analytics"
            />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/product" element={
        <ProtectedRoute allowedRoles={['admin', 'product']}>
          <DashboardLayout>
            <ProductDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/product/deployment/new" element={
        <ProtectedRoute allowedRoles={['admin', 'product']}>
          <DashboardLayout>
            <PlaceholderPage
              title="New Deployment"
              description="Create and configure a new product deployment"
            />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/product/pipeline" element={
        <ProtectedRoute allowedRoles={['admin', 'product']}>
          <DashboardLayout>
            <PlaceholderPage
              title="Release Pipeline"
              description="Monitor and manage the product release pipeline"
            />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/product/health" element={
        <ProtectedRoute allowedRoles={['admin', 'product']}>
          <DashboardLayout>
            <PlaceholderPage
              title="System Health"
              description="Monitor system performance and health metrics"
            />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/alerts" element={
        <ProtectedRoute>
          <DashboardLayout>
            <AlertsNotifications />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/alerts/:id" element={
        <ProtectedRoute>
          <DashboardLayout>
            <PlaceholderPage 
              title="Alert Details" 
              description="View detailed information about this alert or notification" 
            />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* 404 Page */}
      <Route path="*" element={
        <DashboardLayout>
          <NotFound />
        </DashboardLayout>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
