"use client";

import { useCallback, useRef } from "react";
import type { JournalEntry } from "@/lib/types/journal";

interface UseHourNotesProps {
  hour: number;
  entry: JournalEntry | undefined;
  onSave: (hour: number, content: string) => Promise<boolean>;
  onError?: (error: string) => void;
}

export function useHourNotes({ hour, entry, onSave, onError }: UseHourNotesProps) {
  const savedContentRef = useRef(entry?.content || "");

  const handleBlur = useCallback(async (value: string) => {
    if (value === savedContentRef.current) return;
    savedContentRef.current = value;
    const success = await onSave(hour, value);
    if (!success && onError) {
      onError("Failed to save. Please check your connection.");
    }
  }, [hour, onSave, onError]);

  return { initialContent: entry?.content || "", handleBlur };
}
