import type { JournalEntry, JournalDay } from "@/lib/types/journal";

import type { JournalStorage } from "./journal-storage";

const STORAGE_PREFIX = "journal:";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Checks if localStorage is available and writable.
 * Returns false in private browsing modes or when storage is disabled.
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if localStorage has exceeded quota.
 */
function isLocalStorageQuotaExceeded(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === "QuotaExceededError";
  }
  if (error instanceof Error) {
    return (
      error.message.includes("quota") || error.message.includes("exceeded")
    );
  }
  return false;
}

export class LocalStorageAdapter implements JournalStorage {
  constructor(private readonly storagePrefix = STORAGE_PREFIX) {}

  private getStorageKey(date: string): string {
    return `${this.storagePrefix}${date}`;
  }

  async getEntries(date: string): Promise<JournalEntry[]> {
    if (typeof window === "undefined") {
      return [];
    }

    if (!isLocalStorageAvailable()) {
      throw new Error(
        "LocalStorage is not available. Your data cannot be loaded."
      );
    }

    const key = this.getStorageKey(date);
    const data = localStorage.getItem(key);

    if (!data) {
      return [];
    }

    try {
      const entries: JournalEntry[] = JSON.parse(data);
      return entries;
    } catch {
      return [];
    }
  }

  async saveEntry(entry: JournalEntry): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("Cannot save: not running in browser");
    }

    if (!isLocalStorageAvailable()) {
      throw new Error(
        "LocalStorage is not available. Your entries cannot be saved."
      );
    }

    const key = this.getStorageKey(entry.date);
    const existingEntries = await this.getEntries(entry.date);

    const existingIndex = existingEntries.findIndex((e) => e.id === entry.id);

    if (existingIndex >= 0) {
      existingEntries[existingIndex] = entry;
    } else {
      existingEntries.push(entry);
    }

    try {
      localStorage.setItem(key, JSON.stringify(existingEntries));
    } catch (error) {
      if (isLocalStorageQuotaExceeded(error)) {
        throw new Error(
          "Storage quota exceeded. Please delete some entries to free up space."
        );
      }
      throw new Error(
        "Failed to save entry. Please check your browser settings."
      );
    }
  }

  async deleteEntry(id: string, date: string): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    const key = this.getStorageKey(date);
    const existingEntries = await this.getEntries(date);
    const filteredEntries = existingEntries.filter((e) => e.id !== id);

    if (filteredEntries.length === 0) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(filteredEntries));
    }
  }

  async restoreEntry(entry: JournalEntry): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    const key = this.getStorageKey(entry.date);
    const existingEntries = await this.getEntries(entry.date);

    // Check if entry already exists (don't duplicate)
    const exists = existingEntries.some((e) => e.id === entry.id);
    if (!exists) {
      existingEntries.push(entry);
      // Sort by hour
      existingEntries.sort((a, b) => a.hour - b.hour);
      localStorage.setItem(key, JSON.stringify(existingEntries));
    }
  }

  async deleteDay(date: string): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    const key = this.getStorageKey(date);
    localStorage.removeItem(key);
  }

  async replaceEntries(date: string, entries: JournalEntry[]): Promise<void> {
    if (typeof window === "undefined" || !isLocalStorageAvailable()) return;

    const key = this.getStorageKey(date);
    if (entries.length === 0) {
      localStorage.removeItem(key);
      return;
    }

    localStorage.setItem(
      key,
      JSON.stringify([...entries].sort((a, b) => a.hour - b.hour))
    );
  }

  async replaceAllDays(days: JournalDay[]): Promise<void> {
    if (typeof window === "undefined" || !isLocalStorageAvailable()) return;

    const keysToDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(this.storagePrefix)) continue;

      const date = key.slice(this.storagePrefix.length);
      if (DATE_PATTERN.test(date)) keysToDelete.push(key);
    }

    for (const key of keysToDelete) localStorage.removeItem(key);
    for (const day of days) await this.replaceEntries(day.date, day.entries);
  }

  async getDay(date: string): Promise<JournalDay | null> {
    const entries = await this.getEntries(date);

    if (entries.length === 0) {
      return null;
    }

    return {
      date,
      entries,
    };
  }

  async getAllDays(): Promise<JournalDay[]> {
    if (typeof window === "undefined") {
      return [];
    }

    if (!isLocalStorageAvailable()) {
      return [];
    }

    const days: JournalDay[] = [];

    // Collect all date keys first to avoid issues with shifting indices during iteration
    // Exclude special keys like journal:trash
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        const date = key.slice(this.storagePrefix.length);
        if (!DATE_PATTERN.test(date)) continue;
        keys.push(key);
      }
    }

    // Now iterate over the collected date keys
    for (const key of keys) {
      const date = key.slice(this.storagePrefix.length);
      const entries = await this.getEntries(date);

      if (entries.length > 0) {
        days.push({
          date,
          entries: entries.sort((a, b) => a.hour - b.hour),
        });
      }
    }

    return days.sort((a, b) => b.date.localeCompare(a.date));
  }
}
