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
  const [isSaving, setIsSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const lastSavedRef = useRef(entry?.content || "");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with entry prop (when date changes)
  useEffect(() => {
    setContent(entry?.content || "");
    lastSavedRef.current = entry?.content || "";
    setSaveFailed(false);
  }, [entry]);

  // Save function - only save when content actually changes
  const saveContent = useCallback(async (value: string) => {
    if (value === lastSavedRef.current) return;

    setIsSaving(true);
    lastSavedRef.current = value;
    setSaveFailed(false);

    const success = await onSave(hour, value);
    if (!success && onError) {
      onError("Failed to save. Please check your browser storage.");
      setSaveFailed(true);
    }
    setIsSaving(false);
  }, [hour, onSave, onError]);

  // Handle typing - update state immediately, debounce save
  const handleChange = useCallback((value: string) => {
    setContent(value);
    setSaveFailed(false);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save by 500ms
    saveTimeoutRef.current = setTimeout(() => {
      saveContent(value);
    }, 500);
  }, [saveContent]);

  // Handle blur - save immediately and trigger streak animation
  const handleBlur = useCallback(async () => {
    // Clear debounce timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const currentContent = content;
    const success = await onSave(hour, currentContent);
    if (!success && onError) {
      onError("Failed to save. Please check your browser storage.");
      setSaveFailed(true);
    }
  }, [content, hour, onSave, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    content,
    handleChange,
    handleBlur,
    isSaving,
    saveFailed,
  };
}
