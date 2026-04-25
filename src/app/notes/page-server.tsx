import { auth } from "@/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { JournalDay, JournalEntry } from "@/lib/types/journal";
import NotesPage from "./page-client";

export default async function NotesPageServer() {
  const session = await auth();
  let initialDays: JournalDay[] = [];

  if (session?.user?.id) {
    const db = createServerSupabaseClient();
    const { data } = await db
      .from("journal_entries")
      .select("*")
      .eq("user_id", session.user.id)
      .order("date", { ascending: false })
      .order("hour", { ascending: true });

    const dayMap = new Map<string, JournalEntry[]>();
    for (const row of data ?? []) {
      const entry: JournalEntry = {
        id: row.id, date: row.date, hour: row.hour, content: row.content,
        mood: row.mood ?? undefined, createdAt: row.created_at, updatedAt: row.updated_at,
      };
      const existing = dayMap.get(row.date) ?? [];
      existing.push(entry);
      dayMap.set(row.date, existing);
    }

    initialDays = Array.from(dayMap.entries())
      .map(([date, entries]) => ({ date, entries }))
      .filter(d => d.entries.some(e => e.content.trim().length > 0))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  return <NotesPage initialDays={initialDays} />;
}
