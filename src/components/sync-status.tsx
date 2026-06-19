"use client";

import {
  IconAlertTriangle,
  IconCloudOff,
  IconRefresh,
} from "@tabler/icons-react";

import type { SyncStatus } from "@/lib/storage/journal-storage";

import { cn } from "@/lib/utils";

const statusContent = {
  offline: {
    icon: IconCloudOff,
    label: "Saved offline",
  },
  syncing: {
    icon: IconRefresh,
    label: "Syncing...",
  },
  error: {
    icon: IconAlertTriangle,
    label: "Sync paused",
  },
} as const;

export function SyncStatusIndicator({
  className,
  isAuthenticated,
  status,
}: {
  className?: string;
  isAuthenticated: boolean;
  status: SyncStatus;
}) {
  if (!isAuthenticated || status === "synced") return null;

  const content = statusContent[status];
  const Icon = content.icon;

  return (
    <span
      aria-live="polite"
      className={cn(
        "flex items-center gap-1.5 text-xs text-muted-foreground",
        status === "error" && "text-orange-600 dark:text-orange-400",
        className
      )}
      role="status"
    >
      <Icon
        aria-hidden="true"
        className={cn("size-3.5", status === "syncing" && "animate-spin")}
        stroke={1.7}
      />
      {content.label}
    </span>
  );
}
