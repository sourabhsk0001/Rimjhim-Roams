"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, Sparkles, ChevronDown, Play, Pause } from "lucide-react";
import { LandingNavbar } from "./LandingNavbar";

export function LandingHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check user preference for reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setPrefersReducedMotion(true);
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      if (e.matches && videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    // Ensure video autoplays smoothly across all modern browsers
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      if (!mediaQuery.matches) {
        const promise = videoRef.current.play();
        if (promise !== undefined) {
          promise.catch(() => {
            // Autoplay with muted is allowed, but handle edge-case policies
          });
        }
      }
    }

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const scrollToPlanning = () => {
    const el = document.getElementById("planner-section") || document.getElementById("hero-planner");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-slate-950 text-white">
      {/* 1. Cinematic Background Video Layer */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          ref={videoRef}
          autoPlay={!prefersReducedMotion}
          loop
          muted
          playsInline
          preload="auto"
          poster="/images/hero-fallback.jpg"
          onError={() => setVideoError(true)}
          className="absolute inset-0 w-full h-full object-cover opacity-100 filter brightness-[0.98] contrast-[1.03] saturate-[1.06]"
        >
          <source src="/videos/landing-page.mp4" type="video/mp4" />
          <source src="/LANDING PAGE.mp4" type="video/mp4" />
        </video>

        {/* Fallback Static Poster ONLY if video completely fails to load */}
        {videoError && (
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url('/images/hero-fallback.jpg')` }}
            aria-hidden="true"
          />
        )}

        {/* 2. Tuned Cinematic Scrims: Enhances Travel Video Beauty While Keeping Text Crisp */}
        {/* Top Navbar Scrim */}
        <div
          className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-black/80 via-black/35 to-transparent pointer-events-none"
          aria-hidden="true"
        />
        {/* Soft Ambient Radial Scrim */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.4)_100%)] pointer-events-none"
          aria-hidden="true"
        />
        {/* Bottom Transition Scrim */}
        <div
          className="absolute bottom-0 inset-x-0 h-56 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* 3. Transparent / Glass Navbar */}
      <LandingNavbar />

      {/* 4. Hero Content Container: Focused on typography, action buttons, and pure video beauty */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-16 flex-1 flex flex-col justify-center items-center text-center">
        {/* Brand Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/90 text-xs sm:text-sm font-medium mb-4 sm:mb-6 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-700">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>TripWise AI • Autonomous Travel Operating System</span>
        </div>

        {/* Main Display Headline: Instrument Serif / Serif */}
        <h1 className="font-instrument text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-normal tracking-[-0.03em] text-white leading-[1.05] max-w-5xl mx-auto drop-shadow-[0_4px_30px_rgba(0,0,0,0.85)] text-balance mb-5 sm:mb-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
          Your Entire Journey,{" "}
          <span className="italic font-normal text-amber-200 drop-shadow-[0_4px_25px_rgba(251,191,36,0.45)]">
            Planned by AI.
          </span>
        </h1>

        {/* Supporting Text */}
        <p className="font-sans text-sm sm:text-base md:text-lg text-white/95 max-w-2xl mx-auto font-normal leading-relaxed mb-8 drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)] animate-in fade-in slide-in-from-bottom-4 duration-700">
          Plan destinations, transport, hotels, food, activities, budgets and
          itineraries from one intelligent travel platform.
        </p>

        {/* Hero Quick Action Buttons: High-end luxury single-line pills */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-6 sm:mb-8 w-full max-w-2xl mx-auto">
          {/* Primary Button */}
          <button
            type="button"
            onClick={scrollToPlanning}
            className="w-full sm:w-auto whitespace-nowrap px-8 sm:px-9 py-3.5 sm:py-4 rounded-full bg-white hover:bg-slate-50 text-slate-950 font-semibold text-xs sm:text-sm tracking-wider uppercase shadow-[0_10px_35px_rgba(0,0,0,0.4),0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2.5 group cursor-pointer"
          >
            <span>PLAN MY COMPLETE TRIP</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Secondary Button */}
          <Link
            href="/explore"
            className="w-full sm:w-auto whitespace-nowrap px-8 sm:px-9 py-3.5 sm:py-4 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-xl border border-white/40 shadow-[0_10px_35px_rgba(0,0,0,0.4)] hover:border-white/70 hover:scale-105 active:scale-95 transition-all duration-300 font-semibold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2.5 group"
          >
            <Compass className="w-4 h-4 text-sky-200 transition-transform group-hover:rotate-45 duration-300" />
            <span>EXPLORE DESTINATIONS</span>
          </Link>
        </div>

        {/* Subtle Scroll Cue */}
        <button
          type="button"
          onClick={scrollToPlanning}
          className="mt-4 sm:mt-6 inline-flex flex-col items-center gap-1.5 text-white/70 hover:text-white transition-colors cursor-pointer group"
          aria-label="Scroll to planning section"
        >
          <span className="text-[11px] uppercase tracking-widest font-medium text-white/80 group-hover:text-amber-200 transition-colors">
            Scroll to Plan Your Journey
          </span>
          <ChevronDown className="w-4 h-4 text-amber-300 animate-bounce" />
        </button>
      </div>

      {/* Subtle Bottom Ambient Bar */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full py-4 flex items-center justify-between text-xs text-white/60">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live AI Agents Ready
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">100% Free Tier Infrastructure</span>
        </div>

        {/* Optional Play/Pause control for user accessibility */}
        <button
          type="button"
          onClick={togglePlayback}
          className="flex items-center gap-1.5 hover:text-white transition-colors px-2 py-1 rounded-md bg-white/5 hover:bg-white/10"
          aria-label={isPlaying ? "Pause background video" : "Play background video"}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{isPlaying ? "Pause Video" : "Play Video"}</span>
        </button>
      </div>
    </section>
  );
}
