"use client";

import { useEffect, useState } from "react";

const FRAMES = ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"];

export function BrailleSpinner({ className }: { className?: string }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 100);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={className} aria-label="Loading">
      {FRAMES[frame]}
    </span>
  );
}

export function BrailleLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <BrailleSpinner className="text-muted-foreground text-xl" />
    </div>
  );
}
