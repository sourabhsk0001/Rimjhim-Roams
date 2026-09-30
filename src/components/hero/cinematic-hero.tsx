"use client";

import * as React from "react";
import Link from "next/link";
import { PillButton } from "@/components/ui/pill-button";

export function CinematicHero() {
  return (
    <section className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[hsl(201,100%,13%)] select-none">
      {/* Background Video Layer */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      >
        <source
          src="https://designerstephen.github.io/public-assets/videos/serene-art-hero.mp4"
          type="video/mp4"
        />
      </video>

      {/* Subtle Dark Overlay (alpha 0.2) + soft ambient scrim for crisp legibility */}
      <div
        className="absolute inset-0 bg-black/20 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/10 to-black/10 pointer-events-none"
        aria-hidden="true"
      />

      {/* 3-Column Distributed Navigation Bar */}
      <header className="relative z-20 w-full">
        <div className="max-w-[1280px] mx-auto px-[32px] py-[24px] grid grid-cols-2 md:grid-cols-3 items-center">
          {/* Left Column: Brand Logo in Instrument Serif at 30px with superscript ® */}
          <div className="flex items-center">
            <Link
              href="/"
              className="font-instrument text-[30px] font-normal tracking-tight text-[#0f172a] hover:opacity-80 transition-opacity"
            >
              Rimjhim Roams<sup className="text-[14px] ml-0.5 font-sans font-normal">®</sup>
            </Link>
          </div>

          {/* Center Column: Hidden on mobile. 4 links in Inter 14px Medium with 40px spacing */}
          <nav className="hidden md:flex justify-center items-center gap-[40px]">
            <Link
              href="/explore"
              className="text-[14px] font-medium text-[#0f172a] hover:opacity-70 transition-opacity"
            >
              Destinations
            </Link>
            <Link
              href="/trips"
              className="text-[14px] font-medium text-[#0f172a] hover:opacity-70 transition-opacity"
            >
              Itineraries
            </Link>
            <Link
              href="/assistant"
              className="text-[14px] font-medium text-[#0f172a] hover:opacity-70 transition-opacity"
            >
              AI Copilot
            </Link>
            <Link
              href="#discovery-planner"
              className="text-[14px] font-medium text-[#0f172a] hover:opacity-70 transition-opacity"
            >
              Experiences
            </Link>
          </nav>

          {/* Right Column: Pill-shaped CTA button ('Find my dream') in solid black with white text */}
          <div className="flex justify-end items-center">
            <PillButton variant="small" href="#discovery-planner">
              Find my dream
            </PillButton>
          </div>
        </div>
      </header>

      {/* Centered Hero Content Area */}
      <div className="relative z-10 max-w-[1280px] w-full mx-auto px-[32px] flex-1 flex flex-col justify-center items-center text-center my-auto">
        <div className="max-w-[980px] flex flex-col items-center">
          {/* H1 Heading: Instrument Serif, 80px (mobile 48px), line-height 0.95, -2.46px letter-spacing */}
          <h1
            style={{
              letterSpacing: "-2.46px",
              animation: "fade-rise 0.8s ease-out 0s forwards",
            }}
            className="font-instrument text-[48px] md:text-[80px] font-normal leading-[0.95] text-[#0f172a] opacity-0 text-balance drop-shadow-sm"
          >
            Where wanderlust meets{" "}
            <em className="not-italic font-normal">quiet perfection.</em>
          </h1>

          {/* Paragraph: Inter 18px, max-width 670px, line-height 1.625, HSL(215, 25%, 32%) */}
          <p
            style={{
              color: "hsl(215, 25%, 32%)",
              animation: "fade-rise 0.8s ease-out 0.2s forwards",
            }}
            className="mt-6 max-w-[670px] mx-auto text-[18px] font-normal leading-[1.625] opacity-0 font-sans"
          >
            An editorial travel operating system engineered for discerning
            wanderers. Seamlessly orchestrating deterministic itineraries,
            real-time replanning, and bespoke destination discovery.
          </p>

          {/* Main CTA: Large pill button, 20px 56px, 16px Medium, placed 48px below text */}
          <div
            style={{
              animation: "fade-rise 0.8s ease-out 0.4s forwards",
            }}
            className="opacity-0"
          >
            <PillButton
              variant="hero"
              href="#discovery-planner"
              className="mt-[48px]"
            >
              Find my dream
            </PillButton>
          </div>
        </div>
      </div>

      {/* Subtle Scroll Cue */}
      <div className="relative z-10 pb-8 w-full flex justify-center text-center">
        <a
          href="#discovery-planner"
          className="text-[12px] font-medium tracking-widest uppercase text-[#0f172a]/70 hover:text-[#0f172a] transition-colors flex items-center gap-1.5"
        >
          <span>Scroll to explore</span>
          <span className="text-[14px] animate-bounce">↓</span>
        </a>
      </div>
    </section>
  );
}
