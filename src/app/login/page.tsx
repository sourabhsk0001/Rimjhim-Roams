"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Compass,
  Lock,
  Mail,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  User,
  ShieldCheck,
  ArrowRight,
  Database,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthBackgroundAnimation } from "@/components/background/AuthBackgroundAnimation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillDemoAccount = (role: "traveler" | "admin") => {
    if (role === "traveler") {
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
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed. Please check your credentials.");
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 animate-fade-rise px-2 sm:px-0">
      <div className="text-center space-y-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 group cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-950 shadow-lg transition-transform group-hover:scale-105">
            <Compass className="w-5 h-5 text-slate-950 transition-transform group-hover:rotate-45 duration-300" />
          </div>
          <span className="font-instrument text-3xl font-normal tracking-tight text-white drop-shadow-md">
            TripWise AI<sup className="text-xs font-sans text-amber-300 font-normal ml-1">PRO</sup>
          </span>
        </Link>
        <p className="text-sm text-slate-300 font-normal drop-shadow-sm">
          Sign in to your autonomous travel intelligence platform
        </p>
      </div>

      <Card className="rounded-3xl border border-white/20 bg-slate-950/75 backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.7)] text-white overflow-hidden">
        {/* Responsive Mode Switcher */}
        <div className="p-2 border-b border-white/10 bg-white/5">
          <div className="grid grid-cols-2 gap-1 p-1 bg-white/10 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              className="py-2.5 rounded-xl bg-white text-slate-950 shadow-md text-center font-bold transition-all cursor-pointer"
            >
              Sign In (Login)
            </button>
            <Link
              href="/register"
              className="py-2.5 rounded-xl text-slate-300 hover:text-white text-center transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <span>Sign Up (Register)</span>
            </Link>
          </div>
        </div>

        <CardHeader className="space-y-1 pb-4 pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="font-instrument text-3xl sm:text-4xl font-normal text-white">
              Welcome Back
            </CardTitle>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              DB Online
            </span>
          </div>
          <CardDescription className="text-xs text-slate-300 font-normal">
            Enter your credentials or test with 1-click verified database accounts
          </CardDescription>
        </CardHeader>

        <form action="javascript:void(0)" onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Quick 1-Click Demo Fill Bar */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  1-Click Instant Demo Login:
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoAccount("traveler")}
                  className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/15 text-[11px] font-medium transition-all text-left flex items-center gap-1.5 truncate shadow-sm cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  <span className="truncate">Demo Traveler</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount("admin")}
                  className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/15 text-[11px] font-medium transition-all text-left flex items-center gap-1.5 truncate shadow-sm cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="truncate">Admin Planner</span>
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-2xl border-rose-500/40 bg-rose-500/20 text-rose-200">
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-slate-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="traveler@example.com"
                  required
                  className="pl-10 h-11 rounded-2xl bg-white/10 border-white/20 text-white placeholder-slate-400 text-sm focus-visible:ring-amber-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-slate-300">
                  Password
                </Label>
                <span className="text-[11px] text-amber-300/80">Default: password123</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10 h-11 rounded-2xl bg-white/10 border-white/20 text-white placeholder-slate-400 text-sm focus-visible:ring-amber-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <button
              type="submit"
              className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 text-sm font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex flex-col sm:flex-row items-center justify-between w-full text-xs text-slate-300 gap-2 pt-2 border-t border-white/10">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                Persistent Database
              </span>
              <span>
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-amber-300 hover:text-amber-200 hover:underline"
                >
                  Create one free
                </Link>
              </span>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden font-sans bg-slate-950">
      {/* Cinematic Animated Background Layer */}
      <AuthBackgroundAnimation />

      {/* Auth Content */}
      <div className="relative z-10 w-full flex items-center justify-center">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-300" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
