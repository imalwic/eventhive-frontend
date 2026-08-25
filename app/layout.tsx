import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EventHive | Premium Event Booking Platform",
  description: "Secure concurrency-safe event booking with EventHive.",
};

import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Script src="https://www.payhere.lk/lib/payhere.js" strategy="beforeInteractive" />
        <GoogleOAuthProvider clientId="313163096616-iect6906cnhpnh07u3bpj3a3p80nj3uq.apps.googleusercontent.com">
          <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
          <Navbar />
          
          <main className="flex-1">
            {children}
          </main>

        <footer className="border-t border-border bg-card py-6 mt-auto">
          <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <Link href="/" className="text-lg font-black tracking-tighter block mb-1">
                <span className="text-primary">Event</span>Hive
              </Link>
              <p className="text-xs text-foreground/50">© 2026 EventHive. All rights reserved.</p>
            </div>
            
            <div className="flex gap-6 text-xs text-foreground/60">
              <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>
        </footer>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
