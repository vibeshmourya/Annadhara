import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HeartHandshake, User, Mail, Lock, Phone, Building, ShieldCheck, Truck, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState(searchParams.get('role') || 'donor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState('restaurant');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === 'donor') setOrganizationType('restaurant');
    if (newRole === 'recipient') setOrganizationType('ngo');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({
        name,
        email,
        password,
        role,
        phone,
        organizationName: role === 'volunteer' ? undefined : organizationName,
        organizationType: role === 'volunteer' ? undefined : organizationType,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#2E7D5B] text-white shadow-md mx-auto">
          <HeartHandshake className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#26332D] tracking-tight">Create your Account</h2>
        <p className="text-xs text-[#718078]">Join the FoodBridge Surplus Rescue Network</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-stone-200/80 shadow-sm space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#D9534F] flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Role selector tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRoleChange('donor')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center space-y-1 transition-all ${
                  role === 'donor'
                    ? 'bg-[#2E7D5B] text-white shadow-sm'
                    : 'bg-[#F8FAF8] text-[#718078] hover:bg-stone-100 border border-stone-200/80'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Donor</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('recipient')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center space-y-1 transition-all ${
                  role === 'recipient'
                    ? 'bg-[#2E7D5B] text-white shadow-sm'
                    : 'bg-[#F8FAF8] text-[#718078] hover:bg-stone-100 border border-stone-200/80'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Recipient NGO</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('volunteer')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center space-y-1 transition-all ${
                  role === 'volunteer'
                    ? 'bg-[#2E7D5B] text-white shadow-sm'
                    : 'bg-[#F8FAF8] text-[#718078] hover:bg-stone-100 border border-stone-200/80'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Volunteer</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1">
                Full Name / Contact Person
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718078]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Elena Rostova"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1">
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
                  placeholder="e.g. elena@sunrisebakery.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718078]">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
                />
              </div>
            </div>

            {role !== 'volunteer' && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1">
                    Organization / Business Name
                  </label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                    placeholder={role === 'donor' ? 'e.g. Sunrise Artisanal Bakery' : 'e.g. Hope Harvest Foundation'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1">
                    Organization Type
                  </label>
                  <select
                    value={organizationType}
                    onChange={(e) => setOrganizationType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
                  >
                    {role === 'donor' ? (
                      <>
                        <option value="restaurant">Restaurant</option>
                        <option value="bakery">Bakery</option>
                        <option value="hotel">Hotel</option>
                        <option value="canteen">College / Corporate Canteen</option>
                        <option value="event_organizer">Event Catering</option>
                        <option value="other">Other Business</option>
                      </>
                    ) : (
                      <>
                        <option value="ngo">Non-Profit NGO</option>
                        <option value="shelter">Homeless / Community Shelter</option>
                        <option value="food_bank">Food Bank</option>
                        <option value="community_kitchen">Community Kitchen</option>
                        <option value="charity">Registered Charity</option>
                      </>
                    )}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1">
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
                  minLength={6}
                  placeholder="At least 6 characters"
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
              <span>Create Account</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-center text-xs text-[#718078]">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#2E7D5B] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

