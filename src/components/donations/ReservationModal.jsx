import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { reservationApi } from '../../api/endpoints';
import { AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';

export const ReservationModal = ({ isOpen, onClose, donation, onReservationSuccess }) => {
  if (!donation) return null;

  const [quantity, setQuantity] = useState(
    Math.min(10, donation.availableQuantity || 1)
  );
  const [requestNotes, setRequestNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (quantity <= 0) {
      setError('Please request at least 1 unit');
      return;
    }

    if (quantity > donation.availableQuantity) {
      setError(`Cannot request more than available quantity (${donation.availableQuantity} ${donation.unit})`);
      return;
    }

    try {
      setLoading(true);
      const res = await reservationApi.create({
        donationId: donation._id,
        requestedQuantity: Number(quantity),
        requestNotes,
      });

      if (res.data.success) {
        setSuccessData(res.data.data.reservation);
        if (onReservationSuccess) {
          onReservationSuccess(res.data.data);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to submit reservation. Please check quantity and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccessData(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={successData ? 'Reservation Submitted!' : `Reserve Food: ${donation.title}`}
      maxWidth="max-w-md"
    >
      {successData ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-14 h-14 bg-[#EAF4EE] text-[#2E7D5B] rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-[#26332D]">Request Successfully Sent</h4>
            <p className="text-xs text-[#718078] mt-1 max-w-sm mx-auto">
              The donor has received your request for {successData.requestedQuantity} {successData.unit}. Once approved, you will be notified with pickup coordination details.
            </p>
          </div>

          <div className="bg-[#F8FAF8] border border-stone-200/80 rounded-xl p-4 text-left space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#718078]">Handover Code:</span>
              <span className="font-mono font-bold text-[#205B43] bg-[#EAF4EE] px-2 py-0.5 rounded">
                {successData.handoverCode}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#718078]">Requested Quantity:</span>
              <span className="font-bold text-[#26332D]">
                {successData.requestedQuantity} {successData.unit}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#718078]">Status:</span>
              <span className="font-semibold text-yellow-800 bg-yellow-50 px-2 py-0.5 rounded text-[11px]">
                Pending Donor Approval
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-sm transition-colors"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#D9534F] flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Available info */}
          <div className="bg-[#EAF4EE] p-3 rounded-xl border border-[#2E7D5B]/20 flex items-center justify-between text-xs">
            <span className="text-[#205B43] font-medium">Currently Available:</span>
            <span className="font-bold text-[#205B43] text-sm">
              {donation.availableQuantity} {donation.unit}
            </span>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1.5">
              Requested Quantity ({donation.unit})
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max={donation.availableQuantity}
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-200 bg-[#F8FAF8] text-sm font-semibold text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
              />
              <span className="text-sm font-semibold text-[#718078] px-2">{donation.unit}</span>
            </div>

            {/* Quick preset buttons */}
            <div className="flex space-x-2 mt-2">
              {[0.25, 0.5, 1.0].map((ratio) => {
                const val = Math.max(1, Math.round(donation.availableQuantity * ratio));
                return (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setQuantity(val)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-[#718078] transition-colors"
                  >
                    {ratio === 1.0 ? 'All' : `${ratio * 100}%`} ({val})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Request Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1.5">
              Request Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
              placeholder="e.g. For our evening shelter meal service; can pick up around 5:30 PM..."
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-[#F8FAF8] text-xs text-[#26332D] placeholder-[#718078] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
            />
          </div>

          <div className="flex items-start space-x-2 text-[11px] text-[#718078] bg-[#F8FAF8] p-2.5 rounded-xl border border-stone-200/60">
            <ShieldCheck className="w-4 h-4 text-[#2E7D5B] shrink-0 mt-0.5" />
            <span>
              By requesting, your organization commits to adhering to hygienic food transport standards and arriving within the pickup window.
            </span>
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#718078] bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-sm transition-colors flex items-center justify-center space-x-1.5"
            >
              {loading && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>Submit Request</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

