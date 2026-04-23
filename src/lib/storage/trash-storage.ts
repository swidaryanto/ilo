import type { JournalDay, JournalEntry } from "@/lib/types/journal";
import type { TrashStorageInterface } from "./trash-storage-interface";

const TRASH_KEY = "journal:trash";
const TRASH_EXPIRY_DAYS = 30;

export interface TrashItem {
  day: JournalDay;
  deletedAt: string;
  expiresAt: string;
}

function getExpiryDate(): string {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + TRASH_EXPIRY_DAYS);
  return expiry.toISOString();
}

function isExpired(item: TrashItem): boolean {
  return new Date(item.expiresAt) < new Date();
}

export class TrashStorage implements TrashStorageInterface {
  async getTrashItems(): Promise<TrashItem[]> {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const data = localStorage.getItem(TRASH_KEY);
      if (!data) return [];

      const items: TrashItem[] = JSON.parse(data);
      // Filter out expired items
      const validItems = items.filter(item => !isExpired(item));
      
      // Persist the cleanup
      if (validItems.length !== items.length) {
        await this.saveTrashItems(validItems);
      }

      return validItems;
    } catch {
      return [];
    }
  }

  async addToTrash(day: JournalDay): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    const items = await this.getTrashItems();
    const newItem: TrashItem = {
      day,
      deletedAt: new Date().toISOString(),
      expiresAt: getExpiryDate(),
    };

    items.unshift(newItem); // Add to top
    await this.saveTrashItems(items);
  }

  async restoreFromTrash(date: string): Promise<JournalDay | null> {
    if (typeof window === "undefined") {
      return null;
    }

    const items = await this.getTrashItems();
    const itemIndex = items.findIndex(item => item.day.date === date);

    if (itemIndex === -1) return null;

    const item = items[itemIndex];
    items.splice(itemIndex, 1);
    await this.saveTrashItems(items);

    return item.day;
  }

  async permanentlyDelete(date: string): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    const items = await this.getTrashItems();
    const filtered = items.filter(item => item.day.date !== date);
    await this.saveTrashItems(filtered);
  }

  async emptyTrash(): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.removeItem(TRASH_KEY);
  }

  async getTrashCount(): Promise<number> {
    const items = await this.getTrashItems();
    return items.length;
  }

  private async saveTrashItems(items: TrashItem[]): Promise<void> {
    if (items.length === 0) {
      localStorage.removeItem(TRASH_KEY);
    } else {
      localStorage.setItem(TRASH_KEY, JSON.stringify(items));
    }
  }

  async restoreEntryToStorage(entry: JournalEntry): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    const key = `journal:${entry.date}`;
    const existingData = localStorage.getItem(key);
    const existingEntries: JournalEntry[] = existingData ? JSON.parse(existingData) : [];

    const exists = existingEntries.some(e => e.id === entry.id);
    if (!exists) {
      existingEntries.push(entry);
      existingEntries.sort((a, b) => a.hour - b.hour);
      localStorage.setItem(key, JSON.stringify(existingEntries));
    }
  }
}
