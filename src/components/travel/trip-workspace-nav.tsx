"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Clock,
  Wallet,
  CloudSun,
  ShieldAlert,
  Users,
  Scale,
  Luggage,
  FileText,
  CalendarCheck,
  Bot,
  LayoutDashboard,
} from "lucide-react";

export interface TripWorkspaceNavProps {
  tripId: string;
  className?: string;
}

export function TripWorkspaceNav({ tripId, className }: TripWorkspaceNavProps) {
  const pathname = usePathname();

  const navItems = [
    { id: "overview", label: "Overview", href: `/trips/${tripId}`, icon: LayoutDashboard, exact: true },
    { id: "itinerary", label: "Itinerary", href: `/trips/${tripId}/itinerary`, icon: Clock },
    { id: "budget", label: "Budget", href: `/trips/${tripId}/budget`, icon: Wallet },
    { id: "weather", label: "Weather", href: `/trips/${tripId}/weather`, icon: CloudSun },
    { id: "safety", label: "Safety Center", href: `/trips/${tripId}/safety`, icon: ShieldAlert },
    { id: "group", label: "Group & Polls", href: `/trips/${tripId}/group`, icon: Users },
    { id: "expenses", label: "Split Expenses", href: `/trips/${tripId}/expenses`, icon: Scale },
    { id: "packing", label: "Packing List", href: `/trips/${tripId}/packing`, icon: Luggage },
    { id: "documents", label: "Documents", href: `/trips/${tripId}/documents`, icon: FileText },
    { id: "bookings", label: "Bookings", href: `/trips/${tripId}/bookings`, icon: CalendarCheck },
    { id: "assistant", label: "AI Copilot", href: `/trips/${tripId}/assistant`, icon: Bot },
  ];

  return (
    <nav
      aria-label="Trip workspace sections"
      className={`w-full overflow-x-auto no-scrollbar py-2.5 border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-16 z-30 ${className || ""}`}
    >
      <div className="flex items-center gap-1.5 min-w-max px-2 container mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? "bg-black text-white shadow-xs font-medium scale-[1.02]"
                  : "text-[hsl(215,25%,32%)] hover:bg-slate-100 hover:text-[#0f172a]"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
