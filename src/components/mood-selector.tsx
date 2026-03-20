"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Mood } from "@/lib/types/journal";

interface MoodOption {
  value: Mood;
  emoji: string;
  label: string;
}

const MOODS: MoodOption[] = [
  { value: "happy", emoji: "😊", label: "Happy" },
  { value: "excited", emoji: "🤩", label: "Excited" },
  { value: "calm", emoji: "😌", label: "Calm" },
  { value: "tired", emoji: "😴", label: "Tired" },
  { value: "sad", emoji: "😔", label: "Sad" },
  { value: "frustrated", emoji: "😤", label: "Frustrated" },
];

// Smooth easing curves from animations.dev
const EASING = {
  swift: "cubic-bezier(.86, .04, .67, .24)",
  silk: "cubic-bezier(.52, .062, .64, .21)",
  breeze: "cubic-bezier(.55, .085, .68, .53)",
  nova: "cubic-bezier(.73, .065, .82, .08)",
};

interface MoodSelectorProps {
  selectedMood?: Mood;
  onMoodSelect: (mood: Mood | undefined) => void;
  className?: string;
}

export function MoodSelector({ selectedMood, onMoodSelect, className }: MoodSelectorProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState<string | null>(null);
  
  const selectedMoodOption = selectedMood 
    ? MOODS.find((m) => m.value === selectedMood)
    : null;

  // If no mood selected, show all options
  if (!selectedMood) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {MOODS.map((mood) => (
          <button
            key={mood.value}
            onClick={() => onMoodSelect(mood.value)}
            onMouseDown={() => setIsPressed(mood.value)}
            onMouseUp={() => setIsPressed(null)}
            onMouseLeave={() => setIsPressed(null)}
            className={cn(
              "relative flex items-center justify-center w-7 h-7 rounded-full text-base",
              "transition-all duration-200",
              "hover:scale-110 hover:bg-accent/50"
            )}
            style={{
              opacity: isPressed === mood.value ? 0.7 : 0.6,
              transform: isPressed === mood.value ? "scale(0.92)" : "scale(1)",
              transitionTimingFunction: EASING.silk,
            }}
            title={mood.label}
          >
            {mood.emoji}
          </button>
        ))}
      </div>
    );
  }

  // If mood is selected, show only selected by default, expand on hover
  return (
    <div 
      className={cn("flex items-center gap-1", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered ? (
        // Show all moods when hovered with smooth stagger
        MOODS.map((mood, index) => {
          const isSelected = selectedMood === mood.value;
          return (
            <button
              key={mood.value}
              onClick={() => onMoodSelect(isSelected ? undefined : mood.value)}
              onMouseDown={() => setIsPressed(mood.value)}
              onMouseUp={() => setIsPressed(null)}
              onMouseLeave={() => setIsPressed(null)}
              className={cn(
                "relative flex items-center justify-center w-7 h-7 rounded-full text-base",
                "transition-all duration-300",
                "hover:scale-110"
              )}
              style={{
                opacity: isPressed === mood.value ? 0.8 : isSelected ? 1 : 0.6,
                transform: isPressed === mood.value 
                  ? "scale(0.92)" 
                  : isSelected 
                    ? "scale(1.1)" 
                    : "scale(1)",
                transitionTimingFunction: EASING.swift,
                transitionDelay: `${index * 20}ms`,
              }}
              title={mood.label}
            >
              {mood.emoji}
            </button>
          );
        })
      ) : (
        // Show only selected mood when not hovered
        <button
          onClick={() => onMoodSelect(undefined)}
          onMouseDown={() => setIsPressed("selected")}
          onMouseUp={() => setIsPressed(null)}
          onMouseLeave={() => setIsPressed(null)}
          className="relative flex items-center justify-center w-7 h-7 rounded-full text-base"
          style={{
            transform: isPressed === "selected"
              ? "scale(0.92)"
              : "scale(1.1)",
            opacity: isPressed === "selected" ? 0.8 : 1,
            transition: "all 200ms cubic-bezier(.52, .062, .64, .21)",
          }}
          title={`${selectedMoodOption?.label} - Click to remove`}
        >
          {selectedMoodOption?.emoji}
        </button>
      )}
    </div>
  );
}

export function MoodBadge({ mood, className }: { mood?: Mood; className?: string }) {
  if (!mood) return null;

  const moodOption = MOODS.find((m) => m.value === mood);
  if (!moodOption) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center text-sm",
        className
      )}
      title={moodOption.label}
    >
      {moodOption.emoji}
    </span>
  );
}

export function getMoodEmoji(mood?: Mood): string {
  if (!mood) return "";
  const moodOption = MOODS.find((m) => m.value === mood);
  return moodOption?.emoji || "";
}
