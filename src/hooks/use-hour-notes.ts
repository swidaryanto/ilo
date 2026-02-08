"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { JournalEntry } from "@/lib/types/journal";

interface UseHourNotesProps {
  hour: number;
  entry: JournalEntry | undefined;
  onSave: (hour: number, content: string) => Promise<void>;
}

export function useHourNotes({ hour, entry, onSave }: UseHourNotesProps) {
  const [content, setContent] = useState(entry?.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedRef = useRef(entry?.content || "");
  const contentRef = useRef(content);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setContent(entry?.content || "");
    lastSavedRef.current = entry?.content || "";
  }, [entry]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const debouncedSave = useCallback(
    async (value: string) => {
      setIsSaving(true);
      try {
        await onSave(hour, value);
        lastSavedRef.current = value;
      } finally {
        setIsSaving(false);
      }
    },
    [hour, onSave]
  );

  const flushSave = useCallback(() => {
    const value = contentRef.current ?? "";
    if (value === lastSavedRef.current) return;

    setIsSaving(true);
    onSave(hour, value)
      .then(() => {
        lastSavedRef.current = value;
      })
      .finally(() => {
        setIsSaving(false);
      });
  }, [hour, onSave]);

  useEffect(() => {
    if (content === undefined) return;

    const timeoutId = setTimeout(() => {
      debouncedSave(content);
    }, 500);

    timeoutRef.current = timeoutId;

    return () => clearTimeout(timeoutId);
  }, [content, debouncedSave]);

  useEffect(() => {
    return () => {
      if (contentRef.current !== lastSavedRef.current) {
        void onSave(hour, contentRef.current ?? "");
      }
    };
  }, [hour, onSave]);

  const handleChange = useCallback((value: string) => {
    setContent(value);
  }, []);

  const handleBlur = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    flushSave();
  }, [flushSave]);

  return {
    content,
    handleChange,
    handleBlur,
    isSaving,
  };
}
