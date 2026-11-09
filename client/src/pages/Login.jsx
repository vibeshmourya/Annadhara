import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HeartHandshake,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  Building,
  ShieldCheck,
  Truck,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    location.search.includes('expired=true') ? 'Your session has expired. Please sign in again.' : ''
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }

    setLoading(true);

    try {
      const user = await login(email, password);
      const userRole = (user.role || '').toLowerCase();

      // Role-based smart redirect
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'recipient') {
        navigate('/find-food');
      } else if (userRole === 'volunteer') {
        navigate('/pickups');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-Click Demo Login helper
  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#2E7D5B] text-white shadow-md mx-auto">
          <HeartHandshake className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#26332D] tracking-tight">Sign in to FoodBridge</h2>
        <p className="text-xs sm:text-sm text-[#718078]">Surplus Food. Shared Hope. Zero Waste.</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-[#E3EAE5] shadow-xs space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#D9534F] flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718078]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="e.g. donor@greengarden.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718078]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#718078] hover:text-[#26332D]"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login selector */}
          <div className="pt-4 border-t border-[#E3EAE5]">
            <p className="text-[11px] font-bold text-[#718078] uppercase tracking-wider mb-2 text-center">
              Quick 1-Click Evaluation Logins
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('donor@greengarden.com', 'Donor@123')}
                className="p-2 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] hover:bg-[#EAF4EE] text-left transition-colors flex items-center space-x-2"
              >
                <Building className="w-3.5 h-3.5 text-[#2E7D5B] shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-[#26332D] block">Donor</span>
                  <span className="text-[10px] text-[#718078] truncate">Bistro</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ngo@hopeharvest.org', 'Recipient@123')}
                className="p-2 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] hover:bg-[#EAF4EE] text-left transition-colors flex items-center space-x-2"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D5B] shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-[#26332D] block">Recipient NGO</span>
                  <span className="text-[10px] text-[#718078] truncate">Hope Harvest</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('alex@volunteer.org', 'Volunteer@123')}
                className="p-2 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] hover:bg-[#EAF4EE] text-left transition-colors flex items-center space-x-2"
              >
                <Truck className="w-3.5 h-3.5 text-[#2E7D5B] shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-[#26332D] block">Volunteer</span>
                  <span className="text-[10px] text-[#718078] truncate">Alex R.</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@foodbridge.org', 'Admin@123')}
                className="p-2 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] hover:bg-[#EAF4EE] text-left transition-colors flex items-center space-x-2"
              >
                <Shield className="w-3.5 h-3.5 text-[#2E7D5B] shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-[#26332D] block">Administrator</span>
                  <span className="text-[10px] text-[#718078] truncate">Sarah J.</span>
                </div>
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-[#718078]">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-bold text-[#2E7D5B] hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
