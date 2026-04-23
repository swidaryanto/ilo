import { auth } from "@/auth";
import type { Session } from "next-auth";

type RequiredSession = Session & { user: { id: string } };

export async function getRequiredSession(): Promise<RequiredSession> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session as RequiredSession;
}
