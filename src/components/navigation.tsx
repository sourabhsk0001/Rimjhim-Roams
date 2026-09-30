"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, Map, User, LogOut, PlusCircle, LayoutDashboard, Globe, Sparkles, BookOpen, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

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
    <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">Rimjhim Roams</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" asChild className="gap-1.5 shadow-sm">
            <Link href="/trips/new">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">New Trip</span>
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive gap-1.5"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
