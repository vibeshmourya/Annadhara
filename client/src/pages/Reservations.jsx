import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Clock, MapPin, Building, KeyRound, AlertCircle, XCircle, QrCode, Flag } from 'lucide-react';
import { reservationApi, contributionApi } from '../api/endpoints';
import { StatusBadge } from '../components/common/Badge';
import { ConfirmationDialog, Modal } from '../components/common/Modal';
import { QrCodeModal } from '../components/common/QrCodeModal';
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

  // Discrepancy report state (Recipient reporting issue on completed food delivery)
  const [discrepancyReservation, setDiscrepancyReservation] = useState(null);
  const [discrepancyReason, setDiscrepancyReason] = useState('');
  const [discrepancyLoading, setDiscrepancyLoading] = useState(false);
  const [discrepancySuccess, setDiscrepancySuccess] = useState(false);

  // QR Modal state
  const [qrModal, setQrModal] = useState({
    isOpen: false,
    code: '',
    type: 'delivery',
    itemTitle: '',
    quantityText: '',
  });

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

  const handleReportDiscrepancySubmit = async (e) => {
    e.preventDefault();
    if (!discrepancyReservation || !discrepancyReason.trim()) return;

    try {
      setDiscrepancyLoading(true);
      await contributionApi.reportDiscrepancy(discrepancyReservation._id, {
        reason: discrepancyReason.trim(),
      });
      setDiscrepancySuccess(true);
      setTimeout(() => {
        setDiscrepancyReservation(null);
        setDiscrepancyReason('');
        setDiscrepancySuccess(false);
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit discrepancy report');
    } finally {
      setDiscrepancyLoading(false);
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
            const userRole = (user?.role || '').toLowerCase();
            const isDonorUser = isDonor || userRole === 'donor' || (user?._id && (res.donor?._id === user._id || res.donor === user._id));
            const isRecipientUser = isRecipient || userRole === 'recipient' || (user?._id && (res.recipient?._id === user._id || res.recipient === user._id));
            const showDeliveryCode = isApproved && !isDonorUser && isRecipientUser;

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

                  {/* Recipient Delivery Verification Code (Only shown to RECIPIENT, strictly between Volunteer and Recipient) */}
                  {showDeliveryCode && (
                    <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                          Delivery Verification Code (For Volunteer)
                        </span>
                        <span className="text-xl font-mono font-black text-amber-950 tracking-wider">
                          {res.deliveryCode || `DL-${res.handoverCode?.replace('FB-', '') || '7294'}`}
                        </span>
                        <p className="text-[11px] text-amber-800/80 mt-0.5">
                          Share this code or show QR to the volunteer when they deliver the food to your location.
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setQrModal({
                              isOpen: true,
                              code: res.deliveryCode || `DL-${res.handoverCode?.replace('FB-', '') || '7294'}`,
                              type: 'delivery',
                              itemTitle: res.donation?.title,
                              quantityText: `${res.requestedQuantity} ${res.unit}`,
                            })
                          }
                          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-200 text-amber-950 hover:bg-amber-300 transition-colors shadow-2xs"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Show Delivery QR</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Donor View: No code or QR displayed to food donor */}
                  {isApproved && isDonorUser && (
                    <div className="bg-[#EAF4EE] p-3.5 rounded-xl border border-[#2E7D5B]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#205B43] block">
                          Status: Approved for Pickup
                        </span>
                        <p className="text-xs text-[#205B43] font-medium mt-0.5">
                          Awaiting volunteer runner collection. No verification code is required from the food donor.
                        </p>
                      </div>
                      <Link
                        to="/my-donations"
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-[#205B43] border border-[#2E7D5B]/30 hover:bg-stone-50 transition-colors shadow-2xs shrink-0"
                      >
                        <span>Manage in My Donations →</span>
                      </Link>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="bg-[#EAF4EE] p-3 rounded-xl border border-[#2E7D5B]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-[#205B43]">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-[#2E7D5B]" />
                        <span>Delivery Confirmed & Verified by Recipient Code ✓</span>
                      </div>
                      {isRecipient && (
                        <button
                          type="button"
                          onClick={() => {
                            setDiscrepancyReservation(res);
                            setDiscrepancyReason('');
                            setDiscrepancySuccess(false);
                          }}
                          className="text-[11px] text-[#718078] hover:text-[#D9534F] underline self-start sm:self-auto"
                        >
                          Report Discrepancy
                        </button>
                      )}
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

      {/* Recipient QR Code Modal */}
      <QrCodeModal
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal({ ...qrModal, isOpen: false })}
        title={qrModal.type === 'delivery' ? 'Recipient Delivery Verification QR' : 'Pickup Handover QR'}
        code={qrModal.code}
        type={qrModal.type}
        itemTitle={qrModal.itemTitle}
        quantityText={qrModal.quantityText}
      />

      {/* Recipient Discrepancy Reporting Modal */}
      {discrepancyReservation && (
        <Modal
          isOpen={!!discrepancyReservation}
          onClose={() => setDiscrepancyReservation(null)}
          title="Report Food Receipt Discrepancy"
          maxWidth="max-w-md"
        >
          {discrepancySuccess ? (
            <div className="text-center py-4 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF4EE] text-[#2E7D5B] flex items-center justify-center mx-auto">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#26332D]">Discrepancy Report Submitted</h4>
              <p className="text-xs text-[#718078]">
                Platform administrators have been notified to review this contribution record.
              </p>
            </div>
          ) : (
            <form onSubmit={handleReportDiscrepancySubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-[#F8FAF8] rounded-xl border border-stone-200/70 space-y-1">
                <div><strong className="text-[#26332D]">Food Item:</strong> {discrepancyReservation.donation?.title}</div>
                <div><strong className="text-[#26332D]">Quantity:</strong> {discrepancyReservation.requestedQuantity} {discrepancyReservation.unit}</div>
              </div>

              <div>
                <label className="block font-bold text-[#26332D] mb-1">
                  Describe Observed Discrepancy <span className="text-[#D9534F]">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Quantity received was 10 kg instead of 20 kg, or packaging was broken upon delivery."
                  value={discrepancyReason}
                  onChange={(e) => setDiscrepancyReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2E7D5B]/30"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setDiscrepancyReservation(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 bg-stone-100 hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={discrepancyLoading}
                  className="px-4 py-2 rounded-xl font-bold text-white bg-[#D9534F] hover:bg-red-700"
                >
                  {discrepancyLoading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};

