import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Building, AlertTriangle, FileText, CheckCircle2, XCircle, Search, ShieldAlert } from 'lucide-react';
import { adminApi, organizationApi } from '../api/endpoints';
import { LoadingSpinner, EmptyState } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/Badge';
import { ConfirmationDialog } from '../components/common/Modal';

export const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('verifications');
  const [loading, setLoading] = useState(true);

  // Data states
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [reportedDonations, setReportedDonations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Search
  const [userSearch, setUserSearch] = useState('');

  // Action states
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [verifyAction, setVerifyAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTabContent = async () => {
    try {
      setLoading(true);
      if (activeTab === 'verifications') {
        const res = await organizationApi.getAll({ status: 'pending' });
        if (res.data.success) setOrganizations(res.data.data);
      } else if (activeTab === 'users') {
        const res = await adminApi.getUsers({ search: userSearch });
        if (res.data.success) setUsers(res.data.data);
      } else if (activeTab === 'reports') {
        const res = await adminApi.getReportedDonations();
        if (res.data.success) setReportedDonations(res.data.data);
      } else if (activeTab === 'audits') {
        const res = await adminApi.getAuditLogs();
        if (res.data.success) setAuditLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin tab:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabContent();
  }, [activeTab]);

  const handleVerifyOrg = async () => {
    if (!selectedOrg || !verifyAction) return;
    try {
      setActionLoading(true);
      await organizationApi.verify(selectedOrg._id, {
        status: verifyAction,
        notes: verifyAction === 'verified' ? 'Approved by admin' : 'Rejected by admin',
      });
      setSelectedOrg(null);
      setVerifyAction(null);
      fetchTabContent();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      const res = await adminApi.toggleUserStatus(userId);
      if (res.data.success) {
        fetchTabContent();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update user');
    }
  };

  const handleResolveReport = async (donationId, action) => {
    try {
      await adminApi.resolveDonationReport(donationId, { action });
      fetchTabContent();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve report');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#EAF4EE] text-[#205B43] text-xs font-bold mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D5B]" />
          <span>Platform Administrator Operations</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26332D] tracking-tight">Admin Management Panel</h1>
        <p className="text-xs sm:text-sm text-[#718078] mt-1">
          Review pending charities, supervise user accounts, resolve community food safety reports, and inspect audit logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-stone-200">
        <button
          type="button"
          onClick={() => setActiveTab('verifications')}
          className={`pb-3 px-4 text-xs font-bold transition-all ${
            activeTab === 'verifications'
              ? 'text-[#205B43] border-b-2 border-[#2E7D5B]'
              : 'text-[#718078] hover:text-[#26332D]'
          }`}
        >
          Pending Verifications
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'text-[#205B43] border-b-2 border-[#2E7D5B]'
              : 'text-[#718078] hover:text-[#26332D]'
          }`}
        >
          User Accounts
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-4 text-xs font-bold transition-all ${
            activeTab === 'reports'
              ? 'text-[#205B43] border-b-2 border-[#2E7D5B]'
              : 'text-[#718078] hover:text-[#26332D]'
          }`}
        >
          Reported Food Listings
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audits')}
          className={`pb-3 px-4 text-xs font-bold transition-all ${
            activeTab === 'audits'
              ? 'text-[#205B43] border-b-2 border-[#2E7D5B]'
              : 'text-[#718078] hover:text-[#26332D]'
          }`}
        >
          Audit Trail
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading records..." />
      ) : (
        <>
          {/* TAB 1: Verifications */}
          {activeTab === 'verifications' && (
            <div className="space-y-4">
              {organizations.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {organizations.map((org) => (
                    <div
                      key={org._id}
                      className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-base text-[#26332D]">{org.name}</span>
                          <span className="text-[11px] font-semibold text-[#205B43] bg-[#EAF4EE] px-2 py-0.5 rounded-full capitalize">
                            {org.type?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-[#718078]">
                          Registration: <strong className="text-[#26332D]">{org.registrationNumber || 'Not provided'}</strong> • Email: {org.contactEmail} • Phone: {org.contactPhone}
                        </p>
                        {org.verificationNotes && (
                          <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg italic">
                            Notes: {org.verificationNotes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrg(org);
                            setVerifyAction('rejected');
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-[#D9534F] bg-red-50 hover:bg-red-100"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrg(org);
                            setVerifyAction('verified');
                          }}
                          className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43]"
                        >
                          Verify & Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ShieldCheck}
                  title="No Pending Verifications"
                  description="All registered organizations have been reviewed."
                />
              )}
            </div>
          )}

          {/* TAB 2: Users */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-stone-100 flex items-center justify-between gap-4">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchTabContent()}
                  placeholder="Search user by name or email..."
                  className="px-3.5 py-2 rounded-xl border border-stone-200 bg-[#F8FAF8] text-xs text-[#26332D] w-72"
                />
                <button
                  type="button"
                  onClick={fetchTabContent}
                  className="px-4 py-2 bg-[#2E7D5B] text-white text-xs font-bold rounded-xl"
                >
                  Search
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#718078]">
                  <thead className="bg-[#F8FAF8] text-[#26332D] font-bold uppercase tracking-wider text-[11px] border-b border-stone-200/60">
                    <tr>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Organization</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-stone-50/50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-[#26332D] text-sm">{u.name}</p>
                          <p className="text-[#718078] text-[11px]">{u.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold capitalize px-2 py-0.5 rounded bg-stone-100 text-[#26332D]">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {u.organization ? u.organization.name : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              u.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {u.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleUser(u._id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                              u.isActive
                                ? 'text-[#D9534F] hover:bg-red-50'
                                : 'text-[#205B43] hover:bg-[#EAF4EE]'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Reports */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {reportedDonations.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {reportedDonations.map((item) => (
                    <div
                      key={item._id}
                      className="bg-white rounded-2xl p-6 border border-red-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-5 h-5 text-[#D9534F]" />
                          <h4 className="font-bold text-base text-[#26332D]">{item.title}</h4>
                          <span className="text-xs font-bold text-[#D9534F] bg-red-50 px-2 py-0.5 rounded">
                            {item.reports?.length || 1} report(s)
                          </span>
                        </div>
                        <p className="text-xs text-[#718078]">
                          Donor: {item.donor?.name} ({item.donor?.email})
                        </p>
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs text-[#26332D]">
                          <strong>Latest Concern: </strong>
                          {item.reports?.[0]?.reason} — {item.reports?.[0]?.details || 'No additional text'}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleResolveReport(item._id, 'dismiss')}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-[#718078] bg-stone-100 hover:bg-stone-200"
                        >
                          Dismiss Report
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveReport(item._id, 'cancel_listing')}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#D9534F] hover:bg-red-700"
                        >
                          Remove Food Listing
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ShieldCheck}
                  title="No Reported Listings"
                  description="All food listings are compliant with platform safety guidelines."
                />
              )}
            </div>
          )}

          {/* TAB 4: Audit Logs */}
          {activeTab === 'audits' && (
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#718078]">
                  <thead className="bg-[#F8FAF8] text-[#26332D] font-bold uppercase tracking-wider text-[11px] border-b border-stone-200/60">
                    <tr>
                      <th className="px-6 py-3">Timestamp</th>
                      <th className="px-6 py-3">Action</th>
                      <th className="px-6 py-3">User / Role</th>
                      <th className="px-6 py-3">Entity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono">
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-stone-50/50">
                        <td className="px-6 py-3 text-[11px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 font-bold text-[#205B43]">{log.action}</td>
                        <td className="px-6 py-3 font-sans">
                          {log.user ? `${log.user.name} (${log.role})` : 'System'}
                        </td>
                        <td className="px-6 py-3 text-[11px]">
                          {log.entityType} ({log.entityId ? log.entityId.slice(-6) : '—'})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Verification Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!selectedOrg}
        onClose={() => {
          setSelectedOrg(null);
          setVerifyAction(null);
        }}
        onConfirm={handleVerifyOrg}
        title={verifyAction === 'verified' ? 'Verify Organization' : 'Reject Organization'}
        message={
          verifyAction === 'verified'
            ? `Approve organization ${selectedOrg?.name}? The organization will immediately be granted full surplus food reservation capabilities.`
            : `Decline verification for ${selectedOrg?.name}?`
        }
        confirmText={verifyAction === 'verified' ? 'Verify' : 'Reject'}
        isDanger={verifyAction === 'rejected'}
        isLoading={actionLoading}
      />
    </div>
  );
};

