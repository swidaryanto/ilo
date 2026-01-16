"use client";

import { useEffect, useState } from "react";
import { LocalStorageAdapter } from "@/lib/storage/local-storage-adapter";
import type { JournalDay } from "@/lib/types/journal";
import { formatDate, formatDateDisplay } from "@/lib/utils/date";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { IconTrash } from "@tabler/icons-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Link from "next/link";

const storage = new LocalStorageAdapter();

export default function NotesPage() {
  const [days, setDays] = useState<JournalDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDateToDelete, setSelectedDateToDelete] = useState<string | null>(null);

  const loadAllDays = async () => {
    setLoading(true);
    try {
      const allDays = await storage.getAllDays();
      setDays(allDays);
    } catch (error) {
      console.error("Failed to load days:", error);
      setDays([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllDays();
  }, []);

  const handleDeleteClick = (e: React.MouseEvent, date: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedDateToDelete(date);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedDateToDelete) {
      await storage.deleteDay(selectedDateToDelete);
      await loadAllDays();
      setSelectedDateToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center size-full h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="flex flex-col h-screen max-w-4xl mx-auto overflow-hidden">
        <div className="shrink-0 py-12">
          <div className="flex items-center justify-between px-6">
            <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Journal
            </Link>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center text-muted-foreground">
            <p className="text-lg">No notes yet</p>
            <p className="text-sm mt-2">
              Start writing in your journal to see notes here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-screen max-w-4xl mx-auto overflow-hidden">
        <div className="shrink-0 py-12">
          <div className="flex items-center justify-between px-6">
            <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Resume Journal
            </Link>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="flex flex-col gap-1 px-6 pb-6">
            {days.map((day) => {
              const isToday = day.date === formatDate(new Date());
              return (
                <div key={day.date} className="group flex items-center justify-between py-1 px-2 -mx-2 rounded-lg hover:bg-accent/35 transition-all">
                  <Link
                    href={`/notes/${day.date}`}
                    className="flex-1 text-xl font-semibold hover:text-muted-foreground transition-colors py-2"
                  >
                    {formatDateDisplay(day.date)}
                  </Link>
                  {isToday ? (
                    <span className="text-sm font-medium text-muted-foreground/40 px-3 select-none">
                      Today
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteClick(e, day.date)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <IconTrash className="h-5 w-5" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        description="Are you sure you want to delete this journal entry?"
      />
    </>
  );
}


