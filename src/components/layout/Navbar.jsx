import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HeartHandshake,
  Search,
  PlusCircle,
  Package,
  CalendarCheck,
  Truck,
  Bell,
  User,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export const Navbar = () => {
  const { user, isAuthenticated, isDonor, isRecipient, isVolunteer, isAdmin, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#2E7D5B] text-white flex items-center justify-center shadow-md group-hover:bg-[#205B43] transition-colors">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-[#26332D] tracking-tight">FoodBridge</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold text-[#2E7D5B] uppercase tracking-wider bg-[#EAF4EE] px-2 py-0.5 rounded-full">
                Zero Waste
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Role-specific) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-[#EAF4EE] text-[#205B43]'
                      : 'text-[#718078] hover:text-[#26332D] hover:bg-stone-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/find-food"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive('/find-food')
                      ? 'bg-[#EAF4EE] text-[#205B43]'
                      : 'text-[#718078] hover:text-[#26332D] hover:bg-stone-100'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>Find Food</span>
                </Link>

                {isDonor && (
                  <Link
                    to="/my-donations"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      isActive('/my-donations')
                        ? 'bg-[#EAF4EE] text-[#205B43]'
                        : 'text-[#718078] hover:text-[#26332D] hover:bg-stone-100'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>My Donations</span>
                  </Link>
                )}

                {(isDonor || isRecipient) && (
                  <Link
                    to="/reservations"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      isActive('/reservations')
                        ? 'bg-[#EAF4EE] text-[#205B43]'
                        : 'text-[#718078] hover:text-[#26332D] hover:bg-stone-100'
                    }`}
                  >
                    <CalendarCheck className="w-4 h-4" />
                    <span>Reservations</span>
                  </Link>
                )}

                <Link
                  to="/pickups"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive('/pickups')
                      ? 'bg-[#EAF4EE] text-[#205B43]'
                      : 'text-[#718078] hover:text-[#26332D] hover:bg-stone-100'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Pickups</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      isActive('/admin')
                        ? 'bg-[#EAF4EE] text-[#205B43]'
                        : 'text-[#718078] hover:text-[#26332D] hover:bg-stone-100'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive('/') ? 'text-[#2E7D5B]' : 'text-[#718078] hover:text-[#26332D]'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/find-food"
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive('/find-food') ? 'text-[#2E7D5B]' : 'text-[#718078] hover:text-[#26332D]'
                  }`}
                >
                  Available Food
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Icons / Auth Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {isDonor && (
                  <Link
                    to="/create-donation"
                    className="flex items-center space-x-1.5 bg-[#2E7D5B] hover:bg-[#205B43] text-white px-3.5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all hover:shadow"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Donate Food</span>
                  </Link>
                )}

                {/* Notifications Bell */}
                <Link
                  to="/notifications"
                  className="relative p-2 rounded-xl text-[#718078] hover:text-[#26332D] hover:bg-stone-100 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-[#D9534F] rounded-full ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile Pill */}
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-xl border border-stone-200/80 hover:bg-stone-50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#EAF4EE] text-[#205B43] font-bold text-xs flex items-center justify-center">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#26332D] leading-none line-clamp-1">{user?.name}</p>
                    <p className="text-[10px] font-semibold text-[#718078] uppercase mt-0.5">{user?.role}</p>
                  </div>
                </Link>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-[#718078] hover:text-[#D9534F] hover:bg-red-50 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#26332D] hover:bg-stone-100 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-sm transition-colors"
                >
                  Join Network
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle button */}
          <div className="flex md:hidden items-center space-x-2">
            {isAuthenticated && (
              <Link to="/notifications" className="relative p-2 text-[#718078]">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-[#D9534F] rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#718078] hover:text-[#26332D] hover:bg-stone-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {isAuthenticated ? (
            <>
              <div className="flex items-center space-x-3 px-3 py-2 border-b border-stone-100 mb-2">
                <div className="w-9 h-9 rounded-xl bg-[#EAF4EE] text-[#205B43] font-bold flex items-center justify-center">
                  {user?.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#26332D]">{user?.name}</p>
                  <p className="text-xs text-[#718078] capitalize">{user?.role} account</p>
                </div>
              </div>

              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium text-[#26332D] hover:bg-[#EAF4EE]"
              >
                <LayoutDashboard className="w-4 h-4 text-[#2E7D5B]" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/find-food"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium text-[#26332D] hover:bg-[#EAF4EE]"
              >
                <Search className="w-4 h-4 text-[#2E7D5B]" />
                <span>Find Food</span>
              </Link>

              {isDonor && (
                <>
                  <Link
                    to="/create-donation"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-semibold text-[#205B43] bg-[#EAF4EE]"
                  >
                    <PlusCircle className="w-4 h-4 text-[#2E7D5B]" />
                    <span>Create Donation</span>
                  </Link>
                  <Link
                    to="/my-donations"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium text-[#26332D] hover:bg-[#EAF4EE]"
                  >
                    <Package className="w-4 h-4 text-[#2E7D5B]" />
                    <span>My Donations</span>
                  </Link>
                </>
              )}

              {(isDonor || isRecipient) && (
                <Link
                  to="/reservations"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium text-[#26332D] hover:bg-[#EAF4EE]"
                >
                  <CalendarCheck className="w-4 h-4 text-[#2E7D5B]" />
                  <span>Reservations</span>
                </Link>
              )}

              <Link
                to="/pickups"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium text-[#26332D] hover:bg-[#EAF4EE]"
              >
                <Truck className="w-4 h-4 text-[#2E7D5B]" />
                <span>Pickups</span>
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium text-[#26332D] hover:bg-[#EAF4EE]"
                >
                  <ShieldCheck className="w-4 h-4 text-[#2E7D5B]" />
                  <span>Admin Panel</span>
                </Link>
              )}

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium text-[#26332D] hover:bg-[#EAF4EE]"
              >
                <User className="w-4 h-4 text-[#2E7D5B]" />
                <span>Profile & Settings</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium text-[#D9534F] hover:bg-red-50 text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                to="/find-food"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-[#26332D]"
              >
                Available Food
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2 text-sm font-medium text-[#26332D] bg-stone-100 rounded-xl"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2 text-sm font-medium text-white bg-[#2E7D5B] rounded-xl"
              >
                Join FoodBridge
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

