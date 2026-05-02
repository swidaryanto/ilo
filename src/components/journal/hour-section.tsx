"use client";

import { useEffect, useRef } from "react";
import { useHourNotes } from "@/hooks/use-hour-notes";
import { formatHour } from "@/lib/utils/date";
import type { JournalEntry } from "@/lib/types/journal";
import { cn } from "@/lib/utils";
import { IconAlertCircle } from "@tabler/icons-react";

interface HourSectionProps {
  hour: number;
  entry: JournalEntry | undefined;
  onSave: (hour: number, content: string) => Promise<boolean>;
  onError?: (error: string) => void;
  isCurrentHour?: boolean;
  isFocused?: boolean;
  isHovered?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
}

export function HourSection({
  hour,
  entry,
  onSave,
  onError,
  isCurrentHour = false,
  isFocused = false,
  isHovered = false,
  onFocus,
  onBlur,
  onNavigateUp,
  onNavigateDown,
}: HourSectionProps) {
  const { initialContent, handleBlur } = useHourNotes({ hour, entry, onSave, onError });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveFailed = useRef(false);

  // Focus management only — no value control
  useEffect(() => {
    if (isFocused && textareaRef.current) {
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [isFocused]);

  // Auto-resize on initial render
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, []);

  const isBlurred = !isFocused && !isHovered;
  const hasContent = (entry?.content || "").trim().length > 0;
  const shouldShowPlaceholder = isCurrentHour && !hasContent;

  return (
    <div
      className={cn(
        "flex gap-3 transition-all duration-300",
        isBlurred && "opacity-30 blur-md"
      )}
    >
      {/* Left: Hour label */}
      <div className="flex flex-col gap-2 min-w-[60px] items-start justify-start pt-1.5 relative">
        <span className="text-sm font-medium text-muted-foreground">
          {formatHour(hour)}
        </span>
        {saveFailed.current && (
          <span className="text-xs text-red-500 flex items-center gap-1">
            <IconAlertCircle className="h-3 w-3" />
            Save failed
          </span>
        )}
      </div>

      {/* Middle: Uncontrolled textarea */}
      <div className="flex-1">
        <textarea
          ref={textareaRef}
          defaultValue={initialContent}
          placeholder={shouldShowPlaceholder ? "What's on your mind?" : ""}
          onFocus={onFocus}
          onBlur={(e) => {
            handleBlur(e.currentTarget.value);
            onBlur?.();
          }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = el.scrollHeight + "px";
          }}
          onKeyDown={(e) => {
            const textarea = e.currentTarget;
            const pos = textarea.selectionStart || 0;
            const lines = textarea.value.split("\n");
            const currentLine = textarea.value.substring(0, pos).split("\n").length - 1;
            const isAtStart = pos === 0;
            const isAtEnd = pos === textarea.value.length;

            if (e.key === "ArrowUp" && currentLine === 0 && isAtStart) {
              e.preventDefault();
              onNavigateUp?.();
            } else if (e.key === "ArrowDown" && currentLine === lines.length - 1 && isAtEnd) {
              e.preventDefault();
              onNavigateDown?.();
            }
          }}
          className={cn(
            "w-full bg-transparent border-0 outline-none resize-none min-h-[36px] px-2 py-1.5",
            "text-sm text-foreground placeholder:text-muted-foreground/50",
            "focus:outline-none focus:ring-0"
          )}
          rows={1}
        />
      </div>
    </div>
  );
}
