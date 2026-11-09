import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Building,
  AlertTriangle,
  FileText,
  CheckCircle2,
  XCircle,
  Search,
  ShieldAlert,
  Clock,
  Package,
  HeartHandshake,
} from 'lucide-react';
import { adminApi, dashboardApi } from '../api/endpoints';
import { LoadingSpinner, EmptyState, StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/Badge';
import { ConfirmationDialog, Modal } from '../components/common/Modal';

export const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('verifications');
  const [loading, setLoading] = useState(true);

  // Admin stats
  const [stats, setStats] = useState(null);

  // Data states
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [reportedDonations, setReportedDonations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Search
  const [userSearch, setUserSearch] = useState('');

  // Verification action modal state
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [verifyAction, setVerifyAction] = useState(null); // 'VERIFIED' | 'REJECTED'
  const [verifyNotes, setVerifyNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch admin overview stats
  const fetchStats = async () => {
    try {
      const res = await dashboardApi.getStats();
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.warn('Could not load admin stats:', err);
    }
  };

  const fetchTabContent = async () => {
    try {
      setLoading(true);
      if (activeTab === 'verifications') {
        const res = await adminApi.getOrganizations({ status: 'PENDING' });
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
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTabContent();
  }, [activeTab]);

  const handleVerifyOrg = async (e) => {
    e.preventDefault();
    if (!selectedOrg || !verifyAction) return;

    try {
      setActionLoading(true);
      await adminApi.verifyOrganization(selectedOrg._id, {
        status: verifyAction,
        notes: verifyNotes.trim() || (verifyAction === 'VERIFIED' ? 'Approved by platform administrator' : 'Declined by platform administrator'),
      });
      setSelectedOrg(null);
      setVerifyAction(null);
      setVerifyNotes('');
      fetchTabContent();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Organization verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      const res = await adminApi.toggleUserStatus(userId);
      if (res.data.success) {
        fetchTabContent();
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update user status');
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
      {/* Header */}
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

      {/* Summary Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-[#E3EAE5] shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#718078]">Total Users</p>
            <p className="text-2xl font-black text-[#26332D] mt-1">{stats.totalUsers || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#E3EAE5] shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#718078]">Registered Orgs</p>
            <p className="text-2xl font-black text-[#26332D] mt-1">{stats.registeredOrganizations || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#E3EAE5] shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#718078]">Pending Verifications</p>
            <p className="text-2xl font-black text-[#E9A23B] mt-1">{stats.pendingVerifications || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#E3EAE5] shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#718078]">Total Donations</p>
            <p className="text-2xl font-black text-[#26332D] mt-1">{stats.totalDonations || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#E3EAE5] shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#718078]">Completed Handovers</p>
            <p className="text-2xl font-black text-[#205B43] mt-1">{stats.completedHandovers || 0}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-[#E3EAE5] overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('verifications')}
          className={`pb-3 px-4 text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'verifications'
              ? 'text-[#205B43] border-b-2 border-[#2E7D5B]'
              : 'text-[#718078] hover:text-[#26332D]'
          }`}
        >
          Pending Verifications ({organizations.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-xs font-bold transition-all whitespace-nowrap ${
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
          className={`pb-3 px-4 text-xs font-bold transition-all whitespace-nowrap ${
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
          className={`pb-3 px-4 text-xs font-bold transition-all whitespace-nowrap ${
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
                      className="bg-white rounded-2xl p-6 border border-[#E3EAE5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-base text-[#26332D]">
                            {org.organizationName || org.name}
                          </span>
                          <span className="text-[11px] font-semibold text-[#205B43] bg-[#EAF4EE] px-2 py-0.5 rounded-full capitalize">
                            {org.organizationType || org.type}
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            PENDING REVIEW
                          </span>
                        </div>
                        <p className="text-xs text-[#718078]">
                          Registration / Tax ID: <strong className="text-[#26332D]">{org.registrationNumber || 'Not provided'}</strong> • Contact: {org.contactPerson || org.createdBy?.name} • Email: {org.email} • Phone: {org.phone}
                        </p>
                        {org.description && (
                          <p className="text-xs text-[#26332D] bg-[#F8FAF8] p-2 rounded-lg">
                            {org.description}
                          </p>
                        )}
                        <p className="text-[11px] text-[#718078]">
                          Submitted: {new Date(org.submittedAt || org.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrg(org);
                            setVerifyAction('REJECTED');
                            setVerifyNotes('');
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-[#D9534F] bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrg(org);
                            setVerifyAction('VERIFIED');
                            setVerifyNotes('');
                          }}
                          className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-xs transition-colors"
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
            <div className="bg-white rounded-2xl border border-[#E3EAE5] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#E3EAE5] flex items-center justify-between gap-4">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchTabContent()}
                  placeholder="Search user by name or email..."
                  className="px-3.5 py-2 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-xs text-[#26332D] w-72 focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30"
                />
                <button
                  type="button"
                  onClick={fetchTabContent}
                  className="px-4 py-2 bg-[#2E7D5B] text-white text-xs font-bold rounded-xl hover:bg-[#205B43]"
                >
                  Search
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#718078]">
                  <thead className="bg-[#F8FAF8] text-[#26332D] font-bold uppercase tracking-wider text-[11px] border-b border-[#E3EAE5]">
                    <tr>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Organization</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3EAE5]">
                    {users.map((u) => {
                      const isActive = u.accountStatus === 'ACTIVE' || u.isActive;
                      return (
                        <tr key={u._id} className="hover:bg-stone-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-[#26332D]">
                            <p className="font-bold text-sm text-[#26332D]">{u.name}</p>
                            <p className="text-[11px] text-[#718078]">{u.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EAF4EE] text-[#205B43]">
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[#26332D]">
                            {u.organization?.organizationName || u.organization?.name || 'Individual'}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {isActive ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {u.role !== 'ADMIN' && (
                              <button
                                type="button"
                                onClick={() => handleToggleUser(u._id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                  isActive
                                    ? 'text-[#D9534F] hover:bg-red-50'
                                    : 'text-[#205B43] hover:bg-[#EAF4EE]'
                                }`}
                              >
                                {isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
                          <AlertTriangle className="w-4 h-4 text-[#D9534F]" />
                          <span className="font-bold text-base text-[#26332D]">{item.title}</span>
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-full">
                            {item.reports?.length || 1} Reports
                          </span>
                        </div>
                        <p className="text-xs text-[#718078]">
                          Donor: <strong className="text-[#26332D]">{item.donor?.name}</strong> • Available: {item.availableQuantity} {item.unit}
                        </p>
                        <div className="bg-red-50 p-3 rounded-xl space-y-1 text-xs text-red-900">
                          {item.reports?.map((rep, idx) => (
                            <p key={idx}>
                              <strong>{rep.reason}:</strong> {rep.details || 'No additional details.'}
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleResolveReport(item._id, 'dismiss')}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200"
                        >
                          Dismiss Flag
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveReport(item._id, 'remove')}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#D9534F] hover:bg-red-700 shadow-xs"
                        >
                          Remove Listing
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ShieldAlert}
                  title="No Reported Listings"
                  description="There are currently no community food safety flags requiring moderation."
                />
              )}
            </div>
          )}

          {/* TAB 4: Audits */}
          {activeTab === 'audits' && (
            <div className="bg-white rounded-2xl border border-[#E3EAE5] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#E3EAE5]">
                <h3 className="text-sm font-bold text-[#26332D]">System Audit Trail</h3>
                <p className="text-xs text-[#718078]">Immutable chronological log of platform security and review actions.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#718078]">
                  <thead className="bg-[#F8FAF8] text-[#26332D] font-bold uppercase tracking-wider text-[11px] border-b border-[#E3EAE5]">
                    <tr>
                      <th className="px-6 py-3">Timestamp</th>
                      <th className="px-6 py-3">Action</th>
                      <th className="px-6 py-3">Actor / Role</th>
                      <th className="px-6 py-3">Entity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3EAE5]">
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-3 text-[11px] text-[#718078] font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 font-bold text-[#26332D]">{log.action}</td>
                        <td className="px-6 py-3">
                          <span className="font-semibold text-[#26332D]">{log.user?.name || log.role || 'System'}</span>
                        </td>
                        <td className="px-6 py-3 text-[11px]">
                          {log.entityType}: {log.entityId}
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

      {/* Organization Verification Modal with Custom Review Notes */}
      {selectedOrg && (
        <Modal
          isOpen={!!selectedOrg}
          onClose={() => {
            setSelectedOrg(null);
            setVerifyAction(null);
            setVerifyNotes('');
          }}
          title={verifyAction === 'VERIFIED' ? 'Approve Organization Verification' : 'Reject Organization Verification'}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleVerifyOrg} className="space-y-4 text-xs">
            <p className="text-[#718078] leading-relaxed">
              {verifyAction === 'VERIFIED'
                ? `You are approving ${selectedOrg.organizationName || selectedOrg.name} as a verified community organization.`
                : `You are declining verification for ${selectedOrg.organizationName || selectedOrg.name}.`}
            </p>

            <div>
              <label className="block font-bold text-[#26332D] mb-1">
                Administrative Review Reason / Notes *
              </label>
              <textarea
                rows={3}
                required
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder={
                  verifyAction === 'VERIFIED'
                    ? 'e.g. Registered 501(c)(3) tax exemption and food handling credentials verified.'
                    : 'e.g. Missing valid registration documents or unable to verify shelter location.'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] bg-[#F8FAF8] text-sm text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-[#E3EAE5]">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrg(null);
                  setVerifyAction(null);
                  setVerifyNotes('');
                }}
                className="px-4 py-2 rounded-xl text-stone-600 bg-stone-100 hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className={`px-5 py-2 rounded-xl font-bold text-white shadow-xs transition-colors ${
                  verifyAction === 'VERIFIED'
                    ? 'bg-[#2E7D5B] hover:bg-[#205B43]'
                    : 'bg-[#D9534F] hover:bg-red-700'
                }`}
              >
                {actionLoading ? 'Saving...' : verifyAction === 'VERIFIED' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
