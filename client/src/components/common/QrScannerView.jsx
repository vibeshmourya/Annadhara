import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, AlertCircle, CheckCircle2, RefreshCw, Zap, Image as ImageIcon } from 'lucide-react';

let jsQRModule = null;
const getJsQR = async () => {
  if (typeof window !== 'undefined' && window.jsQR) return window.jsQR;
  if (jsQRModule) return jsQRModule;
  try {
    const mod = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/+esm');
    jsQRModule = mod.default || mod;
    return jsQRModule;
  } catch (_) {
    return null;
  }
};

export const QrScannerView = ({ onScanSuccess, hintText = 'Scan QR Code' }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const animFrameId = useRef(null);
  const fileInputRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scannedResult, setScannedResult] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);

  // Scan frame by frame using BarcodeDetector or jsQR
  const scanFrame = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      animFrameId.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      // 1. Try native browser BarcodeDetector API if available (Chrome, Edge, Android)
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await detector.detect(video);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            const rawVal = barcodes[0].rawValue.trim();
            setScannedResult(rawVal);
            setScanSuccess(true);
            stopCamera();
            onScanSuccess(rawVal);
            return;
          }
        } catch (_) {}
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const decoder = await getJsQR();
        if (decoder) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = decoder(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data && code.data.trim()) {
            const rawVal = code.data.trim();
            setScannedResult(rawVal);
            setScanSuccess(true);
            stopCamera();
            onScanSuccess(rawVal);
            return;
          }
        }
      } catch (_) {
        // Continue scanning next frame
      }
    }

    animFrameId.current = requestAnimationFrame(scanFrame);
  }, [onScanSuccess]);

  // Start live camera
  const startCamera = async () => {
    setCameraError('');
    setScanSuccess(false);
    setScannedResult('');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        await videoRef.current.play();
      }

      setCameraActive(true);
      animFrameId.current = requestAnimationFrame(scanFrame);
    } catch (err) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera permissions in your browser or type the code manually.'
          : err.message || 'Camera not available or busy.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Process uploaded image file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        try {
          if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
            try {
              const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
              const barcodes = await detector.detect(img);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                const rawVal = barcodes[0].rawValue.trim();
                setScannedResult(rawVal);
                setScanSuccess(true);
                onScanSuccess(rawVal);
                return;
              }
            } catch (_) {}
          }

          const decoder = await getJsQR();
          if (decoder) {
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            const code = decoder(imageData.data, imageData.width, imageData.height);
            if (code && code.data && code.data.trim()) {
              const rawVal = code.data.trim();
              setScannedResult(rawVal);
              setScanSuccess(true);
              onScanSuccess(rawVal);
              return;
            }
          }
          setCameraError('No valid QR code was detected in this image. Please ensure the QR is clear and well-lit.');
        } catch (readErr) {
          setCameraError('Failed to decode the uploaded image.');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Instant one-tap simulation for testing
  const handleQuickDemoScan = (demoCode) => {
    stopCamera();
    setScannedResult(demoCode);
    setScanSuccess(true);
    onScanSuccess(demoCode);
  };

  return (
    <div className="space-y-3">
      {/* Viewport for Camera */}
      <div className="relative w-full h-56 bg-stone-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center border-2 border-dashed border-[#2E7D5B]/40">
        {cameraActive ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />
            {/* Animated Scanning Reticle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-40 h-40 border-2 border-emerald-400/80 rounded-xl relative shadow-lg">
                <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-[#2E7D5B]" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-[#2E7D5B]" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-[#2E7D5B]" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-[#2E7D5B]" />
                <div className="w-full h-0.5 bg-emerald-400/70 absolute top-1/2 -translate-y-1/2 animate-pulse shadow-sm" />
              </div>
            </div>
            <div className="absolute bottom-2.5 bg-black/70 text-emerald-300 text-[11px] px-3.5 py-1 rounded-full font-semibold flex items-center space-x-1.5 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Scanning live video for QR code...</span>
            </div>
          </>
        ) : scanSuccess ? (
          <div className="text-center p-4 space-y-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#205B43] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-xs font-bold text-white">QR Code Detected!</p>
            <p className="text-sm font-mono font-black text-emerald-400 bg-stone-800 px-3 py-1 rounded-lg">
              {scannedResult}
            </p>
          </div>
        ) : (
          <div className="text-center p-4 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center mx-auto">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-stone-200 font-semibold">{hintText}</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Use camera or upload a QR image</p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-1">
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-[#2E7D5B] hover:bg-[#205B43] text-white text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Start Camera</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition-all border border-stone-700 flex items-center space-x-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload QR</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {cameraError && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">{cameraError}</span>
            <span className="text-[11px] text-amber-700 block">
              Tip: You can upload a QR image, type the code manually, or tap one of the instant test codes below.
            </span>
          </div>
        </div>
      )}

      {/* Quick Demo Scan Shortcuts for testing */}
      <div className="p-3 rounded-xl bg-[#F8FAF8] border border-stone-200 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[#205B43] font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant One-Tap QR Scanner Simulator</span>
          </div>
          <span className="text-[10px] text-[#718078]">For quick testing</span>
        </div>
        <p className="text-[11px] text-[#718078] leading-tight">
          Tap any button to instantly simulate camera scanning of that QR code:
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleQuickDemoScan('DL-9382')}
            className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white hover:bg-emerald-50 border border-stone-200 text-[#205B43] transition-colors shadow-2xs"
          >
            ⚡ Scan DL-9382
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoScan('DL-7294')}
            className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white hover:bg-emerald-50 border border-stone-200 text-[#205B43] transition-colors shadow-2xs"
          >
            ⚡ Scan DL-7294
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoScan('FB-7294')}
            className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white hover:bg-emerald-50 border border-stone-200 text-[#205B43] transition-colors shadow-2xs"
          >
            ⚡ Scan FB-7294
          </button>
        </div>
      </div>
    </div>
  );
};
