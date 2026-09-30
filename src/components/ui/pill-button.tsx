import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface PillButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "small" | "hero";
  href?: string;
}

export const PillButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  PillButtonProps
>(({ className, variant = "small", href, children, ...props }, ref) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-full bg-[#000000] text-[#ffffff] font-medium transition-transform duration-200 ease-in-out hover:scale-[1.03] active:scale-[0.98] cursor-pointer select-none shadow-md hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none";

  const sizeClasses =
    variant === "hero"
      ? "px-[56px] py-[20px] text-[16px] leading-tight"
      : "px-[24px] py-[10px] text-[14px] leading-tight";

  const combinedClasses = cn(baseClasses, sizeClasses, className);

  if (href) {
    return (
      <Link
        href={href}
        className={combinedClasses}
        ref={ref as React.Ref<HTMLAnchorElement>}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      className={combinedClasses}
      {...props}
    >
      {children}
    </button>
  );
});

PillButton.displayName = "PillButton";
