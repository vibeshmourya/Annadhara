import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HeartHandshake,
  Search,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  User,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E3EAE5] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#2E7D5B] text-white flex items-center justify-center shadow-md group-hover:bg-[#205B43] transition-colors">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-[#26332D] tracking-tight">Annadhara</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold text-[#2E7D5B] uppercase tracking-wider bg-[#EAF4EE] px-2 py-0.5 rounded-full">
                Zero Waste
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/find-food"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isActive('/find-food')
                  ? 'bg-[#EAF4EE] text-[#205B43]'
                  : 'text-[#718078] hover:text-[#26332D] hover:bg-stone-50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Find Food</span>
            </Link>

            <a
              href="/#how-it-works"
              className="px-3 py-2 rounded-xl text-sm font-semibold text-[#718078] hover:text-[#26332D] hover:bg-stone-50 transition-colors"
            >
              How It Works
            </a>

            <a
              href="/#benefits"
              className="px-3 py-2 rounded-xl text-sm font-semibold text-[#718078] hover:text-[#26332D] hover:bg-stone-50 transition-colors"
            >
              Impact
            </a>

            {isAuthenticated ? (
              <div className="flex items-center space-x-2 pl-3 border-l border-[#E3EAE5]">
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-xs transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Go to Dashboard</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-xl text-[#718078] hover:text-[#D9534F] hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 pl-3 border-l border-[#E3EAE5]">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#26332D] hover:bg-stone-100 transition-colors"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-xs transition-colors"
                >
                  <span>Join Network</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="p-2 rounded-xl text-[#205B43] bg-[#EAF4EE] text-xs font-bold"
              >
                Dashboard
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#718078] hover:text-[#26332D] hover:bg-stone-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E3EAE5] bg-white px-4 pt-2 pb-6 space-y-2">
          <Link
            to="/find-food"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#26332D] hover:bg-stone-50"
          >
            Find Food
          </Link>
          <a
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#718078] hover:bg-stone-50"
          >
            How It Works
          </a>
          <a
            href="/#benefits"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#718078] hover:bg-stone-50"
          >
            Benefits & Impact
          </a>

          <div className="pt-3 border-t border-[#E3EAE5] space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 text-center rounded-xl text-xs font-bold text-white bg-[#2E7D5B]"
                >
                  Open Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full py-2 text-center rounded-xl text-xs font-bold text-[#D9534F] bg-red-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-xl text-xs font-bold text-[#26332D] border border-stone-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-xl text-xs font-bold text-white bg-[#2E7D5B]"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
