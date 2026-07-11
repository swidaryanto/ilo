"use client";

import { IconDownload } from "@tabler/icons-react";
import * as React from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useStorage } from "@/hooks/use-storage";
import { formatDateDisplay } from "@/lib/utils/date";

type ExportFormat = "txt" | "json";

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ExportButton() {
  const { storage } = useStorage();
  const [open, setOpen] = React.useState(false);

  const handleExport = async (format: ExportFormat) => {
    const allDays = await storage.getAllDays();

    if (allDays.length === 0) {
      alert("No journal entries to export.");
      return;
    }

    const exportedAt = new Date();
    const exportDate = exportedAt.toISOString().split("T")[0];

    if (format === "json") {
      const content = JSON.stringify(
        {
          app: "ilo",
          version: 1,
          exportedAt: exportedAt.toISOString(),
          days: allDays,
        },
        null,
        2
      );

      downloadFile(
        content,
        `ilo-journal-${exportDate}.json`,
        "application/json"
      );
      setOpen(false);
      return;
    }

    let content = "ilo Journal Export\n";
    content += `Generated on: ${exportedAt.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}\n\n`;

    allDays.forEach((day) => {
      const entriesWithContent = day.entries.filter(
        (entry) => entry.content.trim().length > 0
      );

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

    downloadFile(content, `ilo-journal-${exportDate}.txt`, "text/plain");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger aria-label="Export journal">
        <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-foreground/80 transition-all hover:bg-accent/50">
          <IconDownload className="h-[1.15rem] w-[1.15rem]" />
          <span className="sr-only">Export journal</span>
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-48 gap-1 rounded-xl p-1"
      >
        <button
          type="button"
          onClick={() => void handleExport("txt")}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
        >
          Download as TXT
        </button>
        <button
          type="button"
          onClick={() => void handleExport("json")}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
        >
          Download as JSON
        </button>
      </PopoverContent>
    </Popover>
  );
}
