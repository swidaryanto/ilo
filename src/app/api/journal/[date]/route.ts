import { type NextRequest, NextResponse } from "next/server";

import type { JournalEntry, Mood } from "@/lib/types/journal";

import { getRequiredSession } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

    const entries: JournalEntry[] = ((data as EntryRow[]) ?? []).map(
      rowToEntry
    );
    return NextResponse.json({ entries });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: "Failed to load entries" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getRequiredSession();
    const { date } = await params;
    const entry = (await req.json()) as JournalEntry;
    const db = createServerSupabaseClient();
    const updatedAt = Number.isNaN(Date.parse(entry.updatedAt))
      ? new Date().toISOString()
      : entry.updatedAt;

    const { data: existing, error: readError } = await db
      .from("journal_entries")
      .select("updated_at")
      .eq("user_id", session.user.id)
      .eq("id", entry.id)
      .maybeSingle();

    if (readError) throw readError;

    if (
      existing?.updated_at &&
      Date.parse(existing.updated_at) > Date.parse(updatedAt)
    ) {
      return NextResponse.json({ success: true, conflict: "remote-newer" });
    }

    const { error } = await db.from("journal_entries").upsert({
      id: entry.id,
      user_id: session.user.id,
      date,
      hour: entry.hour,
      content: entry.content,
      mood: entry.mood ?? null,
      updated_at: updatedAt,
    });

    if (error) {
      console.error("[journal/date] upsert error:", error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    const e = err as {
      message?: string;
      code?: string;
      details?: string;
      hint?: string;
    };
    const message =
      e?.message ?? e?.details ?? e?.hint ?? "Failed to save entry";
    return NextResponse.json(
      { error: message, code: e?.code, details: e?.details, hint: e?.hint },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getRequiredSession();
    const { date } = await params;
    const db = createServerSupabaseClient();
    const entryId = req.nextUrl.searchParams.get("entryId");
    const requestedDeletedAt = req.nextUrl.searchParams.get("deletedAt");
    const deletedAt =
      requestedDeletedAt && !Number.isNaN(Date.parse(requestedDeletedAt))
        ? requestedDeletedAt
        : new Date().toISOString();

    if (entryId) {
      const { error } = await db
        .from("journal_entries")
        .delete()
        .eq("user_id", session.user.id)
        .eq("id", entryId)
        .lte("updated_at", deletedAt);
      if (error) throw error;
    } else {
      const { error } = await db
        .from("journal_entries")
        .delete()
        .eq("user_id", session.user.id)
        .eq("date", date)
        .lte("updated_at", deletedAt);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500 }
    );
  }
}
