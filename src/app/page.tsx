import { auth } from "@/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { JournalPage } from "@/components/journal/journal-page";
import type { JournalEntry } from "@/lib/types/journal";
import { formatDate } from "@/lib/utils/date";

export default async function Home() {
  const session = await auth();
  let initialEntries: JournalEntry[] = [];

  if (session?.user?.id) {
    const today = formatDate(new Date());
    const db = createServerSupabaseClient();
    const { data } = await db
      .from("journal_entries")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("date", today)
      .order("hour", { ascending: true });

    initialEntries = (data ?? []).map((row) => ({
      id: row.id,
      date: row.date,
      hour: row.hour,
      content: row.content,
      mood: row.mood ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  return <JournalPage initialEntries={initialEntries} />;
}
