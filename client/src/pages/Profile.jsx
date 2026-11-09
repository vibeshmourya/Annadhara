import React, { useState } from 'react';
import { User, Building, ShieldCheck, Mail, Phone, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/endpoints';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [street, setStreet] = useState(user?.address?.street || '');
  const [city, setCity] = useState(user?.address?.city || '');
  const [state, setState] = useState(user?.address?.state || '');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      setLoading(true);
      const res = await authApi.updateProfile({
        name,
        phone,
        address: { street, city, state },
      });
      if (res.data.success) {
        updateUser(res.data.data);
        setMessage('Profile details updated successfully');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#26332D] tracking-tight">Profile & Organization</h1>
        <p className="text-xs text-[#718078] mt-1">Manage your account information and organization credentials.</p>
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
        {/* Left Column: Organization & Role summary */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#EAF4EE] text-[#205B43] font-black text-2xl flex items-center justify-center mx-auto shadow-inner">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#26332D]">{user?.name}</h3>
              <p className="text-xs text-[#718078]">{user?.email}</p>
            </div>
            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EAF4EE] text-[#205B43]">
              {user?.role}
            </div>
          </div>

          {user?.organization && (
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-3 text-xs">
              <div className="flex items-center space-x-2 font-bold text-[#26332D]">
                <Building className="w-4 h-4 text-[#2E7D5B]" />
                <span>Organization Details</span>
              </div>
              <p className="font-bold text-sm text-[#26332D]">{user.organization.name}</p>
              <div className="space-y-1 text-[#718078]">
                <p>Type: <strong className="text-[#26332D] capitalize">{user.organization.type?.replace('_', ' ')}</strong></p>
                <p>Status: <strong className={`capitalize ${user.organization.verificationStatus === 'verified' ? 'text-[#205B43]' : 'text-amber-700'}`}>{user.organization.verificationStatus}</strong></p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-[#26332D] border-b border-stone-100 pb-3">Edit Information</h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#26332D] mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#26332D] mb-1">Email (Account identifier)</label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-100 text-sm text-stone-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-bold text-[#26332D] mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-[#26332D] mb-1">Street Address</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#26332D] mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm text-[#26332D]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-sm transition-all"
              >
                {loading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

