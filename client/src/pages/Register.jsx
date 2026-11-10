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

const normalizeInitialRole = (raw) => {
  const value = (raw || '').trim().toLowerCase();
  if (value === 'recipient' || value === 'recipient_ngo') return 'recipient';
  if (value === 'volunteer') return 'volunteer';
  return 'donor';
};

const isValidPhoneInput = (value) => {
  const trimmed = value.trim();
  if (!/^[+\d][\d\s().-]{6,19}$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialRole = normalizeInitialRole(searchParams.get('role'));
  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');

  // Organization fields
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState(
    initialRole === 'recipient' ? 'NGO' : 'Restaurant'
  );
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError('');
    setFieldErrors({});
    if (newRole === 'donor') setOrganizationType('Restaurant');
    if (newRole === 'recipient') setOrganizationType('NGO');
  };

  const validateForm = () => {
    const errors = {};
    const requiresOrg = role === 'donor' || role === 'recipient';

    if (!name.trim()) {
      errors.name = 'Full name is required';
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (requiresOrg && !phone.trim()) {
      errors.phone = 'Contact phone number is required for organization registration';
    } else if (phone.trim() && !isValidPhoneInput(phone)) {
      errors.phone = 'Please enter a valid phone number (7 to 15 digits)';
    }
    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (requiresOrg) {
      if (!organizationName.trim()) {
        errors.organizationName = 'Organization name is required';
      }
      if (!city.trim()) {
        errors.city = 'City is required';
      }
      if (!state.trim()) {
        errors.state = 'State is required';
      }
      if (!postalCode.trim()) {
        errors.postalCode = 'Postal code / pincode is required';
      } else if (!/^[A-Za-z0-9\s-]{4,10}$/.test(postalCode.trim())) {
        errors.postalCode = 'Please enter a valid postal code / pincode';
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError(Object.values(validationErrors)[0]);
      return;
    }

    setFieldErrors({});
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

      if (import.meta.env.DEV) {
        console.debug('[Annadhara][Register] Submitting registration payload:', {
          ...payload,
          password: '[REDACTED]',
        });
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
      if (!err.response) {
        setError(
          err.message && err.message !== 'Network Error'
            ? err.message
            : 'Unable to reach the Annadhara server. Please ensure the backend service is running and try again.'
        );
        return;
      }

      const data = err.response.data;
      if (data && typeof data === 'object') {
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          const mappedErrors = {};
          data.errors.forEach((item) => {
            if (!item?.field) return;
            const cleanField = item.field.replace(/^address\./, '');
            mappedErrors[cleanField] = item.message;
          });
          setFieldErrors(mappedErrors);
        }

        if (data.message) {
          setError(data.message);
          return;
        }
      }

      setError(
        `Registration request failed (HTTP ${err.response.status}). Please verify the backend API server is running and try again.`
      );
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
        <p className="text-xs sm:text-sm text-[#718078]">Join the Annadhara Surplus Rescue Network • Team Seva Shakti</p>
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
              Select Your Role on Annadhara
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
                  Full Name / Contact Person *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718078]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearFieldError('name');
                    }}
                    required
                    placeholder="e.g. Elena Rostova"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                      fieldErrors.name ? 'border-[#D9534F]' : 'border-[#E3EAE5]'
                    } bg-[#F8FAF8] text-sm text-[#26332D] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B] transition-all`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-[11px] text-[#D9534F] mt-1">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1.5">
                  {role !== 'volunteer' ? 'Contact Phone *' : 'Contact Phone (Optional)'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718078]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      clearFieldError('phone');
                    }}
                    required={role !== 'volunteer'}
                    placeholder="e.g. +91 9876543210"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                      fieldErrors.phone ? 'border-[#D9534F]' : 'border-[#E3EAE5]'
                    } bg-[#F8FAF8] text-sm text-[#26332D] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B] transition-all`}
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="text-[11px] text-[#D9534F] mt-1">{fieldErrors.phone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718078]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearFieldError('email');
                    }}
                    required
                    placeholder="name@organization.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                      fieldErrors.email ? 'border-[#D9534F]' : 'border-[#E3EAE5]'
                    } bg-[#F8FAF8] text-sm text-[#26332D] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B] transition-all`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-[#D9534F] mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1.5">
                  Password (min. 6 chars) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718078]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError('password');
                    }}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border ${
                      fieldErrors.password ? 'border-[#D9534F]' : 'border-[#E3EAE5]'
                    } bg-[#F8FAF8] text-sm text-[#26332D] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B] transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#718078] hover:text-[#26332D]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] text-[#D9534F] mt-1">{fieldErrors.password}</p>
                )}
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
                      onChange={(e) => {
                        setOrganizationName(e.target.value);
                        clearFieldError('organizationName');
                      }}
                      required
                      placeholder={role === 'donor' ? 'e.g. Green Garden Bistro' : 'e.g. City Hope Shelter'}
                      className={`w-full px-3.5 py-2.5 rounded-xl border ${
                        fieldErrors.organizationName ? 'border-[#D9534F]' : 'border-[#E3EAE5]'
                      } bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]`}
                    />
                    {fieldErrors.organizationName && (
                      <p className="text-[11px] text-[#D9534F] mt-1">{fieldErrors.organizationName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#26332D] mb-1">Organization Type *</label>
                    <select
                      value={organizationType}
                      onChange={(e) => {
                        setOrganizationType(e.target.value);
                        clearFieldError('organizationType');
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border ${
                        fieldErrors.organizationType ? 'border-[#D9534F]' : 'border-[#E3EAE5]'
                      } bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]`}
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
                    {fieldErrors.organizationType && (
                      <p className="text-[11px] text-[#D9534F] mt-1">{fieldErrors.organizationType}</p>
                    )}
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
                <span>
                  {role !== 'volunteer'
                    ? 'Primary Location / Pickup Address'
                    : 'Location Details (Optional)'}
                </span>
              </p>

              <div>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Street Address (Optional, e.g. 425 Garden Way)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      clearFieldError('city');
                    }}
                    required={role !== 'volunteer'}
                    placeholder={role !== 'volunteer' ? 'City *' : 'City'}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      fieldErrors.city ? 'border-[#D9534F]' : 'border-[#E3EAE5]'
                    } bg-[#F8FAF8] text-xs text-[#26332D]`}
                  />
                  {fieldErrors.city && (
                    <p className="text-[11px] text-[#D9534F] mt-1">{fieldErrors.city}</p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      clearFieldError('state');
                    }}
                    required={role !== 'volunteer'}
                    placeholder={role !== 'volunteer' ? 'State *' : 'State'}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      fieldErrors.state ? 'border-[#D9534F]' : 'border-[#E3EAE5]'
                    } bg-[#F8FAF8] text-xs text-[#26332D]`}
                  />
                  {fieldErrors.state && (
                    <p className="text-[11px] text-[#D9534F] mt-1">{fieldErrors.state}</p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => {
                      setPostalCode(e.target.value);
                      clearFieldError('postalCode');
                    }}
                    required={role !== 'volunteer'}
                    placeholder={role !== 'volunteer' ? 'Postal Code *' : 'Postal Code'}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      fieldErrors.postalCode ? 'border-[#D9534F]' : 'border-[#E3EAE5]'
                    } bg-[#F8FAF8] text-xs text-[#26332D]`}
                  />
                  {fieldErrors.postalCode && (
                    <p className="text-[11px] text-[#D9534F] mt-1">{fieldErrors.postalCode}</p>
                  )}
                </div>
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
