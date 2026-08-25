"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import { QrCode, CheckCircle2, XCircle, ArrowLeft, Scan, Camera } from "lucide-react";
import Link from "next/link";

export default function QRScannerPage() {
  const { id } = useParams();
  const router = useRouter();
  const [uuid, setUuid] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!uuid.trim()) return;

    setScanning(true);
    setResult(null);

    try {
      const res = await api.post(`/tickets/${uuid}/checkin`);
      setResult({
        success: true,
        data: res.data
      });
    } catch (err: any) {
      setResult({
        success: false,
        error: err.response?.data?.message || "Invalid QR Code or network error"
      });
    } finally {
      setScanning(false);
      setUuid(""); // Clear for next scan
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <Link href={`/events/${id}/manage`} className="flex items-center gap-2 text-foreground/60 hover:text-primary mb-8 transition-colors">
          <ArrowLeft size={20} />
          <span className="font-bold">Back to Manage Event</span>
        </Link>

        <div className="glass-card p-8 rounded-3xl border border-border shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
              <Scan size={32} />
            </div>
            <h1 className="text-2xl font-black mb-2">Event Check-In</h1>
            <p className="text-sm text-foreground/60">Scan attendee QR codes to admit them.</p>
          </div>

          <div className="w-full aspect-square bg-secondary/50 rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center mb-8 relative">
            <Camera size={48} className="text-foreground/20 mb-4" />
            <p className="text-xs text-foreground/50 font-bold uppercase tracking-widest text-center px-8">Camera scanning not available in this environment</p>
          </div>

          <form onSubmit={handleScan} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Or enter Ticket UUID..."
              value={uuid}
              onChange={(e) => setUuid(e.target.value)}
              className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
              disabled={scanning}
            />
            <button 
              type="submit" 
              disabled={scanning || !uuid.trim()}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {scanning ? "..." : "Verify"}
            </button>
          </form>

          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mt-6 p-4 rounded-2xl border ${result.success ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}
              >
                {result.success ? (
                  <div className="flex flex-col items-center text-center">
                    <CheckCircle2 size={48} className="text-emerald-500 mb-2" />
                    <h3 className="font-black text-lg text-emerald-500 mb-1">{result.data.status === 'ALREADY_CHECKED_IN' ? 'Already Checked In' : 'Valid Ticket!'}</h3>
                    <p className="text-sm font-semibold">{result.data.attendeeName}</p>
                    <p className="text-xs text-foreground/70">{result.data.ticketCategory} {result.data.isGroupTicket ? '(Group/Table)' : ''}</p>
                    {result.data.status === 'ALREADY_CHECKED_IN' && (
                      <p className="text-xs text-amber-500 mt-2 font-bold bg-amber-500/10 px-3 py-1 rounded-full">{result.data.message}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <XCircle size={48} className="text-red-500 mb-2" />
                    <h3 className="font-black text-lg text-red-500 mb-1">Invalid Ticket</h3>
                    <p className="text-sm text-foreground/70">{result.error}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
