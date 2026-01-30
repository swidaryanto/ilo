"use client";

import { useEffect, useState } from "react";
import { LocalStorageAdapter } from "@/lib/storage/local-storage-adapter";
import type { JournalDay } from "@/lib/types/journal";
import { formatDate, formatDateDisplay } from "@/lib/utils/date";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { IconTrash, IconList, IconLayoutGrid } from "@tabler/icons-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Link from "next/link";

import { useRouter } from "next/navigation";
import React from "react";

const storage = new LocalStorageAdapter();

export default function NotesPage() {
  const router = useRouter();
  const [days, setDays] = useState<JournalDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDateToDelete, setSelectedDateToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  // Calculate days in current month for calendar view
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysLeftInMonth = daysInMonth - today.getDate();
  const percentLeft = Math.round((daysLeftInMonth / daysInMonth) * 100);

  const loadAllDays = async () => {
    setLoading(true);
    try {
      const allDays = await storage.getAllDays();
      // Only keep days where at least one entry has text content
      const filteredDays = allDays.filter(day =>
        day.entries.some(entry => entry.content.trim().length > 0)
      );
      setDays(filteredDays);
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
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  // Calendar View Component
  const CalendarView = () => (
    <div className="flex flex-col items-center justify-between flex-1 py-12 w-full max-w-full">
      <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-11 lg:grid-cols-13 gap-4 md:gap-6 w-full px-6 place-items-center">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayNum = i + 1;
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const hasEntry = days.some(d => d.date === dateStr);
          const isToday = dayNum === today.getDate();

          return (
            <button
              key={dayNum}
              onClick={() => hasEntry && router.push(`/notes/${dateStr}`)}
              className={`w-[15px] h-[15px] rounded-full transition-all duration-500 ease-in-out relative group ${hasEntry
                ? "bg-orange-500 hover:scale-115 cursor-pointer shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                : "bg-muted-foreground/15 cursor-default"
                } ${isToday ? "ring-2 ring-orange-500/40 ring-offset-2" : ""}`}
              title={hasEntry ? `Note for ${formatDateDisplay(dateStr)}` : undefined}
            >
              {hasEntry && (
                <span className="absolute inset-0 rounded-full animate-pulse bg-orange-500/20 group-hover:block hidden" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-16 text-center">
        <div className="text-sm font-medium text-orange-500/80">
          {daysLeftInMonth}d left
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-screen max-w-4xl mx-auto overflow-hidden">
        {/* Header Section */}
        <div className="shrink-0 pt-12 pb-4 px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Resume Journal
            </Link>
          </div>

          {/* Mode Selection Toggle */}
          <div className="flex justify-end mt-6">
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl ring-1 ring-border/50">
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-lg transition-all ${viewMode === 'list'
                  ? 'bg-background shadow-sm text-foreground ring-1 ring-border/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
                  }`}
                onClick={() => setViewMode('list')}
              >
                <IconList stroke={1.5} className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-lg transition-all ${viewMode === 'calendar'
                  ? 'bg-background shadow-sm text-foreground ring-1 ring-border/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
                  }`}
                onClick={() => setViewMode('calendar')}
              >
                <IconLayoutGrid stroke={1.5} className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 min-h-0 flex flex-col mt-4">
          {viewMode === 'list' ? (
            days.length === 0 ? (
              <div className="flex-1 flex items-center justify-center px-6">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg">No notes yet</p>
                  <p className="text-sm mt-2">Start writing in your journal to see notes here</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-1 px-6 pb-12">
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
                            <IconTrash stroke={1.5} className="h-5 w-5" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )
          ) : (
            <CalendarView />
          )}
        </div>
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
