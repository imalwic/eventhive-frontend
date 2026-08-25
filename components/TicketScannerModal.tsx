"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";

interface ScanResult {
  status: "SUCCESS" | "ALREADY_CHECKED_IN" | "INVALID";
  message: string;
  attendeeName?: string;
  ticketCategory?: string;
  isGroupTicket?: boolean;
}

export default function TicketScannerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setScanResult(null);

      const timer = setTimeout(() => {
        if (!document.getElementById("reader")) return;
        
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            disableFlip: false, // Re-enable to avoid mirroring issues
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
          },
          onScanSuccess,
          onScanFailure
        ).catch((err) => {
          console.warn("Environment camera failed, trying user camera...", err);
          // Fallback to PC webcam/front camera if back camera doesn't exist
          html5QrCode.start(
            { facingMode: "user" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              disableFlip: false,
              formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
            },
            onScanSuccess,
            onScanFailure
          ).catch(console.error);
        });
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.stop().then(() => {
            scannerRef.current.clear();
          }).catch(console.error);
        }
      };
    }
  }, [isOpen]);

  const onScanSuccess = async (decodedText: string) => {
    // Prevent multiple calls if already loading or if there's a result showing
    if (loading || scanResult) return;
    
    setLoading(true);
    
    try {
      const res = await api.post(`/tickets/${decodedText}/checkin`);
      setScanResult(res.data);
    } catch (err: any) {
      if (err.response?.data?.status) {
        setScanResult(err.response.data);
      } else {
        setScanResult({
          status: "INVALID",
          message: "Failed to verify ticket. Server error or invalid code."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const onScanFailure = (error: any) => {
    // HTML5 QR Code Scanner throws errors continuously when no QR is in frame
    // We ignore them.
  };

  const handleNextScan = () => {
    setScanResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border rounded-2xl shadow-2xl overflow-hidden relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 p-2 bg-foreground/10 hover:bg-foreground/20 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-black mb-6">Scan Ticket QR</h2>
          
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/5 flex items-center justify-center border-2 border-dashed border-foreground/20">
            
            {/* The Scanner View */}
            <div 
              id="reader" 
              className={`w-full h-full ${scanResult || loading ? 'hidden' : 'block'}`}
            ></div>

            {/* Loading State */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-20">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-lg animate-pulse">Verifying Ticket...</p>
              </div>
            )}

            {/* Result State */}
            <AnimatePresence>
              {scanResult && !loading && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 ${
                    scanResult.status === "SUCCESS" ? "bg-green-500/10 text-green-600" :
                    scanResult.status === "ALREADY_CHECKED_IN" ? "bg-yellow-500/10 text-yellow-600" :
                    "bg-red-500/10 text-red-600"
                  }`}
                >
                  {scanResult.status === "SUCCESS" ? (
                    <CheckCircle2 size={64} className="mb-4" />
                  ) : scanResult.status === "ALREADY_CHECKED_IN" ? (
                    <AlertTriangle size={64} className="mb-4" />
                  ) : (
                    <XCircle size={64} className="mb-4" />
                  )}

                  <h3 className="text-2xl font-black mb-2">
                    {scanResult.status === "SUCCESS" ? "APPROVED" :
                     scanResult.status === "ALREADY_CHECKED_IN" ? "ALREADY CHECKED IN" :
                     "INVALID"}
                  </h3>
                  <p className="font-medium text-foreground/80 mb-4">{scanResult.message}</p>
                  
                  {scanResult.attendeeName && (
                    <div className="bg-background/80 p-4 rounded-xl border w-full text-foreground text-left space-y-1 mb-6">
                      <p className="text-sm text-foreground/60">Attendee</p>
                      <p className="font-bold text-lg">{scanResult.attendeeName}</p>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs font-bold px-2 py-1 bg-primary/20 text-primary rounded-md">
                          {scanResult.ticketCategory}
                        </span>
                        {scanResult.isGroupTicket && (
                          <span className="text-xs font-bold px-2 py-1 bg-accent/20 text-accent rounded-md">
                            Group Ticket
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={handleNextScan}
                    className="w-full py-3 bg-foreground text-background font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Scan Next Ticket
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <p className="text-center text-sm text-foreground/60 mt-4">
            Point your camera at the attendee's ticket QR code.
          </p>
        </div>
      </div>
    </div>
  );
}
