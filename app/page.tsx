"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap, Music, Ticket, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [exploreHref, setExploreHref] = useState("/login");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setExploreHref("/events");
    }
  }, []);

  return (
    <div className="h-[calc(100vh-80px)] bg-background overflow-hidden relative selection:bg-primary/30">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        
        {/* Floating Event Icons */}
        <motion.div 
          animate={{ y: [-20, 20, -20], rotate: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 text-primary/10"
        >
          <Music size={80} />
        </motion.div>
        
        <motion.div 
          animate={{ y: [20, -20, 20], rotate: [0, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 text-accent/10"
        >
          <Ticket size={100} />
        </motion.div>

        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/3 right-1/3 text-yellow-500/10"
        >
          <Star size={60} />
        </motion.div>
      </div>
      
      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-6 h-full flex items-center justify-center text-center max-w-4xl">
        <div className="flex flex-col items-center w-full">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-8 text-sm font-semibold text-foreground/80 shadow-sm backdrop-blur-sm">
              <Zap size={16} className="text-accent" /> Your Next Big Experience Awaits
            </div>
            
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
              Experience the <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent relative inline-block">
                Extraordinary
                <motion.span 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, delay: 0.8, ease: "easeInOut" }}
                  className="absolute bottom-2 left-0 h-3 bg-primary/20 -z-10 rounded-full"
                ></motion.span>
              </span>
            </h1>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="text-xl md:text-2xl text-foreground/70 mb-12 max-w-2xl mx-auto font-light"
          >
            Discover, book, and manage your events seamlessly. We guarantee concurrency-safe bookings and secure payments.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-6 justify-center w-full sm:w-auto"
          >
            <Link href={exploreHref} className="group px-10 py-5 bg-primary text-primary-foreground rounded-full font-bold text-xl shadow-[0_0_40px_rgba(139,92,246,0.3)] hover:shadow-[0_0_60px_rgba(139,92,246,0.5)] transition-all hover:-translate-y-1 flex items-center justify-center gap-3">
              Explore Events 
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight size={24} />
              </motion.span>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
