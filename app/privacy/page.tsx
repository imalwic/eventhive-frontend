"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/axios";

export default function PrivacyPage() {
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    api.get("/settings").then(res => setSettings(res.data)).catch(console.error);
  }, []);
  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20"
          >
            <Shield size={32} className="text-primary" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-4xl md:text-6xl font-black mb-4 tracking-tighter"
          >
            Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Policy</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            className="text-foreground/60 text-lg"
          >
            Last updated: {settings.lastUpdated ? new Date(settings.lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "August 24, 2026"}
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="glass-card p-8 md:p-12 rounded-3xl border border-border prose prose-invert max-w-none"
        >
          {settings.privacyPolicyContent ? (
            <div 
              className="text-foreground/80 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: settings.privacyPolicyContent }} 
            />
          ) : (
            <div className="text-foreground/70 leading-relaxed">Loading...</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
