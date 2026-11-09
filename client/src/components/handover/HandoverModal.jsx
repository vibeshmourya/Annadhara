import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { handoverApi } from '../../api/endpoints';
import { ShieldCheck, CheckCircle2, AlertCircle, QrCode, KeyRound } from 'lucide-react';

export const HandoverModal = ({ isOpen, onClose, reservation, onHandoverSuccess }) => {
  if (!reservation) return null;

  const [handoverCode, setHandoverCode] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!handoverCode.trim()) {
      setError('Please enter the 6-character verification code');
      return;
    }

    try {
      setLoading(true);
      const res = await handoverApi.confirm({
        reservationId: reservation._id,
        handoverCode: handoverCode.trim(),
        notes,
        verificationMethod: 'code',
      });

      if (res.data.success) {
        setIsCompleted(true);
        if (onHandoverSuccess) {
          onHandoverSuccess(res.data.data);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Verification failed. Please check the code and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setHandoverCode('');
    setNotes('');
    setError('');
    setIsCompleted(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isCompleted ? 'Handover Confirmed!' : 'Confirm Food Handover'}
      maxWidth="max-w-md"
    >
      {isCompleted ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#EAF4EE] text-[#2E7D5B] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-[#26332D]">Food Rescued & Transferred!</h4>
            <p className="text-xs text-[#718078] mt-1 max-w-sm mx-auto leading-relaxed">
              {reservation.requestedQuantity} {reservation.unit} of food has been successfully recorded as collected.
              Thank you for keeping surplus food in the human food cycle.
            </p>
          </div>

          <div className="bg-[#EAF4EE] p-3 rounded-xl text-[#205B43] text-xs font-semibold">
            Zero Waste Invariant Confirmed • Impact Recorded
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-sm transition-colors"
          >
            Close
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

          <div className="bg-[#F8FAF8] p-3.5 rounded-xl border border-stone-200/80 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#718078]">Item:</span>
              <span className="font-bold text-[#26332D]">{reservation.donation?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#718078]">Quantity:</span>
              <span className="font-bold text-[#205B43]">
                {reservation.requestedQuantity} {reservation.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#718078]">Recipient:</span>
              <span className="font-semibold text-[#26332D]">
                {reservation.recipient?.name || 'Authorized Recipient'}
              </span>
            </div>
          </div>

          {/* Code input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <KeyRound className="w-3.5 h-3.5 text-[#2E7D5B]" />
                <span>Verification Code</span>
              </span>
              <span className="text-[10px] text-[#718078] font-normal">Provided by recipient / volunteer</span>
            </label>
            <input
              type="text"
              value={handoverCode}
              onChange={(e) => setHandoverCode(e.target.value.toUpperCase())}
              placeholder="e.g. FB-7294"
              maxLength={10}
              required
              className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white text-center font-mono text-lg font-bold tracking-widest text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1">
              Handover Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Checked temperature; packed in thermal insulated bag"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-[#F8FAF8] text-xs text-[#26332D] focus:outline-none focus:ring-2 focus:ring-[#2E7D5B]/30 focus:border-[#2E7D5B]"
            />
          </div>

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
              <span>Verify & Complete</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

