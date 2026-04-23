"use client";

import { useEffect } from "react";
import { useMigration } from "@/hooks/use-migration";

export function MigrationBanner() {
  const { migrationState, runMigration, dismissMigration } = useMigration();

  useEffect(() => {
    if (migrationState.status === "done") {
      const timer = setTimeout(dismissMigration, 3000);
      return () => clearTimeout(timer);
    }
  }, [migrationState.status, dismissMigration]);

  if (migrationState.status === "idle" || migrationState.status === "done") {
    if (migrationState.status === "done") {
      return (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-3">
          <div className="bg-foreground text-background text-xs rounded-lg px-4 py-2 shadow-lg">
            Journal synced to cloud successfully
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-3">
      <div className="bg-background border border-border rounded-xl px-4 py-3 shadow-lg max-w-sm w-full mx-4">
        {migrationState.status === "pending" && (
          <>
            <p className="text-sm font-medium mb-1">Sync your local data to the cloud?</p>
            <p className="text-xs text-muted-foreground mb-3">
              {migrationState.dayCount} day{migrationState.dayCount !== 1 ? "s" : ""} of journal
              entries found on this device.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={runMigration}
                className="flex-1 text-xs bg-foreground text-background rounded-lg py-2 font-medium hover:opacity-90 transition-opacity"
              >
                Sync Now
              </button>
              <button
                type="button"
                onClick={dismissMigration}
                className="flex-1 text-xs border border-border rounded-lg py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Not Now
              </button>
            </div>
          </>
        )}

        {migrationState.status === "migrating" && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Syncing your journal...</p>
          </div>
        )}

        {migrationState.status === "error" && (
          <>
            <p className="text-sm font-medium text-red-500 mb-1">Sync failed</p>
            <p className="text-xs text-muted-foreground mb-3">{migrationState.message}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={runMigration}
                className="flex-1 text-xs bg-foreground text-background rounded-lg py-2 font-medium"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={dismissMigration}
                className="flex-1 text-xs border border-border rounded-lg py-2 text-muted-foreground"
              >
                Skip
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
