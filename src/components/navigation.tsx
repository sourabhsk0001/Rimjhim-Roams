"use client";

import React, { useState, useRef, useEffect } from "react";
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
  ChevronDown,
  ArrowRight,
  Landmark,
  Hotel,
  Utensils,
  Navigation as NavIcon,
  Plane,
  Calendar,
  Wallet,
  ShieldCheck,
  LifeBuoy,
  MapPin,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ==============================================================================
// 10 Core Features Categorized into 3 Intuitive Journey Sections
// 1. Explore & Stay    (Destination, Places, Hotels, Food)
// 2. Plan & Route      (Route, Transport, Calendar, Budget)
// 3. AI & Safety       (AI Trip Planning, Safety & Comfort, SOS / Emergency)
// ==============================================================================

export interface NavDropdownItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  iconBg: string;
  iconColor: string;
}

export interface NavCategory {
  id: string;
  label: string;
  badge: string;
  summary: string;
  footerLink: {
    label: string;
    href: string;
  };
  items: NavDropdownItem[];
}

export const NAV_CATEGORIES: NavCategory[] = [
  {
    id: "explore",
    label: "Explore & Stay",
    badge: "Discovery",
    summary: "Curated destinations, iconic sights, boutique hotels, and regional gastronomy",
    footerLink: {
      label: "Browse all curated Indian destinations →",
      href: "/explore",
    },
    items: [
      {
        id: "destination",
        title: "Destinations",
        description: "Explore 30+ states, coastal havens, and hill stations",
        href: "/explore",
        icon: Compass,
        badge: "Trending",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        iconBg: "bg-blue-50 text-blue-600",
        iconColor: "text-blue-600",
      },
      {
        id: "places",
        title: "Places & Sights",
        description: "Monuments, heritage forts, viewpoints, and temples",
        href: "/explore?tab=attractions",
        icon: Landmark,
        iconBg: "bg-amber-50 text-amber-600",
        iconColor: "text-amber-600",
      },
      {
        id: "hotels",
        title: "Hotels & Stays",
        description: "Heritage havelis, luxury resorts, and cozy eco-lodges",
        href: "/explore?tab=hotels",
        icon: Hotel,
        iconBg: "bg-emerald-50 text-emerald-600",
        iconColor: "text-emerald-600",
      },
      {
        id: "food",
        title: "Food & Dining",
        description: "Authentic regional thalis, street food, and fine dining",
        href: "/explore?tab=restaurants",
        icon: Utensils,
        iconBg: "bg-rose-50 text-rose-600",
        iconColor: "text-rose-600",
      },
    ],
  },
  {
    id: "plan",
    label: "Plan & Route",
    badge: "Logistics",
    summary: "GPU MapLibre 3D routes, multi-modal transport, daily timelines, and zero-drift budgets",
    footerLink: {
      label: "Open interactive route & trip manager →",
      href: "/trips",
    },
    items: [
      {
        id: "route",
        title: "Route & 3D Maps",
        description: "GPU-accelerated MapLibre 3D terrain, routes & live times",
        href: "/trips",
        icon: MapPin,
        badge: "3D GPU",
        badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
        iconBg: "bg-indigo-50 text-indigo-600",
        iconColor: "text-indigo-600",
      },
      {
        id: "transport",
        title: "Transport & Cabs",
        description: "Scenic train journeys, intercity flights, and taxi fares",
        href: "/trips",
        icon: Plane,
        iconBg: "bg-cyan-50 text-cyan-600",
        iconColor: "text-cyan-600",
      },
      {
        id: "calendar",
        title: "Calendar & Schedule",
        description: "Day-by-day itineraries, attraction hours, and rest buffers",
        href: "/trips",
        icon: Calendar,
        iconBg: "bg-purple-50 text-purple-600",
        iconColor: "text-purple-600",
      },
      {
        id: "budget",
        title: "Budget & Expenses",
        description: "Deterministic 8-category expense tracking & bill splitting",
        href: "/trips",
        icon: Wallet,
        iconBg: "bg-emerald-50 text-emerald-600",
        iconColor: "text-emerald-600",
      },
    ],
  },
  {
    id: "intelligence",
    label: "AI & Safety",
    badge: "Protection",
    summary: "Autonomous travel intelligence, Open-Meteo weather forecasts, and emergency support",
    footerLink: {
      label: "Open 24/7 emergency & hospital finder →",
      href: "/dashboard",
    },
    items: [
      {
        id: "ai-planning",
        title: "AI Trip Planning",
        description: "Auto-generate full personalized journeys in seconds",
        href: "/trips/new",
        icon: Sparkles,
        badge: "AI Copilot",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
        iconColor: "text-white",
      },
      {
        id: "safety",
        title: "Safety & Place Comfort",
        description: "Crowd levels, late-night transit access, and safety signals",
        href: "/dashboard",
        icon: ShieldCheck,
        badge: "Live Index",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        iconBg: "bg-emerald-50 text-emerald-600",
        iconColor: "text-emerald-600",
      },
      {
        id: "emergency",
        title: "SOS / I'm Lost & Emergency",
        description: "Instant hospital routing, police numbers & location broadcast",
        href: "/dashboard",
        icon: LifeBuoy,
        badge: "24/7 SOS",
        badgeColor: "bg-red-50 text-red-700 border-red-200",
        iconBg: "bg-red-50 text-red-600",
        iconColor: "text-red-600",
      },
    ],
  },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  // Active desktop dropdown
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navContainerRef = useRef<HTMLElement | null>(null);

  // Mobile menu & accordion states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileCategories, setExpandedMobileCategories] = useState<Record<string, boolean>>({
    explore: true,
    plan: false,
    intelligence: false,
  });

  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch current user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user?.role) {
          setUserRole(data.user.role);
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Dropdown hover timing
  const handleMouseEnter = (categoryId: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(categoryId);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  const toggleDropdownClick = (categoryId: string) => {
    setActiveDropdown((prev) => (prev === categoryId ? null : categoryId));
  };

  const toggleMobileCategory = (categoryId: string) => {
    setExpandedMobileCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // Offline / mock fallback
      }
      document.cookie = "rr_demo_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/login");
    }
  };

  const directLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Trips", href: "/trips", icon: Map },
    { label: "Memories", href: "/memories", icon: Heart },
    ...(userRole === "admin"
      ? [{ label: "Admin RAG", href: "/admin/knowledge", icon: BookOpen }]
      : []),
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <header
      ref={navContainerRef}
      className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-50 transition-colors"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-5 sm:gap-7">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 group cursor-pointer active:scale-95 transition-transform duration-150 select-none shrink-0"
            title="Go to Landing Page"
            aria-label="Rimjhim Roams - Home"
            onClick={() => {
              setActiveDropdown(null);
              setMobileMenuOpen(false);
            }}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0f172a] flex items-center justify-center text-white shadow-xs transition-all group-hover:scale-105 group-active:scale-95 shrink-0">
              <Compass className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform group-hover:rotate-45 duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-instrument text-xl sm:text-2xl font-normal tracking-[-0.5px] text-[#0f172a] leading-none group-hover:opacity-85 transition-opacity">
                Rimjhim Roams<sup className="text-[9px] sm:text-[10px] font-sans font-normal ml-0.5 text-slate-500">®</sup>
              </span>
              <span className="text-[8px] sm:text-[9px] text-[hsl(215,25%,32%)] font-medium tracking-wider uppercase mt-0.5">
                TripWise AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation with 3 Category Dropdowns & Direct Links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Desktop navigation">
            {/* 3 Categories with Smooth Dropdowns */}
            {NAV_CATEGORIES.map((category) => {
              const isOpen = activeDropdown === category.id;
              const hasActiveChild = category.items.some((item) => pathname.startsWith(item.href.split("?")[0]) && item.href !== "/");

              return (
                <div
                  key={category.id}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(category.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    type="button"
                    onClick={() => toggleDropdownClick(category.id)}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                      isOpen
                        ? "bg-[#0f172a] text-white shadow-xs"
                        : hasActiveChild
                        ? "bg-slate-100 text-[#0f172a] font-semibold"
                        : "text-[hsl(215,25%,32%)] hover:text-[#0f172a] hover:bg-slate-100/80"
                    }`}
                  >
                    <span>{category.label}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ease-out ${
                        isOpen ? "rotate-180 text-white" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                  </button>

                  {/* Smooth Animated Dropdown Menu Panel */}
                  <div
                    className={`absolute left-0 top-full pt-2 z-50 transition-all duration-200 ease-out transform origin-top-left ${
                      isOpen
                        ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                        : "opacity-0 translate-y-2 scale-95 pointer-events-none"
                    }`}
                  >
                    <div className="w-[360px] sm:w-[420px] rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/10 backdrop-blur-md p-3.5 text-left animate-in fade-in-50 zoom-in-95 duration-150">
                      {/* Dropdown Header */}
                      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 px-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                            {category.badge}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs font-semibold text-[#0f172a]">{category.label}</span>
                        </div>
                      </div>

                      {/* Dropdown Items List */}
                      <div className="grid grid-cols-1 gap-1">
                        {category.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isItemActive = pathname === item.href.split("?")[0];

                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => setActiveDropdown(null)}
                              className={`group flex items-start gap-3 p-2.5 rounded-xl transition-all duration-150 ${
                                isItemActive
                                  ? "bg-slate-100/90 text-[#0f172a]"
                                  : "hover:bg-slate-50 text-slate-700 hover:text-[#0f172a]"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-150 ${item.iconBg}`}
                              >
                                <ItemIcon className={`w-4 h-4 ${item.iconColor}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-[#0f172a] group-hover:text-blue-600 transition-colors">
                                    {item.title}
                                  </span>
                                  {item.badge && (
                                    <span
                                      className={`text-[9px] font-medium px-1.5 py-0.2 rounded-full border ${
                                        item.badgeColor || "bg-slate-50 text-slate-600 border-slate-200"
                                      }`}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-1">
                                  {item.description}
                                </p>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all self-center shrink-0" />
                            </Link>
                          );
                        })}
                      </div>

                      {/* Dropdown Footer Action */}
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 px-1">
                        <Link
                          href={category.footerLink.href}
                          onClick={() => setActiveDropdown(null)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          {category.footerLink.label}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Subtle Divider */}
            <div className="h-4 w-px bg-slate-200 mx-1.5" aria-hidden="true" />

            {/* Direct Core App Links */}
            {directLinks.slice(0, 3).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#0f172a] text-white shadow-xs"
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

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            href="/trips/new"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0f172a] text-white text-xs sm:text-sm font-medium shadow-xs hover:scale-[1.03] active:scale-[0.98] transition-transform duration-200 hover:bg-[#1e293b]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Trip</span>
          </Link>

          <Link
            href="/profile"
            className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 text-slate-600 hover:text-black hover:border-slate-400 hover:bg-slate-50 transition-colors"
            title="Profile"
          >
            <User className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[hsl(215,25%,32%)] hover:text-[#0f172a] hover:bg-slate-100 transition-colors"
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

      {/* Mobile Drawer Menu with Smooth Accordions */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200/80 bg-white/98 backdrop-blur-lg px-4 pt-3 pb-6 max-h-[calc(100vh-4rem)] overflow-y-auto animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
            {/* 3 Categories with Collapsible Accordions */}
            <div className="space-y-1.5 pb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 font-mono">
                Explore, Plan & Safety
              </span>

              {NAV_CATEGORIES.map((category) => {
                const isExpanded = expandedMobileCategories[category.id] ?? false;

                return (
                  <div key={category.id} className="rounded-xl border border-slate-200/70 overflow-hidden bg-slate-50/50">
                    <button
                      type="button"
                      onClick={() => toggleMobileCategory(category.id)}
                      className="w-full flex items-center justify-between p-3 text-left font-semibold text-xs text-[#0f172a] hover:bg-slate-100/80 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <span>{category.label}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Smooth Accordion Body */}
                    {isExpanded && (
                      <div className="px-2.5 pb-2.5 pt-1 space-y-1 bg-white border-t border-slate-100">
                        {category.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isItemActive = pathname === item.href.split("?")[0];

                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium transition-colors ${
                                isItemActive
                                  ? "bg-slate-100 text-[#0f172a] font-semibold"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-black"
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${item.iconBg}`}>
                                <ItemIcon className={`w-3.5 h-3.5 ${item.iconColor}`} />
                              </div>
                              <span className="flex-1 truncate">{item.title}</span>
                              {item.badge && (
                                <span className="text-[9px] font-medium px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Direct Core App Links */}
            <div className="pt-2 border-t border-slate-200/60 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 font-mono">
                Workspace
              </span>
              {directLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-[#0f172a] text-white font-medium"
                        : "text-[hsl(215,25%,32%)] hover:bg-slate-100 hover:text-[#0f172a]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Sign Out Button */}
            <div className="pt-2 mt-1 border-t border-slate-200/60">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-start gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
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
