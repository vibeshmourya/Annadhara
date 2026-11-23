import React, { useState } from 'react';
import { Modal } from './Modal';
import { QrCode, Copy, Check, ShieldCheck, Download } from 'lucide-react';

export const QrCodeModal = ({
  isOpen,
  onClose,
  title = 'Handover QR Code',
  code,
  type = 'delivery', // 'pickup' | 'delivery'
  subtitle = '',
  itemTitle = '',
  quantityText = '',
}) => {
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDelivery = type === 'delivery';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center space-y-4 py-2">
        {itemTitle && (
          <div className="w-full bg-[#F8FAF8] p-3 rounded-xl border border-stone-200/80 text-xs">
            <span className="text-[#718078] block">Food Item:</span>
            <span className="font-bold text-[#26332D] text-sm">{itemTitle}</span>
            {quantityText && <span className="text-[#205B43] font-semibold block mt-0.5">{quantityText}</span>}
          </div>
        )}

        {/* QR Code Container */}
        <div className="p-4 bg-white rounded-2xl border-2 border-[#2E7D5B]/30 shadow-md flex items-center justify-center min-w-[200px] min-h-[200px]">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code)}&color=32-91-67`}
            alt={`Handover QR Code ${code}`}
            className="w-48 h-48 object-contain rounded-lg"
            loading="lazy"
          />
        </div>

        {/* Code display with Copy */}
        <div className="w-full">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#718078] block mb-1">
            {isDelivery ? 'Recipient Delivery Verification Code' : 'Pickup Verification Code'}
          </span>
          <div className="flex items-center justify-center space-x-2 bg-[#EAF4EE] py-2 px-4 rounded-xl border border-[#2E7D5B]/20">
            <span className="text-2xl font-mono font-black text-[#205B43] tracking-widest">{code}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-white text-[#2E7D5B] hover:bg-stone-50 border border-stone-200 transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {copied && <span className="text-[11px] text-[#2E7D5B] font-bold block mt-1">Code copied to clipboard!</span>}
        </div>

        {/* Instructions */}
        <div className={`p-3 rounded-xl text-xs text-left w-full ${isDelivery ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-[#EAF4EE] text-[#205B43] border border-[#2E7D5B]/20'}`}>
          <div className="flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              {subtitle || (isDelivery
                ? 'Display this QR code to the volunteer runner ONLY after you physically receive and inspect the food.'
                : 'Display this QR code to the food donor upon arriving at the pickup location.')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#205B43] transition-colors"
        >
          Done
        </button>
      </div>
    </Modal>
  );
};
