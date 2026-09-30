import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-muted/70 dark:bg-muted/40",
        className
      )}
      {...props}
    />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border p-6 space-y-4 shadow-sm bg-card", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function TripHeaderSkeleton() {
  return (
    <div className="w-full space-y-4 rounded-3xl border bg-card/60 backdrop-blur-md p-6 lg:p-8 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted/80 rounded-xl" />
          <div className="h-4 w-48 bg-muted/60 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-muted/80 rounded-xl" />
          <div className="h-10 w-28 bg-muted/80 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
        <div className="h-14 bg-muted/50 rounded-xl" />
        <div className="h-14 bg-muted/50 rounded-xl" />
        <div className="h-14 bg-muted/50 rounded-xl" />
        <div className="h-14 bg-muted/50 rounded-xl" />
      </div>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-4 py-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 items-start p-4 rounded-2xl border bg-card">
          <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-full max-w-sm" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
