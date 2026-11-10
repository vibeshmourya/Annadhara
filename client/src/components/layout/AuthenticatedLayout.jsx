import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HeartHandshake,
  LayoutDashboard,
  Search,
  Package,
  PlusCircle,
  CalendarCheck,
  Truck,
  ShieldCheck,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export const AuthenticatedLayout = ({ children }) => {
  const { user, role, isDonor, isRecipient, isVolunteer, isAdmin, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define role-specific navigation items
  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['donor', 'recipient', 'volunteer', 'admin'],
    },
    {
      label: 'Find Food',
      path: '/find-food',
      icon: Search,
      roles: ['donor', 'recipient', 'volunteer', 'admin'],
    },
    {
      label: 'Post Donation',
      path: '/create-donation',
      icon: PlusCircle,
      roles: ['donor', 'admin'],
      highlight: true,
    },
    {
      label: 'My Donations',
      path: '/my-donations',
      icon: Package,
      roles: ['donor', 'admin'],
    },
    {
      label: isDonor ? 'Reservation Requests' : 'My Reservations',
      path: '/reservations',
      icon: CalendarCheck,
      roles: ['donor', 'recipient'],
    },
    {
      label: isVolunteer ? 'Pickup Missions' : 'Transport Logistics',
      path: '/pickups',
      icon: Truck,
      roles: ['volunteer', 'admin'],
    },
    {
      label: 'Admin Operations',
      path: '/admin',
      icon: ShieldCheck,
      roles: ['admin'],
    },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: Bell,
      roles: ['donor', 'recipient', 'volunteer', 'admin'],
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      label: 'Profile & Org',
      path: '/profile',
      icon: User,
      roles: ['donor', 'recipient', 'volunteer', 'admin'],
    },
  ];

  // Filter items matching current user's role
  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  const roleLabels = {
    donor: 'Food Donor',
    recipient: 'Recipient NGO',
    volunteer: 'Volunteer Runner',
    admin: 'Platform Admin',
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#26332D] flex flex-col lg:flex-row">
      {/* ======================================================== */}
      {/* DESKTOP SIDEBAR                                         */}
      {/* ======================================================== */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-[#E3EAE5] shrink-0 sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#E3EAE5]">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#2E7D5B] text-white flex items-center justify-center shadow-md group-hover:bg-[#205B43] transition-colors">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-[#26332D] tracking-tight">Annadhara</span>
              <p className="text-[10px] text-[#718078] font-medium leading-none mt-0.5">By Team Seva Shakti</p>
            </div>
          </Link>

          {/* Active Role Badge */}
          <div className="mt-4 px-3 py-1.5 rounded-xl bg-[#EAF4EE] border border-[#2E7D5B]/20 flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#205B43] uppercase tracking-wider">
              {roleLabels[role] || 'Member'}
            </span>
            <span className="w-2 h-2 rounded-full bg-[#2E7D5B] animate-pulse" />
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          {filteredNavItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-[#EAF4EE] text-[#205B43] shadow-xs'
                    : 'text-[#718078] hover:text-[#26332D] hover:bg-stone-50'
                } ${item.highlight && !active ? 'text-[#2E7D5B] font-bold bg-[#EAF4EE]/40' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-[#205B43]' : 'text-[#718078]'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#D9534F] text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout at bottom of sidebar */}
        <div className="p-4 border-t border-[#E3EAE5] bg-[#F8FAF8]">
          <div className="flex items-center justify-between">
            <Link to="/profile" className="flex items-center space-x-2.5 min-w-0 group">
              <div className="w-9 h-9 rounded-xl bg-[#2E7D5B] text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#26332D] truncate group-hover:text-[#2E7D5B] transition-colors">
                  {user?.name || 'User'}
                </p>
                <p className="text-[11px] text-[#718078] truncate">{user?.email}</p>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-[#718078] hover:text-[#D9534F] hover:bg-red-50 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MAIN VIEW AREA                                          */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E3EAE5] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#718078] hover:text-[#26332D] hover:bg-stone-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Platform Brand (Mobile only) */}
            <Link to="/" className="lg:hidden flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#2E7D5B] text-white flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-[#26332D] text-base">Annadhara</span>
            </Link>

            {/* Desktop Tagline / Welcome */}
            <div className="hidden lg:block">
              <p className="text-xs text-[#718078]">
                Signed in as <strong className="text-[#26332D]">{user?.name}</strong> •{' '}
                <span className="text-[#205B43] font-semibold">{roleLabels[role]}</span>
              </p>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Post Food Quick Action (Donors only) */}
            {isDonor && (
              <Link
                to="/create-donation"
                className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-xs transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Post Food</span>
              </Link>
            )}

            {/* Notifications Button */}
            <Link
              to="/notifications"
              className="relative p-2 rounded-xl text-[#718078] hover:text-[#26332D] hover:bg-stone-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D9534F] ring-2 ring-white animate-pulse" />
              )}
            </Link>

            {/* User Profile Avatar Link */}
            <Link
              to="/profile"
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-stone-100 transition-colors"
              title="Account Profile"
            >
              <div className="w-8 h-8 rounded-lg bg-[#EAF4EE] text-[#205B43] font-bold flex items-center justify-center text-xs border border-[#2E7D5B]/20">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </Link>

            {/* Mobile Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="lg:hidden p-2 rounded-xl text-[#718078] hover:text-[#D9534F]"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 pb-12">{children}</main>
      </div>

      {/* ======================================================== */}
      {/* MOBILE NAVIGATION DRAWER                                */}
      {/* ======================================================== */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#26332D]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-10">
            <div className="p-5 border-b border-[#E3EAE5] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#2E7D5B] text-white flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-lg font-extrabold text-[#26332D]">Annadhara</span>
                  <p className="text-[10px] text-[#718078]">{roleLabels[role]}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-[#718078] hover:text-[#26332D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {filteredNavItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? 'bg-[#EAF4EE] text-[#205B43]'
                        : 'text-[#718078] hover:text-[#26332D] hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#D9534F] text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#E3EAE5] bg-[#F8FAF8]">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl font-bold text-xs text-[#D9534F] bg-red-50 hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

