import type { JournalDay, JournalEntry } from "@/lib/types/journal";

import type { SyncableJournalStorage, SyncStatus } from "./journal-storage";

import { LocalStorageAdapter } from "./local-storage-adapter";

export const SYNC_STATUS_EVENT = "ilo:sync-status";

export type SyncStatusEventDetail = {
  status: SyncStatus;
  userId: string;
};

type SyncOperation =
  | {
      id: string;
      type: "upsert";
      date: string;
      entry: JournalEntry;
    }
  | {
      id: string;
      type: "delete-entry";
      date: string;
      entryId: string;
      deletedAt: string;
    }
  | {
      id: string;
      type: "delete-day";
      date: string;
      deletedAt: string;
    };

function operationId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

function sortEntries(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((a, b) => a.hour - b.hour);
}

export class SupabaseAdapter implements SyncableJournalStorage {
  private readonly cache: LocalStorageAdapter;
  private readonly queueKey: string;
  private status: SyncStatus = "synced";
  private syncInFlight: Promise<void> | null = null;

  constructor(private readonly userId: string) {
    const accountKey = encodeURIComponent(userId);
    this.cache = new LocalStorageAdapter(`journal:cloud:${accountKey}:`);
    this.queueKey = `journal:sync:${accountKey}`;
  }

  getSyncStatus(): SyncStatus {
    if (isOffline()) return "offline";
    if (this.readQueue().length > 0 && this.status === "synced") {
      return "syncing";
    }
    return this.status;
  }

  async syncPending(): Promise<void> {
    if (!this.syncInFlight) {
      this.syncInFlight = this.runSync().catch((error: unknown) => {
        this.emitFailure(error);
      });
    }

    const currentSync = this.syncInFlight;
    await currentSync;
    if (this.syncInFlight === currentSync) {
      this.syncInFlight = null;
    }

    if (
      !isOffline() &&
      this.status !== "error" &&
      this.readQueue().length > 0
    ) {
      await this.syncPending();
    }
  }

  async getEntries(date: string): Promise<JournalEntry[]> {
    await this.syncPending();
    if (isOffline()) return this.cache.getEntries(date);

    try {
      const response = await fetch(`/api/journal/${date}`);
      if (!response.ok) throw new Error(`Failed to load entries for ${date}`);

      const data = (await response.json()) as { entries: JournalEntry[] };
      const entries = this.applyPendingToEntries(
        data.entries,
        date,
        this.readQueue()
      );
      await this.cache.replaceEntries(date, entries);
      this.emitReadStatus();
      return entries;
    } catch (error) {
      this.emitFailure(error);
      return this.cache.getEntries(date);
    }
  }

  async saveEntry(entry: JournalEntry): Promise<void> {
    await this.cache.saveEntry(entry);
    this.enqueue({
      id: operationId(),
      type: "upsert",
      date: entry.date,
      entry,
    });
    this.startBackgroundSync();
  }

  async deleteEntry(id: string, date: string): Promise<void> {
    await this.cache.deleteEntry(id, date);
    this.enqueue({
      id: operationId(),
      type: "delete-entry",
      date,
      entryId: id,
      deletedAt: new Date().toISOString(),
    });
    this.startBackgroundSync();
  }

  async restoreEntry(entry: JournalEntry): Promise<void> {
    await this.saveEntry(entry);
  }

  async deleteDay(date: string): Promise<void> {
    await this.cache.deleteDay(date);
    this.enqueue({
      id: operationId(),
      type: "delete-day",
      date,
      deletedAt: new Date().toISOString(),
    });
    this.startBackgroundSync();
  }

  async getDay(date: string): Promise<JournalDay | null> {
    const entries = await this.getEntries(date);
    return entries.length > 0 ? { date, entries } : null;
  }

  async getAllDays(): Promise<JournalDay[]> {
    await this.syncPending();
    if (isOffline()) return this.cache.getAllDays();

    try {
      const response = await fetch("/api/journal/days");
      if (!response.ok) throw new Error("Failed to load all days");

      const data = (await response.json()) as { days: JournalDay[] };
      const days = this.applyPendingToDays(data.days, this.readQueue());
      await this.cache.replaceAllDays(days);
      this.emitReadStatus();
      return days;
    } catch (error) {
      this.emitFailure(error);
      return this.cache.getAllDays();
    }
  }

  private startBackgroundSync(): void {
    this.emitStatus(isOffline() ? "offline" : "syncing");
    void this.syncPending();
  }

  private async runSync(): Promise<void> {
    if (isOffline()) {
      this.emitStatus("offline");
      return;
    }

    let queue = this.readQueue();
    if (queue.length === 0) {
      this.emitStatus("synced");
      return;
    }

    this.emitStatus("syncing");

    while (queue.length > 0) {
      const operation = queue[0];
      try {
        await this.sendOperation(operation);
      } catch (error) {
        this.emitFailure(error);
        return;
      }

      const latestQueue = this.readQueue().filter(
        (item) => item.id !== operation.id
      );
      this.writeQueue(latestQueue);
      queue = latestQueue;
    }

    this.emitStatus("synced");
  }

  private async sendOperation(operation: SyncOperation): Promise<void> {
    let response: Response;

    if (operation.type === "upsert") {
      response = await fetch(`/api/journal/${operation.date}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(operation.entry),
      });
    } else if (operation.type === "delete-entry") {
      response = await fetch(
        `/api/journal/${operation.date}?entryId=${encodeURIComponent(operation.entryId)}&deletedAt=${encodeURIComponent(operation.deletedAt)}`,
        { method: "DELETE" }
      );
    } else {
      response = await fetch(
        `/api/journal/${operation.date}?deletedAt=${encodeURIComponent(operation.deletedAt)}`,
        { method: "DELETE" }
      );
    }

    if (!response.ok) {
      throw new Error(`Sync failed with status ${response.status}`);
    }
  }

  private enqueue(operation: SyncOperation): void {
    let queue = this.readQueue();

    if (operation.type === "upsert") {
      queue = queue.filter(
        (item) =>
          !(item.type === "upsert" && item.entry.id === operation.entry.id)
      );
    } else if (operation.type === "delete-entry") {
      queue = queue.filter(
        (item) =>
          !(item.type === "upsert" && item.entry.id === operation.entryId)
      );
    } else {
      queue = queue.filter((item) => item.date !== operation.date);
    }

    this.writeQueue([...queue, operation]);
  }

  private readQueue(): SyncOperation[] {
    if (typeof window === "undefined") return [];

    try {
      const data = localStorage.getItem(this.queueKey);
      if (!data) return [];
      const parsed: unknown = JSON.parse(data);
      return Array.isArray(parsed) ? (parsed as SyncOperation[]) : [];
    } catch {
      return [];
    }
  }

  private writeQueue(queue: SyncOperation[]): void {
    if (typeof window === "undefined") return;

    if (queue.length === 0) {
      localStorage.removeItem(this.queueKey);
      return;
    }

    localStorage.setItem(this.queueKey, JSON.stringify(queue));
  }

  private applyPendingToEntries(
    remoteEntries: JournalEntry[],
    date: string,
    queue: SyncOperation[]
  ): JournalEntry[] {
    const entries = new Map(remoteEntries.map((entry) => [entry.id, entry]));

    for (const operation of queue) {
      if (operation.date !== date) continue;

      if (operation.type === "upsert") {
        entries.set(operation.entry.id, operation.entry);
      } else if (operation.type === "delete-entry") {
        entries.delete(operation.entryId);
      } else {
        entries.clear();
      }
    }

    return sortEntries([...entries.values()]);
  }

  private applyPendingToDays(
    remoteDays: JournalDay[],
    queue: SyncOperation[]
  ): JournalDay[] {
    const days = new Map(
      remoteDays.map((day) => [day.date, sortEntries(day.entries)])
    );

    for (const operation of queue) {
      const entries = new Map(
        (days.get(operation.date) ?? []).map((entry) => [entry.id, entry])
      );

      if (operation.type === "upsert") {
        entries.set(operation.entry.id, operation.entry);
      } else if (operation.type === "delete-entry") {
        entries.delete(operation.entryId);
      } else {
        entries.clear();
      }

      if (entries.size === 0) {
        days.delete(operation.date);
      } else {
        days.set(operation.date, sortEntries([...entries.values()]));
      }
    }

    return [...days.entries()]
      .map(([date, entries]) => ({ date, entries }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  private emitFailure(error: unknown): void {
    this.emitStatus(
      isOffline() || error instanceof TypeError ? "offline" : "error"
    );
  }

  private emitReadStatus(): void {
    if (this.readQueue().length === 0) {
      this.emitStatus("synced");
    } else if (this.status !== "error") {
      this.emitStatus("syncing");
    }
  }

  private emitStatus(status: SyncStatus): void {
    this.status = status;
    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent<SyncStatusEventDetail>(SYNC_STATUS_EVENT, {
        detail: { status, userId: this.userId },
      })
    );
  }
}
