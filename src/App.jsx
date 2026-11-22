import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layouts
import { AuthenticatedLayout } from './components/layout/AuthenticatedLayout';
import { PublicLayout } from './components/layout/PublicLayout';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { FindFood } from './pages/FindFood';
import { DonationDetails } from './pages/DonationDetails';
import { CreateDonation } from './pages/CreateDonation';
import { MyDonations } from './pages/MyDonations';
import { Reservations } from './pages/Reservations';
import { Pickups } from './pages/Pickups';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { AdminPanel } from './pages/AdminPanel';
import { NotFound } from './pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAF8] space-y-3">
        <div className="w-10 h-10 border-4 border-[#EAF4EE] border-t-[#2E7D5B] rounded-full animate-spin" />
        <p className="text-xs font-semibold text-[#718078]">Loading Annadhara...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.map((r) => r.toLowerCase()).includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
};

// Route wrapper for pages accessible both publicly and by authenticated users
const FlexibleRoute = ({ component: Component }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <AuthenticatedLayout>
        <Component />
      </AuthenticatedLayout>
    );
  }

  return (
    <PublicLayout>
      <Component />
    </PublicLayout>
  );
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <PublicLayout>
                  <Home />
                </PublicLayout>
              }
            />
            <Route
              path="/login"
              element={
                <PublicLayout>
                  <Login />
                </PublicLayout>
              }
            />
            <Route
              path="/register"
              element={
                <PublicLayout>
                  <Register />
                </PublicLayout>
              }
            />

            {/* Flexible Routes (Public or Authenticated) */}
            <Route path="/find-food" element={<FlexibleRoute component={FindFood} />} />
            <Route path="/donations/:id" element={<FlexibleRoute component={DonationDetails} />} />

            {/* Authenticated Routes with Role Protection */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-donation"
              element={
                <ProtectedRoute allowedRoles={['donor', 'admin']}>
                  <CreateDonation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-donations"
              element={
                <ProtectedRoute allowedRoles={['donor', 'admin']}>
                  <MyDonations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservations"
              element={
                <ProtectedRoute allowedRoles={['donor', 'recipient', 'admin']}>
                  <Reservations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pickups"
              element={
                <ProtectedRoute allowedRoles={['volunteer', 'admin']}>
                  <Pickups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />

            {/* 404 Route */}
            <Route
              path="*"
              element={
                <PublicLayout>
                  <NotFound />
                </PublicLayout>
              }
            />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
