import type { JournalStorage } from "./journal-storage";
import type { JournalEntry, JournalDay } from "@/lib/types/journal";

export class SupabaseAdapter implements JournalStorage {
  async getEntries(date: string): Promise<JournalEntry[]> {
    const res = await fetch(`/api/journal/${date}`);
    if (!res.ok) throw new Error(`Failed to load entries for ${date}`);
    const data = (await res.json()) as { entries: JournalEntry[] };
    return data.entries;
  }

  async saveEntry(entry: JournalEntry): Promise<void> {
    const res = await fetch(`/api/journal/${entry.date}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error("Failed to save entry");
  }

  async deleteEntry(id: string, date: string): Promise<void> {
    const res = await fetch(
      `/api/journal/${date}?entryId=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    if (!res.ok) throw new Error("Failed to delete entry");
  }

  async restoreEntry(entry: JournalEntry): Promise<void> {
    await this.saveEntry(entry);
  }

  async deleteDay(date: string): Promise<void> {
    const res = await fetch(`/api/journal/${date}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete day");
  }

  async getDay(date: string): Promise<JournalDay | null> {
    const entries = await this.getEntries(date);
    if (entries.length === 0) return null;
    return { date, entries };
  }

  async getAllDays(): Promise<JournalDay[]> {
    const res = await fetch("/api/journal/days");
    if (!res.ok) throw new Error("Failed to load all days");
    const data = (await res.json()) as { days: JournalDay[] };
    return data.days;
  }
}
