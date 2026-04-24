import { type NextRequest, NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { JournalDay, JournalEntry, Mood } from "@/lib/types/journal";
import type { TrashItem } from "@/lib/storage/trash-storage";

export async function POST(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    const body = (await req.json()) as { days: JournalDay[]; trash: TrashItem[] };
    const db = createServerSupabaseClient();
    const userId = session.user.id;

    let migratedDays = 0;
    let migratedTrashItems = 0;

    const allEntries: JournalEntry[] = body.days.flatMap((d) => d.entries);
    if (allEntries.length > 0) {
      const { error } = await db.from("journal_entries").upsert(
        allEntries.map((e) => ({
          id: e.id,
          user_id: userId,
          date: e.date,
          hour: e.hour,
          content: e.content,
          mood: (e.mood as Mood | undefined) ?? null,
          created_at: e.createdAt,
          updated_at: e.updatedAt,
        }))
      );
      if (error) {
        console.error("[migrate] journal_entries upsert error:", error);
        throw error;
      }
      migratedDays = body.days.length;
    }

    if (body.trash.length > 0) {
      const { error } = await db.from("journal_trash").upsert(
        body.trash.map((item) => ({
          user_id: userId,
          date: item.day.date,
          entries_json: item.day.entries,
          expires_at: item.expiresAt,
        }))
      );
      if (error) {
        console.error("[migrate] journal_trash upsert error:", error);
        // Don't block migration if only trash fails
      } else {
        migratedTrashItems = body.trash.length;
      }
    }

    return NextResponse.json({ migratedDays, migratedTrashItems });
  } catch (err) {
    if (err instanceof Response) return err;
    const message = err instanceof Error ? err.message : "Migration failed";
    console.error("[migrate] unhandled error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
