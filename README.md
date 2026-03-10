# Ilo

A time-based journal for people who think in hours, not pages.

Ilo organizes your notes by the hour of the day — so instead of scrolling through
a wall of text, you can find exactly what you were thinking at 9am, 3pm, or midnight.
No setup. No accounts. Just open it and start writing.

## What it does

- **Write by the hour** — each hour of the day has its own space
- **Auto-saves as you type** — nothing to click, nothing to lose
- **Stays focused** — only the current hour is in full view; past and future hours are softened so you can concentrate on now
- **Keyboard-friendly** — navigate between hours with arrow keys without lifting your hands

## How it's built

| Layer | Approach |
|---|---|
| Storage | localStorage with a clean adapter pattern — ready to swap in a real database |
| Auto-save | 500ms debounce on content change |
| Data shape | Maps directly to a future database schema (date, hour, content, timestamps) |
| Structure | Storage interface, hooks, and components are kept separate |

## What's next

- [ ] Database migration (PostgreSQL / SQLite)
- [ ] Search and filtering across entries
- [ ] Export to text or markdown
- [ ] Tags and categories
- [ ] Rich text support
