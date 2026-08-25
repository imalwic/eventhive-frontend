"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";

export default function ContactPage() {
  const [settings, setSettings] = useState<any>({});
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get("/settings").then(res => setSettings(res.data)).catch(console.error);
  }, []);
  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20"
          >
            <MessageSquare size={32} className="text-primary" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-4xl md:text-6xl font-black mb-4 tracking-tighter"
          >
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Touch</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            className="text-foreground/60 text-lg max-w-2xl mx-auto"
          >
            Have questions about EventHive? Need help organizing your event? We're here to help you every step of the way.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Contact Info Cards */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.2 }}
            className="md:col-span-2 space-y-4"
          >
            <div className="glass-card p-6 rounded-3xl border border-border flex items-start gap-4 hover:border-primary/30 transition-colors group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Phone size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Call Us</h3>
                <p className="text-foreground/60 text-sm mb-2">Mon-Fri from 9am to 6pm.</p>
                <a href={`tel:${settings.contactPhone?.replace(/\s+/g, '') || '0762807271'}`} className="font-black text-xl text-primary hover:underline">
                  {settings.contactPhone || '076 280 7271'}
                </a>
              </div>
            </div>
            
            <div className="glass-card p-6 rounded-3xl border border-border flex items-start gap-4 hover:border-primary/30 transition-colors group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Mail size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Email Us</h3>
                <p className="text-foreground/60 text-sm mb-2">We'll respond within 24 hours.</p>
                <a href={`mailto:${settings.contactEmail || 'hello@eventhive.lk'}`} className="font-bold text-primary hover:underline">
                  {settings.contactEmail || 'hello@eventhive.lk'}
                </a>
              </div>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-border flex items-start gap-4 hover:border-primary/30 transition-colors group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <MapPin size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Visit Us</h3>
                <p className="text-foreground/60 text-sm whitespace-pre-wrap">
                  {settings.contactAddress || '123 Event Avenue\nColombo 03\nSri Lanka'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.3 }}
            className="md:col-span-3 glass-card p-8 rounded-3xl border border-border relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <h2 className="text-2xl font-black mb-6">Send us a Message</h2>
            {success ? (
              <div className="text-center py-12 relative z-10">
                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                <p className="text-foreground/60 mb-6">Thank you for getting in touch. We'll get back to you shortly.</p>
                <button 
                  onClick={() => { setSuccess(false); setFormData({firstName: '', lastName: '', email: '', message: ''}); }}
                  className="px-6 py-2 bg-secondary text-foreground rounded-xl font-bold hover:bg-secondary/80 transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form 
                className="space-y-4 relative z-10" 
                onSubmit={async (e) => { 
                  e.preventDefault(); 
                  setIsSubmitting(true);
                  try {
                    await api.post("/contact/messages", formData);
                    setSuccess(true);
                  } catch (err) {
                    console.error(err);
                    toast.error("Failed to send message. Please try again.");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-2 text-foreground/70 uppercase tracking-wider">First Name</label>
                    <input type="text" required placeholder="John" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full p-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2 text-foreground/70 uppercase tracking-wider">Last Name</label>
                    <input type="text" required placeholder="Doe" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full p-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary outline-none transition-colors" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold mb-2 text-foreground/70 uppercase tracking-wider">Email Address</label>
                  <input type="email" required placeholder="john@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary outline-none transition-colors" />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-2 text-foreground/70 uppercase tracking-wider">Message</label>
                  <textarea required rows={5} placeholder="How can we help you?" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full p-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary outline-none transition-colors resize-none"></textarea>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-black text-lg hover:bg-primary/90 transition-all hover:scale-[1.02] disabled:hover:scale-100 shadow-lg shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-70">
                  <Send size={20} />
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
