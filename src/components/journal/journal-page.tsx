"use client";

import { useEffect, useState } from "react";
import { useJournal } from "@/hooks/use-journal";
import { HourSection } from "./hour-section";
import { formatDate, formatDateDisplay } from "@/lib/utils/date";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/empty-state";
import Link from "next/link";

export function JournalPage({ initialEntries }: { initialEntries?: import("@/lib/types/journal").JournalEntry[] }) {
  const currentDate = formatDate(new Date());
  const { addToast } = useToast();
  const {
    loading,
    saveEntry,
    getEntryForHour,
    saveError,
    clearSaveError,
    entries,
  } = useJournal(currentDate, initialEntries);

  const currentHour = new Date().getHours();
  const [focusedHour, setFocusedHour] = useState<number | null>(currentHour);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const hasEntries = entries.some((e) => e.content.trim().length > 0);

  useEffect(() => {
    if (saveError) {
      addToast({ message: saveError.message, type: "error", duration: 5000 });
      clearSaveError();
    }
  }, [saveError, addToast, clearSaveError]);

  useEffect(() => {
    if (!loading) {
      setFocusedHour(currentHour);
    }
  }, [currentHour, loading]);

  if (loading) {
    const quotes = ["Write it down.", "Words heal you.", "Begin right now.", "Tell your truth.", "Just keep writing."];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    return (
      <div className="flex flex-col items-center justify-center h-screen px-10 gap-3">
        <p className="text-center text-muted-foreground text-sm italic">&ldquo;{quote}&rdquo;</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto overflow-hidden">
      <div className="shrink-0 pt-6 pb-8 md:pb-12 mt-8">
        <div className="flex flex-col px-6 gap-2">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-lg md:text-2xl font-semibold tracking-tight leading-tight">
                {formatDateDisplay(currentDate)}
              </h1>
              <Link
                href="/notes"
                className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to Notes
              </Link>
            </div>
            <div className="md:hidden mt-1">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-2 px-6 pb-6">
          {!hasEntries && (
            <div className="py-8">
              <EmptyState variant="journal" onAction={() => setFocusedHour(currentHour)} />
            </div>
          )}

          {Array.from({ length: 24 }).map((_, i) => {
            const hour = i;
            return (
              <div
                key={hour}
                onMouseEnter={() => focusedHour !== hour && setHoveredHour(hour)}
                onMouseLeave={() => setHoveredHour(null)}
              >
                <HourSection
                  hour={hour}
                  entry={getEntryForHour(hour)}
                  onSave={saveEntry}
                  onError={(message) => addToast({ message, type: "error", duration: 5000 })}
                  isCurrentHour={hour === currentHour}
                  isFocused={focusedHour === hour}
                  isHovered={hoveredHour === hour}
                  onFocus={() => { setFocusedHour(hour); setHoveredHour(null); }}
                  onBlur={() => {}}
                  onNavigateUp={() => hour > 0 && setFocusedHour(hour - 1)}
                  onNavigateDown={() => hour < 23 && setFocusedHour(hour + 1)}
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
