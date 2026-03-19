"use client";

import * as React from "react";
import { IconAlertCircle, IconCheck, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export type ToastType = "error" | "success" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, message, type };
    
    setToasts((prev) => [...prev, toast]);

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
  React.useEffect(() => {
    const timer = setTimeout(onDismiss, 3800);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icons = {
    error: <IconAlertCircle className="h-5 w-5 text-red-500" />,
    success: <IconCheck className="h-5 w-5 text-green-500" />,
    info: <IconAlertCircle className="h-5 w-5 text-blue-500" />,
  };

  const bgColors = {
    error: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
    success: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
    info: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border shadow-lg backdrop-blur-sm",
        "animate-in slide-in-from-bottom-2 fade-in duration-300",
        bgColors[toast.type]
      )}
    >
      <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
      <p className="text-sm text-foreground flex-1">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <IconX className="h-4 w-4" />
      </button>
    </div>
  );
}
