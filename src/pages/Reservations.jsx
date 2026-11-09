import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Clock, MapPin, Building, KeyRound, AlertCircle, XCircle } from 'lucide-react';
import { reservationApi } from '../api/endpoints';
import { StatusBadge } from '../components/common/Badge';
import { ConfirmationDialog } from '../components/common/Modal';
import { LoadingSpinner, EmptyState } from '../components/common/StatCard';
import { useAuth } from '../context/AuthContext';

export const Reservations = () => {
  const { user, isRecipient, isDonor } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cancel reservation state
  const [selectedForCancel, setSelectedForCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await reservationApi.getAll();
      if (res.data.success) {
        setReservations(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancelReservation = async () => {
    if (!selectedForCancel) return;
    try {
      setCancelLoading(true);
      await reservationApi.cancel(selectedForCancel._id, {
        reason: cancelReason || 'Cancelled by user',
      });
      setSelectedForCancel(null);
      setCancelReason('');
      fetchReservations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel reservation');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading reservations..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#26332D] tracking-tight">
            Food Reservations
          </h1>
          <p className="text-xs sm:text-sm text-[#718078] mt-1">
            {isRecipient
              ? 'Track your requested food donations and access your pickup handover verification codes.'
              : 'Review and manage reservations made across your food donations.'}
          </p>
        </div>

        {isRecipient && (
          <Link
            to="/find-food"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-sm transition-all"
          >
            <span>Browse More Food</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-[#D9534F] flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {reservations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reservations.map((res) => {
            const isApproved = res.status === 'approved';
            const isPending = res.status === 'pending';
            const isCompleted = res.status === 'completed';

            return (
              <div
                key={res._id}
                className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={res.status} />
                    <span className="text-xs text-[#718078]">
                      {new Date(res.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#26332D]">
                      {res.donation?.title || 'Food Donation'}
                    </h3>
                    <p className="text-xs font-semibold text-[#205B43] mt-0.5">
                      Requested: {res.requestedQuantity} {res.unit}
                    </p>
                  </div>

                  {/* Donor & Location Details */}
                  <div className="space-y-1.5 text-xs text-[#718078] pt-2 border-t border-stone-100">
                    <div className="flex items-center space-x-2">
                      <Building className="w-3.5 h-3.5 text-[#2E7D5B] shrink-0" />
                      <span>
                        Donor: <strong className="text-[#26332D]">{res.donor?.name}</strong>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-[#2E7D5B] shrink-0" />
                      <span>
                        Pickup at:{' '}
                        <strong className="text-[#26332D]">
                          {res.donation?.pickupLocation?.address?.street},{' '}
                          {res.donation?.pickupLocation?.address?.city}
                        </strong>
                      </span>
                    </div>

                    {res.donation?.pickupEndTime && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-[#2E7D5B] shrink-0" />
                        <span>
                          Deadline:{' '}
                          <strong className="text-[#26332D]">
                            {new Date(res.donation.pickupEndTime).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Handover Code Banner for Recipient */}
                  {isApproved && (
                    <div className="bg-[#EAF4EE] p-3.5 rounded-xl border border-[#2E7D5B]/20 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#205B43] block">
                          Pickup Handover Code
                        </span>
                        <span className="text-xl font-mono font-black text-[#205B43]">
                          {res.handoverCode}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#718078] max-w-[130px] text-right">
                        Present this code to the donor at pickup
                      </span>
                    </div>
                  )}

                  {res.donorNotes && (
                    <div className="bg-[#F8FAF8] p-3 rounded-xl border border-stone-200/60 text-xs">
                      <span className="font-bold text-[#26332D]">Donor instructions: </span>
                      <span className="text-[#718078]">{res.donorNotes}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                  <Link
                    to={`/donations/${res.donation?._id}`}
                    className="text-xs font-bold text-[#2E7D5B] hover:underline"
                  >
                    View Food Details
                  </Link>

                  {(isPending || isApproved) && (
                    <button
                      type="button"
                      onClick={() => setSelectedForCancel(res)}
                      className="text-xs font-bold text-[#D9534F] hover:bg-red-50 px-3 py-1.5 rounded-xl transition-colors"
                    >
                      Cancel Reservation
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No reservations found"
          description={
            isRecipient
              ? 'You have not reserved any surplus food yet. Explore available donations in your community.'
              : 'No reservations have been requested on your donations yet.'
          }
          action={
            isRecipient ? (
              <Link
                to="/find-food"
                className="px-4 py-2 bg-[#2E7D5B] text-white text-xs font-bold rounded-xl"
              >
                Find Food Near You
              </Link>
            ) : null
          }
        />
      )}

      {/* Cancellation Dialog */}
      <ConfirmationDialog
        isOpen={!!selectedForCancel}
        onClose={() => setSelectedForCancel(null)}
        onConfirm={handleCancelReservation}
        title="Cancel Reservation"
        message={`Are you sure you want to cancel your reservation for ${selectedForCancel?.requestedQuantity} ${selectedForCancel?.unit} of "${selectedForCancel?.donation?.title}"? The reserved food quantity will be immediately restored to the donor's available surplus.`}
        confirmText="Confirm Cancellation"
        isDanger={true}
        isLoading={cancelLoading}
      />
    </div>
  );
};

