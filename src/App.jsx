import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

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
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAF8]">
        <div className="w-10 h-10 border-4 border-[#EAF4EE] border-t-[#2E7D5B] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <div className="min-h-screen flex flex-col bg-[#F8FAF8] text-[#26332D]">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/find-food" element={<FindFood />} />
                <Route path="/donations/:id" element={<DonationDetails />} />

                {/* Authenticated Routes */}
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
                    <ProtectedRoute>
                      <Reservations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pickups"
                  element={
                    <ProtectedRoute>
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

