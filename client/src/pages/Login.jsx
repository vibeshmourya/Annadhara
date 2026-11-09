import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HeartHandshake, Lock, Mail, AlertCircle, ArrowRight, Shield, Building, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    location.search.includes('expired=true') ? 'Your session expired. Please sign in again.' : ''
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login helper
  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#2E7D5B] text-white shadow-md mx-auto">
          <HeartHandshake className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#26332D] tracking-tight">Sign in to FoodBridge</h2>
        <p className="text-xs text-[#718078]">Surplus Food. Shared Hope. Zero Waste.</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-stone-200/80 shadow-sm space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#D9534F] flex items-start space-x-2">
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-sm transition-all flex items-center justify-center space-x-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>Sign In</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* 1-Click Demo Accounts for Easy Testing */}
          <div className="pt-4 border-t border-stone-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#718078] mb-2.5 text-center">
              Quick Test Login (Demo Accounts):
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('donor@greengarden.com', 'Donor@123')}
                className="p-2 rounded-xl border border-stone-200 hover:border-[#2E7D5B] bg-[#F8FAF8] hover:bg-[#EAF4EE] text-left transition-colors"
              >
                <div className="flex items-center space-x-1 font-bold text-[#205B43]">
                  <Building className="w-3.5 h-3.5" />
                  <span>Donor</span>
                </div>
                <div className="text-[10px] text-[#718078] truncate">Bistro Restaurant</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ngo@hopeharvest.org', 'Recipient@123')}
                className="p-2 rounded-xl border border-stone-200 hover:border-[#2E7D5B] bg-[#F8FAF8] hover:bg-[#EAF4EE] text-left transition-colors"
              >
                <div className="flex items-center space-x-1 font-bold text-[#205B43]">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Recipient</span>
                </div>
                <div className="text-[10px] text-[#718078] truncate">Hope Harvest NGO</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('alex@volunteer.org', 'Volunteer@123')}
                className="p-2 rounded-xl border border-stone-200 hover:border-[#2E7D5B] bg-[#F8FAF8] hover:bg-[#EAF4EE] text-left transition-colors"
              >
                <div className="flex items-center space-x-1 font-bold text-[#205B43]">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Volunteer</span>
                </div>
                <div className="text-[10px] text-[#718078] truncate">Alex Rivera</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@foodbridge.org', 'Admin@123')}
                className="p-2 rounded-xl border border-stone-200 hover:border-[#2E7D5B] bg-[#F8FAF8] hover:bg-[#EAF4EE] text-left transition-colors"
              >
                <div className="flex items-center space-x-1 font-bold text-[#205B43]">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </div>
                <div className="text-[10px] text-[#718078] truncate">Platform Admin</div>
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-[#718078]">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-[#2E7D5B] hover:underline">
              Join the network
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

