"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, Lock, KeyRound, Check, X, Eye, EyeOff, AlertCircle } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  
  // Password states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const router = useRouter();

  // Validations for Password
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isStrongPassword = hasLength && hasUpper && hasLower && hasNumber && hasSpecial;
  const passwordsMatch = password === confirmPassword && password !== "";

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess("If your email is registered, an OTP has been sent.");
      setStep(2);
      setTimeLeft(300);
      setTimerActive(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to process request.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/auth/verify-otp", { email, otp });
      setSuccess("OTP verified! You can now reset your password.");
      setStep(3);
      setTimerActive(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!isStrongPassword) {
      setError("Password is not strong enough.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, otp, newPassword: password });
      setSuccess("Password reset successfully!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const PasswordCriterion = ({ met, text }: { met: boolean, text: string }) => (
    <div className={`flex items-center gap-2 text-xs transition-colors duration-300 ${met ? 'text-green-500 font-medium' : 'text-foreground/50'}`}>
      <div className={`flex items-center justify-center rounded-full p-0.5 ${met ? 'bg-green-500/20' : 'bg-foreground/10'}`}>
        {met ? <Check size={12} className="text-green-500" /> : <X size={12} />}
      </div>
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 relative overflow-hidden py-12">
      <div className="absolute top-[10%] left-[-10%] w-[40%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-accent/20 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 rounded-3xl shadow-2xl border border-border bg-card/80">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
            <p className="text-foreground/60 text-sm">
              {step === 1 && "Enter your email to receive an OTP"}
              {step === 2 && "Enter the OTP sent to your email"}
              {step === 3 && "Create a new strong password"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                key="error"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm flex items-start gap-3">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl text-sm flex items-start gap-3">
                  <Check size={18} className="shrink-0 mt-0.5" />
                  <p>{success}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step === 1 && (
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendOtp} 
              className="space-y-6"
            >
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

              <button 
                type="submit" 
                disabled={loading || !email}
                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : (
                  <>Send OTP <ArrowRight size={18} /></>
                )}
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form 
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleVerifyOtp} 
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground/80">Enter 6-Digit OTP</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                  <input 
                    type="text" 
                    required
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all tracking-[0.5em] font-mono text-center"
                    placeholder="000000"
                  />
                </div>
                
                <div className="flex justify-between items-center mt-3 px-1">
                  <span className={`text-sm font-mono font-medium ${timeLeft < 60 ? 'text-red-500' : 'text-primary'}`}>
                    {formatTime(timeLeft)}
                  </span>
                  
                  {timeLeft === 0 && (
                    <button 
                      type="button" 
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || otp.length !== 6 || timeLeft === 0}
                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : (
                  <>Verify OTP <ArrowRight size={18} /></>
                )}
              </button>
              
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="w-full py-3 bg-transparent text-foreground/60 rounded-2xl font-semibold hover:bg-secondary/50 transition-all text-sm"
              >
                Back to Email
              </button>
            </motion.form>
          )}

          {step === 3 && (
            <motion.form 
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleResetPassword} 
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground/80">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className={`w-full pl-11 pr-11 py-3 rounded-2xl bg-secondary/50 border border-border focus:ring-1 outline-none transition-all ${!isStrongPassword && password.length > 0 ? 'focus:border-yellow-500/50 focus:ring-yellow-500/50' : 'focus:border-primary focus:ring-primary'}`}
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                <AnimatePresence>
                  {(passwordFocused || password.length > 0) && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="grid grid-cols-2 gap-2.5 bg-secondary/30 p-4 rounded-xl border border-border/50 overflow-hidden"
                    >
                      <PasswordCriterion met={hasLength} text="At least 8 chars" />
                      <PasswordCriterion met={hasUpper} text="Uppercase letter" />
                      <PasswordCriterion met={hasLower} text="Lowercase letter" />
                      <PasswordCriterion met={hasNumber} text="Number (0-9)" />
                      <PasswordCriterion met={hasSpecial} text="Symbol (@, #, $)" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground/80">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    required 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`w-full pl-11 pr-11 py-3 rounded-2xl bg-secondary/50 border outline-none transition-all focus:ring-1 ${confirmPassword.length > 0 && !passwordsMatch ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 'border-border focus:border-primary focus:ring-primary'}`}
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-red-500 text-xs mt-1 ml-1">Passwords do not match</p>
                )}
              </div>

              <button 
                type="submit" 
                disabled={loading || !isStrongPassword || !passwordsMatch}
                className="w-full py-4 mt-2 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                {loading ? "Resetting..." : (
                  <>Reset Password <Check size={18} /></>
                )}
              </button>
            </motion.form>
          )}
          
          <p className="text-center mt-8 text-sm text-foreground/60">
            Remember your password? <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
