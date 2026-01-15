"use client";

import * as React from "react";
import { IconInfoCircle, IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className="flex items-center md:flex-col gap-1 md:gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className="rounded-full w-8 h-8 transition-all hover:bg-accent/50"
      >
        <IconSun className="h-[1rem] w-[1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <IconMoon className="absolute h-[1rem] w-[1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      <div className="group relative flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setShowTooltip(!showTooltip);
          }}
          className="rounded-full w-8 h-8 hover:bg-accent/35 text-foreground/80 dark:text-foreground/80"
        >
          <IconInfoCircle className="h-[1.15rem] w-[1.15rem]" />
          <span className="sr-only">Information</span>
        </Button>

        {/* Tooltip - shows on click for mobile, hover for desktop */}
        <div className={`absolute top-full right-0 mt-3 md:top-0 md:left-full md:ml-4 md:mt-0 ${showTooltip ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'} transition-all duration-200 pointer-events-none z-50`}>
          <div className="relative bg-white dark:bg-[#2D2D2D] text-[#111] dark:text-[#E0E0E0] text-[13px] px-3 py-2 rounded-xl shadow-lg border border-black/5 dark:border-white/10 whitespace-nowrap w-max">
            {/* Arrow for Desktop (Left) */}
            <div className="hidden md:block absolute -left-1 top-[13px] w-2 h-2 bg-white dark:bg-[#2D2D2D] border-l border-b border-black/5 dark:border-white/10 transform rotate-45"></div>

            {/* Arrow for Mobile (Top-Right) */}
            <div className="md:hidden absolute right-[13px] -top-1 w-2 h-2 bg-white dark:bg-[#2D2D2D] border-t border-l border-black/5 dark:border-white/10 transform rotate-45"></div>

            <div className="relative z-10 font-[family-name:var(--font-sans)] flex flex-col gap-0 select-none">
              <span className="font-medium hidden md:block">Hover to view the content</span>
              <span className="text-black/50 dark:text-white/50">Your content is auto-save</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


