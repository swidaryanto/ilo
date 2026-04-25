"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { JournalEntry } from "@/lib/types/journal";

interface UseHourNotesProps {
  hour: number;
  entry: JournalEntry | undefined;
  onSave: (hour: number, content: string) => Promise<boolean>;
  onError?: (error: string) => void;
}

export function useHourNotes({ hour, entry, onSave, onError }: UseHourNotesProps) {
  const [content, setContent] = useState(entry?.content || "");
  const [saveFailed, setSaveFailed] = useState(false);
  const isFocusedRef = useRef(false);

  // Only sync entry → content when not currently typing
  useEffect(() => {
    if (!isFocusedRef.current) {
      setContent(entry?.content || "");
      setSaveFailed(false);
    }
  }, [entry]);

  const handleChange = useCallback((value: string) => {
    setContent(value);
    setSaveFailed(false);
  }, []);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const handleBlur = useCallback(async () => {
    isFocusedRef.current = false;
    const success = await onSave(hour, content);
    if (!success && onError) {
      onError("Failed to save. Please check your connection.");
      setSaveFailed(true);
    }
  }, [content, hour, onSave, onError]);

  return { content, handleChange, handleFocus, handleBlur, saveFailed };
}
