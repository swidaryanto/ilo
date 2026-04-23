import { type NextRequest, NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { JournalDay, JournalEntry, Mood } from "@/lib/types/journal";
import type { TrashItem } from "@/lib/storage/trash-storage";

type TrashRow = {
  id: string;
  user_id: string;
  date: string;
  entries_json: unknown;
  deleted_at: string;
  expires_at: string;
};

export async function GET() {
  try {
    const session = await getRequiredSession();
    const db = createServerSupabaseClient();

    await db
      .from("journal_trash")
      .delete()
      .eq("user_id", session.user.id)
      .lt("expires_at", new Date().toISOString());

    const { data, error } = await db
      .from("journal_trash")
      .select("*")
      .eq("user_id", session.user.id)
      .order("deleted_at", { ascending: false });

    if (error) throw error;

    const items: TrashItem[] = ((data as TrashRow[]) ?? []).map((row) => ({
      day: {
        date: row.date,
        entries: row.entries_json as JournalEntry[],
      },
      deletedAt: row.deleted_at,
      expiresAt: row.expires_at,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to load trash" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    const body = (await req.json()) as { action: "add"; day: JournalDay };
    const db = createServerSupabaseClient();

    if (body.action === "add") {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error } = await db.from("journal_trash").upsert(
        {
          user_id: session.user.id,
          date: body.day.date,
          entries_json: body.day.entries,
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: "user_id,date" }
      );
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to update trash" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    const body = (await req.json()) as {
      action: "restore" | "permanentDelete" | "emptyTrash";
      date?: string;
    };
    const db = createServerSupabaseClient();

    if (body.action === "emptyTrash") {
      const { error } = await db
        .from("journal_trash")
        .delete()
        .eq("user_id", session.user.id);
      if (error) throw error;
    } else if (body.date) {
      if (body.action === "restore") {
        const { data, error: fetchErr } = await db
          .from("journal_trash")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("date", body.date)
          .single();
        if (fetchErr) throw fetchErr;

        const row = data as TrashRow;
        const entries = row.entries_json as JournalEntry[];
        if (entries.length > 0) {
          const { error: upsertErr } = await db.from("journal_entries").upsert(
            entries.map((e) => ({
              id: e.id,
              user_id: session.user.id,
              date: e.date,
              hour: e.hour,
              content: e.content,
              mood: (e.mood as Mood | undefined) ?? null,
              updated_at: new Date().toISOString(),
            })),
            { onConflict: "id,user_id" }
          );
          if (upsertErr) throw upsertErr;
        }
      }

      const { error } = await db
        .from("journal_trash")
        .delete()
        .eq("user_id", session.user.id)
        .eq("date", body.date);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to process trash action" }, { status: 500 });
  }
}
