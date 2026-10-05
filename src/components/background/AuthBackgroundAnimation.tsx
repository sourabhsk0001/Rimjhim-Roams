"use client";

import React, { useEffect, useState } from "react";

export function AuthBackgroundAnimation() {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0 bg-slate-950"
      aria-hidden="true"
    >
      <style>{`
        @keyframes auroraFloat1 {
          0% { transform: translate3d(0px, 0px, 0px) scale(1) rotate(0deg); }
          33% { transform: translate3d(120px, 80px, 0px) scale(1.15) rotate(45deg); }
          66% { transform: translate3d(-60px, 140px, 0px) scale(0.9) rotate(90deg); }
          100% { transform: translate3d(0px, 0px, 0px) scale(1) rotate(0deg); }
        }
        @keyframes auroraFloat2 {
          0% { transform: translate3d(0px, 0px, 0px) scale(1) rotate(0deg); }
          33% { transform: translate3d(-140px, -70px, 0px) scale(1.2) rotate(-60deg); }
          66% { transform: translate3d(90px, -110px, 0px) scale(0.95) rotate(-120deg); }
          100% { transform: translate3d(0px, 0px, 0px) scale(1) rotate(0deg); }
        }
        @keyframes auroraFloat3 {
          0% { transform: translate3d(0px, 0px, 0px) scale(0.9) rotate(0deg); }
          50% { transform: translate3d(-100px, 90px, 0px) scale(1.25) rotate(180deg); }
          100% { transform: translate3d(0px, 0px, 0px) scale(0.9) rotate(360deg); }
        }
        @keyframes auroraFloat4 {
          0% { transform: translate3d(0px, 0px, 0px) scale(1.1); }
          50% { transform: translate3d(80px, -80px, 0px) scale(0.85); }
          100% { transform: translate3d(0px, 0px, 0px) scale(1.1); }
        }
        @keyframes particleDrift {
          0% { transform: translateY(100vh) translateX(0); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translateY(-10vh) translateX(30px); opacity: 0; }
        }
        @keyframes compassSpin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.85; }
        }
        .anim-aurora-1 {
          animation: auroraFloat1 18s ease-in-out infinite;
        }
        .anim-aurora-2 {
          animation: auroraFloat2 22s ease-in-out infinite;
        }
        .anim-aurora-3 {
          animation: auroraFloat3 26s ease-in-out infinite;
        }
        .anim-aurora-4 {
          animation: auroraFloat4 20s ease-in-out infinite;
        }
        .anim-compass {
          animation: compassSpin 140s linear infinite;
        }
        .anim-pulse-subtle {
          animation: pulseGlow 8s ease-in-out infinite;
        }
      `}</style>

      {/* 1. Deep Midnight Cosmic Gradient Base */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-95" />

      {/* 2. Interactive Spotlight Following Mouse (Smooth Parallax Glow) */}
      {isMounted && (
        <div
          className="absolute inset-0 transition-opacity duration-1000 pointer-events-none"
          style={{
            background: `radial-gradient(650px circle at ${mousePos.x * 100}% ${
              mousePos.y * 100
            }%, rgba(251, 191, 36, 0.12), rgba(14, 165, 233, 0.08) 40%, transparent 70%)`,
          }}
        />
      )}

      {/* 3. Layered Ambient Aurora Liquid Orbs */}
      {/* Orb 1: Warm Amber Gold Sunrise */}
      <div
        className="anim-aurora-1 absolute -top-20 -left-20 w-[38rem] h-[38rem] rounded-full bg-gradient-to-tr from-amber-500/25 via-amber-400/20 to-orange-500/10 blur-[90px] mix-blend-screen"
        style={{ willChange: "transform" }}
      />

      {/* Orb 2: Electric Azure Sky / Ocean */}
      <div
        className="anim-aurora-2 absolute -bottom-24 -right-24 w-[42rem] h-[42rem] rounded-full bg-gradient-to-bl from-sky-500/25 via-cyan-400/20 to-blue-600/10 blur-[100px] mix-blend-screen"
        style={{ willChange: "transform" }}
      />

      {/* Orb 3: Cosmic Indigo / Starlight Violet */}
      <div
        className="anim-aurora-3 absolute top-1/3 left-1/4 w-[34rem] h-[34rem] rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-pink-500/10 blur-[95px] mix-blend-screen"
        style={{ willChange: "transform" }}
      />

      {/* Orb 4: Emerald Lagoon Discovery */}
      <div
        className="anim-aurora-4 absolute bottom-1/4 left-1/3 w-[30rem] h-[30rem] rounded-full bg-gradient-to-tl from-emerald-500/20 via-teal-400/15 to-cyan-500/10 blur-[85px] mix-blend-screen"
        style={{ willChange: "transform" }}
      />

      {/* 4. Elegant Rotating Travel Geometric Compass & Flight Contours */}
      <div className="absolute top-1/2 left-1/2 anim-compass opacity-15 pointer-events-none">
        <svg
          width="800"
          height="800"
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          {/* Concentric rings */}
          <circle cx="400" cy="400" r="380" stroke="currentColor" strokeWidth="1" strokeDasharray="6 8" />
          <circle cx="400" cy="400" r="300" stroke="currentColor" strokeWidth="0.75" />
          <circle cx="400" cy="400" r="220" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="400" cy="400" r="140" stroke="currentColor" strokeWidth="0.75" />
          <circle cx="400" cy="400" r="60" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" />

          {/* Compass crosshairs & coordinates */}
          <line x1="400" y1="20" x2="400" y2="780" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8" />
          <line x1="20" y1="400" x2="780" y2="400" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8" />
          <line x1="130" y1="130" x2="670" y2="670" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 6" />
          <line x1="130" y1="670" x2="670" y2="130" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 6" />

          {/* Cardinal markers */}
          <polygon points="400,20 408,60 392,60" fill="currentColor" opacity="0.6" />
          <polygon points="400,780 408,740 392,740" fill="currentColor" opacity="0.4" />
          <polygon points="780,400 740,408 740,392" fill="currentColor" opacity="0.4" />
          <polygon points="20,400 60,408 60,392" fill="currentColor" opacity="0.4" />
        </svg>
      </div>

      {/* 5. Floating Constellation Sparks / Travel Nodes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { left: "10%", size: 3, delay: "0s", duration: "16s", color: "bg-amber-300" },
          { left: "22%", size: 2, delay: "3s", duration: "20s", color: "bg-sky-300" },
          { left: "35%", size: 2.5, delay: "7s", duration: "18s", color: "bg-white" },
          { left: "48%", size: 2, delay: "2s", duration: "22s", color: "bg-amber-200" },
          { left: "62%", size: 3, delay: "5s", duration: "17s", color: "bg-sky-200" },
          { left: "74%", size: 2, delay: "9s", duration: "19s", color: "bg-emerald-300" },
          { left: "85%", size: 2.5, delay: "1s", duration: "21s", color: "bg-white" },
          { left: "93%", size: 2, delay: "6s", duration: "24s", color: "bg-amber-300" },
          { left: "15%", size: 2, delay: "11s", duration: "19s", color: "bg-sky-300" },
          { left: "42%", size: 3, delay: "13s", duration: "23s", color: "bg-white" },
          { left: "68%", size: 2, delay: "8s", duration: "25s", color: "bg-amber-200" },
        ].map((spark, idx) => (
          <div
            key={idx}
            className={`absolute bottom-0 rounded-full ${spark.color} shadow-[0_0_8px_currentColor]`}
            style={{
              left: spark.left,
              width: `${spark.size}px`,
              height: `${spark.size}px`,
              animation: `particleDrift ${spark.duration} linear infinite`,
              animationDelay: spark.delay,
            }}
          />
        ))}
      </div>

      {/* 6. Subtle Vignette & Grain Overlay for Depth */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)] pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
