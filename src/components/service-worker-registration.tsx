"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  const { status } = useSession();

  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      status === "unauthenticated" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
        console.error("Service worker registration failed:", error);
      });
    }
  }, [status]);

  return null;
}
