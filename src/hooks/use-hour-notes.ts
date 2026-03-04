"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { JournalEntry } from "@/lib/types/journal";

interface UseHourNotesProps {
  hour: number;
  entry: JournalEntry | undefined;
  onSave: (hour: number, content: string) => Promise<void>;
  onNewEntry?: () => void;
}

export function useHourNotes({ hour, entry, onSave, onNewEntry }: UseHourNotesProps) {
  const [content, setContent] = useState(entry?.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedRef = useRef(entry?.content || "");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with entry prop (when date changes)
  useEffect(() => {
    setContent(entry?.content || "");
    lastSavedRef.current = entry?.content || "";
  }, [entry]);

  // Save function - only save when content actually changes
  const saveContent = useCallback((value: string) => {
    if (value === lastSavedRef.current) return;
    
    setIsSaving(true);
    lastSavedRef.current = value;
    
    onSave(hour, value).finally(() => {
      setIsSaving(false);
    });
  }, [hour, onSave]);

  // Handle typing - update state immediately, debounce save
  const handleChange = useCallback((value: string) => {
    setContent(value);
    
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
  const handleBlur = useCallback(() => {
    // Clear debounce timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const currentContent = content;
    const isNewEntry = currentContent.trim().length > 0;

    // Save immediately on blur
    saveContent(currentContent);

    // Trigger streak animation
    if (isNewEntry && onNewEntry) {
      onNewEntry();
    }
  }, [content, saveContent, onNewEntry]);

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
  };
}
