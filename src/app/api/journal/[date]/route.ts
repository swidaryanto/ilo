import { type NextRequest, NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { JournalEntry, Mood } from "@/lib/types/journal";

type RouteContext = { params: Promise<{ date: string }> };

type EntryRow = {
  id: string;
  date: string;
  hour: number;
  content: string;
  mood: Mood | null;
  created_at: string;
  updated_at: string;
};

function rowToEntry(row: EntryRow): JournalEntry {
  return {
    id: row.id,
    date: row.date,
    hour: row.hour,
    content: row.content,
    mood: row.mood ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getRequiredSession();
    const { date } = await params;
    const db = createServerSupabaseClient();

    const { data, error } = await db
      .from("journal_entries")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("date", date)
      .order("hour", { ascending: true });

    if (error) throw error;

    const entries: JournalEntry[] = ((data as EntryRow[]) ?? []).map(rowToEntry);
    return NextResponse.json({ entries });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to load entries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getRequiredSession();
    const { date } = await params;
    const entry = (await req.json()) as JournalEntry;
    const db = createServerSupabaseClient();

    const { error } = await db.from("journal_entries").upsert(
      {
        id: entry.id,
        user_id: session.user.id,
        date,
        hour: entry.hour,
        content: entry.content,
        mood: entry.mood ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id,user_id" }
    );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to save entry" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getRequiredSession();
    const { date } = await params;
    const db = createServerSupabaseClient();
    const entryId = req.nextUrl.searchParams.get("entryId");

    if (entryId) {
      const { error } = await db
        .from("journal_entries")
        .delete()
        .eq("user_id", session.user.id)
        .eq("id", entryId);
      if (error) throw error;
    } else {
      const { error } = await db
        .from("journal_entries")
        .delete()
        .eq("user_id", session.user.id)
        .eq("date", date);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
