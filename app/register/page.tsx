"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Mail, ArrowRight, Phone, Eye, EyeOff, Check, X, AlertCircle, UploadCloud } from "lucide-react";
import Link from "next/link";
import { GoogleLogin } from '@react-oauth/google';
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

const COUNTRIES = [
  { code: "LK", dial: "+94", flag: "🇱🇰", name: "Sri Lanka" },
  { code: "US", dial: "+1", flag: "🇺🇸", name: "United States" },
  { code: "GB", dial: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "AU", dial: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "IN", dial: "+91", flag: "🇮🇳", name: "India" },
  { code: "CA", dial: "+1", flag: "🇨🇦", name: "Canada" },
  { code: "DE", dial: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "FR", dial: "+33", flag: "🇫🇷", name: "France" },
  { code: "IT", dial: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "JP", dial: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "SG", dial: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "AE", dial: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "NZ", dial: "+64", flag: "🇳🇿", name: "New Zealand" },
  { code: "ZA", dial: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "MY", dial: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "MV", dial: "+960", flag: "🇲🇻", name: "Maldives" },
  { code: "CN", dial: "+86", flag: "🇨🇳", name: "China" },
  { code: "BR", dial: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "RU", dial: "+7", flag: "🇷🇺", name: "Russia" },
  { code: "KR", dial: "+82", flag: "🇰🇷", name: "South Korea" },
];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  // Phone Number
  const [countryCode, setCountryCode] = useState("+94");
  const [phone, setPhone] = useState("");
  
  // Passwords
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  const [role, setRole] = useState("ATTENDEE"); // ATTENDEE or ORGANIZER
  const [proposalFile, setProposalFile] = useState<File | null>(null);
  
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Validations
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isStrongPassword = hasLength && hasUpper && hasLower && hasNumber && hasSpecial;
  
  const passwordsMatch = password === confirmPassword && password !== "";
  const isPhoneValid = /^\d{10}$/.test(phone); // Exactly 10 digits

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isPhoneValid) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    if (!isStrongPassword) {
      setError("Password is not strong enough. Please fulfill all the criteria below.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }
    
    if (role === "ORGANIZER" && !proposalFile) {
      setError("Event proposal PDF is strictly required for Organizers.");
      return;
    }
    
    if (proposalFile && proposalFile.type !== "application/pdf") {
      setError("Event proposal must be a PDF file.");
      return;
    }
    
    setLoading(true);

    try {
      const fullPhone = `${countryCode}${phone}`;
      
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", fullPhone);
      formData.append("passwordHash", password);
      formData.append("role", role);
      
      if (role === "ORGANIZER" && proposalFile) {
        formData.append("proposalFile", proposalFile);
      }

      await api.post("/users/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      
      if (role === "ORGANIZER") {
        setSuccessMessage("Registration successful! Your request has been sent to the Admin. Please wait for the approval email to login.");
      } else {
        router.push("/login");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
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
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[50%] bg-accent/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 rounded-3xl shadow-2xl border border-border bg-card/80">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create an Account</h1>
            <p className="text-foreground/60 text-sm">Join EventHive today.</p>
          </div>

          <AnimatePresence>
            {successMessage ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-green-500/10 border border-green-500/20 text-green-500 rounded-3xl text-center flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check size={32} />
                </div>
                <p className="font-medium text-lg leading-relaxed">{successMessage}</p>
                <Link href="/" className="mt-4 px-6 py-3 bg-secondary rounded-xl text-foreground font-semibold hover:bg-secondary/80 transition-colors">
                  Return to Home
                </Link>
              </motion.div>
            ) : (
              <>
                <AnimatePresence>
                  {error && (
                    <motion.div 
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
                </AnimatePresence>

                <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground/80">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
              <label className="block text-sm font-medium mb-2 text-foreground/80">Telephone Number</label>
              <div className="relative flex">
                <select 
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="pl-3 pr-6 py-3 rounded-l-2xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer max-w-[110px]"
                >
                  {COUNTRIES.map(country => (
                    <option key={country.code} value={country.dial}>
                      {country.flag} {country.dial}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
                  <input 
                    type="tel" 
                    required
                    value={phone}
                    onChange={e => {
                      // Only allow numbers
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) setPhone(val);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-r-2xl bg-secondary/50 border-y border-r border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all ${phone.length > 0 && !isPhoneValid ? 'border-red-500/50' : ''}`}
                    placeholder="0771234567"
                  />
                </div>
              </div>
              {phone.length > 0 && !isPhoneValid && (
                <p className="text-red-500 text-xs mt-1 ml-1">Phone number must be exactly 10 digits</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground/80">Password</label>
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
              
              {/* Password Strength Indicators - Show on focus OR if there is typed content */}
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
              <label className="block text-sm font-medium mb-2 text-foreground/80">Confirm Password</label>
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

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground/80">I want to...</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("ATTENDEE")}
                  className={`py-3 rounded-2xl border transition-all ${role === "ATTENDEE" ? "bg-primary/10 border-primary text-primary" : "bg-secondary/50 border-border text-foreground/60 hover:border-foreground/30"}`}
                >
                  Attend Events
                </button>
                <button
                  type="button"
                  onClick={() => setRole("ORGANIZER")}
                  className={`py-3 rounded-2xl border transition-all ${role === "ORGANIZER" ? "bg-primary/10 border-primary text-primary" : "bg-secondary/50 border-border text-foreground/60 hover:border-foreground/30"}`}
                >
                  Host Events
                </button>
              </div>
            </div>

            <AnimatePresence>
              {role === "ORGANIZER" && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 20 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <label className="block text-sm font-medium mb-2 text-foreground/80">Event Proposal PDF (Required)</label>
                  <div className="relative">
                    <input 
                      type="file"
                      id="proposalFile"
                      accept=".pdf"
                      required={role === "ORGANIZER"}
                      onChange={e => {
                        if (e.target.files && e.target.files.length > 0) {
                          setProposalFile(e.target.files[0]);
                        } else {
                          setProposalFile(null);
                        }
                      }}
                      className="hidden"
                    />
                    <label 
                      htmlFor="proposalFile"
                      className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${proposalFile ? 'bg-primary/5 border-primary text-primary' : 'bg-secondary/50 border-border text-foreground/60 hover:bg-secondary hover:border-primary/50'}`}
                    >
                      <UploadCloud size={20} />
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {proposalFile ? proposalFile.name : "Upload PDF Proposal"}
                      </span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 mt-2 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              {loading ? "Creating account..." : (
                <>Sign Up <ArrowRight size={18} /></>
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
              text="signup_with"
            />
          </div>

          <p className="text-center mt-8 text-sm text-foreground/60">
            Already have an account? <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
