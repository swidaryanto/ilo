import type { JournalDay, JournalEntry } from "@/lib/types/journal";

import type { TrashItem } from "./trash-storage";

const MIGRATION_FLAG_KEY = "ilo:migrated";
const JOURNAL_PREFIX = "journal:";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function hasMigrationFlag(): boolean {
  return localStorage.getItem(MIGRATION_FLAG_KEY) === "true";
}

export function setMigrationFlag(): void {
  localStorage.setItem(MIGRATION_FLAG_KEY, "true");
}

export function getLocalStorageJournalData(): JournalDay[] {
  const days: JournalDay[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(JOURNAL_PREFIX)) continue;
    const date = key.replace(JOURNAL_PREFIX, "");
    if (!DATE_PATTERN.test(date)) continue;

    try {
      const raw = localStorage.getItem(key);
      const entries = JSON.parse(raw ?? "[]") as JournalEntry[];
      if (Array.isArray(entries) && entries.length > 0) {
        days.push({ date, entries });
      }
    } catch {
      // skip malformed
    }
  }

  return days;
}

export function getLocalStorageTrashData(): TrashItem[] {
  try {
    const raw = localStorage.getItem("journal:trash");
    if (!raw) return [];
    return JSON.parse(raw) as TrashItem[];
  } catch {
    return [];
  }
}
