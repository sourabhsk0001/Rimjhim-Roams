"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, Lock, Mail, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
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

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50/50 font-sans">
      <div className="w-full max-w-md space-y-6 animate-fade-rise">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105">
              <Compass className="w-4 h-4" />
            </div>
            <span className="font-instrument text-3xl font-normal tracking-tight text-[#0f172a]">
              Rimjhim Roams<sup className="text-xs font-sans text-slate-500 font-normal ml-0.5">®</sup>
            </span>
          </Link>
          <p className="text-sm text-[hsl(215,25%,32%)] font-normal">
            Create an account to build AI-guided travel itineraries
          </p>
        </div>

        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="font-instrument text-3xl font-normal text-[#0f172a]">
              Create an Account
            </CardTitle>
            <CardDescription className="text-xs text-[hsl(215,25%,32%)] font-normal">
              Start designing your dream adventures today
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-medium text-slate-700">Full Name</Label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Sourabh Kumar"
                    required
                    className="pl-9 rounded-full border-slate-200 text-sm focus-visible:ring-black"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-slate-700">Email Address</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="traveler@example.com"
                    required
                    className="pl-9 rounded-full border-slate-200 text-sm focus-visible:ring-black"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-slate-700">Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="pl-9 rounded-full border-slate-200 text-sm focus-visible:ring-black"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-slate-700">Confirm Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="pl-9 rounded-full border-slate-200 text-sm focus-visible:ring-black"
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
                className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-full bg-black text-white text-sm font-medium shadow-xs hover:scale-[1.03] active:scale-[0.98] transition-transform disabled:opacity-50"
                disabled={loading}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Creating account..." : "Sign Up"}
              </button>

              <p className="text-center text-xs text-[hsl(215,25%,32%)]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-black hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
