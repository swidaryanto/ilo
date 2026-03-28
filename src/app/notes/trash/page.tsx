"use client";

import { useEffect, useState } from "react";
import { TrashStorage, type TrashItem } from "@/lib/storage/trash-storage";
import { formatDateDisplay } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { IconTrash, IconRotate2, IconArrowLeft, IconAlertTriangle } from "@tabler/icons-react";
import { useToast } from "@/components/ui/toast";
import { MoodBadge } from "@/components/mood-selector";
import type { Mood } from "@/lib/types/journal";
import Link from "next/link";
import { useRouter } from "next/navigation";

const storage = new TrashStorage();

export default function TrashPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const loadTrash = async () => {
    setLoading(true);
    const items = await storage.getTrashItems();
    setTrashItems(items);
    setLoading(false);
  };

  useEffect(() => {
    loadTrash();
  }, []);

  const handleRestore = async (date: string) => {
    const item = trashItems.find(i => i.day.date === date);
    if (!item) return;

    // Restore all entries from this day
    for (const entry of item.day.entries) {
      await storage.restoreEntryToStorage(entry);
    }

    // Remove from trash
    await storage.permanentlyDelete(date);
    await loadTrash();

    addToast({
      message: "Entry restored",
      type: "success",
      duration: 3000,
    });
  };

  const handlePermanentDelete = (date: string) => {
    setPendingDelete(date);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    await storage.permanentlyDelete(pendingDelete);
    await loadTrash();
    setPendingDelete(null);

    addToast({
      message: "Entry permanently deleted",
      type: "info",
      duration: 3000,
    });
  };

  const handleEmptyTrash = async () => {
    await storage.emptyTrash();
    await loadTrash();

    addToast({
      message: "Trash emptied",
      type: "info",
      duration: 3000,
    });
  };

  const getDaysUntilExpiry = (item: TrashItem): number => {
    const expires = new Date(item.expiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center size-full h-screen">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="shrink-0 pt-12 pb-4 px-6">
        <div className="flex items-center gap-4">
          <Link href="/notes">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <IconArrowLeft stroke={1.5} className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-[20px] md:text-[25px] font-normal italic tracking-tight font-[family-name:var(--font-instrument-serif)]">
              Trash
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {trashItems.length === 0 
                ? "No deleted entries" 
                : `${trashItems.length} item${trashItems.length !== 1 ? 's' : ''} • Auto-deleted after 30 days`
              }
            </p>
          </div>
          {trashItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEmptyTrash}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <IconTrash stroke={1.5} className="h-4 w-4 mr-1" />
              Empty
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
        {trashItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center h-full text-center py-12">
            {/* Illustration */}
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-900/20 flex items-center justify-center">
                <IconTrash className="w-8 h-8 text-blue-500 dark:text-blue-400" stroke={1.5} />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-400/60" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-cyan-400/60" />
              <div className="absolute top-1/2 -right-3 w-1.5 h-1.5 rounded-full bg-sky-400/40" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Trash is empty
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed">
              Deleted notes will appear here for 30 days before being permanently removed.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {trashItems.map((item) => {
              const daysLeft = getDaysUntilExpiry(item);
              const uniqueMoods = [...new Set(item.day.entries.map(e => e.mood).filter(Boolean))] as Mood[];
              const entryCount = item.day.entries.filter(e => e.content.trim().length > 0).length;

              return (
                <div
                  key={item.day.date}
                  className={`group flex items-center justify-between py-3 px-3 bg-background hover:bg-accent/35 relative rounded-[4px] transition-colors ${pendingDelete === item.day.date ? 'opacity-50' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/notes/${item.day.date}`}
                      className="text-sm md:text-xl font-semibold hover:text-muted-foreground transition-colors"
                    >
                      {formatDateDisplay(item.day.date)}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      {uniqueMoods.length > 0 && (
                        <span className="flex items-center gap-1">
                          {uniqueMoods.slice(0, 3).map((mood, i) => (
                            <MoodBadge key={i} mood={mood} />
                          ))}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className={`text-xs ${daysLeft <= 7 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                        {daysLeft <= 7 
                          ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` 
                          : `Expires in ${daysLeft} days`
                        }
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRestore(item.day.date)}
                      className="h-9 w-9 text-muted-foreground hover:text-green-600 hover:bg-green-600/10"
                      disabled={pendingDelete !== null}
                    >
                      <IconRotate2 stroke={1.5} className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePermanentDelete(item.day.date)}
                      className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      disabled={pendingDelete !== null}
                    >
                      <IconTrash stroke={1.5} className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      {pendingDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-background rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <IconAlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Permanently delete?</h3>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. This entry will be permanently removed from your trash.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPendingDelete(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
