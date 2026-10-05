"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  Map,
  User,
  LogOut,
  PlusCircle,
  LayoutDashboard,
  Globe,
  Sparkles,
  BookOpen,
  Heart,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // Mock / offline fallback
      }
      // Clear demo session cookie if set
      document.cookie = "rr_demo_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/login");
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Explore", href: "/explore", icon: Globe },
    { label: "My Trips", href: "/trips", icon: Map },
    { label: "AI Copilot", href: "/assistant", icon: Sparkles },
    { label: "Memories", href: "/memories", icon: Heart },
    { label: "Knowledge RAG", href: "/admin/knowledge", icon: BookOpen },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer active:scale-95 transition-transform duration-150 select-none"
            title="Go to Landing Page"
            aria-label="TripWise AI - Go to Landing Page"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black flex items-center justify-center text-white shadow-xs transition-all group-hover:scale-105 group-active:scale-95 shrink-0">
              <Compass className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform group-hover:rotate-45 duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-instrument text-xl sm:text-2xl font-normal tracking-[-0.5px] text-[#0f172a] leading-none group-hover:opacity-80 transition-opacity">
                Rimjhim Roams<sup className="text-[9px] sm:text-[10px] font-sans font-normal ml-0.5 text-slate-500">®</sup>
              </span>
              <span className="text-[8px] sm:text-[9px] text-[hsl(215,25%,32%)] font-medium tracking-wider uppercase mt-0.5">
                TripWise AI
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Desktop navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? "bg-black text-white shadow-xs"
                      : "text-[hsl(215,25%,32%)] hover:text-[#0f172a] hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/trips/new"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black text-white text-xs sm:text-sm font-medium shadow-xs hover:scale-[1.03] active:scale-[0.98] transition-transform duration-200"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Trip</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium text-[hsl(215,25%,32%)] hover:text-[#0f172a] hover:bg-slate-100 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="inline">Sign Out</span>
          </button>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full text-slate-700 hover:text-black hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-black"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-lg px-4 pt-3 pb-6 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-1.5" aria-label="Mobile navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-black text-white font-medium"
                      : "text-[hsl(215,25%,32%)] hover:bg-slate-100 hover:text-[#0f172a]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-3 mt-2 border-t border-slate-200/60 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-start gap-2.5 px-4 py-2.5 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
