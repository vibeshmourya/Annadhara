import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Building, Clock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { pickupApi } from '../api/endpoints';
import { StatusBadge } from '../components/common/Badge';
import { LoadingSpinner, EmptyState } from '../components/common/StatCard';
import { useAuth } from '../context/AuthContext';

export const Pickups = () => {
  const { user, isVolunteer } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(isVolunteer ? 'my-tasks' : 'all');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (isVolunteer && activeTab === 'available') {
        params.view = 'available';
      }
      const res = await pickupApi.getAll(params);
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load pickup tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeTab]);

  const handleClaimTask = async (taskId) => {
    try {
      setActionLoadingId(taskId);
      const res = await pickupApi.claim(taskId);
      if (res.data.success) {
        fetchTasks();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not claim task');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      setActionLoadingId(taskId);
      const res = await pickupApi.updateStatus(taskId, {
        status: newStatus,
        note: `Updated to ${newStatus} by ${user?.name}`,
      });
      if (res.data.success) {
        fetchTasks();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) return <LoadingSpinner text="Loading pickup missions..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26332D] tracking-tight">
            Pickup & Transport Management
          </h1>
          <p className="text-xs sm:text-sm text-[#718078] mt-1">
            Coordinate food collection and delivery to ensure surplus meals arrive fresh and on schedule.
          </p>
        </div>
      </div>

      {/* Volunteer View Tabs */}
      {isVolunteer && (
        <div className="flex space-x-2 border-b border-stone-200">
          <button
            type="button"
            onClick={() => setActiveTab('my-tasks')}
            className={`pb-3 px-4 text-xs font-bold transition-all ${
              activeTab === 'my-tasks'
                ? 'text-[#205B43] border-b-2 border-[#2E7D5B]'
                : 'text-[#718078] hover:text-[#26332D]'
            }`}
          >
            My Assigned Tasks
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('available')}
            className={`pb-3 px-4 text-xs font-bold transition-all ${
              activeTab === 'available'
                ? 'text-[#205B43] border-b-2 border-[#2E7D5B]'
                : 'text-[#718078] hover:text-[#26332D]'
            }`}
          >
            Browse Available Missions (Unassigned)
          </button>
        </div>
      )}

      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tasks.map((task) => {
            const isAssignedToMe = task.volunteer && task.volunteer._id === user?._id;

            return (
              <div
                key={task._id}
                className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={task.status} />
                    <span className="text-xs text-[#718078]">
                      Pickup: {new Date(task.pickupWindowEnd).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#26332D]">
                      {task.donation?.title || 'Food Donation'}
                    </h3>
                    <p className="text-xs text-[#718078] mt-0.5">
                      Quantity: <strong className="text-[#205B43]">{task.reservation?.requestedQuantity} {task.donation?.unit}</strong>
                    </p>
                  </div>

                  {/* Route Card */}
                  <div className="p-3.5 rounded-xl bg-[#F8FAF8] border border-stone-200/80 space-y-2 text-xs">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[#2E7D5B] mt-1 shrink-0" />
                      <div>
                        <span className="font-bold text-[#26332D]">Pickup from:</span>{' '}
                        <span className="text-[#718078]">{task.donor?.name} ({task.pickupAddress?.street}, {task.pickupAddress?.city})</span>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[#E9A23B] mt-1 shrink-0" />
                      <div>
                        <span className="font-bold text-[#26332D]">Deliver to:</span>{' '}
                        <span className="text-[#718078]">{task.recipient?.name}</span>
                      </div>
                    </div>

                    {task.instructions && (
                      <p className="text-[11px] text-[#718078] pt-1 border-t border-stone-200/40 italic">
                        Note: {task.instructions}
                      </p>
                    )}
                  </div>

                  {/* Assigned volunteer tag */}
                  <div className="text-xs text-[#718078]">
                    Volunteer:{' '}
                    <strong className="text-[#26332D]">
                      {task.volunteer ? task.volunteer.name : 'Unassigned'}
                    </strong>
                  </div>
                </div>

                {/* Progress Control Buttons */}
                <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                  {/* Unassigned Volunteer claim */}
                  {isVolunteer && !task.volunteer && (
                    <button
                      type="button"
                      onClick={() => handleClaimTask(task._id)}
                      disabled={actionLoadingId === task._id}
                      className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-sm transition-all"
                    >
                      {actionLoadingId === task._id ? 'Claiming task...' : 'Accept This Pickup Task'}
                    </button>
                  )}

                  {/* Assigned Volunteer / Admin state advancement */}
                  {(isAssignedToMe || user?.role === 'admin') && task.status !== 'completed' && task.status !== 'cancelled' && (
                    <div className="w-full flex items-center space-x-2">
                      {task.status === 'assigned' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(task._id, 'in_progress')}
                          className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                        >
                          Start Transport (In Progress)
                        </button>
                      )}

                      {task.status === 'in_progress' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(task._id, 'collected')}
                          className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors"
                        >
                          Mark as Collected from Donor
                        </button>
                      )}

                      {task.status === 'collected' && (
                        <span className="text-xs text-[#205B43] font-semibold bg-[#EAF4EE] px-3 py-1.5 rounded-xl w-full text-center">
                          Collected • Ready for Handover Verification
                        </span>
                      )}
                    </div>
                  )}

                  {task.status === 'completed' && (
                    <div className="w-full text-center text-xs font-bold text-[#205B43] bg-[#EAF4EE] py-2 rounded-xl">
                      Pickup & Delivery Completed ✓
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No pickup tasks found"
          description={
            isVolunteer && activeTab === 'available'
              ? 'There are no unclaimed pickup tasks right now. Check back when new reservations are approved!'
              : 'No active pickup tasks found in this view.'
          }
        />
      )}
    </div>
  );
};

