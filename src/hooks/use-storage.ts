"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

import type { JournalStorage, SyncStatus } from "@/lib/storage/journal-storage";
import type { TrashStorageInterface } from "@/lib/storage/trash-storage-interface";

import { isSyncableJournalStorage } from "@/lib/storage/journal-storage";
import {
  getJournalStorage,
  getTrashStorage,
} from "@/lib/storage/storage-factory";
import {
  SYNC_STATUS_EVENT,
  type SyncStatusEventDetail,
} from "@/lib/storage/supabase-adapter";

export function useStorage(): {
  storage: JournalStorage;
  trashStorage: TrashStorageInterface;
  isAuthenticated: boolean;
  isLoading: boolean;
  syncStatus: SyncStatus;
} {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && session !== null;
  const isLoading = status === "loading";
  const userId = session?.user?.id;
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");

  const storage = useMemo(() => getJournalStorage(userId), [userId]);

  const trashStorage = useMemo(
    () => getTrashStorage(isAuthenticated),
    [isAuthenticated]
  );

  useEffect(() => {
    if (!userId || !isSyncableJournalStorage(storage)) {
      setSyncStatus("synced");
      return;
    }

    setSyncStatus(storage.getSyncStatus());

    const handleSyncStatus = (event: Event) => {
      const detail = (event as CustomEvent<SyncStatusEventDetail>).detail;
      if (detail.userId === userId) setSyncStatus(detail.status);
    };
    const handleOnline = () => void storage.syncPending();
    const handleOffline = () => setSyncStatus("offline");

    window.addEventListener(SYNC_STATUS_EVENT, handleSyncStatus);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    void storage.syncPending();

    return () => {
      window.removeEventListener(SYNC_STATUS_EVENT, handleSyncStatus);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [storage, userId]);

  return {
    storage,
    trashStorage,
    isAuthenticated,
    isLoading,
    syncStatus,
  };
}
