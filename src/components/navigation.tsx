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
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
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
    <header className="border-b bg-card/85 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              <Compass className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight leading-none">Rimjhim Roams</span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">TripWise OS</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Desktop navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <Button size="sm" asChild className="gap-1.5 shadow-sm rounded-xl">
            <Link href="/trips/new">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">New Trip</span>
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="hidden sm:flex text-muted-foreground hover:text-destructive gap-1.5 rounded-xl"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="inline">Sign Out</span>
          </Button>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-card/95 backdrop-blur-lg px-4 pt-3 pb-6 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-3 mt-2 border-t flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-destructive hover:bg-destructive/10 border-destructive/20 gap-2 rounded-xl"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
