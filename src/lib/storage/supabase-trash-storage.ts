import type { TrashStorageInterface } from "./trash-storage-interface";
import type { TrashItem } from "./trash-storage";
import type { JournalDay, JournalEntry } from "@/lib/types/journal";

export class SupabaseTrashStorage implements TrashStorageInterface {
  async getTrashItems(): Promise<TrashItem[]> {
    const res = await fetch("/api/journal/trash");
    if (!res.ok) throw new Error("Failed to load trash");
    const data = (await res.json()) as { items: TrashItem[] };
    return data.items;
  }

  async addToTrash(day: JournalDay): Promise<void> {
    const res = await fetch("/api/journal/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", day }),
    });
    if (!res.ok) throw new Error("Failed to add to trash");
  }

  async restoreFromTrash(date: string): Promise<JournalDay | null> {
    const items = await this.getTrashItems();
    const item = items.find((i) => i.day.date === date);
    if (!item) return null;

    const res = await fetch("/api/journal/trash", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore", date }),
    });
    if (!res.ok) throw new Error("Failed to restore from trash");

    return item.day;
  }

  async permanentlyDelete(date: string): Promise<void> {
    const res = await fetch("/api/journal/trash", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "permanentDelete", date }),
    });
    if (!res.ok) throw new Error("Failed to permanently delete");
  }

  async emptyTrash(): Promise<void> {
    const res = await fetch("/api/journal/trash", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "emptyTrash" }),
    });
    if (!res.ok) throw new Error("Failed to empty trash");
  }

  async getTrashCount(): Promise<number> {
    const items = await this.getTrashItems();
    return items.length;
  }

  async restoreEntryToStorage(entry: JournalEntry): Promise<void> {
    const res = await fetch(`/api/journal/${entry.date}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error("Failed to restore entry");
  }
}
