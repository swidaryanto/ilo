"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { LocalStorageAdapter } from "@/lib/storage/local-storage-adapter";
import type { JournalDay } from "@/lib/types/journal";
import { formatDate, formatDateDisplay, formatDateShortDisplay } from "@/lib/utils/date";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { IconTrash, IconList, IconLayoutGrid } from "@tabler/icons-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Link from "next/link";

import { useRouter } from "next/navigation";
import React from "react";

const SWIPE_ACTION_WIDTH = 80;
const SWIPE_THRESHOLD = 40;
const VELOCITY_THRESHOLD = 0.4;
const DEAD_ZONE = 10;

const storage = new LocalStorageAdapter();

export default function NotesPage() {
  const router = useRouter();
  const [days, setDays] = useState<JournalDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDateToDelete, setSelectedDateToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
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
    locked: boolean | null; // null = undecided, true = horizontal, false = vertical
    startTime: number;
    lastX: number;
    lastTime: number;
  } | null>(null);
  const openSwipeDate = useRef<string | null>(null);
  // Calculate days in current month for calendar view
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysLeftInMonth = daysInMonth - today.getDate();
  const percentLeft = Math.round((daysLeftInMonth / daysInMonth) * 100);
  const currentDateDisplay = formatDateShortDisplay(formatDate(today));
  const daysLeftLabel = `${currentDateDisplay} • ${daysLeftInMonth}d left`;

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

  // Swipe hint — show on every page load, animated via direct DOM manipulation
  useEffect(() => {
    const link = linkRef.current;
    const hint = hintRef.current;
    if (!link || !hint) return;

    // Phase 1: after 1.5s, crossfade "Resume Journal" → "Swipe left to delete"
    const t1 = setTimeout(() => {
      link.style.opacity = '0';
      link.style.transform = 'translateY(-8px)';
      hint.style.opacity = '1';
      hint.style.transform = 'translateY(0)';
    }, 1500);

    // Phase 2: after 4.5s, crossfade back
    const t2 = setTimeout(() => {
      link.style.opacity = '1';
      link.style.transform = 'translateY(0)';
      hint.style.opacity = '0';
      hint.style.transform = 'translateY(8px)';
    }, 4500);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loading]);

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
      openSwipeDate.current = null;
    }
  };

  // Show/hide the red background for a given date
  const showBg = useCallback((date: string) => {
    const bg = bgRefs.current[date];
    if (bg) bg.style.visibility = 'visible';
  }, []);

  const hideBg = useCallback((date: string) => {
    const bg = bgRefs.current[date];
    if (bg) bg.style.visibility = 'hidden';
  }, []);

  // Animate an element's transform with spring-like easing
  const animateSwipe = useCallback((el: HTMLDivElement, targetX: number, onDone?: () => void) => {
    el.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    el.style.transform = `translateX(${targetX}px)`;
    const handler = () => {
      el.style.transition = '';
      el.removeEventListener('transitionend', handler);
      onDone?.();
    };
    el.addEventListener('transitionend', handler);
  }, []);

  // Close any previously open swipe
  const closeOpenSwipe = useCallback((exceptDate?: string) => {
    const prev = openSwipeDate.current;
    if (prev && prev !== exceptDate) {
      const el = swipeRefs.current[prev];
      if (el) animateSwipe(el, 0, () => hideBg(prev));
      openSwipeDate.current = null;
    }
  }, [animateSwipe, hideBg]);

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

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const swipe = activeSwipe.current;
    if (!swipe) return;

    const touch = e.touches[0];
    const dx = touch.clientX - swipe.startX;
    const dy = touch.clientY - swipe.startY;

    // Decide direction lock within the dead zone
    if (swipe.locked === null) {
      if (Math.abs(dx) < DEAD_ZONE && Math.abs(dy) < DEAD_ZONE) return;
      swipe.locked = Math.abs(dx) > Math.abs(dy);
      if (!swipe.locked) {
        // Vertical scroll — bail out
        activeSwipe.current = null;
        return;
      }
      // Close any other open swipe when starting a new one
      closeOpenSwipe(swipe.date);
      // Show the red background for this item
      showBg(swipe.date);
    }

    // Track velocity
    swipe.lastX = touch.clientX;
    swipe.lastTime = Date.now();

    const el = swipeRefs.current[swipe.date];
    if (!el) return;

    // Calculate offset: negative = swiped left
    const isAlreadyOpen = openSwipeDate.current === swipe.date;
    const baseOffset = isAlreadyOpen ? -SWIPE_ACTION_WIDTH : 0;
    let offset = baseOffset + dx;

    // Clamp: don't allow right swipe past 0
    if (offset > 0) offset = 0;

    // Rubber-band resistance past the action width
    if (offset < -SWIPE_ACTION_WIDTH) {
      const over = -offset - SWIPE_ACTION_WIDTH;
      offset = -(SWIPE_ACTION_WIDTH + over * 0.3);
    }

    el.style.transition = 'none';
    el.style.transform = `translateX(${offset}px)`;
    swipe.currentX = touch.clientX;
  }, [closeOpenSwipe, showBg]);

  const onTouchEnd = useCallback((date: string) => {
    const swipe = activeSwipe.current;
    activeSwipe.current = null;
    if (!swipe || swipe.locked !== true) return;

    const el = swipeRefs.current[date];
    if (!el) return;

    const dx = swipe.currentX - swipe.startX;
    const dt = Math.max(1, swipe.lastTime - swipe.startTime);
    const velocity = Math.abs(dx) / dt; // px/ms
    const isAlreadyOpen = openSwipeDate.current === date;
    const totalOffset = (isAlreadyOpen ? -SWIPE_ACTION_WIDTH : 0) + dx;

    // Fast flick left or past threshold = open/trigger
    const shouldOpen = totalOffset < -SWIPE_THRESHOLD || (velocity > VELOCITY_THRESHOLD && dx < 0);
    // Fast flick right or within threshold = close
    const shouldClose = !shouldOpen || (velocity > VELOCITY_THRESHOLD && dx > 0);

    if (shouldOpen && !shouldClose) {
      // If swiped well past the action width with velocity, auto-trigger delete
      if (totalOffset < -(SWIPE_ACTION_WIDTH * 1.2) || (velocity > 0.8 && dx < -SWIPE_ACTION_WIDTH)) {
        animateSwipe(el, 0, () => {
          openSwipeDate.current = null;
          hideBg(date);
        });
        setSelectedDateToDelete(date);
        setDeleteDialogOpen(true);
      } else {
        // Snap to open position
        animateSwipe(el, -SWIPE_ACTION_WIDTH);
        openSwipeDate.current = date;
      }
    } else {
      // Snap closed
      animateSwipe(el, 0, () => hideBg(date));
      openSwipeDate.current = null;
    }
  }, [animateSwipe, hideBg]);

  if (loading) {
    return (
      <div className="flex items-center justify-center size-full h-screen">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  // Calendar View Component
  const CalendarView = () => (
    <div className="flex flex-col items-center flex-1 py-3 w-full max-w-full">
      <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-11 lg:grid-cols-13 gap-x-4 gap-y-6 md:gap-6 w-full px-6 place-items-center">
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
              {isToday && (
                <span className="absolute inset-[-4px] rounded-full bg-orange-500/20 animate-ping [animation-duration:2.5s]" />
              )}
              {hasEntry && (
                <span className="absolute inset-0 rounded-full animate-pulse bg-orange-500/20 group-hover:block hidden" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-screen max-w-4xl mx-auto overflow-hidden">
        {/* Header Section */}
        <div className="shrink-0 pt-12 pb-4 px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-[20px] md:text-[25px] font-normal italic tracking-tight font-[family-name:var(--font-instrument-serif)]">Ilo Journal</h1>
            <div className="relative">
              <Link
                ref={linkRef}
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground font-medium block"
                style={{ transition: 'opacity 0.5s ease, transform 0.5s ease' }}
              >
                Resume Journal
              </Link>
              <span
                ref={hintRef}
                className="absolute top-0 right-0 h-full text-xs text-muted-foreground/60 italic font-medium flex items-center pointer-events-none whitespace-nowrap"
                style={{ opacity: 0, transform: 'translateY(8px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}
              >
                <span className="md:hidden">Swipe left to delete</span>
                <span className="hidden md:inline">Hover the date to delete</span>
              </span>
            </div>
          </div>

          {/* Mode Selection Toggle */}
          {/* Mode Selection Toggle */}
          <div className="flex items-center gap-4 mt-3">
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
            {viewMode === 'calendar' && (
              <p className="text-[11px] text-muted-foreground/45 tracking-wide italic">
                Orange dots mark days with captured notes
              </p>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 min-h-0 flex flex-col mt-3 pb-6 md:pb-8">
          <div className="flex-1 min-h-0">
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
                  <div className="flex flex-col gap-2 md:gap-0 px-6 pb-12">
                    {days.map((day) => {
                      const isToday = day.date === formatDate(new Date());

                      return (
                        <div
                          key={day.date}
                          className="relative overflow-hidden -mx-2 rounded-[4px]"
                          onClick={() => {
                            if (openSwipeDate.current === day.date) {
                              const el = swipeRefs.current[day.date];
                              if (el) animateSwipe(el, 0, () => hideBg(day.date));
                              openSwipeDate.current = null;
                            }
                          }}
                        >
                          {/* Red delete background - hidden by default, shown via JS during swipe */}
                          {!isToday && (
                            <div
                              ref={(el) => { bgRefs.current[day.date] = el; }}
                              className="absolute right-0 top-0 bottom-0 w-[80px] bg-destructive flex items-center justify-center rounded-r-[4px] md:hidden"
                              style={{ visibility: 'hidden' }}
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

                          {/* Content layer - swipeable on mobile */}
                          <div
                            ref={(el) => { swipeRefs.current[day.date] = el; }}
                            className="group flex items-center justify-between py-1 px-2 bg-background md:hover:bg-accent/35 relative rounded-[4px]"
                            onTouchStart={(e) => !isToday && onTouchStart(e, day.date)}
                            onTouchMove={(e) => !isToday && onTouchMove(e)}
                            onTouchEnd={() => !isToday && onTouchEnd(day.date)}
                          >
                            <Link
                              href={`/notes/${day.date}`}
                              className="flex-1 text-sm md:text-xl font-semibold hover:text-muted-foreground transition-colors py-2"
                              onClick={(e) => {
                                if (openSwipeDate.current === day.date) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              {formatDateDisplay(day.date)}
                            </Link>
                            {isToday ? (
                              <span className="text-sm font-medium text-muted-foreground/40 px-3 select-none">
                                Today
                              </span>
                            ) : (
                              /* Desktop delete button - only visible on hover on md+ screens */
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
          <div className="mt-6 text-center">
            <div className="text-sm font-medium text-orange-500/80">
              {daysLeftLabel}
            </div>
          </div>
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
