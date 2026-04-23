"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { getJournalStorage, getTrashStorage } from "@/lib/storage/storage-factory";
import type { JournalStorage } from "@/lib/storage/journal-storage";
import type { TrashStorageInterface } from "@/lib/storage/trash-storage-interface";

export function useStorage(): {
  storage: JournalStorage;
  trashStorage: TrashStorageInterface;
  isAuthenticated: boolean;
  isLoading: boolean;
} {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && session !== null;
  const isLoading = status === "loading";

  const storage = useMemo(
    () => getJournalStorage(isAuthenticated),
    [isAuthenticated]
  );

  const trashStorage = useMemo(
    () => getTrashStorage(isAuthenticated),
    [isAuthenticated]
  );

  return { storage, trashStorage, isAuthenticated, isLoading };
}
