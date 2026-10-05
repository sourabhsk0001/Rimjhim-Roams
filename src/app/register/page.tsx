"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  Lock,
  Mail,
  User,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  Database,
  CheckCircle2,
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

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      setSuccess("Account successfully registered in database! Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 700);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden font-sans bg-slate-950">
      {/* Cinematic Animated Background Layer */}
      <AuthBackgroundAnimation />

      <div className="relative z-10 w-full max-w-md space-y-6 animate-fade-rise px-2 sm:px-0">
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
            Create an account to build AI-guided travel itineraries
          </p>
        </div>

        <Card className="rounded-3xl border border-white/20 bg-slate-950/75 backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.7)] text-white overflow-hidden">
          {/* Responsive Segmented Tabs */}
          <div className="p-2 border-b border-white/10 bg-white/5">
            <div className="grid grid-cols-2 gap-1 p-1 bg-white/10 rounded-2xl text-xs font-semibold">
              <Link
                href="/login"
                className="py-2.5 rounded-xl text-slate-300 hover:text-white text-center transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Sign In (Login)</span>
              </Link>
              <button
                type="button"
                className="py-2.5 rounded-xl bg-white text-slate-950 shadow-md text-center font-bold transition-all cursor-pointer"
              >
                Sign Up (Register)
              </button>
            </div>
          </div>

          <CardHeader className="space-y-1 pb-4 pt-6">
            <div className="flex items-center justify-between">
              <CardTitle className="font-instrument text-3xl sm:text-4xl font-normal text-white">
                Create an Account
              </CardTitle>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                DB Connected
              </span>
            </div>
            <CardDescription className="text-xs text-slate-300 font-normal">
              Register with your details to save custom trips and get personalized AI recommendations
            </CardDescription>
          </CardHeader>

          <form action="javascript:void(0)" onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="rounded-2xl border-rose-500/40 bg-rose-500/20 text-rose-200">
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-medium text-slate-300">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Sourabh Kumar"
                    required
                    className="pl-10 h-11 rounded-2xl bg-white/10 border-white/20 text-white placeholder-slate-400 text-sm focus-visible:ring-amber-300"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

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
                  <span className="text-[11px] text-slate-400">At least 6 characters</span>
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

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-slate-300">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="pl-10 h-11 rounded-2xl bg-white/10 border-white/20 text-white placeholder-slate-400 text-sm focus-visible:ring-amber-300"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
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
                    <span>Creating account in database...</span>
                  </>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex flex-col sm:flex-row items-center justify-between w-full text-xs text-slate-300 gap-2 pt-2 border-t border-white/10">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  Encrypted &amp; Persisted
                </span>
                <span>
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-amber-300 hover:text-amber-200 hover:underline"
                  >
                    Sign In
                  </Link>
                </span>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
