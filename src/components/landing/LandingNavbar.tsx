"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Compass, Menu, X, ArrowRight, User, Sparkles, LogIn, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "@/components/auth/AuthModal";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");

  const openLogin = () => {
    setAuthModalTab("login");
    setAuthModalOpen(true);
  };

  const openRegister = () => {
    setAuthModalTab("register");
    setAuthModalOpen(true);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    // Check auth session against both App Database and Supabase
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setIsAuthenticated(true);
        } else {
          // Fallback to Supabase client
          try {
            const supabase = createClient();
            supabase.auth.getSession().then(({ data: sbData }) => {
              if (sbData.session?.user) {
                setIsAuthenticated(true);
              }
            });
          } catch {
            // Non-fatal
          }
        }
      })
      .catch(() => {
        // Non-fatal
      });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-slate-950/80 backdrop-blur-md border-b border-white/10 shadow-lg py-3.5"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer active:scale-95 transition-transform duration-150 select-none"
            title="TripWise AI - Landing Page"
            aria-label="TripWise AI - Go to Landing Page"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white flex items-center justify-center text-black shadow-md transition-all group-hover:scale-105 group-active:scale-95 shrink-0">
              <Compass className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-black transition-transform group-hover:rotate-45 duration-300" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-instrument text-2xl sm:text-3xl font-normal tracking-tight text-white leading-none drop-shadow-sm">
                  TripWise AI
                </span>
                <span className="text-[10px] font-sans font-medium px-1.5 py-0.5 rounded-full bg-white/15 text-white/90 border border-white/20">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-white/70 font-medium tracking-wider uppercase">
                Rimjhim Roams<sup className="text-[8px] font-sans ml-0.5">®</sup>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              href="/explore"
              className="text-sm font-medium text-white/85 hover:text-white transition-colors"
            >
              Explore
            </Link>
            <a
              href="#features"
              className="text-sm font-medium text-white/85 hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-white/85 hover:text-white transition-colors"
            >
              How It Works
            </a>
            <Link
              href="/trips"
              className="text-sm font-medium text-white/85 hover:text-white transition-colors"
            >
              My Trips
            </Link>
            <Link
              href="/assistant"
              className="text-sm font-medium text-white/85 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              AI Assistant
            </Link>
          </nav>

          {/* Desktop Auth CTAs */}
          <div className="hidden lg:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-white/90 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
                <Link
                  href="/trips/new"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-slate-950 font-medium text-sm shadow-md hover:bg-slate-100 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
                >
                  <span>New Trip</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    openLogin();
                  }}
                  className="text-sm font-medium text-white/90 hover:text-white px-3.5 py-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all cursor-pointer select-none"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={(e) => {
                    e.preventDefault();
                    openRegister();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-slate-950 font-medium text-sm shadow-md hover:bg-slate-100 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer select-none"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Header Quick Actions */}
          <div className="flex lg:hidden items-center gap-2">
            {!isAuthenticated && (
              <Link
                href="/login"
                onClick={(e) => {
                  e.preventDefault();
                  openLogin();
                }}
                className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-medium border border-white/20 transition-all cursor-pointer select-none"
              >
                Login
              </Link>
            )}
            <Link
              href="/trips/new"
              className="px-3.5 py-1.5 rounded-full bg-white text-slate-950 font-medium text-xs shadow-sm active:scale-95 transition-all"
            >
              Plan Trip
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-white hover:bg-white/15 active:scale-95 focus:outline-hidden transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-950/95 backdrop-blur-xl border-b border-white/15 px-6 py-6 transition-all animate-in fade-in slide-in-from-top-2">
            <nav className="flex flex-col gap-4">
              <Link
                href="/explore"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-white/90 hover:text-white py-1 active:scale-98 transition-all"
              >
                Explore Destinations
              </Link>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-white/90 hover:text-white py-1 active:scale-98 transition-all"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-white/90 hover:text-white py-1 active:scale-98 transition-all"
              >
                How It Works
              </a>
              <Link
                href="/trips"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-white/90 hover:text-white py-1 active:scale-98 transition-all"
              >
                My Trips
              </Link>
              <Link
                href="/assistant"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-white/90 hover:text-white py-1 flex items-center gap-2 active:scale-98 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                AI Assistant
              </Link>

              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 text-center rounded-xl bg-white/10 text-white font-medium text-sm active:scale-95 transition-all"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/trips/new"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 text-center rounded-xl bg-white text-slate-950 font-semibold text-sm shadow-md active:scale-95 transition-all"
                    >
                      Plan Complete Trip
                    </Link>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      onClick={(e) => {
                        e.preventDefault();
                        setMobileMenuOpen(false);
                        openLogin();
                      }}
                      className="w-full py-2.5 text-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-medium text-xs sm:text-sm border border-white/15 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Login</span>
                    </Link>
                    <Link
                      href="/register"
                      onClick={(e) => {
                        e.preventDefault();
                        setMobileMenuOpen(false);
                        openRegister();
                      }}
                      className="w-full py-2.5 text-center rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-950 font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register</span>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Interactive Responsive Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </>
  );
}
