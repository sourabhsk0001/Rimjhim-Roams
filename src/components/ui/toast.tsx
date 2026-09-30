"use client";

import React, { createContext, useContext, useState, useCallback, useId } from "react";
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react";

export type ToastType = "default" | "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  title?: string;
  description: string;
  type?: ToastType;
  variant?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastMessage, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, type, variant, duration = 4000 }: Omit<ToastMessage, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const resolvedType = variant || type || "default";
      const newToast: ToastMessage = { id, title, description, type: resolvedType, variant: resolvedType, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast Render Viewport */}
      <div
        role="region"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-4"
      >
        {toasts.map((t) => {
          let bg = "bg-card text-card-foreground border-border";
          let Icon = Info;
          let iconColor = "text-primary";

          if (t.type === "success") {
            bg = "bg-emerald-50 text-emerald-950 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800";
            Icon = CheckCircle2;
            iconColor = "text-emerald-600 dark:text-emerald-400";
          } else if (t.type === "error") {
            bg = "bg-rose-50 text-rose-950 border-rose-200 dark:bg-rose-950 dark:text-rose-100 dark:border-rose-800";
            Icon = AlertCircle;
            iconColor = "text-rose-600 dark:text-rose-400";
          } else if (t.type === "warning") {
            bg = "bg-amber-50 text-amber-950 border-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800";
            Icon = AlertTriangle;
            iconColor = "text-amber-600 dark:text-amber-400";
          }

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 duration-200 ${bg}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 min-w-0">
                {t.title && <h4 className="font-semibold text-sm leading-tight mb-0.5">{t.title}</h4>}
                <p className="text-xs leading-relaxed opacity-90">{t.description}</p>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-muted-foreground hover:text-foreground rounded p-0.5 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside ToastProvider
    return {
      toast: (options: Omit<ToastMessage, "id">) => {
        console.log(`[Toast ${options.type || "info"}]: ${options.title || ""} - ${options.description}`);
      },
      dismiss: () => {},
    };
  }
  return context;
}
