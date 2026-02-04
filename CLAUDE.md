# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run oxlint
npm run format   # Run oxfmt (formatter)
npm run check    # Run both lint and format
```

## Architecture

Ilo is a time-based journal app built with Next.js 16, React 19, and Tailwind CSS 4. Notes are organized by hour (0-23) for each day.

### Storage Layer

The app uses a storage adapter pattern designed for future database migration:

- `src/lib/storage/journal-storage.ts` - Interface defining storage operations (`JournalStorage`)
- `src/lib/storage/local-storage-adapter.ts` - localStorage implementation using `journal:YYYY-MM-DD` keys

To add a new storage backend, implement the `JournalStorage` interface and swap the adapter in `use-journal.ts`.

### Data Flow

1. **useJournal hook** (`src/hooks/use-journal.ts`) - Main state management for entries by date
2. **useHourNotes hook** (`src/hooks/use-hour-notes.ts`) - Per-hour input state with 500ms debounced auto-save
3. **HourSection** component renders individual hour blocks with blur effect for non-focused hours

### Routes

- `/` - Today's journal (JournalPage component)
- `/notes` - Calendar/list view of all days with entries
- `/notes/[date]` - View/edit specific date

### Key Patterns

- Entry IDs: `{date}-{hour}` format (e.g., `2024-01-15-14`)
- Date format: `YYYY-MM-DD` strings throughout
- All components are client-side (`"use client"`) due to localStorage dependency
- Arrow key navigation between hours when cursor is at text boundaries

## Tech Stack

- Next.js 16 with React Compiler (babel-plugin-react-compiler)
- Tailwind CSS 4 with tw-animate-css
- Oxlint + ultracite for linting
- @tabler/icons-react for icons
- next-themes for dark mode
