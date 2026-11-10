import React, { useState, useEffect } from 'react';
import {
  User,
  Building,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  PlusCircle,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi, organizationApi } from '../api/endpoints';

export const Profile = () => {
  const { user, updateUser, role } = useAuth();

  // Personal profile state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [street, setStreet] = useState(user?.address?.street || '');
  const [city, setCity] = useState(user?.address?.city || '');
  const [state, setState] = useState(user?.address?.state || '');
  const [postalCode, setPostalCode] = useState(user?.address?.postalCode || '');

  // Organization state
  const [org, setOrg] = useState(null);
  const [orgLoading, setOrgLoading] = useState(true);

  // New Organization submission state
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState('NGO');
  const [newOrgDesc, setNewOrgDesc] = useState('');
  const [newOrgRegNo, setNewOrgRegNo] = useState('');

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchOrganization = async () => {
    try {
      setOrgLoading(true);
      const res = await organizationApi.getMyOrg();
      if (res.data.success && res.data.data) {
        setOrg(res.data.data);
      }
    } catch {
      // User might not have registered an organization yet
      setOrg(null);
    } finally {
      setOrgLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      setLoading(true);
      const res = await userApi.updateMyProfile({
        name: name.trim(),
        phone: phone.trim(),
        address: {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
        },
      });
      if (res.data.success) {
        updateUser(res.data.data);
        setMessage('Your personal profile details have been updated successfully');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update personal profile');
    } finally {
      setLoading(false);
    }
  };

  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!newOrgName.trim()) {
      setError('Organization name is required');
      return;
    }

    try {
      setLoading(true);
      const res = await organizationApi.create({
        organizationName: newOrgName.trim(),
        organizationType: newOrgType,
        description: newOrgDesc.trim(),
        registrationNumber: newOrgRegNo.trim(),
        phone: phone || user?.phone || '',
        address: { street, city, state, postalCode },
      });

      if (res.data.success) {
        setOrg(res.data.data);
        setShowOrgForm(false);
        setMessage('Organization details submitted successfully and pending administrative review');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit organization details');
    } finally {
      setLoading(false);
    }
  };

  const roleBadgeColors = {
    donor: 'bg-[#EAF4EE] text-[#205B43]',
    recipient: 'bg-blue-50 text-blue-800',
    volunteer: 'bg-teal-50 text-teal-800',
    admin: 'bg-purple-50 text-purple-800',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26332D] tracking-tight">
          Profile & Organization Credentials
        </h1>
        <p className="text-xs sm:text-sm text-[#718078] mt-1">
          Manage your verified account identity, contact details, and organization credentials.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-[#EAF4EE] border border-[#2E7D5B]/20 text-xs text-[#205B43] flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-[#D9534F] flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Account & Organization Badge Card */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-[#E3EAE5] shadow-xs space-y-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#EAF4EE] text-[#205B43] font-black text-2xl flex items-center justify-center mx-auto shadow-inner border border-[#2E7D5B]/20">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#26332D]">{user?.name}</h3>
              <p className="text-xs text-[#718078] truncate">{user?.email}</p>
            </div>
            <div
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                roleBadgeColors[role] || 'bg-stone-100 text-stone-800'
              }`}
            >
              {user?.role}
            </div>

            <div className="pt-2 text-[11px] text-[#718078] border-t border-[#E3EAE5]">
              Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString([], { month: 'short', year: 'numeric' })}
            </div>
          </div>

          {/* Organization Verification Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#E3EAE5] shadow-xs space-y-3 text-xs">
            <div className="flex items-center space-x-2 font-bold text-[#26332D]">
              <Building className="w-4 h-4 text-[#2E7D5B]" />
              <span>Linked Organization</span>
            </div>

            {org ? (
              <div className="space-y-2">
                <p className="font-bold text-sm text-[#26332D]">
                  {org.organizationName || org.name}
                </p>
                <div className="space-y-1 text-[#718078]">
                  <p>
                    Type:{' '}
                    <strong className="text-[#26332D] capitalize">
                      {org.organizationType || org.type}
                    </strong>
                  </p>
                  <p>
                    Registration ID:{' '}
                    <strong className="text-[#26332D]">
                      {org.registrationNumber || 'Not provided'}
                    </strong>
                  </p>
                  <div className="pt-2 flex items-center justify-between">
                    <span>Verification:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                        org.verificationStatus === 'VERIFIED' || org.verificationStatus === 'verified'
                          ? 'bg-emerald-50 text-[#205B43] border border-emerald-200'
                          : org.verificationStatus === 'REJECTED' || org.verificationStatus === 'rejected'
                          ? 'bg-red-50 text-[#D9534F] border border-red-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {org.verificationStatus}
                    </span>
                  </div>
                  {org.verificationNotes && (
                    <p className="bg-[#F8FAF8] p-2 rounded-lg border border-stone-200 text-[11px] text-stone-600 mt-2">
                      Review Note: {org.verificationNotes}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <p className="text-[#718078]">No organization currently linked to this profile.</p>
                <button
                  type="button"
                  onClick={() => setShowOrgForm(true)}
                  className="w-full py-2 px-3 rounded-xl font-bold text-xs text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-xs flex items-center justify-center space-x-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Register Organization</span>
                </button>
              </div>
            )}
          </div>

          {/* Platform Identity Info Card */}
          <div className="bg-[#EAF4EE]/60 p-5 rounded-2xl border border-[#2E7D5B]/20 text-xs space-y-1.5">
            <p className="font-extrabold text-[#205B43]">Annadhara</p>
            <p className="text-[11px] font-semibold text-[#2E7D5B]">Surplus Food. Shared Hope. Zero Waste.</p>
            <p className="text-[11px] text-[#718078]">Developed by Team Seva Shakti • MERNOVA X 2026</p>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit Profile Form */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E3EAE5] shadow-xs space-y-6">
            <h3 className="text-base font-bold text-[#26332D] border-b border-[#E3EAE5] pb-3">
              Permitted Profile Details
            </h3>

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#26332D] mb-1">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#26332D] mb-1">Email (Immutable Account ID)</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-stone-100 text-sm text-stone-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-[#718078] mt-1">Email cannot be modified directly.</p>
                </div>

                <div>
                  <label className="block font-bold text-[#26332D] mb-1">Account Role (Security Protected)</label>
                  <input
                    type="text"
                    value={user?.role || ''}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-stone-100 text-sm text-stone-500 cursor-not-allowed uppercase font-bold"
                  />
                  <p className="text-[10px] text-[#718078] mt-1">Roles cannot be altered by users.</p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#26332D] mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#26332D] mb-1">Street Address</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#26332D] mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#26332D] mb-1">State / Region</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#26332D] mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-xs transition-all"
                >
                  {loading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Register Organization Form (shown when requested) */}
          {showOrgForm && !org && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#2E7D5B]/40 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E3EAE5] pb-3">
                <h3 className="text-base font-bold text-[#205B43] flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  <span>Register Organization Details</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowOrgForm(false)}
                  className="text-xs text-stone-500 hover:text-stone-700"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleOrgSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#26332D] mb-1">Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="e.g. Hope Harvest Community Pantry"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#26332D] mb-1">Organization Type *</label>
                    <select
                      value={newOrgType}
                      onChange={(e) => setNewOrgType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D]"
                    >
                      <option value="Restaurant">Restaurant</option>
                      <option value="Hotel">Hotel</option>
                      <option value="College Canteen">College Canteen</option>
                      <option value="Event Organizer">Event Organizer</option>
                      <option value="NGO">NGO / Charity</option>
                      <option value="Food Distribution Organization">Food Distribution / Pantry</option>
                      <option value="Other">Other Community Entity</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#26332D] mb-1">Registration / Tax ID</label>
                    <input
                      type="text"
                      value={newOrgRegNo}
                      onChange={(e) => setNewOrgRegNo(e.target.value)}
                      placeholder="e.g. 501(c)(3) Number"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#26332D] mb-1">Mission / Description</label>
                  <textarea
                    rows={2}
                    value={newOrgDesc}
                    onChange={(e) => setNewOrgDesc(e.target.value)}
                    placeholder="Briefly describe your food donation or community service mission"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D]"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowOrgForm(false)}
                    className="px-4 py-2 rounded-xl text-stone-600 bg-stone-100 hover:bg-stone-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-xl font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-xs"
                  >
                    {loading ? 'Submitting...' : 'Submit for Admin Review'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
