import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, AlertCircle, CheckCircle2, RefreshCw, Zap } from 'lucide-react';

export const QrScannerView = ({ onScanSuccess, expectedPrefix = 'DL' }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanning, setScanning] = useState(false);

  // Start live webcam if available
  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setScanning(true);

      // Check if native BarcodeDetector is supported
      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const interval = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const rawVal = barcodes[0].rawValue.trim();
              clearInterval(interval);
              stopCamera();
              onScanSuccess(rawVal);
            }
          } catch (_) {}
        }, 400);
      }
    } catch (err) {
      setCameraError(err.message || 'Camera permission denied or camera not found.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Quick Demo Simulator for easy testing on computers without external webcams
  const handleQuickDemoScan = (demoCode) => {
    stopCamera();
    onScanSuccess(demoCode);
  };

  return (
    <div className="space-y-3">
      {/* Viewport for Camera */}
      <div className="relative w-full h-52 bg-stone-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center border-2 border-dashed border-[#2E7D5B]/40">
        {cameraActive ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Animated Scanning Box */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-36 h-36 border-2 border-emerald-400 rounded-xl relative animate-pulse">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#2E7D5B]" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#2E7D5B]" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#2E7D5B]" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#2E7D5B]" />
              </div>
            </div>
            <div className="absolute bottom-2 bg-black/60 text-white text-[11px] px-3 py-1 rounded-full font-semibold">
              Scanning for QR Code...
            </div>
          </>
        ) : (
          <div className="text-center p-4 space-y-2">
            <div className="w-12 h-12 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center mx-auto">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-xs text-stone-300 font-medium">
              Point your camera at the recipient's Delivery QR Code
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="px-4 py-2 rounded-xl bg-[#2E7D5B] hover:bg-[#205B43] text-white text-xs font-bold transition-all shadow-sm"
            >
              Start Camera Scanner
            </button>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{cameraError} (You can also type the code or use the quick test scan below).</span>
        </div>
      )}

      {/* Quick Demo Scan Shortcuts for testing */}
      <div className="p-3 rounded-xl bg-[#F8FAF8] border border-stone-200 text-xs space-y-2">
        <div className="flex items-center space-x-1.5 text-[#205B43] font-bold">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Instant One-Tap QR Scanner Simulator</span>
        </div>
        <p className="text-[11px] text-[#718078]">
          Useful for laptop testing or whenever camera hardware is busy or unavailable:
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleQuickDemoScan('DL-9382')}
            className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white hover:bg-stone-100 border border-stone-200 text-[#205B43] transition-colors"
          >
            ⚡ Scan DL-9382 (Demo)
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoScan('DL-XEUW')}
            className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white hover:bg-stone-100 border border-stone-200 text-[#205B43] transition-colors"
          >
            ⚡ Scan DL-XEUW (Demo)
          </button>
        </div>
      </div>
    </div>
  );
};
