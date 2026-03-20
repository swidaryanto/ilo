"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { useHourNotes } from "@/hooks/use-hour-notes";
import { formatHour } from "@/lib/utils/date";
import type { JournalEntry, Mood } from "@/lib/types/journal";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { StreakBadge } from "@/components/streak-badge";
import { MoodSelector, MoodBadge } from "@/components/mood-selector";
import { IconAlertCircle } from "@tabler/icons-react";

interface HourSectionProps {
  hour: number;
  entry: JournalEntry | undefined;
  onSave: (hour: number, content: string, mood?: Mood) => Promise<boolean>;
  onError?: (error: string) => void;
  isCurrentHour?: boolean;
  isFocused?: boolean;
  isHovered?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  showStreakBadge?: boolean;
  streakCount?: number;
  onStreakAnimationComplete?: () => void;
  onNewEntry?: (hour: number) => void;
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
  showStreakBadge = false,
  streakCount = 0,
  onStreakAnimationComplete,
  onNewEntry,
}: HourSectionProps) {
  const [mood, setMood] = React.useState<Mood | undefined>(entry?.mood);
  const moodRef = React.useRef(mood);

  // Keep moodRef in sync with mood state
  React.useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  const { content, handleChange, handleBlur, isSaving, saveFailed } = useHourNotes({
    hour,
    entry,
    onSave: (h, c) => onSave(h, c, moodRef.current),
    onError,
    onNewEntry: () => {
      if (onNewEntry) {
        onNewEntry(hour);
      }
    }
  });

  // Sync mood with entry prop
  React.useEffect(() => {
    setMood(entry?.mood);
  }, [entry?.mood]);

  const handleMoodChange = (newMood: Mood | undefined) => {
    setMood(newMood);
    // Save with new mood
    onSave(hour, content, newMood);
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isFocused && textareaRef.current) {
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      });
    }
  }, [isFocused]);

  const isBlurred = !isFocused && !isHovered;
  const hasContent = content && content.trim().length > 0;
  const shouldShowPlaceholder = isCurrentHour && !hasContent;
  const showMoodSelector = isFocused || hasContent || mood;

  return (
    <div
      className={cn(
        "flex gap-3 transition-all duration-300",
        isBlurred && "opacity-30 blur-md"
      )}
    >
      {/* Left: Hour label */}
      <div className="flex flex-col gap-2 min-w-[60px] items-start justify-center relative">
        <span className="text-sm font-medium text-muted-foreground">
          {formatHour(hour)}
        </span>
        {isSaving && (
          <span className="text-xs text-muted-foreground">Saving...</span>
        )}
        {saveFailed && (
          <span className="text-xs text-red-500 flex items-center gap-1">
            <IconAlertCircle className="h-3 w-3" />
            Save failed
          </span>
        )}
        <StreakBadge
          streak={streakCount}
          show={showStreakBadge}
          onAnimationComplete={onStreakAnimationComplete}
        />
      </div>

      {/* Middle: Input with fixed width */}
      <div className="flex flex-col relative w-[400px]">
        <Textarea
          ref={textareaRef}
          value={content || ""}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={onFocus}
          onBlur={() => {
            handleBlur();
            onBlur?.();
          }}
          onKeyDown={(e) => {
            const textarea = e.currentTarget;
            const cursorPosition = textarea.selectionStart || 0;
            const isAtStart = cursorPosition === 0;
            const isAtEnd = cursorPosition === textarea.value.length;
            const lines = textarea.value.split("\n");
            const currentLine = textarea.value.substring(0, cursorPosition).split("\n").length - 1;

            if (e.key === "ArrowUp" && currentLine === 0 && isAtStart) {
              e.preventDefault();
              onNavigateUp?.();
            } else if (e.key === "ArrowDown" && currentLine === lines.length - 1 && isAtEnd) {
              e.preventDefault();
              onNavigateDown?.();
            }
          }}
          placeholder={shouldShowPlaceholder ? "What's on your mind?" : ""}
          className={cn(
            "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 px-2 bg-transparent resize-none min-h-9 w-full",
            saveFailed && "text-red-600 dark:text-red-400"
          )}
          rows={1}
        />
      </div>

      {/* Right: Mood selector */}
      {showMoodSelector && (
        <div className="flex items-start pt-1">
          <MoodSelector
            selectedMood={mood}
            onMoodSelect={handleMoodChange}
            className=""
          />
        </div>
      )}
    </div>
  );
}
