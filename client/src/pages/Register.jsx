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
  FileCheck2,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  INDIAN_STATES,
  DONOR_ORGANIZATION_TYPES,
  RECIPIENT_ORGANIZATION_TYPES,
  VOLUNTEER_TYPES,
  isValidIndianPhone,
  isValidPINCode,
  FOOD_SAFETY_DISCLAIMER,
} from '../constants/india';

const normalizeInitialRole = (raw) => {
  const value = (raw || '').trim().toLowerCase();
  if (value === 'recipient' || value === 'recipient_ngo') return 'recipient';
  if (value === 'volunteer') return 'volunteer';
  return 'donor';
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
    initialRole === 'recipient' ? 'Registered NGO' : 'Restaurant'
  );
  const [volunteerType, setVolunteerType] = useState('Individual Volunteer');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [fssaiNumber, setFssaiNumber] = useState('');

  // Indian Address fields
  const [street, setStreet] = useState('');
  const [areaLocality, setAreaLocality] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Karnataka');
  const [postalCode, setPostalCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
    if (newRole === 'recipient') setOrganizationType('Registered NGO');
  };

  const validateForm = () => {
    const errors = {};
    const requiresOrg = role === 'donor' || role === 'recipient';

    if (!name.trim()) {
      errors.name = 'Full name / Contact person is required';
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (requiresOrg && !phone.trim()) {
      errors.phone = 'Contact phone number is required for organization registration';
    } else if (phone.trim() && !isValidIndianPhone(phone)) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile or landline number';
    }

    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (requiresOrg) {
      if (!organizationName.trim()) {
        errors.organizationName = 'Organization / Business name is required';
      }
      if (!city.trim()) {
        errors.city = 'Village / Town / City is required';
      }
      if (!state.trim()) {
        errors.state = 'State / Union Territory is required';
      }
      if (!postalCode.trim()) {
        errors.postalCode = '6-digit PIN code is required';
      } else if (!isValidPINCode(postalCode)) {
        errors.postalCode = 'Please enter a valid 6-digit Indian PIN code (e.g. 560001)';
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
          areaLocality: areaLocality.trim(),
          city: city.trim(),
          district: district.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: 'India',
        },
      };

      if (role !== 'volunteer') {
        payload.organizationName = organizationName.trim();
        payload.organizationType = organizationType;
        if (registrationNumber.trim()) {
          payload.registrationNumber = registrationNumber.trim();
        }
        if (fssaiNumber.trim()) {
          payload.fssaiNumber = fssaiNumber.trim();
        }
      } else {
        payload.volunteerType = volunteerType;
      }

      const user = await register(payload);
      const userRole = (user.role || '').toLowerCase();
      setSuccessMessage(`Account created successfully! Welcome to Annadhara, ${user.name}. Redirecting...`);

      setTimeout(() => {
        if (userRole === 'recipient') {
          navigate('/find-food');
        } else if (userRole === 'volunteer') {
          navigate('/pickups');
        } else {
          navigate('/dashboard');
        }
      }, 1000);
    } catch (err) {
      if (err.isConfigError) {
        setError(
          'Annadhara API base URL is not configured. Please set VITE_API_BASE_URL=https://<your-backend-project>.vercel.app/api in Vercel Project Settings (Environment Variables) and redeploy.'
        );
        return;
      }

      if (!err.response) {
        const isLocal =
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' ||
            window.location.hostname.includes('127.0.0.1'));
        setError(
          isLocal
            ? 'Cannot connect to backend server. Please verify your local Node.js server is running on port 5000.'
            : 'Unable to reach the Annadhara API server. Please check your internet connection or verify the deployed backend service.'
        );
        return;
      }

      const status = err.response.status;
      const resp = err.response.data;

      if (resp && resp.errors && Array.isArray(resp.errors)) {
        const mappedErrors = {};
        resp.errors.forEach((e) => {
          if (e.field) mappedErrors[e.field] = e.message;
        });
        setFieldErrors(mappedErrors);
      }

      if (status === 404) {
        setError(
          'API service endpoint not found (HTTP 404). Please ensure the backend is deployed and VITE_API_BASE_URL points to the deployed backend URL.'
        );
        return;
      }

      if (status === 405) {
        setError(
          'HTTP 405 Method Not Allowed: The API request was routed to a static frontend host instead of the Express backend. Please ensure VITE_API_BASE_URL=https://<your-backend-project>.vercel.app/api is configured in Vercel Frontend Project Settings and redeployed.'
        );
        return;
      }

      if (status === 409) {
        setError('An account with this email address already exists. Please log in instead.');
        return;
      }

      if (status === 422) {
        setError(
          resp?.message ||
            'Organization validation failed. Please check the organization type and contact details.'
        );
        return;
      }

      if (status === 503) {
        setError(
          resp?.message ||
            'Database service is currently connecting or unavailable. Please wait a moment and try again.'
        );
        return;
      }

      if (status >= 500) {
        setError(
          resp?.message ||
            'An internal server error occurred while processing your registration. Please try again in a few moments.'
        );
        return;
      }

      if (resp && resp.message) {
        setError(resp.message);
        return;
      }

      setError(
        `Registration request failed (HTTP ${status}). Please check your inputs and try again.`
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
        <p className="text-xs sm:text-sm text-[#718078]">Join the Annadhara Food Rescue Network • Team Seva Shakti (India)</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-[#E3EAE5] shadow-xs space-y-6">
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#2E7D5B] flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

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
                <span className="text-[10px] opacity-80 font-normal">Restaurant / Canteen</span>
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
                <span className="text-[10px] opacity-80 font-normal">Trust / Shelter Home</span>
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
                <span className="text-[10px] opacity-80 font-normal">Pickup & Delivery</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal / Contact Details */}
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
                    placeholder="e.g. Vikram Mehta"
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
                  {role !== 'volunteer' ? 'Mobile / Contact Phone *' : 'Mobile Number (Optional)'}
                </label>
                <div className="relative flex">
                  <div className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-[#E3EAE5] bg-stone-100 text-xs font-bold text-[#26332D]">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      clearFieldError('phone');
                    }}
                    required={role !== 'volunteer'}
                    placeholder="98765 43210"
                    className={`w-full pl-3 pr-4 py-2.5 rounded-r-xl border ${
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
                    placeholder="name@organization.org"
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

            {/* Volunteer Type Selection */}
            {role === 'volunteer' && (
              <div className="pt-3 border-t border-[#E3EAE5] space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D]">
                  Volunteer Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VOLUNTEER_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setVolunteerType(type)}
                      className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                        volunteerType === type
                          ? 'bg-[#EAF4EE] text-[#205B43] border border-[#2E7D5B]'
                          : 'bg-[#F8FAF8] text-[#718078] border border-[#E3EAE5]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Organization Specific Section (Donor / Recipient) */}
            {role !== 'volunteer' && (
              <div className="pt-3 border-t border-[#E3EAE5] space-y-4">
                <p className="text-xs font-bold text-[#205B43] flex items-center space-x-1.5">
                  <Building className="w-4 h-4" />
                  <span>Indian Organization / Entity Details</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#26332D] mb-1">
                      {role === 'donor' ? 'Business / Restaurant Name *' : 'NGO / Shelter / Trust Name *'}
                    </label>
                    <input
                      type="text"
                      value={organizationName}
                      onChange={(e) => {
                        setOrganizationName(e.target.value);
                        clearFieldError('organizationName');
                      }}
                      required
                      placeholder={role === 'donor' ? 'e.g. Green Garden Bistro' : 'e.g. Hope Harvest Seva Trust'}
                      className={`w-full px-3.5 py-2.5 rounded-xl border ${
                        fieldErrors.organizationName ? 'border-[#D9534F]' : 'border-[#E3EAE5]'
                      } bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]`}
                    />
                    {fieldErrors.organizationName && (
                      <p className="text-[11px] text-[#D9534F] mt-1">{fieldErrors.organizationName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#26332D] mb-1">Organization Category *</label>
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
                      {role === 'donor'
                        ? DONOR_ORGANIZATION_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))
                        : RECIPIENT_ORGANIZATION_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                    </select>
                    {fieldErrors.organizationType && (
                      <p className="text-[11px] text-[#D9534F] mt-1">{fieldErrors.organizationType}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#26332D] mb-1">
                      {role === 'donor' ? 'Trade / GST / Registration Number' : 'NGO Darpan / Trust Reg. Number'} (Optional)
                    </label>
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder={role === 'donor' ? 'e.g. GSTIN or Municipal License' : 'e.g. KA/2021/012345'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
                    />
                  </div>

                  {role === 'donor' && (
                    <div>
                      <label className="block text-xs font-bold text-[#26332D] mb-1 flex items-center justify-between">
                        <span>FSSAI Registration / License No.</span>
                        <span className="text-[10px] text-[#718078] font-normal">Optional</span>
                      </label>
                      <input
                        type="text"
                        value={fssaiNumber}
                        onChange={(e) => setFssaiNumber(e.target.value)}
                        placeholder="14-digit FSSAI Number"
                        maxLength={14}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Indian Address System Section */}
            <div className="pt-3 border-t border-[#E3EAE5] space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#205B43] flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-[#2E7D5B]" />
                  <span>
                    {role !== 'volunteer'
                      ? 'Location / Address (India)'
                      : 'Residential / Operational Area (Optional)'}
                  </span>
                </p>
                <span className="text-[11px] font-bold text-[#2E7D5B] bg-[#EAF4EE] px-2 py-0.5 rounded-md">
                  Country: India (Default)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#26332D] mb-1">
                    House / Building / Street
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="e.g. 42/1, 12th Main Road"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-xs text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#26332D] mb-1">
                    Area / Locality
                  </label>
                  <input
                    type="text"
                    value={areaLocality}
                    onChange={(e) => setAreaLocality(e.target.value)}
                    placeholder="e.g. Indiranagar, Koramangala"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-xs text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#26332D] mb-1">
                    Village / Town / City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      clearFieldError('city');
                    }}
                    required={role !== 'volunteer'}
                    placeholder="e.g. Bengaluru"
                    className={`w-full px-3 py-2 rounded-xl border ${
                      fieldErrors.city ? 'border-[#D9534F]' : 'border-[#E3EAE5]'
                    } bg-[#F8FAF8] text-xs text-[#26332D]`}
                  />
                  {fieldErrors.city && (
                    <p className="text-[10px] text-[#D9534F] mt-1">{fieldErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#26332D] mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Bengaluru Urban"
                    className="w-full px-3 py-2 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-xs text-[#26332D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#26332D] mb-1">
                    State / UT *
                  </label>
                  <select
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      clearFieldError('state');
                    }}
                    required={role !== 'volunteer'}
                    className={`w-full px-2.5 py-2 rounded-xl border ${
                      fieldErrors.state ? 'border-[#D9534F]' : 'border-[#E3EAE5]'
                    } bg-[#F8FAF8] text-xs text-[#26332D]`}
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.state && (
                    <p className="text-[10px] text-[#D9534F] mt-1">{fieldErrors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#26332D] mb-1">
                    PIN Code (6 Digits) *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={postalCode}
                    onChange={(e) => {
                      setPostalCode(e.target.value);
                      clearFieldError('postalCode');
                    }}
                    required={role !== 'volunteer'}
                    placeholder="e.g. 560038"
                    className={`w-full px-3 py-2 rounded-xl border ${
                      fieldErrors.postalCode ? 'border-[#D9534F]' : 'border-[#E3EAE5]'
                    } bg-[#F8FAF8] text-xs text-[#26332D]`}
                  />
                  {fieldErrors.postalCode && (
                    <p className="text-[10px] text-[#D9534F] mt-1">{fieldErrors.postalCode}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Food Safety Advisory Note */}
            <div className="p-3 bg-[#EAF4EE]/60 rounded-xl border border-[#2E7D5B]/20 flex items-start space-x-2 text-[11px] text-[#205B43]">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#2E7D5B]" />
              <div>
                <span className="font-bold">Indian Food Safety Note: </span>
                {FOOD_SAFETY_DISCLAIMER}
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
                  <span>Registering Account in India...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Join Network</span>
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
