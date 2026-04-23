"use client";

import { useState, useEffect, useCallback } from "react";
import type { JournalEntry, Mood } from "@/lib/types/journal";
import { formatDate } from "@/lib/utils/date";
import { useStorage } from "@/hooks/use-storage";

function generateEntryId(date: string, hour: number): string {
  return `${date}-${hour}`;
}

export interface SaveError {
  hour: number;
  message: string;
  timestamp: number;
}

export function useJournal(initialDate?: string) {
  const [selectedDate] = useState<string>(
    initialDate || formatDate(new Date())
  );
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<SaveError | null>(null);
  const { storage, isLoading: storageLoading } = useStorage();

  const loadEntries = useCallback(
    async (date: string) => {
      setLoading(true);
      try {
        const loadedEntries = await storage.getEntries(date);
        setEntries(loadedEntries);
        setSaveError(null);
      } catch (error) {
        console.error("Failed to load entries:", error);
        setEntries([]);
        setSaveError({
          hour: -1,
          message: "Failed to load journal entries. Your data may not be accessible.",
          timestamp: Date.now(),
        });
      } finally {
        setLoading(false);
      }
    },
    [storage]
  );

  useEffect(() => {
    if (storageLoading) return;
    loadEntries(selectedDate);
  }, [selectedDate, loadEntries, storageLoading]);

  const saveEntry = useCallback(
    async (hour: number, content: string, mood?: Mood): Promise<boolean> => {
      const now = new Date().toISOString();
      const entryId = generateEntryId(selectedDate, hour);

      const existingEntry = entries.find((e) => e.id === entryId);

      const entry: JournalEntry = {
        id: entryId,
        date: selectedDate,
        hour,
        content,
        mood,
        createdAt: existingEntry?.createdAt || now,
        updatedAt: now,
      };

      try {
        await storage.saveEntry(entry);
        setEntries((prev) => {
          const filtered = prev.filter((e) => e.id !== entryId);
          return [...filtered, entry];
        });
        setSaveError(null);
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to save your entry";
        setSaveError({
          hour,
          message: errorMessage,
          timestamp: Date.now(),
        });
        return false;
      }
    },
    [selectedDate, entries, storage]
  );

  const getEntryForHour = useCallback(
    (hour: number): JournalEntry | undefined => {
      return entries.find((e) => e.hour === hour);
    },
    [entries]
  );

  const clearSaveError = useCallback(() => {
    setSaveError(null);
  }, []);

  return {
    selectedDate,
    entries,
    loading: loading || storageLoading,
    saveEntry,
    getEntryForHour,
    saveError,
    clearSaveError,
  };
}
