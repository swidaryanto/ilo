# CLAUDE.md

> **Read this file first.** This document captures the architecture, design decisions, and latest UI state of this project. Every AI agent or collaborator working on this repo should start here.

---

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # Run oxlint
npm run format   # Run oxfmt (formatter)
npm run check    # Run both lint and format
```

---

## Project Overview

**Ilo** is a minimal, mobile-first time-based journal app. Notes are organized by hour (0–23) for each day. The design philosophy is calm, intentional, and premium — no clutter, no distractions.

**Live:** `ilo-ten.vercel.app`
**Repo:** `github.com/swidaryanto/ilo`
**Stack:** Next.js 16 · React 19 · Tailwind CSS 4 · TypeScript · localStorage

---

## Architecture

### Storage Layer

Uses a storage adapter pattern designed for future database migration:

- `src/lib/storage/journal-storage.ts` — Interface (`JournalStorage`)
- `src/lib/storage/local-storage-adapter.ts` — localStorage impl, keys: `journal:YYYY-MM-DD`

To add a new backend: implement `JournalStorage` and swap the adapter in `use-journal.ts`.

### Data Flow

1. **`useJournal`** (`src/hooks/use-journal.ts`) — main state management for entries by date
2. **`useHourNotes`** (`src/hooks/use-hour-notes.ts`) — per-hour input state with 500ms debounced auto-save
3. **`HourSection`** — renders individual hour blocks with blur for non-focused hours

### Routes

| Route | Description |
|---|---|
| `/` | Today's journal (`JournalPage`) |
| `/notes` | Notes index — list/grid view of all days with entries |
| `/notes/[date]` | View/edit a specific date |

### Key Patterns

- Entry IDs: `{date}-{hour}` (e.g. `2024-01-15-14`)
- Date format: `YYYY-MM-DD` strings throughout
- All components are `"use client"` — localStorage dependency
- Arrow key navigation between hours at text boundaries

---

## Design System & UI Principles

### Mobile-First

**Always design for mobile first.** The target viewport is ~390px wide (iPhone 12/13/14 size). Desktop enhancements come after mobile is solid.

### Typography

- **Headings:** `Instrument Serif` — italic, used for "Ilo Journal" branding
- **Body:** System sans-serif via Tailwind defaults
- **Heading size:** `20px` mobile / `25px` desktop

### Colors

| Token | Usage |
|---|---|
| `orange-500` | Active entries, current date indicator, filled notes |
| `muted-foreground` | Secondary text, empty states |
| `#C0C0C0` | Subtle footer subtext (current date label) |
| `#E8E8E8` | Button border in light mode |
| `background` / `foreground` | Semantic, adapts to dark mode |

### Dark Mode

The app supports dark mode via `next-themes`. Always use Tailwind semantic tokens (`bg-background`, `text-foreground`, `border-border`) — avoid hardcoding `#FFF` or `#000` directly. Use `dark:` variants only when the semantic token is insufficient.

---

## Notes Page (`/notes`) — UI Spec

This is the primary mobile screen. Design decisions below are intentional — do not revert them.

### Header (top bar)

```
[ Ilo Journal ]              [ ≡  ⊞ ]
```

- `Ilo Journal` — left, Instrument Serif italic
- View toggle pill (list/grid icons) — **right**, inside a rounded pill `bg-muted/20 ring-1 ring-border/30`
- The top bar contains **nothing else** — no links, no subtext

### List View

- Dates listed vertically with `font-semibold`, `text-sm` (mobile) / `text-xl` (desktop)
- `gap-2` between items on mobile, `gap-0` on desktop
- Today's entry shows a `Today` label instead of a delete button
- Desktop: hover-to-reveal trash icon (hidden on mobile)
- Mobile: **swipe-left to delete** (iOS-style with spring easing, `cubic-bezier(0.25, 0.46, 0.45, 0.94)`)
  - Dead zone: 10px before locking direction
  - Threshold: 40px to snap open, 80px auto-triggers confirm dialog
  - Velocity threshold: 0.4 px/ms for flick detection
  - All gesture state lives in `useRef` — zero re-renders during swipe

### Grid / Calendar View

- 7-column dot grid (`grid-cols-7`), one dot per day of the current month
- **Orange filled dot** (`bg-orange-500`) = day has a captured note
- **Gray dot** (`bg-muted-foreground/15`) = no note
- **Today's dot** has a `ring-2 ring-orange-500/40 ring-offset-2` border + animated ping pulse
- Helper text `"Orange dots mark days with captured notes"` — italic gray, **centered below the grid** (not in the header)

### Fixed Bottom Bar (both views)

Fixed to the bottom of the viewport. Always visible regardless of scroll position.

**"Resume Journal" button:**
```css
display: flex;
padding: 14px 8px;
justify-content: center;
align-items: center;
gap: 8px;
align-self: stretch;
border-radius: 8px;
border: 1px solid #E8E8E8;          /* dark: border-border */
background: #FFF;                    /* dark: bg-background */
box-shadow: 0 2px 4px 0 rgba(0,0,0,0.05);  /* dark: none */
```

**Subtext below button:**
```
Current date: Sun, Feb 22
```
- `text-[11px]`, `font-medium`, color `#C0C0C0` (light) / `text-muted-foreground` (dark)
- Centered, `mt-4` below the button

**Container:** `fixed bottom-0 left-0 right-0`, `pb-8 pt-4 px-6`, `bg-background/80 backdrop-blur-md`, `max-w-4xl mx-auto`

**Important:** Add `pb-[140px]` to the main scrollable content area to prevent the fixed bar from obscuring the last list item.

---

## Recent Changes (Feb 2026)

| Date | Change |
|---|---|
| Feb 22, 2026 | Redesigned `/notes` mobile layout: toggle to header, fixed bottom Resume Journal button, helper text moved below grid |
| Feb 14, 2026 | Mobile-first Notes UI — Instrument Serif heading, swipe hint context awareness, smaller font/spacing on mobile |
| Feb 13, 2026 | Native iOS-style swipe-to-delete on Notes list |
| Feb 9, 2026 | Added current date display + pulse indicator on today's date in journal |
| Feb 8, 2026 | Improved auto-save logic |

---

## What NOT to Change

- Do not move the view toggle back below the header title
- Do not add "Resume Journal" back to the top header
- Do not replace localStorage with another storage without implementing the `JournalStorage` interface
- Do not use `any` types — discriminated unions preferred
- Do not use Tailwind `v3` class syntax — this project is on **Tailwind CSS v4**
