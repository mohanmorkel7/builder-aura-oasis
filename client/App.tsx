import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/DashboardLayout';
import Login from '@/pages/Login';
import Overview from '@/pages/Overview';
import AdminPanel from '@/pages/AdminPanel';
import TemplateCreator from '@/pages/TemplateCreator';
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
            <PlaceholderPage 
              title="Create New Template" 
              description="Build custom onboarding workflows for your clients" 
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
