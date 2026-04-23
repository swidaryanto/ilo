"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  hasMigrationFlag,
  setMigrationFlag,
  getLocalStorageJournalData,
  getLocalStorageTrashData,
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
      const trash = getLocalStorageTrashData();

      const res = await fetch("/api/journal/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, trash }),
      });

      if (!res.ok) throw new Error("Migration request failed");

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
