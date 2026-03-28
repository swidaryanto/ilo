"use client";

import * as React from "react";
import { IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { TrashStorage } from "@/lib/storage/trash-storage";
import Link from "next/link";

export function TrashButton() {
    const [trashCount, setTrashCount] = React.useState(0);
    const [showTooltip, setShowTooltip] = React.useState(false);

    React.useEffect(() => {
        const loadCount = async () => {
            const storage = new TrashStorage();
            const count = await storage.getTrashCount();
            setTrashCount(count);
        };
        loadCount();
    }, []);

    return (
        <div className="relative group">
            <Link href="/notes/trash">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-8 h-8 transition-all hover:bg-accent/50 text-foreground/80 relative"
                >
                    <IconTrash className="h-[1.15rem] w-[1.15rem]" />
                    {trashCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                            {trashCount > 9 ? '9+' : trashCount}
                        </span>
                    )}
                    <span className="sr-only">Trash</span>
                </Button>
            </Link>

            {/* Tooltip */}
            <div className={`absolute top-full right-0 mt-2 md:top-0 md:left-full md:ml-4 md:mt-0 opacity-0 md:group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50`}>
                <div className="relative bg-white dark:bg-[#2D2D2D] text-[#111] dark:text-[#E0E0E0] text-[13px] px-3 py-2 rounded-xl shadow-lg border border-black/5 dark:border-white/10 whitespace-nowrap w-max">
                    {/* Arrow for Desktop (Left) */}
                    <div className="hidden md:block absolute -left-1 top-[13px] w-2 h-2 bg-white dark:bg-[#2D2D2D] border-l border-b border-black/5 dark:border-white/10 transform rotate-45"></div>

                    {/* Arrow for Mobile (Top-Right) */}
                    <div className="md:hidden absolute right-[13px] -top-1 w-2 h-2 bg-white dark:bg-[#2D2D2D] border-t border-l border-black/5 dark:border-white/10 transform rotate-45"></div>

                    <div className="relative z-10 font-[family-name:var(--font-sans)] select-none font-medium">
                        We store your deleted notes here.
                    </div>
                </div>
            </div>
        </div>
    );
}
