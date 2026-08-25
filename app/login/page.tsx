"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { GoogleLogin } from '@react-oauth/google';
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/google-login", { credential: credentialResponse.credential });
      localStorage.setItem("token", res.data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Google Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-accent/20 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 rounded-3xl shadow-2xl border border-border bg-card/80">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-foreground/60 text-sm">Sign in to your EventHive account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground/80">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-foreground/80">Password</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot Password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                <input 
                  type="password"
                  required 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center before:flex-1 before:border-t before:border-border after:flex-1 after:border-t after:border-border">
            <p className="mx-4 mb-0 text-center text-sm text-foreground/50">OR</p>
          </div>
          
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Login Failed")}
              theme="filled_black"
              shape="pill"
            />
          </div>

          <p className="text-center mt-8 text-sm text-foreground/60">
            Don't have an account? <Link href="/register" className="text-primary font-semibold hover:underline">Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
