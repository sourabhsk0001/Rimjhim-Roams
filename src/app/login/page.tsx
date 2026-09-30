"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Compass, Lock, Mail, Loader2 } from "lucide-react";
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          Sign in to access your itineraries and travel plans
        </p>
      </div>

      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="font-instrument text-3xl font-normal text-[#0f172a]">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-xs text-[hsl(215,25%,32%)] font-normal">
            Enter your account credentials to continue
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-slate-700">Password</Label>
              </div>
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
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <button
              type="submit"
              className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-full bg-black text-white text-sm font-medium shadow-xs hover:scale-[1.03] active:scale-[0.98] transition-transform disabled:opacity-50"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="text-center text-xs text-[hsl(215,25%,32%)]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-black hover:underline"
              >
                Create an account
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50/50 font-sans">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-black" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
