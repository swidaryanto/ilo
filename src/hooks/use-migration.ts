"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  hasMigrationFlag,
  setMigrationFlag,
  getLocalStorageJournalData,
} from "@/lib/storage/migration";

export type MigrationState =
  | { status: "idle" }
  | { status: "pending"; dayCount: number }
  | { status: "migrating" }
  | { status: "done" }
  | { status: "error"; message: string };

export function useMigration() {
  const { status } = useSession();
  const [migrationState, setMigrationState] = useState<MigrationState>({ status: "idle" });

  useEffect(() => {
    if (status !== "authenticated") return;
    if (hasMigrationFlag()) return;

    const days = getLocalStorageJournalData();
    const hasData = days.some((d) => d.entries.some((e) => e.content.trim().length > 0));
    if (hasData) {
      setMigrationState({ status: "pending", dayCount: days.length });
    }
  }, [status]);

  const runMigration = useCallback(async () => {
    setMigrationState({ status: "migrating" });
    try {
      const days = getLocalStorageJournalData();

      for (const day of days) {
        for (const entry of day.entries) {
          if (!entry.content.trim()) continue;
          const res = await fetch(`/api/journal/${day.date}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry),
          });
          if (!res.ok) {
            const text = await res.text();
            console.error(`[migration] POST /api/journal/${day.date} → ${res.status}:`, text);
            let message = "Failed to save entry";
            try { message = (JSON.parse(text) as { error?: string }).error ?? message; } catch {}
            throw new Error(message);
          }
        }
      }

      setMigrationFlag();
      setMigrationState({ status: "done" });
    } catch (err) {
      setMigrationState({
        status: "error",
        message: err instanceof Error ? err.message : "Migration failed",
      });
    }
  }, []);

  const dismissMigration = useCallback(() => {
    setMigrationFlag();
    setMigrationState({ status: "idle" });
  }, []);

  return { migrationState, runMigration, dismissMigration };
}
