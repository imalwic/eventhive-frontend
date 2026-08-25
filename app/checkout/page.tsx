"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  const seats = searchParams.get("seats");

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-12 rounded-3xl text-center max-w-lg w-full border border-primary/20"
      >
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        
        <h1 className="text-3xl font-black mb-4">Redirecting to PayHere...</h1>
        <p className="text-foreground/70 mb-8">
          You are booking seats <span className="font-bold text-foreground">{seats}</span> for event <span className="font-bold text-foreground">#{eventId}</span>.
        </p>
        
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-sm text-foreground/50">
          This is a mock checkout flow. In the real app, the backend's `/generate-hash` endpoint is called, and the user is redirected to PayHere sandbox.
        </div>

        <Link href="/" className="inline-block mt-8 text-primary font-semibold hover:underline">
          Cancel & Return Home
        </Link>
      </motion.div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
