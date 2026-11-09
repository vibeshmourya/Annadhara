import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  MapPin,
  Building,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Share2,
  Flag,
} from 'lucide-react';
import { donationApi } from '../api/endpoints';
import { StatusBadge, CategoryBadge } from '../components/common/Badge';
import { ReservationModal } from '../components/donations/ReservationModal';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/StatCard';
import { useAuth } from '../context/AuthContext';

export const DonationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isRecipient, user } = useAuth();

  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Safety or hygiene concern');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  const fetchDonation = async () => {
    try {
      setLoading(true);
      const res = await donationApi.getById(id);
      if (res.data.success) {
        setDonation(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load donation details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonation();
  }, [id]);

  const handleReport = async (e) => {
    e.preventDefault();
    try {
      await donationApi.report(id, { reason: reportReason, details: reportDetails });
      setReportSuccess(true);
      setTimeout(() => {
        setIsReportModalOpen(false);
        setReportSuccess(false);
      }, 2000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit report');
    }
  };

  if (loading) return <LoadingSpinner text="Loading donation information..." />;

  if (error || !donation) {
    return (
      <div className="max-w-xl mx-auto my-16 text-center space-y-4">
        <p className="text-sm text-[#D9534F] font-bold">{error || 'Donation not found'}</p>
        <button
          onClick={() => navigate('/find-food')}
          className="px-4 py-2 rounded-xl bg-[#2E7D5B] text-white text-xs font-bold"
        >
          Back to Available Food
        </button>
      </div>
    );
  }

  const defaultImage =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

  const isExpired = new Date(donation.pickupEndTime) <= new Date();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#718078] hover:text-[#26332D] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to listings</span>
      </button>

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image Pane */}
          <div className="relative h-72 md:h-full min-h-[320px] bg-stone-100">
            <img
              src={donation.imageUrl || defaultImage}
              alt={donation.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = defaultImage;
              }}
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <StatusBadge status={isExpired ? 'expired' : donation.status} />
            </div>
          </div>

          {/* Info Pane */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <CategoryBadge category={donation.category} />
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="text-stone-400 hover:text-[#D9534F] text-xs flex items-center space-x-1 transition-colors"
                  title="Report safety concern"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report listing</span>
                </button>
              </div>

              <h1 className="text-2xl font-extrabold text-[#26332D] tracking-tight">{donation.title}</h1>

              <p className="text-xs text-[#718078] leading-relaxed">{donation.description}</p>

              {/* Quantity Highlight */}
              <div className="p-4 rounded-2xl bg-[#EAF4EE] border border-[#2E7D5B]/20 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#205B43] block">
                    Available for Rescue
                  </span>
                  <span className="text-2xl font-extrabold text-[#205B43]">
                    {donation.availableQuantity} {donation.unit}
                  </span>
                </div>
                <span className="text-xs text-[#718078]">of {donation.totalQuantity} total</span>
              </div>
            </div>

            {/* Timings and Location */}
            <div className="space-y-3 text-xs border-t border-stone-100 pt-4">
              <div className="flex items-center space-x-2 text-[#718078]">
                <Clock className="w-4 h-4 text-[#2E7D5B] shrink-0" />
                <span>
                  Pickup Deadline:{' '}
                  <strong className="text-[#26332D]">
                    {new Date(donation.pickupEndTime).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>
                </span>
              </div>

              <div className="flex items-center space-x-2 text-[#718078]">
                <MapPin className="w-4 h-4 text-[#2E7D5B] shrink-0" />
                <span>
                  Location:{' '}
                  <strong className="text-[#26332D]">
                    {donation.pickupLocation?.address?.street}, {donation.pickupLocation?.address?.city}
                  </strong>
                </span>
              </div>

              <div className="flex items-center space-x-2 text-[#718078]">
                <Building className="w-4 h-4 text-[#2E7D5B] shrink-0" />
                <span>
                  Donor:{' '}
                  <strong className="text-[#26332D]">
                    {donation.organization?.name || donation.donor?.name}
                  </strong>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              {donation.status === 'available' && donation.availableQuantity > 0 && !isExpired ? (
                isRecipient ? (
                  <button
                    type="button"
                    onClick={() => setIsReserveModalOpen(true)}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Request / Reserve Food</span>
                  </button>
                ) : !isAuthenticated ? (
                  <Link
                    to="/login"
                    className="w-full py-3 rounded-xl font-bold text-sm text-center text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-md transition-all block"
                  >
                    Sign in to Reserve
                  </Link>
                ) : (
                  <p className="text-center text-xs text-[#718078] bg-[#F8FAF8] p-2.5 rounded-xl border border-stone-200/60">
                    Logged in as {user?.role}. Food reservations are reserved for registered Recipient NGOs.
                  </p>
                )
              ) : (
                <div className="text-center text-xs text-stone-500 bg-stone-100 p-3 rounded-xl font-semibold">
                  This donation is currently not available for reservation.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Food Safety & Handling Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#205B43]">
            <ShieldCheck className="w-4 h-4 text-[#2E7D5B]" />
            <span>Storage & Handling</span>
          </div>
          <p className="text-sm font-extrabold text-[#26332D] capitalize">
            {donation.storageHandling?.replace('_', ' ')}
          </p>
          <p className="text-[11px] text-[#718078] leading-relaxed">
            Must be transported maintaining standard cold-chain or thermal insulation guidelines.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#205B43]">
            <AlertTriangle className="w-4 h-4 text-[#E9A23B]" />
            <span>Allergen Declaration</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {donation.allergens?.length > 0 ? (
              donation.allergens.map((alg, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-stone-100 text-[#26332D] text-xs font-semibold">
                  {alg}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#718078]">None reported by donor</span>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#205B43]">
            <Calendar className="w-4 h-4 text-[#2E7D5B]" />
            <span>Preparation Date</span>
          </div>
          <p className="text-sm font-extrabold text-[#26332D]">
            {new Date(donation.prepDateTime).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p className="text-[11px] text-[#718078]">Prepared fresh and verified under safety declaration.</p>
        </div>
      </div>

      {/* Reservation Modal */}
      <ReservationModal
        isOpen={isReserveModalOpen}
        onClose={() => setIsReserveModalOpen(false)}
        donation={donation}
        onReservationSuccess={() => {
          fetchDonation();
        }}
      />

      {/* Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report Food Listing"
        maxWidth="max-w-md"
      >
        {reportSuccess ? (
          <div className="text-center py-4 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-[#2E7D5B] mx-auto" />
            <h4 className="text-sm font-bold text-[#26332D]">Report Submitted</h4>
            <p className="text-xs text-[#718078]">Thank you for keeping the community safe. Platform admins have been notified.</p>
          </div>
        ) : (
          <form onSubmit={handleReport} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#26332D] mb-1">Reason for concern</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8]"
              >
                <option value="Safety or hygiene concern">Safety or hygiene concern</option>
                <option value="Expired or spoiled food">Expired or spoiled food</option>
                <option value="Inaccurate quantity or description">Inaccurate quantity or description</option>
                <option value="Suspicious listing">Suspicious listing</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#26332D] mb-1">Additional details (Optional)</label>
              <textarea
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe what you observed..."
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-[#718078] bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-white font-bold bg-[#D9534F] hover:bg-red-700"
              >
                Submit Report
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

