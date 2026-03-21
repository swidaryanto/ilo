"use client";

import * as React from "react";
import { IconAlertCircle, IconCheck, IconX, IconArrowLeft } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export type ToastType = "error" | "success" | "info" | "warning";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const newToast: Toast = { id, ...toast };

    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 300);
    }, toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [onDismiss, toast.duration]);

  const icons = {
    error: <IconAlertCircle className="h-5 w-5 text-red-500" />,
    success: <IconCheck className="h-5 w-5 text-green-500" />,
    info: <IconAlertCircle className="h-5 w-5 text-blue-500" />,
    warning: <IconAlertCircle className="h-5 w-5 text-muted-foreground" />,
  };

  const bgColors = {
    error: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
    success: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
    info: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
    warning: "bg-muted/30 dark:bg-muted/20 border-border/50 dark:border-white/10",
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-3 rounded-lg border shadow-lg backdrop-blur-sm",
        "animate-in slide-in-from-bottom-2 fade-in duration-300",
        isExiting && "animate-out slide-out-to-bottom-2 fade-out duration-300",
        bgColors[toast.type]
      )}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
        <p className="text-sm text-foreground flex-1">{toast.message}</p>
        <button
          onClick={onDismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>

      {toast.action && (
        <button
          onClick={() => {
            toast.action?.onClick();
            onDismiss();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-background border border-border rounded-md hover:bg-accent hover:border-accent-foreground/20 transition-colors self-start"
        >
          <IconArrowLeft className="h-3.5 w-3.5 rotate-180" />
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
