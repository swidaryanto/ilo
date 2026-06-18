"use client";

import { IconArrowRight } from "@tabler/icons-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  variant?: "journal" | "notes";
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  variant = "journal",
  onAction,
  className,
}: EmptyStateProps) {
  const isJournal = variant === "journal";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-12",
        className
      )}
    >
      {/* Illustration */}
      <div className="relative mb-6">
        <img
          src="/document.svg"
          alt=""
          aria-hidden="true"
          className="w-15 h-15"
          style={{ pointerEvents: "none" }}
        />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {isJournal ? "Your day is a blank canvas" : "No entries yet"}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground max-w-[260px] mb-6 leading-relaxed">
        {isJournal
          ? "Capture your thoughts hour by hour. Start with the current time or any moment that comes to mind."
          : "Your journal is waiting for its first story. Every entry becomes a memory worth keeping."}
      </p>

      {/* Action hint */}
      <div
        className={cn(
          "flex items-center gap-2 text-xs font-medium",
          isJournal
            ? "text-orange-500 dark:text-orange-400"
            : "text-muted-foreground"
        )}
      >
        {isJournal ? (
          <>
            <span>Scroll to find your hour</span>
            <IconArrowRight className="w-3 h-3" />
          </>
        ) : (
          <>
            <span>Tap the button below to start writing</span>
          </>
        )}
      </div>

      {/* Suggested prompts for journal */}
      {isJournal && (
        <div className="mt-8 flex flex-col gap-2 w-full max-w-[280px]">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1">
            Need inspiration?
          </p>
          {[
            "What are you grateful for right now?",
            "What's on your mind at this moment?",
            "What made you smile today?",
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={onAction}
              className="text-left text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 rounded-lg hover:bg-accent/30"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
