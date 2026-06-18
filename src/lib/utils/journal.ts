import type { JournalDay, Mood } from "@/lib/types/journal";

export type DayPreview = {
  text: string;
  mood?: Mood;
};

export function getDayPreview(day: JournalDay): DayPreview | null {
  const entries = day.entries
    .filter((entry) => entry.content.trim().length > 0)
    .sort((a, b) => a.hour - b.hour);

  const entry = entries[0];
  if (!entry) return null;

  const text = entry.content.trim().replace(/\s+/g, " ");

  return {
    text,
    mood: entry.mood,
  };
}