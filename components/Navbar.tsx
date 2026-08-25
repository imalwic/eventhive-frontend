"use client";

import Link from "next/link";
import { Sparkles, User as UserIcon, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const hideAuthButtons = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/users/me");
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user in Navbar", err);
        // Invalid token? Clear it
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/");
  };

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-black tracking-tighter">
          <span className="text-primary"><Sparkles size={24} className="inline"/> Event</span>Hive
        </Link>
        
        <div className="flex items-center gap-4">
          {!loading && (
            user ? (
              <div className="flex items-center gap-4">
                {user.role === "ORGANIZER" && (
                  <button 
                    onClick={() => {
                      const currentMode = localStorage.getItem("uiMode") || "ORGANIZER";
                      const newMode = currentMode === "ORGANIZER" ? "ATTENDEE" : "ORGANIZER";
                      localStorage.setItem("uiMode", newMode);
                      window.dispatchEvent(new Event("storage"));
                      window.location.href = "/dashboard";
                    }}
                    className={`hidden sm:block px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer
                      ${(typeof window !== "undefined" ? localStorage.getItem("uiMode") : "ORGANIZER") === "ATTENDEE"
                        ? "bg-secondary text-foreground/70 border-border hover:bg-secondary/80"
                        : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                      }`}
                  >
                    {(typeof window !== "undefined" ? localStorage.getItem("uiMode") : "ORGANIZER") || "ORGANIZER"} Mode
                  </button>
                )}
                <Link href="/dashboard" className="flex items-center gap-3 group hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold">{user.name}</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-full border border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors text-sm font-semibold flex items-center gap-2"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : !hideAuthButtons ? (
              <>
                <Link href="/login" className="text-sm font-semibold hover:text-primary transition-colors">
                  Log In
                </Link>
                <Link href="/register" className="hidden sm:flex text-sm font-semibold px-5 py-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors">
                  Sign Up
                </Link>
              </>
            ) : null
          )}
        </div>
      </div>
    </nav>
  );
}
