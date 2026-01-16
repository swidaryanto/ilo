"use client";

import * as React from "react";
import { IconDownload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { LocalStorageAdapter } from "@/lib/storage/local-storage-adapter";
import { formatDateDisplay } from "@/lib/utils/date";

export function ExportButton() {
    const handleExport = async () => {
        const storage = new LocalStorageAdapter();
        const allDays = await storage.getAllDays();

        if (allDays.length === 0) {
            alert("No journal entries to export.");
            return;
        }

        let content = "Ilo Journal Export\n";
        content += `Generated on: ${new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        })}\n\n`;

        allDays.forEach((day) => {
            const entriesWithContent = day.entries.filter(e => e.content.trim().length > 0);

            if (entriesWithContent.length > 0) {
                content += "--------------------------------------------------\n";
                content += `${formatDateDisplay(day.date)}\n`;
                content += "--------------------------------------------------\n";

                entriesWithContent.forEach((entry) => {
                    const hour = entry.hour.toString().padStart(2, "0") + ":00";
                    content += `${hour} - ${entry.content}\n`;
                });

                content += "\n";
            }
        });

        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ilo-journal-${new Date().toISOString().split("T")[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const [showTooltip, setShowTooltip] = React.useState(false);

    return (
        <div className="relative group">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                    handleExport();
                    // Show tooltip on mobile click too
                    setShowTooltip(true);
                    setTimeout(() => setShowTooltip(false), 2000);
                }}
                className="rounded-full w-8 h-8 transition-all hover:bg-accent/50 text-foreground/80"
            >
                <IconDownload className="h-[1.15rem] w-[1.15rem]" />
                <span className="sr-only">Export Journal</span>
            </Button>

            {/* Tooltip */}
            <div className={`absolute top-full right-0 mt-2 md:top-0 md:left-full md:ml-4 md:mt-0 ${showTooltip ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'} transition-all duration-200 pointer-events-none z-50`}>
                <div className="relative bg-white dark:bg-[#2D2D2D] text-[#111] dark:text-[#E0E0E0] text-[13px] px-3 py-2 rounded-xl shadow-lg border border-black/5 dark:border-white/10 whitespace-nowrap w-max">
                    {/* Arrow for Desktop (Left) */}
                    <div className="hidden md:block absolute -left-1 top-[13px] w-2 h-2 bg-white dark:bg-[#2D2D2D] border-l border-b border-black/5 dark:border-white/10 transform rotate-45"></div>

                    {/* Arrow for Mobile (Top-Right) */}
                    <div className="md:hidden absolute right-[13px] -top-1 w-2 h-2 bg-white dark:bg-[#2D2D2D] border-t border-l border-black/5 dark:border-white/10 transform rotate-45"></div>

                    <div className="relative z-10 font-[family-name:var(--font-sans)] select-none font-medium">
                        Download your entire journal
                    </div>
                </div>
            </div>
        </div>
    );
}
