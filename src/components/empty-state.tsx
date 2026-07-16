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
        {isJournal ? "Your day is a blank canvas" : "Start with one thought"}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground max-w-[260px] mb-6 leading-relaxed">
        {isJournal
          ? "Capture your thoughts hour by hour. Start with the current time or any moment that comes to mind."
          : "Capture one moment from today. You can always come back and add more."}
      </p>

      {isJournal ? (
        <div className="flex items-center gap-2 text-xs font-medium text-orange-500 dark:text-orange-400">
          <span>Scroll to find your hour</span>
          <IconArrowRight className="w-3 h-3" />
        </div>
      ) : (
        <button
          type="button"
          onClick={onAction}
          className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background shadow-sm transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span>Write your first note</span>
          <IconArrowRight className="h-4 w-4" />
        </button>
      )}

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
