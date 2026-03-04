"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  streak: number;
  show: boolean;
  onAnimationComplete?: () => void;
}

export function StreakBadge({ streak, show, onAnimationComplete }: StreakBadgeProps) {
  const [visible, setVisible] = useState(show);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (show && !visible) {
      setVisible(true);
      requestAnimationFrame(() => {
        setAnimate(true);
      });

      const timer = setTimeout(() => {
        setAnimate(false);
        setTimeout(() => {
          setVisible(false);
          onAnimationComplete?.();
        }, 300);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [show, onAnimationComplete, visible]);

  if (!visible) return null;

  return (
    <div className="absolute -top-10 left-0 pointer-events-none z-50">
      <div
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg",
          "bg-gradient-to-r from-orange-500 to-amber-500 text-white",
          "transition-all duration-500 ease-out",
          animate ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        )}
      >
        <span className="text-base">🔥</span>
        <span className="text-xs font-semibold whitespace-nowrap">
          {streak <= 1 ? "First entry!" : `${streak}-day streak`}
        </span>
      </div>
    </div>
  );
}
