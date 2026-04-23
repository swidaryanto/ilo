import { LocalStorageAdapter } from "./local-storage-adapter";
import { SupabaseAdapter } from "./supabase-adapter";
import { TrashStorage } from "./trash-storage";
import { SupabaseTrashStorage } from "./supabase-trash-storage";
import type { JournalStorage } from "./journal-storage";
import type { TrashStorageInterface } from "./trash-storage-interface";

export function getJournalStorage(isAuthenticated: boolean): JournalStorage {
  return isAuthenticated ? new SupabaseAdapter() : new LocalStorageAdapter();
}

export function getTrashStorage(isAuthenticated: boolean): TrashStorageInterface {
  return isAuthenticated ? new SupabaseTrashStorage() : new TrashStorage();
}
