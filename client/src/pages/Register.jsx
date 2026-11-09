import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  HeartHandshake,
  User,
  Mail,
  Lock,
  Phone,
  Building,
  ShieldCheck,
  Truck,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState(searchParams.get('role') || 'donor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');

  // Organization fields
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState('Restaurant');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === 'donor') setOrganizationType('Restaurant');
    if (newRole === 'recipient') setOrganizationType('NGO');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if ((role === 'donor' || role === 'recipient') && !organizationName.trim()) {
      setError('Please provide your organization name');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: role.toUpperCase(),
        phone: phone.trim(),
        address: {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
        },
      };

      if (role !== 'volunteer') {
        payload.organizationName = organizationName.trim();
        payload.organizationType = organizationType;
        if (registrationNumber.trim()) {
          payload.registrationNumber = registrationNumber.trim();
        }
      }

      const user = await register(payload);
      const userRole = (user.role || '').toLowerCase();

      if (userRole === 'recipient') {
        navigate('/find-food');
      } else if (userRole === 'volunteer') {
        navigate('/pickups');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#2E7D5B] text-white shadow-md mx-auto">
          <HeartHandshake className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#26332D] tracking-tight">Create your Account</h2>
        <p className="text-xs sm:text-sm text-[#718078]">Join the FoodBridge Surplus Rescue Network</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-[#E3EAE5] shadow-xs space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#D9534F] flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Role selector tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-2">
              Select Your Role on FoodBridge
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRoleChange('donor')}
                className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center space-y-1.5 transition-all ${
                  role === 'donor'
                    ? 'bg-[#2E7D5B] text-white shadow-sm ring-2 ring-[#2E7D5B]/20'
                    : 'bg-[#F8FAF8] text-[#718078] hover:bg-stone-100 border border-[#E3EAE5]'
                }`}
              >
                <Building className="w-5 h-5" />
                <span>Food Donor</span>
                <span className="text-[10px] opacity-80 font-normal">Restaurant / Hotel</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('recipient')}
                className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center space-y-1.5 transition-all ${
                  role === 'recipient'
                    ? 'bg-[#2E7D5B] text-white shadow-sm ring-2 ring-[#2E7D5B]/20'
                    : 'bg-[#F8FAF8] text-[#718078] hover:bg-stone-100 border border-[#E3EAE5]'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Recipient NGO</span>
                <span className="text-[10px] opacity-80 font-normal">Shelter / Kitchen</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('volunteer')}
                className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center space-y-1.5 transition-all ${
                  role === 'volunteer'
                    ? 'bg-[#2E7D5B] text-white shadow-sm ring-2 ring-[#2E7D5B]/20'
                    : 'bg-[#F8FAF8] text-[#718078] hover:bg-stone-100 border border-[#E3EAE5]'
                }`}
              >
                <Truck className="w-5 h-5" />
                <span>Volunteer</span>
                <span className="text-[10px] opacity-80 font-normal">Rescue Transport</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1.5">
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1.5">
                  Contact Phone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718078]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    placeholder="name@organization.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1.5">
                  Password (min. 6 chars)
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
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Organization Specific Section */}
            {role !== 'volunteer' && (
              <div className="pt-3 border-t border-[#E3EAE5] space-y-4">
                <p className="text-xs font-bold text-[#205B43] flex items-center space-x-1.5">
                  <Building className="w-4 h-4" />
                  <span>Organization Information</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#26332D] mb-1">Organization Name *</label>
                    <input
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      required
                      placeholder={role === 'donor' ? 'e.g. Green Garden Bistro' : 'e.g. City Hope Shelter'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#26332D] mb-1">Organization Type</label>
                    <select
                      value={organizationType}
                      onChange={(e) => setOrganizationType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
                    >
                      {role === 'donor' ? (
                        <>
                          <option value="Restaurant">Restaurant</option>
                          <option value="Hotel">Hotel</option>
                          <option value="College Canteen">College Canteen</option>
                          <option value="Event Organizer">Event Organizer</option>
                          <option value="Other">Other Food Producer</option>
                        </>
                      ) : (
                        <>
                          <option value="NGO">NGO / Charity</option>
                          <option value="Food Distribution Organization">Food Bank / Pantry</option>
                          <option value="Other">Shelter / Community Kitchen</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#26332D] mb-1">Registration / Tax ID (Optional)</label>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. 501(c)(3) or City Business License"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
                  />
                </div>
              </div>
            )}

            {/* Address Information */}
            <div className="pt-3 border-t border-[#E3EAE5] space-y-3">
              <p className="text-xs font-bold text-[#718078] flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-[#2E7D5B]" />
                <span>Primary Location / Pickup Address</span>
              </p>

              <div>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Street Address (e.g. 425 Garden Way)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full px-3 py-2 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-xs text-[#26332D]"
                />
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  className="w-full px-3 py-2 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-xs text-[#26332D]"
                />
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Postal Code"
                  className="w-full px-3 py-2 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-xs text-[#26332D]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Join</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-[#718078]">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[#2E7D5B] hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
