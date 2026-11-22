import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { QrScannerView } from '../common/QrScannerView';
import { handoverApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, CheckCircle2, AlertCircle, QrCode, KeyRound, Truck } from 'lucide-react';

export const HandoverModal = ({ isOpen, onClose, reservation, onHandoverSuccess }) => {
  if (!reservation) return null;

  const { user, isDonor } = useAuth();
  const isDonorUser =
    isDonor ||
    user?.role === 'donor' ||
    (user?._id && reservation.donor?._id && String(reservation.donor._id) === String(user._id));

  const [scanTab, setScanTab] = useState('manual'); // 'manual' | 'qr'
  const [handoverCode, setHandoverCode] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Verification code is only required for non-donors
    if (!isDonorUser && !handoverCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        reservationId: reservation._id,
        notes,
        verificationMethod: isDonorUser ? 'donor_confirmation' : (scanTab === 'qr' ? 'qr' : 'code'),
      };
      if (handoverCode.trim()) {
        payload.handoverCode = handoverCode.trim();
      }

      const res = await handoverApi.confirm(payload);

      if (res.data.success) {
        setIsCompleted(true);
        if (onHandoverSuccess) {
          onHandoverSuccess(res.data.data);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Handover confirmation failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setScanTab('manual');
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
      title={isCompleted ? 'Handover Confirmed!' : (isDonorUser ? 'Confirm Handover to Volunteer' : 'Confirm Food Handover')}
      maxWidth="max-w-md"
    >
      {isCompleted ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#EAF4EE] text-[#2E7D5B] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-[#26332D]">Food Handover Confirmed!</h4>
            <p className="text-xs text-[#718078] mt-1 max-w-sm mx-auto leading-relaxed">
              {reservation.requestedQuantity} {reservation.unit} of food has been successfully recorded as handed over to the volunteer runner.
              Thank you for keeping surplus food in the human food cycle.
            </p>
          </div>

          <div className="bg-[#EAF4EE] p-3 rounded-xl text-[#205B43] text-xs font-semibold">
            Zero Waste Invariant Confirmed • Contribution Recorded
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
              <span className="text-[#718078]">Food Item:</span>
              <span className="font-bold text-[#26332D]">{reservation.donation?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#718078]">Quantity:</span>
              <span className="font-bold text-[#205B43]">
                {reservation.requestedQuantity} {reservation.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#718078]">Recipient Charity:</span>
              <span className="font-semibold text-[#26332D]">
                {reservation.recipientOrg?.organizationName || reservation.recipient?.name || 'Authorized Recipient'}
              </span>
            </div>
          </div>

          {isDonorUser ? (
            /* Donor view: Pure one-click handover confirmation, NO code or QR */
            <div className="space-y-3">
              <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-[#2E7D5B]/20 text-xs text-[#205B43] flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-[#2E7D5B] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">No verification code required for donors</span>
                  <p className="text-[11px] text-[#205B43]/90 leading-relaxed">
                    Confirm that the volunteer runner has arrived at your premises and collected the food. Verification codes are strictly verified between the volunteer and the recipient organization upon delivery.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1">
                  Handover Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Temperature checked; packaged safely in thermal boxes"
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
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43] shadow-sm transition-colors flex items-center justify-center space-x-1.5"
                >
                  {loading && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <Truck className="w-3.5 h-3.5" />
                  <span>Confirm Handover to Volunteer</span>
                </button>
              </div>
            </div>
          ) : (
            /* Non-donor fallback view: code / QR input */
            <>
              {/* Mode Switcher */}
              <div className="flex border-b border-stone-200">
                <button
                  type="button"
                  onClick={() => setScanTab('manual')}
                  className={`flex-1 py-2 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors border-b-2 ${
                    scanTab === 'manual'
                      ? 'border-[#2E7D5B] text-[#205B43]'
                      : 'border-transparent text-[#718078] hover:text-[#26332D]'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Enter Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScanTab('qr')}
                  className={`flex-1 py-2 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors border-b-2 ${
                    scanTab === 'qr'
                      ? 'border-[#2E7D5B] text-[#205B43]'
                      : 'border-transparent text-[#718078] hover:text-[#26332D]'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan QR Code</span>
                </button>
              </div>

              {scanTab === 'qr' ? (
                <div className="space-y-3">
                  <QrScannerView
                    onScanSuccess={(code) => {
                      setHandoverCode(code.toUpperCase());
                      setScanTab('manual');
                    }}
                    hintText="Scan the Recipient Delivery QR Code"
                  />
                  <p className="text-[11px] text-center text-[#718078]">
                    Scan the recipient's delivery QR code from their mobile screen.
                  </p>
                </div>
              ) : (
                <>
                  {/* Code input */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#26332D] mb-1.5 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <KeyRound className="w-3.5 h-3.5 text-[#2E7D5B]" />
                        <span>Delivery Verification Code</span>
                      </span>
                      <span className="text-[10px] text-[#718078] font-normal">Provided by recipient</span>
                    </label>
                    <input
                      type="text"
                      value={handoverCode}
                      onChange={(e) => setHandoverCode(e.target.value.toUpperCase())}
                      placeholder="e.g. DL-7294"
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
                </>
              )}
            </>
          )}
        </form>
      )}
    </Modal>
  );
};
