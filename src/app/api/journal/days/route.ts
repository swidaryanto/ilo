import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { JournalDay, JournalEntry, Mood } from "@/lib/types/journal";

type EntryRow = {
  id: string;
  date: string;
  hour: number;
  content: string;
  mood: Mood | null;
  created_at: string;
  updated_at: string;
};

export async function GET() {
  try {
    const session = await getRequiredSession();
    const db = createServerSupabaseClient();

    const { data, error } = await db
      .from("journal_entries")
      .select("*")
      .eq("user_id", session.user.id)
      .order("date", { ascending: false })
      .order("hour", { ascending: true });

    if (error) throw error;

    const dayMap = new Map<string, JournalEntry[]>();
    for (const row of (data as EntryRow[]) ?? []) {
      const entry: JournalEntry = {
        id: row.id,
        date: row.date,
        hour: row.hour,
        content: row.content,
        mood: row.mood ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
      const existing = dayMap.get(row.date) ?? [];
      existing.push(entry);
      dayMap.set(row.date, existing);
    }

    const days: JournalDay[] = Array.from(dayMap.entries())
      .map(([date, entries]) => ({ date, entries }))
      .sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({ days });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to load days" }, { status: 500 });
  }
}
