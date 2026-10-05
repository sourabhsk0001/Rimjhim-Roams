"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  Lock,
  Mail,
  User,
  Loader2,
  X,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">(defaultTab);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFillDemo = (type: "traveler" | "admin") => {
    if (type === "traveler") {
      setEmail("demo@tripwise.ai");
      setPassword("password123");
    } else {
      setEmail("admin@tripwise.ai");
      setPassword("admin123");
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (tab === "register") {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        tab === "login"
          ? { email, password }
          : { email, password, fullName: fullName || email.split("@")[0] };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `${tab === "login" ? "Login" : "Registration"} failed.`);
      }

      setSuccessMessage(
        tab === "login"
          ? "Welcome back! Redirecting to your dashboard..."
          : "Account created! Welcome to TripWise AI."
      );

      setTimeout(() => {
        onClose();
        router.push("/dashboard");
        router.refresh();
      }, 700);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-slate-950 text-white rounded-3xl border border-white/20 p-6 sm:p-8 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Subtle Ambient Glows */}
        <div
          className="absolute -top-24 -right-24 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -left-24 w-48 h-48 bg-sky-400/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-hidden"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Brand Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-950 shadow-sm">
            <Compass className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="font-instrument text-2xl font-normal leading-none tracking-tight text-white">
              TripWise AI
            </div>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Connected to Local Persistent Database
            </span>
          </div>
        </div>

        {/* Responsive Segmented Switcher (Sign In ⇄ Sign Up) */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/10 border border-white/15 mb-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setError(null);
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
              tab === "login"
                ? "bg-white text-slate-950 font-semibold shadow-md"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <span>Sign In / Login</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setError(null);
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
              tab === "register"
                ? "bg-white text-slate-950 font-semibold shadow-md"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <span>Sign Up / Register</span>
          </button>
        </div>

        {/* Quick Demo Autofill Bar (Only on Sign In) */}
        {tab === "login" && (
          <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                1-Click Demo Fill:
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo("traveler")}
                className="py-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white text-[11px] font-medium text-left truncate flex items-center gap-1.5"
              >
                <User className="w-3 h-3 text-sky-300 shrink-0" />
                <span>Demo Traveler</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo("admin")}
                className="py-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white text-[11px] font-medium text-left truncate flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3 h-3 text-amber-300 shrink-0" />
                <span>Admin Planner</span>
              </button>
            </div>
          </div>
        )}

        {/* Notifications / Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "register" && (
            <div className="space-y-1.5">
              <label htmlFor="auth-modal-name" className="text-xs font-medium text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="auth-modal-name"
                  type="text"
                  placeholder="Sourabh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={tab === "register"}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-300 transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="auth-modal-email" className="text-xs font-medium text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="auth-modal-email"
                type="email"
                placeholder="traveler@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-300 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="auth-modal-password" className="text-xs font-medium text-slate-300">
                Password
              </label>
              {tab === "login" && (
                <span className="text-[11px] text-amber-300/80">Default: password123</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="auth-modal-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-300 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {tab === "register" && (
            <div className="space-y-1.5">
              <label htmlFor="auth-modal-confirm" className="text-xs font-medium text-slate-300">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="auth-modal-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required={tab === "register"}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-300 transition-all"
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-semibold text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{tab === "login" ? "Sign In to Account" : "Create My Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer database status pill */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Database Online (Local & Supabase Synced)
          </span>
          <button
            type="button"
            onClick={() => {
              setTab(tab === "login" ? "register" : "login");
              setError(null);
            }}
            className="text-amber-300 hover:underline cursor-pointer"
          >
            {tab === "login" ? "Need an account?" : "Already registered?"}
          </button>
        </div>
      </div>
    </div>
  );
}
