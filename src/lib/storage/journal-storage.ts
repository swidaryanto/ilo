import type { JournalEntry, JournalDay } from "@/lib/types/journal";

export interface JournalStorage {
  getEntries(date: string): Promise<JournalEntry[]>;
  saveEntry(entry: JournalEntry): Promise<void>;
  deleteEntry(id: string, date: string): Promise<void>;
  restoreEntry(entry: JournalEntry): Promise<void>;
  deleteDay(date: string): Promise<void>;
  getDay(date: string): Promise<JournalDay | null>;
  getAllDays(): Promise<JournalDay[]>;
}

export type SyncStatus = "synced" | "syncing" | "offline" | "error";

export interface SyncableJournalStorage extends JournalStorage {
  getSyncStatus(): SyncStatus;
  syncPending(): Promise<void>;
}

export function isSyncableJournalStorage(
  storage: JournalStorage
): storage is SyncableJournalStorage {
  return "syncPending" in storage && "getSyncStatus" in storage;
}
