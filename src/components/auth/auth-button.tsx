"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />;
  }

  if (session) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image && (
          <Image
            src={session.user.image}
            alt={session.user.name ?? "User"}
            width={28}
            height={28}
            className="rounded-full"
          />
        )}
        <button
          type="button"
          onClick={() => signOut()}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => signIn("google")}
        className="text-xs border border-border rounded-md px-3 py-1.5 bg-background hover:bg-muted transition-colors whitespace-nowrap"
      >
        Sign in with Google
      </button>
      <p className="text-[10px] text-muted-foreground/60 text-center leading-tight">
        Save your journal to the cloud
      </p>
    </div>
  );
}
