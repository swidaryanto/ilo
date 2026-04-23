import type { JournalDay, JournalEntry } from "@/lib/types/journal";
import type { TrashItem } from "./trash-storage";

export interface TrashStorageInterface {
  getTrashItems(): Promise<TrashItem[]>;
  addToTrash(day: JournalDay): Promise<void>;
  restoreFromTrash(date: string): Promise<JournalDay | null>;
  permanentlyDelete(date: string): Promise<void>;
  emptyTrash(): Promise<void>;
  getTrashCount(): Promise<number>;
  restoreEntryToStorage(entry: JournalEntry): Promise<void>;
}
