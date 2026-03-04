"use client";

import { useState, useEffect, useCallback } from "react";
import { LocalStorageAdapter } from "@/lib/storage/local-storage-adapter";
import { formatDate } from "@/lib/utils/date";

interface StreakData {
  currentStreak: number;
  isFirstEntryToday: boolean;
  hasShownCelebration: boolean;
}

const STORAGE_KEY = "streak:celebration";

export function useStreak() {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    isFirstEntryToday: false,
    hasShownCelebration: false,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadStreak() {
      const storage = new LocalStorageAdapter();
      const allDays = await storage.getAllDays();
      const today = formatDate(new Date());

      // Calculate current streak
      let currentStreak = 0;
      const sortedDays = allDays
        .filter(day => day.entries.some(e => e.content.trim().length > 0))
        .map(day => day.date)
        .sort((a, b) => b.localeCompare(a));

      // Check consecutive days backwards from today
      let checkDate = new Date(today);
      for (const date of sortedDays) {
        const expectedDate = formatDate(checkDate);
        if (date === expectedDate) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (date < expectedDate) {
          // Gap found, streak broken
          break;
        }
      }

      // Check if we've already shown celebration today
      const celebrationData = localStorage.getItem(STORAGE_KEY);
      let hasShownCelebration = false;
      if (celebrationData) {
        try {
          const parsed = JSON.parse(celebrationData);
          if (parsed.date === today) {
            hasShownCelebration = parsed.shown;
          }
        } catch {
          // Ignore parse errors
        }
      }

      // Check if this would be first entry today
      const todayEntries = allDays.find(day => day.date === today);
      const hasEntriesToday = todayEntries?.entries.some(e => e.content.trim().length > 0) ?? false;
      const isFirstEntryToday = !hasEntriesToday && !hasShownCelebration;

      setStreakData({
        currentStreak,
        isFirstEntryToday,
        hasShownCelebration,
      });
      setLoaded(true);
    }

    loadStreak();
  }, []);

  const markCelebrationShown = useCallback(() => {
    const today = formatDate(new Date());
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      date: today,
      shown: true,
    }));
    setStreakData(prev => ({
      ...prev,
      hasShownCelebration: true,
      isFirstEntryToday: false,
    }));
  }, []);

  return {
    ...streakData,
    markCelebrationShown,
    loaded,
  };
}
