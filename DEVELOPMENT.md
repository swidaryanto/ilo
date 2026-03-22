# Ilo Journal - Development Documentation

**Last Updated:** March 21, 2026  
**Version:** 0.1.0

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Features Implemented](#features-implemented)
4. [Architecture](#architecture)
5. [Recent Changes Summary](#recent-changes-summary)
6. [Pending Improvements](#pending-improvements)
7. [Development Guidelines](#development-guidelines)
8. [Component Reference](#component-reference)

---

## Project Overview

**Ilo** is a time-based journal application that organizes notes by the hour of the day. Instead of scrolling through a wall of text, users can find exactly what they were thinking at 9am, 3pm, or midnight.

**Core Philosophy:**
- Minimal setup (no accounts required)
- Auto-save everything
- Focus on the present moment
- Mobile-first design

**Live URL:** [Deploy your app]  
**Repository:** https://github.com/swidaryanto/ilo

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16.1.6 (App Router) | React framework |
| **Language** | TypeScript 5.x | Type safety |
| **Styling** | Tailwind CSS v4 | Utility-first CSS |
| **UI Components** | Base UI React | Accessible primitives |
| **Icons** | Tabler Icons | Icon library |
| **Theme** | next-themes | Dark/light mode |
| **Date Utils** | date-fns | Date formatting |
| **Storage** | localStorage (adapter pattern) | Data persistence |
| **Linting** | oxlint, oxfmt | Code quality |

---

## Features Implemented

### ✅ Core Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Hour-based Journaling** | ✅ Complete | 24-hour layout, one entry per hour |
| **Auto-save** | ✅ Complete | 500ms debounce on content change |
| **Focus Mode** | ✅ Complete | Blur effect on non-active hours |
| **Keyboard Navigation** | ✅ Complete | Arrow keys to navigate between hours |
| **Dark/Light Theme** | ✅ Complete | Toggle in header/sidebar |
| **Mood Tagging** | ✅ Complete | 6 emotions per entry (😊 🤩 😌 😴 😔 😤) |
| **Undo Delete** | ✅ Complete | 5-second grace period with undo button |
| **Export to Text** | ✅ Complete | Download all entries as .txt file |
| **List/Calendar View** | ✅ Complete | Toggle between views on notes page |
| **Mobile Swipe Delete** | ✅ Complete | Swipe left to delete on mobile |
| **Streak Tracking** | ✅ Complete | Shows consecutive days with entries |
| **Streak Badge Animation** | ✅ Complete | Celebratory animation on first entry |
| **Error Handling** | ✅ Complete | Toast notifications for save failures |
| **LocalStorage Checks** | ✅ Complete | Quota exceeded, availability detection |
| **Empty States** | ✅ Complete | Encouraging copy + writing prompts |
| **Responsive Design** | ✅ Complete | Mobile-first, desktop enhancements |

### 📱 Mobile-Specific Features

| Feature | Implementation |
|---------|---------------|
| **Settings Menu (⋯)** | Theme toggle + auto-save info |
| **Mood Selector** | Below input form (compact) |
| **Swipe Gestures** | Delete with undo |
| **Touch Optimizations** | Larger tap targets, smooth animations |
| **Footer Layout** | Date + Resume Journal button |

### 💻 Desktop-Specific Features

| Feature | Implementation |
|---------|---------------|
| **Sidebar Controls** | Export + Theme toggle (fixed left) |
| **Mood Selector** | Right of input form |
| **Hover States** | Delete button on hover |
| **Keyboard Shortcuts** | Arrow navigation |

---

## Architecture

### File Structure

```
ilo/
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles, Tailwind config
│   │   ├── layout.tsx           # Root layout with providers
│   │   ├── page.tsx             # Journal page (today's hours)
│   │   └── notes/
│   │       ├── page.tsx         # Notes list (list/calendar view)
│   │       └── [date]/          # Individual date view (future)
│   ├── components/
│   │   ├── journal/
│   │   │   ├── hour-section.tsx # Individual hour component
│   │   │   └── journal-page.tsx # Main journal container
│   │   ├── ui/                  # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── toast.tsx        # Toast notifications with actions
│   │   │   ├── textarea.tsx
│   │   │   └── ...
│   │   ├── empty-state.tsx      # Empty state component
│   │   ├── mood-selector.tsx    # Mood picker component
│   │   ├── streak-badge.tsx     # Streak celebration badge
│   │   ├── theme-provider.tsx   # Theme context provider
│   │   └── theme-toggle.tsx     # Theme toggle button
│   ├── hooks/
│   │   ├── use-hour-notes.ts    # Hour-specific logic
│   │   ├── use-journal.ts       # Journal-wide logic
│   │   └── use-streak.ts        # Streak calculation
│   ├── lib/
│   │   ├── storage/
│   │   │   ├── journal-storage.ts    # Storage interface
│   │   │   └── local-storage-adapter.ts # localStorage implementation
│   │   ├── types/
│   │   │   └── journal.ts       # TypeScript types
│   │   └── utils/
│   │       ├── date.ts          # Date formatting utilities
│   │       └── utils.ts         # General utilities (cn)
│   └── ...
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

### Data Flow

```
User Input → useHourNotes (debounce) → useJournal → LocalStorageAdapter → localStorage
                ↓                           ↓
          Toast Notification        State Update
```

### Storage Schema

```typescript
interface JournalEntry {
  id: string;           // `${date}-${hour}`
  date: string;         // YYYY-MM-DD
  hour: number;         // 0-23
  content: string;      // User's text
  mood?: Mood;          // Optional mood tag
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
}

interface JournalDay {
  date: string;
  entries: JournalEntry[];
}
```

### Key Patterns

**1. Adapter Pattern for Storage**
```typescript
// Easy to swap localStorage for database later
interface JournalStorage {
  getEntries(date: string): Promise<JournalEntry[]>;
  saveEntry(entry: JournalEntry): Promise<void>;
  restoreEntry(entry: JournalEntry): Promise<void>;
  deleteEntry(id: string, date: string): Promise<void>;
}
```

**2. Pending Deletion for Undo**
```typescript
interface PendingDeletion {
  date: string;
  entries: JournalEntry[];
  timeoutId: NodeJS.Timeout;  // 5-second timer
}
```

**3. Optimistic UI Updates**
- Delete immediately updates UI
- Restore on undo
- Permanent delete after timeout

---

## Recent Changes Summary

### Session: March 21, 2026

#### 1. **Undo Delete Feature** (Commit: `c444652`)
- Added pending deletion state with 5-second timeout
- Toast notification with Undo button
- `restoreEntry()` function in storage adapter
- Optimistic UI updates

#### 2. **Toast Notification Improvements** (Commit: `50f6f97`, `9083c0d`)
- Neutral gray background (removed orange)
- Styled Undo button as clickable element
- Removed icons for cleaner look
- Fixed entry count (only shows entries with content)
- Toast width matches footer (492px)

#### 3. **Mood Selector Layout** (Commit: `8d7475f`)
- **Mobile:** Mood selector below input form
- **Desktop:** Mood selector to the right of input
- Removed emoji badge next to hour label
- Compact, responsive design

#### 4. **Footer Layout Fixes**
- Date aligned to left edge (removed padding)
- Resume Journal button with jelly-style dark theme
- Compact button design

#### 5. **Empty States** (Commit: `46a8235`)
- Journal page: "Your day is a blank canvas" + writing prompts
- Notes page: "No entries yet" + encouragement
- Visual illustrations with gradient icons

#### 6. **Mobile Settings Menu**
- Three-dots menu (⋯) in header
- Theme toggle inside menu
- Auto-save info message
- Cleaner header layout

---

## Pending Improvements

### 🔥 High Priority

#### 1. **Search & Filter**
**Problem:** Can't find old entries by content  
**Solution:**
- Search bar in notes page
- Filter by date range
- Filter by mood
- Full-text search in entry content

**Estimated Effort:** 4-6 hours  
**Files to Modify:**
- `src/app/notes/page.tsx` - Add search UI
- `src/lib/storage/local-storage-adapter.ts` - Add search function
- New hook: `src/hooks/use-search.ts`

---

#### 2. **Date Picker / Quick Navigation**
**Problem:** No way to jump to specific dates  
**Solution:**
- Click date in header → opens calendar popup
- Quick navigation to past entries
- "Jump to today" button

**Estimated Effort:** 3-4 hours  
**Files to Modify:**
- `src/components/journal/journal-page.tsx` - Add date picker trigger
- Use existing `src/components/ui/calendar.tsx`
- New state: `selectedDate` navigation

---

#### 3. **Entry Preview in Notes List**
**Problem:** Notes list only shows dates, no content preview  
**Solution:**
- Show first 50 characters of entry content
- Display mood emoji + preview together
- Truncate with ellipsis

**Estimated Effort:** 1-2 hours  
**Files to Modify:**
- `src/app/notes/page.tsx` - Add preview text
- Update day item rendering

---

### 📊 Medium Priority

#### 4. **Streak Heatmap Visualization**
**Problem:** Streak number doesn't show consistency patterns  
**Solution:**
- GitHub-style contribution graph
- Color intensity = number of entries that day
- Monthly view

**Estimated Effort:** 6-8 hours  
**Files to Modify:**
- New component: `src/components/streak-heatmap.tsx`
- `src/hooks/use-streak.ts` - Add heatmap data calculation
- `src/app/notes/page.tsx` - Add heatmap view option

---

#### 5. **Keyboard Shortcuts**
**Problem:** Power users need faster navigation  
**Solution:**
- `Cmd+K` - Open search
- `Cmd+.` - Toggle theme
- `Cmd+↑/↓` - Navigate hours
- `Esc` - Close modals

**Estimated Effort:** 2-3 hours  
**Files to Modify:**
- New hook: `src/hooks/use-keyboard-shortcuts.ts`
- `src/components/journal/journal-page.tsx` - Integrate shortcuts

---

#### 6. **Export Reminders**
**Problem:** Users might lose data (localStorage only)  
**Solution:**
- "Export your journal" nudge after 7 days
- Auto-suggest backup monthly
- Track last export date

**Estimated Effort:** 2-3 hours  
**Files to Modify:**
- `src/hooks/use-export-reminder.ts` - New hook
- `src/components/export-button.tsx` - Add reminder UI
- localStorage: `lastExportDate`

---

### 💡 Lower Priority

#### 7. **Offline Indicator**
- Show banner when localStorage unavailable
- Detect private browsing mode
- Graceful degradation

#### 8. **Writing Prompts**
- Empty hour shows suggestion
- "What made you smile today?"
- Random prompt generator

#### 9. **Accessibility Improvements**
- ARIA labels for all interactive elements
- Focus states for keyboard navigation
- Screen reader announcements

#### 10. **PWA Support**
- Install as native app
- Offline mode
- Push notifications (future)

---

## Development Guidelines

### Code Style

**TypeScript:**
- Strict mode enabled
- No `any` types (use `unknown` or proper types)
- All function parameters typed
- Return types explicit for public functions

**Component Structure:**
```typescript
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ComponentProps {
  // Props here
}

export function Component({ prop }: ComponentProps) {
  // Component logic
  return <div />;
}
```

**Naming Conventions:**
- Components: PascalCase (`HourSection`)
- Hooks: camelCase with `use` prefix (`useJournal`)
- Utils: camelCase (`formatDate`)
- Types: PascalCase (`JournalEntry`)
- Files: kebab-case (`hour-section.tsx`)

---

### Testing Checklist

Before pushing to production:

- [ ] Build passes: `npm run build`
- [ ] Lint passes: `npm run check`
- [ ] Mobile view tested (Chrome DevTools)
- [ ] Desktop view tested
- [ ] Dark mode tested
- [ ] Light mode tested
- [ ] Empty states tested
- [ ] Error states tested (simulate localStorage failure)
- [ ] Undo delete tested (swipe + button)
- [ ] Mood selection tested (mobile + desktop)

---

### Git Workflow

**Commit Message Format:**
```
type: short description

- Detailed change 1
- Detailed change 2
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting (no code changes)
- `refactor:` - Code restructuring (no behavior change)
- `test:` - Adding tests
- `chore:` - Build/config changes

**Example:**
```bash
git commit -m "feat: add undo delete for journal entries

- Add pending deletion state with 5-second timeout
- Show toast with Undo button after delete
- Add restoreEntry function to storage adapter"
```

---

### Performance Considerations

**1. Debouncing:**
- Auto-save: 500ms debounce
- Prevents excessive localStorage writes

**2. Memoization:**
- Use `React.useCallback` for event handlers
- Use `React.useMemo` for expensive calculations
- Consider `React.memo` for list items (24 hours)

**3. State Management:**
- Keep state as close to usage as possible
- Avoid prop drilling (use context if needed)
- Don't store derived state (calculate on render)

**4. localStorage Limits:**
- ~5-10MB depending on browser
- Show warning at 80% capacity
- Export reminder before quota exceeded

---

## Component Reference

### Key Components

#### `HourSection`
**Path:** `src/components/journal/hour-section.tsx`  
**Purpose:** Renders a single hour entry with mood selector  
**Props:**
- `hour` (number) - Hour of day (0-23)
- `entry` (JournalEntry | undefined) - Entry data
- `onSave` (function) - Save handler
- `isFocused` (boolean) - Is this hour focused
- `isHovered` (boolean) - Is this hour hovered

**Layout:**
- Mobile: Mood selector below input
- Desktop: Mood selector right of input

---

#### `MoodSelector`
**Path:** `src/components/mood-selector.tsx`  
**Purpose:** Emoji picker for mood tagging  
**Behavior:**
- No selection: Show all 6 emojis (faded)
- Selected: Show only selected emoji
- Hover selected: Expand to show all
- Click selected: Remove mood

**Animations:**
- Custom easing curves from animations.dev
- Scale on press (0.92)
- Scale on hover (1.1)
- Staggered expand (20ms delay)

---

#### `Toast` (with Undo)
**Path:** `src/components/ui/toast.tsx`  
**Purpose:** Notification system with action buttons  
**Types:**
- `error` - Red background
- `success` - Green background
- `info` - Blue background
- `warning` - Gray background (for undo)

**Usage:**
```typescript
addToast({
  message: "Entry deleted",
  type: "warning",
  duration: 5000,
  action: {
    label: "Undo",
    onClick: () => handleUndo(),
  },
});
```

---

#### `EmptyState`
**Path:** `src/components/empty-state.tsx`  
**Purpose:** Encouraging empty states  
**Variants:**
- `journal` - Writing prompts + "blank canvas"
- `notes` - "No entries yet" + encouragement

---

### Hooks Reference

#### `useJournal`
**Path:** `src/hooks/use-journal.ts`  
**Returns:**
- `entries` - Array of entries for selected date
- `saveEntry(hour, content, mood)` - Save entry
- `getEntryForHour(hour)` - Get entry by hour
- `saveError` - Current save error (if any)
- `clearSaveError()` - Clear error state

---

#### `useHourNotes`
**Path:** `src/hooks/use-hour-notes.ts`  
**Purpose:** Per-hour note logic  
**Returns:**
- `content` - Current content
- `handleChange(value)` - On text change
- `handleBlur()` - On blur (triggers save)
- `isSaving` - Save in progress
- `saveFailed` - Last save failed

---

#### `useStreak`
**Path:** `src/hooks/use-streak.ts`  
**Returns:**
- `currentStreak` - Consecutive days
- `isFirstEntryToday` - First entry flag
- `hasShownCelebration` - Already celebrated
- `markCelebrationShown()` - Mark as shown

---

## Quick Start for New Developers

```bash
# Clone repo
git clone https://github.com/swidaryanto/ilo.git
cd ilo

# Install dependencies
bun install

# Run dev server
bun run dev

# Open browser
open http://localhost:3000
```

**Test Scenarios:**
1. Write in an hour → verify auto-save
2. Select mood → verify emoji shows
3. Swipe delete → verify undo works
4. Toggle theme → verify persists
5. Export → verify .txt download

---

## Contact & Support

**Repository:** https://github.com/swidaryanto/ilo  
**Issues:** Use GitHub Issues for bug reports  
**PRs:** Welcome! Please follow commit message format

---

*This documentation is maintained alongside the codebase. Update when adding features or making significant changes.*
