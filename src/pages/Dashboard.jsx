import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle2,
  Users,
  Building,
  Truck,
  HeartHandshake,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CalendarCheck,
  ShieldAlert,
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, reservationApi } from '../api/endpoints';
import { StatCard, LoadingSpinner, EmptyState } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/Badge';
import { ConfirmationDialog } from '../components/common/Modal';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export const Dashboard = () => {
  const { user, isDonor, isRecipient, isVolunteer, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quick action state for donor approving requests
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approved' or 'rejected'
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getStats();
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleReservationAction = async () => {
    if (!selectedReservation || !actionType) return;
    try {
      setActionLoading(true);
      await reservationApi.updateStatus(selectedReservation._id, {
        status: actionType,
        donorNotes: actionType === 'approved' ? 'Approved from dashboard' : 'Declined from dashboard',
      });
      setSelectedReservation(null);
      setActionType(null);
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update reservation');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading your dashboard data..." />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-6 bg-red-50 rounded-2xl border border-red-200 text-center">
        <AlertCircle className="w-10 h-10 text-[#D9534F] mx-auto mb-2" />
        <h3 className="text-base font-bold text-[#26332D]">Error loading dashboard</h3>
        <p className="text-xs text-[#718078] mt-1">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-[#2E7D5B] text-white text-xs font-bold rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  // Chart data setup for Donor
  const donorChartData = stats?.categoryDistribution
    ? {
        labels: stats.categoryDistribution.map((c) => c._id.replace('_', ' ')),
        datasets: [
          {
            data: stats.categoryDistribution.map((c) => c.count),
            backgroundColor: ['#2E7D5B', '#E9A23B', '#3B82F6', '#8B5CF6', '#10B981'],
            borderColor: '#FFFFFF',
            borderWidth: 2,
          },
        ],
      }
    : null;

  // Chart data setup for Admin
  const adminChartData = stats?.donationsByCategory
    ? {
        labels: stats.donationsByCategory.map((c) => c._id.replace('_', ' ')),
        datasets: [
          {
            label: 'Donations by Category',
            data: stats.donationsByCategory.map((c) => c.count),
            backgroundColor: '#2E7D5B',
            borderRadius: 8,
          },
        ],
      }
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#EAF4EE] text-[#205B43] text-xs font-bold mb-2">
            <span className="w-2 h-2 rounded-full bg-[#2E7D5B]" />
            <span className="uppercase tracking-wider">{user?.role} Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26332D] tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-[#718078] mt-1">
            {user?.organization?.name ? `${user.organization.name} • ` : ''}
            Surplus Food Rescue & Zero Waste Dashboard
          </p>
        </div>

        {isDonor && (
          <Link
            to="/create-donation"
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publish Food Donation</span>
          </Link>
        )}

        {isRecipient && (
          <Link
            to="/find-food"
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-sm transition-all"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Discover Food Near You</span>
          </Link>
        )}
      </div>

      {/* Recipient Verification Status Alert (if pending) */}
      {isRecipient && user?.organization && user.organization.verificationStatus === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3 text-xs text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Organization Verification Pending: </span>
            Your organization details have been submitted to administrators. You can browse all available food donations now; once verified by an administrator, full reservation privileges will activate immediately.
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DONOR DASHBOARD METRICS */}
      {/* ========================================================================= */}
      {isDonor && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Total Published"
              value={stats.totalDonations || 0}
              icon={Package}
              description="Lifetime surplus food listings"
            />
            <StatCard
              title="Active Listings"
              value={stats.activeDonations || 0}
              icon={Clock}
              description="Currently available to NGOs"
              trendColor="text-[#2E7D5B]"
            />
            <StatCard
              title="Pending Requests"
              value={stats.pendingRequests || 0}
              icon={CalendarCheck}
              description="Awaiting your approval"
              trendColor={stats.pendingRequests > 0 ? 'text-[#E9A23B] font-bold' : 'text-[#718078]'}
            />
            <StatCard
              title="Food Rescued"
              value={stats.totalCollected || 0}
              unit="units"
              icon={HeartHandshake}
              description={`≈ ${stats.totalMealsEquivalent || 0} meals saved`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending Requests Actions */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-base font-bold text-[#26332D]">Recent Reservation Requests</h3>
                <Link to="/reservations" className="text-xs font-bold text-[#2E7D5B] hover:underline">
                  View all
                </Link>
              </div>

              {stats.recentReservations?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentReservations.map((res) => (
                    <div
                      key={res._id}
                      className="p-4 rounded-xl border border-stone-200/80 bg-[#F8FAF8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-[#26332D]">{res.recipient?.name}</span>
                          <StatusBadge status={res.status} />
                        </div>
                        <p className="text-[#718078] mt-0.5">
                          Requested <span className="font-bold text-[#205B43]">{res.requestedQuantity} {res.unit}</span> of "{res.donation?.title}"
                        </p>
                      </div>

                      {res.status === 'pending' && (
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReservation(res);
                              setActionType('rejected');
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#D9534F] bg-red-50 hover:bg-red-100"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReservation(res);
                              setActionType('approved');
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43]"
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Pending Requests"
                  description="All incoming reservation requests have been processed."
                />
              )}
            </div>

            {/* Category Doughnut Chart */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs flex flex-col">
              <h3 className="text-base font-bold text-[#26332D] mb-4">Donation Categories</h3>
              {donorChartData && donorChartData.datasets[0].data.length > 0 ? (
                <div className="relative flex-1 flex items-center justify-center min-h-[220px]">
                  <Doughnut data={donorChartData} options={{ maintainAspectRatio: false }} />
                </div>
              ) : (
                <p className="text-xs text-[#718078] text-center my-auto">
                  Publish donations to see analytics breakdown.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. RECIPIENT DASHBOARD METRICS */}
      {/* ========================================================================= */}
      {isRecipient && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Surplus Available"
              value={stats.availableFoodCount || 0}
              icon={Package}
              description="Listings open in community"
            />
            <StatCard
              title="Active Reservations"
              value={stats.activeReservations || 0}
              icon={Clock}
              description="Awaiting approval or pickup"
              trendColor="text-[#E9A23B]"
            />
            <StatCard
              title="Upcoming Pickups"
              value={stats.upcomingPickups || 0}
              icon={Truck}
              description="In progress collection tasks"
            />
            <StatCard
              title="Meals Received"
              value={stats.totalMealsReceived || 0}
              unit="units"
              icon={CheckCircle2}
              description="Completed pickups to date"
            />
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-[#26332D]">Your Active & Recent Reservations</h3>
              <Link to="/reservations" className="text-xs font-bold text-[#2E7D5B] hover:underline">
                View all
              </Link>
            </div>

            {stats.recentReservations?.length > 0 ? (
              <div className="divide-y divide-stone-100">
                {stats.recentReservations.map((res) => (
                  <div key={res._id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#26332D] text-sm">{res.donation?.title}</p>
                      <p className="text-[#718078]">
                        From {res.donor?.name} • {res.requestedQuantity} {res.unit}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {res.status === 'approved' && (
                        <div className="text-right">
                          <span className="text-[10px] text-[#718078]">Handover Code:</span>
                          <span className="block font-mono font-bold text-[#205B43] bg-[#EAF4EE] px-2 py-0.5 rounded">
                            {res.handoverCode}
                          </span>
                        </div>
                      )}
                      <StatusBadge status={res.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Reservations Yet"
                description="Browse available surplus food and reserve portions for your shelter or charity."
                action={
                  <Link
                    to="/find-food"
                    className="px-4 py-2 bg-[#2E7D5B] text-white text-xs font-bold rounded-xl"
                  >
                    Find Food
                  </Link>
                }
              />
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 3. VOLUNTEER DASHBOARD METRICS */}
      {/* ========================================================================= */}
      {isVolunteer && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              title="Active Pickups"
              value={stats.assignedPickups || 0}
              icon={Truck}
              description="Claimed tasks in progress"
              trendColor="text-[#2E7D5B]"
            />
            <StatCard
              title="Available Tasks"
              value={stats.pendingTasks || 0}
              icon={Clock}
              description="Ready to be claimed"
              trendColor="text-[#E9A23B] font-bold"
            />
            <StatCard
              title="Completed Deliveries"
              value={stats.completedPickups || 0}
              icon={CheckCircle2}
              description="Safe food transports completed"
            />
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-[#26332D]">Your Assigned Pickup Tasks</h3>
              <Link to="/pickups" className="text-xs font-bold text-[#2E7D5B] hover:underline">
                View all pickups
              </Link>
            </div>

            {stats.recentPickups?.length > 0 ? (
              <div className="space-y-3">
                {stats.recentPickups.map((task) => (
                  <div
                    key={task._id}
                    className="p-4 rounded-xl border border-stone-200/80 bg-[#F8FAF8] flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#26332D] text-sm">{task.donation?.title}</p>
                      <p className="text-[#718078] mt-0.5">
                        Pickup: {task.donor?.name} ({task.donation?.pickupLocation?.address?.city})
                      </p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Active Tasks"
                description="Check available pickup missions to transport surplus food to recipient shelters."
                action={
                  <Link
                    to="/pickups"
                    className="px-4 py-2 bg-[#2E7D5B] text-white text-xs font-bold rounded-xl"
                  >
                    Browse Available Tasks
                  </Link>
                }
              />
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 4. ADMIN DASHBOARD METRICS */}
      {/* ========================================================================= */}
      {isAdmin && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Total Users"
              value={stats.totalUsers || 0}
              icon={Users}
              description="Registered accounts"
            />
            <StatCard
              title="Organizations"
              value={stats.registeredOrganizations || 0}
              icon={Building}
              description="Donors & Charities"
            />
            <StatCard
              title="Pending Reviews"
              value={stats.pendingVerifications || 0}
              icon={ShieldAlert}
              description="NGOs awaiting verification"
              trendColor={stats.pendingVerifications > 0 ? 'text-[#E9A23B] font-bold' : 'text-[#718078]'}
            />
            <StatCard
              title="Handovers Done"
              value={stats.completedHandovers || 0}
              icon={CheckCircle2}
              description="Verified zero-waste rescues"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs">
              <h3 className="text-base font-bold text-[#26332D] mb-4">Platform Donations by Category</h3>
              {adminChartData ? (
                <div className="h-64">
                  <Bar data={adminChartData} options={{ maintainAspectRatio: false }} />
                </div>
              ) : null}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[#26332D] mb-2">Platform Administration</h3>
                <p className="text-xs text-[#718078] mb-4">
                  Manage registered users, review pending organization credentials, inspect reported listings, and monitor audit trails.
                </p>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-3 bg-[#F8FAF8] rounded-xl border border-stone-200/60">
                    <span className="text-[#718078]">Total Donations Published:</span>
                    <span className="font-bold text-[#26332D]">{stats.totalDonations}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-[#F8FAF8] rounded-xl border border-stone-200/60">
                    <span className="text-[#718078]">Total Reservations Logged:</span>
                    <span className="font-bold text-[#26332D]">{stats.totalReservations}</span>
                  </div>
                </div>
              </div>

              <Link
                to="/admin"
                className="mt-6 w-full py-2.5 rounded-xl font-bold text-xs text-center text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-sm transition-colors"
              >
                Go to Full Admin Management Panel
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Dialog for Donor Request Actions */}
      <ConfirmationDialog
        isOpen={!!selectedReservation}
        onClose={() => {
          setSelectedReservation(null);
          setActionType(null);
        }}
        onConfirm={handleReservationAction}
        title={actionType === 'approved' ? 'Approve Reservation' : 'Decline Reservation'}
        message={
          actionType === 'approved'
            ? `Are you sure you want to approve this reservation of ${selectedReservation?.requestedQuantity} ${selectedReservation?.unit} for ${selectedReservation?.recipient?.name}? A pickup task will be generated.`
            : `Are you sure you want to decline this request? The ${selectedReservation?.requestedQuantity} ${selectedReservation?.unit} will immediately return to your available surplus food pool.`
        }
        confirmText={actionType === 'approved' ? 'Approve Request' : 'Decline Request'}
        isDanger={actionType === 'rejected'}
        isLoading={actionLoading}
      />
    </div>
  );
};

