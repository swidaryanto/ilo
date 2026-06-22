"use client";

import {
  IconTrash,
  IconList,
  IconLayoutGrid,
  IconDotsVertical,
  IconSun,
  IconMoon,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useCallback, useState } from "react";
import React from "react";

import type { JournalDay, JournalEntry } from "@/lib/types/journal";

import { AuthButton } from "@/components/auth/auth-button";
import { EmptyState } from "@/components/empty-state";
import { BrailleLoader } from "@/components/ui/braille-spinner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/toast";
import { useStorage } from "@/hooks/use-storage";
import {
  formatDate,
  formatDateDisplay,
  formatDateShortDisplay,
} from "@/lib/utils/date";
import { getDayPreview } from "@/lib/utils/journal";

const SWIPE_ACTION_WIDTH = 80;
const SWIPE_THRESHOLD = 40;
const VELOCITY_THRESHOLD = 0.4;
const DEAD_ZONE = 10;

type TooltipData = {
  text: string;
  entryCount: number;
  x: number;
  y: number;
  isCalendar?: boolean;
};

export default function NotesPage({
  initialDays,
}: {
  initialDays?: JournalDay[];
}) {
  const router = useRouter();
  const { addToast } = useToast();
  const { setTheme, theme } = useTheme();
  const {
    storage,
    trashStorage,
    isLoading: storageLoading,
    syncStatus,
  } = useStorage();
  const { data: session } = useSession();
  const isDark = theme === "dark";
  const [days, setDays] = useState<JournalDay[]>(initialDays ?? []);
  const [loading, setLoading] = useState(!initialDays);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDateToDelete, setSelectedDateToDelete] = useState<
    string | null
  >(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [pendingDeletion, setPendingDeletion] = useState<{
    date: string;
    entries: JournalEntry[];
    timeoutId: NodeJS.Timeout;
  } | null>(null);
  const [trashCount, setTrashCount] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  // Swipe refs — no re-renders during gesture
  const swipeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const bgRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const activeSwipe = useRef<{
    date: string;
    startX: number;
    startY: number;
    currentX: number;
    locked: boolean | null;
    startTime: number;
    lastX: number;
    lastTime: number;
  } | null>(null);
  const openSwipeDate = useRef<string | null>(null);
  const previousSyncStatus = useRef(syncStatus);
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDateDisplay = formatDateShortDisplay(formatDate(today));

  const loadAllDays = useCallback(async () => {
    setLoading(true);
    try {
      const allDays = await storage.getAllDays();
      const filteredDays = allDays.filter((day) =>
        day.entries.some((entry) => entry.content.trim().length > 0)
      );
      setDays(filteredDays);
    } catch (error) {
      console.error("Failed to load days:", error);
      setDays([]);
    } finally {
      setLoading(false);
    }
  }, [storage]);

  const loadTrashCount = useCallback(async () => {
    const count = await trashStorage.getTrashCount();
    setTrashCount(count);
  }, [trashStorage]);

  useEffect(() => {
    if (storageLoading) return;
    loadAllDays();
    loadTrashCount();
  }, [loadAllDays, loadTrashCount, storageLoading]);

  useEffect(() => {
    const previous = previousSyncStatus.current;
    previousSyncStatus.current = syncStatus;

    if (!storageLoading && previous !== "synced" && syncStatus === "synced") {
      loadAllDays();
    }
  }, [loadAllDays, storageLoading, syncStatus]);

  useEffect(() => {
    const link = linkRef.current;
    const hint = hintRef.current;
    if (!link || !hint) return;

    const t1 = setTimeout(() => {
      link.style.opacity = "0";
      link.style.transform = "translateY(-8px)";
      hint.style.opacity = "1";
      hint.style.transform = "translateY(0)";
    }, 1500);

    const t2 = setTimeout(() => {
      link.style.opacity = "1";
      link.style.transform = "translateY(0)";
      hint.style.opacity = "0";
      hint.style.transform = "translateY(8px)";
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loading]);

  const handleDeleteClick = (e: React.MouseEvent, date: string) => {
    e.preventDefault();
    e.stopPropagation();
    startPendingDeletion(date);
  };

  const startPendingDeletion = async (date: string) => {
    const dayToDelete = days.find((d) => d.date === date);
    if (!dayToDelete) return;

    await trashStorage.addToTrash(dayToDelete);
    await storage.deleteDay(date);

    const entriesWithContent = dayToDelete.entries.filter(
      (e) => e.content.trim().length > 0
    );
    const entryCount = entriesWithContent.length;
    const entryWord = entryCount === 1 ? "entry" : "entries";

    addToast({
      message: `${entryCount} ${entryWord} deleted`,
      type: "warning",
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => handleUndoRestore(date, dayToDelete.entries),
      },
    });

    setDays((prev) => prev.filter((d) => d.date !== date));
    await loadTrashCount();
  };

  const handleUndoRestore = async (date: string, entries: JournalEntry[]) => {
    for (const entry of entries) {
      await trashStorage.restoreEntryToStorage(entry);
    }

    await trashStorage.permanentlyDelete(date);
    await loadAllDays();
    await loadTrashCount();

    addToast({
      message: "Entry restored",
      type: "success",
      duration: 3000,
    });
  };

  const handleConfirmDelete = async () => {
    if (selectedDateToDelete) {
      if (pendingDeletion?.date === selectedDateToDelete) {
        clearTimeout(pendingDeletion.timeoutId);
        setPendingDeletion(null);
      }
      await storage.deleteDay(selectedDateToDelete);
      await loadAllDays();
      setSelectedDateToDelete(null);
      openSwipeDate.current = null;
    }
  };

  const showBg = useCallback((date: string) => {
    const bg = bgRefs.current[date];
    if (bg) bg.style.visibility = "visible";
  }, []);

  const hideBg = useCallback((date: string) => {
    const bg = bgRefs.current[date];
    if (bg) bg.style.visibility = "hidden";
  }, []);

  const animateSwipe = useCallback(
    (el: HTMLDivElement, targetX: number, onDone?: () => void) => {
      el.style.transition =
        "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      el.style.transform = `translateX(${targetX}px)`;
      const handler = () => {
        el.style.transition = "";
        el.removeEventListener("transitionend", handler);
        onDone?.();
      };
      el.addEventListener("transitionend", handler);
    },
    []
  );

  const closeOpenSwipe = useCallback(
    (exceptDate?: string) => {
      const prev = openSwipeDate.current;
      if (prev && prev !== exceptDate) {
        const el = swipeRefs.current[prev];
        if (el) animateSwipe(el, 0, () => hideBg(prev));
        openSwipeDate.current = null;
      }
    },
    [animateSwipe, hideBg]
  );

  const onTouchStart = useCallback((e: React.TouchEvent, date: string) => {
    const touch = e.touches[0];
    activeSwipe.current = {
      date,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      locked: null,
      startTime: Date.now(),
      lastX: touch.clientX,
      lastTime: Date.now(),
    };
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const swipe = activeSwipe.current;
      if (!swipe) return;

      const touch = e.touches[0];
      const dx = touch.clientX - swipe.startX;
      const dy = touch.clientY - swipe.startY;

      if (swipe.locked === null) {
        if (Math.abs(dx) < DEAD_ZONE && Math.abs(dy) < DEAD_ZONE) return;
        swipe.locked = Math.abs(dx) > Math.abs(dy);
        if (!swipe.locked) {
          activeSwipe.current = null;
          return;
        }
        closeOpenSwipe(swipe.date);
        showBg(swipe.date);
      }

      swipe.lastX = touch.clientX;
      swipe.lastTime = Date.now();

      const el = swipeRefs.current[swipe.date];
      if (!el) return;

      const isAlreadyOpen = openSwipeDate.current === swipe.date;
      const baseOffset = isAlreadyOpen ? -SWIPE_ACTION_WIDTH : 0;
      let offset = baseOffset + dx;

      if (offset > 0) offset = 0;

      if (offset < -SWIPE_ACTION_WIDTH) {
        const over = -offset - SWIPE_ACTION_WIDTH;
        offset = -(SWIPE_ACTION_WIDTH + over * 0.3);
      }

      el.style.transition = "none";
      el.style.transform = `translateX(${offset}px)`;
      swipe.currentX = touch.clientX;
    },
    [closeOpenSwipe, showBg]
  );

  const onTouchEnd = useCallback(
    (date: string) => {
      const swipe = activeSwipe.current;
      activeSwipe.current = null;
      if (!swipe || swipe.locked !== true) return;

      const el = swipeRefs.current[date];
      if (!el) return;

      const dx = swipe.currentX - swipe.startX;
      const dt = Math.max(1, swipe.lastTime - swipe.startTime);
      const velocity = Math.abs(dx) / dt;
      const isAlreadyOpen = openSwipeDate.current === date;
      const totalOffset = (isAlreadyOpen ? -SWIPE_ACTION_WIDTH : 0) + dx;

      const shouldOpen =
        totalOffset < -SWIPE_THRESHOLD ||
        (velocity > VELOCITY_THRESHOLD && dx < 0);
      const shouldClose =
        !shouldOpen || (velocity > VELOCITY_THRESHOLD && dx > 0);

      if (shouldOpen && !shouldClose) {
        if (
          totalOffset < -(SWIPE_ACTION_WIDTH * 1.2) ||
          (velocity > 0.8 && dx < -SWIPE_ACTION_WIDTH)
        ) {
          animateSwipe(el, 0, () => {
            openSwipeDate.current = null;
            hideBg(date);
          });
          startPendingDeletion(date);
        } else {
          animateSwipe(el, -SWIPE_ACTION_WIDTH);
          openSwipeDate.current = date;
        }
      } else {
        animateSwipe(el, 0, () => hideBg(date));
        openSwipeDate.current = null;
      }
    },
    [animateSwipe, hideBg, startPendingDeletion]
  );

  // Handle hover for tooltip — use fixed positioning outside scroll
  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, day: JournalDay) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const preview = getDayPreview(day);
      const entriesWithContent = day.entries.filter(
        (entry) => entry.content.trim().length > 0
      );
      const entryCount = entriesWithContent.length;

      if (!preview) return;

      setTooltip({
        text: preview.text,
        entryCount,
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (loading) {
    return <BrailleLoader />;
  }

  const CalendarView = () => (
    <div className="flex flex-col items-center flex-1 py-3 w-full max-w-full">
      <div className="grid w-full grid-cols-7 place-items-center gap-x-1 gap-y-2 px-6 sm:grid-cols-9 sm:gap-x-4 md:grid-cols-11 md:gap-6 lg:grid-cols-13">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayNum = i + 1;
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const hasEntry = days.some((d) => d.date === dateStr);
          const isToday = dayNum === today.getDate();

          return (
            <button
              key={dayNum}
              onClick={() => hasEntry && router.push(`/notes/${dateStr}`)}
              className={`group flex size-11 items-center justify-center rounded-full ${
                hasEntry ? "cursor-pointer" : "cursor-default"
              }`}
              aria-label={
                hasEntry
                  ? `Open note for ${formatDateDisplay(dateStr)}`
                  : `No note for day ${dayNum}`
              }
              onMouseEnter={(e) => {
                if (hasEntry) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({
                    text: `Note for ${formatDateDisplay(dateStr)}`,
                    entryCount: 0,
                    x: rect.left + rect.width / 2,
                    y: rect.bottom + 8,
                    isCalendar: true,
                  });
                }
              }}
              onMouseLeave={handleMouseLeave}
            >
              <span
                className={`relative block size-[15px] rounded-full transition-all duration-500 ease-in-out ${
                  hasEntry
                    ? "bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] group-hover:scale-115"
                    : "bg-muted-foreground/15"
                } ${isToday ? "ring-2 ring-orange-500/40 ring-offset-2" : ""}`}
              >
                {isToday && (
                  <span className="absolute inset-[-4px] animate-ping rounded-full bg-orange-500/20 [animation-duration:2.5s]" />
                )}
                {hasEntry && (
                  <span className="absolute inset-0 hidden animate-pulse rounded-full bg-orange-500/20 group-hover:block" />
                )}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground/45 tracking-wide italic mt-6 text-center">
        Orange dots mark days with captured notes
      </p>
    </div>
  );

  return (
    <>
      <div className="mx-auto flex h-dvh max-w-4xl flex-col overflow-hidden">
        {/* Header Section */}
        <div className="shrink-0 px-6 pb-4 pt-[max(3rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <h1 className="text-[16px] md:text-[22px] font-normal tracking-tight">
              Ilo Journal
            </h1>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-xl ring-1 ring-border/30">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Show list view"
                  aria-pressed={viewMode === "list"}
                  className={`h-11 w-11 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-background shadow-sm text-foreground ring-1 ring-border/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                  }`}
                  onClick={() => setViewMode("list")}
                >
                  <IconList stroke={1.5} className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Show calendar view"
                  aria-pressed={viewMode === "calendar"}
                  className={`h-11 w-11 rounded-lg transition-all ${
                    viewMode === "calendar"
                      ? "bg-background shadow-sm text-foreground ring-1 ring-border/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                  }`}
                  onClick={() => setViewMode("calendar")}
                >
                  <IconLayoutGrid stroke={1.5} className="h-5 w-5" />
                </Button>
              </div>

              <div className="md:hidden">
                <Popover>
                  <PopoverTrigger
                    aria-label="Open settings"
                    id="notes-settings-trigger"
                  >
                    <div className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg hover:bg-accent/50">
                      <IconDotsVertical className="h-5 w-5" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-44 p-1 rounded-lg">
                    <div className="flex flex-col">
                      <button
                        onClick={() => setTheme(isDark ? "light" : "dark")}
                        className="flex items-center gap-2 w-full px-2.5 py-2 rounded-md hover:bg-accent/50 transition-colors text-left"
                      >
                        {isDark ? (
                          <IconSun className="h-4 w-4" />
                        ) : (
                          <IconMoon className="h-4 w-4" />
                        )}
                        <span className="text-sm">
                          {isDark ? "Light theme" : "Dark theme"}
                        </span>
                      </button>

                      <Link href="/notes/trash">
                        <button className="flex items-center gap-2 w-full px-2.5 py-2 rounded-md hover:bg-accent/50 transition-colors text-left">
                          <div className="relative">
                            <IconTrash className="h-4 w-4" />
                            {trashCount > 0 && (
                              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                                {trashCount > 9 ? "9+" : trashCount}
                              </span>
                            )}
                          </div>
                          <span className="text-sm">Trash</span>
                        </button>
                      </Link>

                      <div className="h-px bg-border mx-2 my-0.5" />

                      <AuthButton variant="mobile" />

                      <div className="h-px bg-border mx-2 my-0.5" />

                      <div className="px-2.5 py-1.5">
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <IconInfoCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span className="text-xs leading-relaxed">
                            {session
                              ? syncStatus === "offline"
                                ? "Changes saved offline"
                                : syncStatus === "syncing"
                                  ? "Syncing changes..."
                                  : syncStatus === "error"
                                    ? "Sync paused. Changes remain on this device"
                                    : "Saved to your Google Account"
                              : "Entries save automatically as you type"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 min-h-0 flex flex-col mt-3 pb-[140px]">
          <div className="flex-1 min-h-0">
            {viewMode === "list" ? (
              days.length === 0 ? (
                <div className="flex-1 flex items-center justify-center px-6">
                  <EmptyState variant="notes" />
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="flex flex-col gap-2 md:gap-0 px-6 pb-6">
                    {days.map((day) => {
                      const isToday = day.date === formatDate(new Date());

                      return (
                        <div
                          key={day.date}
                          className="relative -mx-2 rounded-[4px]"
                          onMouseEnter={(e) =>
                            !isToday && handleMouseEnter(e, day)
                          }
                          onMouseLeave={handleMouseLeave}
                          onClick={() => {
                            if (openSwipeDate.current === day.date) {
                              const el = swipeRefs.current[day.date];
                              if (el)
                                animateSwipe(el, 0, () => hideBg(day.date));
                              openSwipeDate.current = null;
                            }
                          }}
                        >
                          {!isToday && (
                            <div
                              ref={(el) => {
                                bgRefs.current[day.date] = el;
                              }}
                              className="absolute right-0 top-0 bottom-0 w-[80px] bg-destructive flex items-center justify-center rounded-r-[4px] md:hidden"
                              style={{ visibility: "hidden" }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(e, day.date);
                                }}
                                className="text-white flex items-center justify-center w-full h-full"
                                aria-label="Delete"
                              >
                                <IconTrash stroke={1.5} className="h-5 w-5" />
                              </button>
                            </div>
                          )}

                          <div
                            ref={(el) => {
                              swipeRefs.current[day.date] = el;
                            }}
                            className="group flex items-center justify-between py-1 px-2 bg-background md:hover:bg-accent/35 relative rounded-[4px]"
                            onTouchStart={(e) =>
                              !isToday && onTouchStart(e, day.date)
                            }
                            onTouchMove={(e) => !isToday && onTouchMove(e)}
                            onTouchEnd={() => !isToday && onTouchEnd(day.date)}
                          >
                            <Link
                              href={`/notes/${day.date}`}
                              className="flex min-h-11 min-w-0 flex-1 items-center py-2 transition-colors hover:text-muted-foreground"
                              onClick={(e) => {
                                if (openSwipeDate.current === day.date) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              <span className="text-sm md:text-xl font-semibold">
                                {formatDateDisplay(day.date)}
                              </span>
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
                                className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <IconTrash stroke={1.5} className="h-5 w-5" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            )}
                          </div>
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

        {/* Fixed Bottom Footer */}
        <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-4xl border-t border-transparent bg-background/80 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-md">
          <div className="flex items-center justify-between w-full px-6 md:max-w-[492px] md:mx-auto md:px-0">
            <div className="text-[13px] font-medium text-muted-foreground">
              {currentDateDisplay}
            </div>
            <Link href="/">
              <div className="group relative flex min-h-11 items-center justify-center overflow-hidden rounded-full bg-[#1a1a1a] px-5 py-2.5 text-[13px] font-medium text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)] active:translate-y-0 active:scale-[0.96] dark:bg-[#2a2a2a]">
                <span className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                <span className="relative z-10">Resume Journal</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Fixed Tooltip - rendered outside scroll container */}
      {tooltip && (
        <div
          className="fixed z-[9999] pointer-events-none hidden md:block"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: "translateX(-50%)",
          }}
        >
          {tooltip.isCalendar ? (
            /* Calendar dot tooltip - compact */
            <div className="bg-card rounded-lg border border-border/50 px-3 py-2 shadow-lg">
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {tooltip.text}
              </p>
            </div>
          ) : (
            /* List item tooltip - bento style */
            <div className="w-72 bg-card rounded-xl border border-border/50 p-4 shadow-lg">
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {tooltip.text}
              </p>
              <div className="mt-3 pt-3 border-t border-border/30">
                <span className="text-xs text-muted-foreground">
                  {tooltip.entryCount}{" "}
                  {tooltip.entryCount === 1 ? "entry" : "entries"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        description="Are you sure you want to delete this journal entry?"
      />
    </>
  );
}
