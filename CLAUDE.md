# CLAUDE.md — Hassad Project Context

## Project Overview

**Name:** حصاد (Hassad) — Comprehensive Self-Tracking System
**Purpose:** Arabic (RTL) personal development app for tracking habits, prayers, sports, goals, and a hashish cessation program. All data persisted in PostgreSQL via Prisma. Authentication via Auth.js (NextAuth v5).

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS (build-time via PostCSS, NOT CDN)
- **Font:** Tajawal (Google Fonts, loaded via next/font/google)
- **Database:** PostgreSQL (local) via Prisma ORM
- **Auth:** Auth.js (NextAuth v5) with Credentials provider (email/password)
- **AI:** Google Gemini API (`@google/genai`) — called server-side only via /api/coach
- **Charts:** recharts
- **Icons:** lucide-react
- **Dates:** date-fns

## Directory Structure

```
hassad/
  CLAUDE.md              # This file
  next.config.ts         # Next.js configuration
  tailwind.config.ts     # Tailwind CSS config
  postcss.config.mjs     # PostCSS config
  tsconfig.json          # TypeScript config
  package.json
  .env.local             # DATABASE_URL, AUTH_SECRET, GEMINI_API_KEY
  auth.ts                # Auth.js configuration
  middleware.ts          # Route protection
  types.ts               # All shared TypeScript types
  constants.tsx          # Category colors, mood emojis

  app/
    layout.tsx           # Root layout (<html lang="ar" dir="rtl">)
    globals.css          # Tailwind directives + body styles
    page.tsx             # Root — redirects to /dashboard
    loading.tsx          # Global loading
    login/
      page.tsx           # Login/Register (public)
    (dashboard)/
      layout.tsx         # Shell with Sidebar + MobileNav + SessionProvider
      dashboard/page.tsx
      prayers/page.tsx
      sports/page.tsx
      habits/page.tsx
      goals/page.tsx
      hashish/page.tsx
      coach/page.tsx
    api/
      auth/[...nextauth]/route.ts  # Auth.js handler
      auth/register/route.ts       # User registration
      state/route.ts               # GET/PUT full UserState
      coach/route.ts               # Gemini AI proxy

  components/            # All "use client" UI components
    Dashboard.tsx
    HabitTracker.tsx
    GoalTracker.tsx
    PrayerTracker.tsx
    SportsTracker.tsx
    HashishTracker.tsx
    AICoach.tsx
    Sidebar.tsx          # Desktop sidebar navigation
    MobileNav.tsx        # Mobile bottom navigation

  hooks/
    useUserState.ts      # Data fetching + mutation + auto-save

  lib/
    prisma.ts            # Prisma client singleton

  prisma/
    schema.prisma        # Database schema
```

## How to Add a New Page

1. Create `app/(dashboard)/newpage/page.tsx`
2. Add route to tabs array in `components/Sidebar.tsx` and `components/MobileNav.tsx`
3. Create component in `components/NewTracker.tsx`
4. Add types to `types.ts`
5. Add Prisma models to `prisma/schema.prisma`, run `npx prisma migrate dev`
6. Add data field to `UserState` interface
7. Update `app/api/state/route.ts` to read/write the new data

## Data Model (types.ts)

```typescript
interface UserState {
  habits: Habit[];           // name, category, frequency, completedDates, streak
  goals: Goal[];             // title, description, category, deadline, progress, tasks[]
  logs: DailyLog[];          // (unused) date, mood, notes
  prayerLogs: PrayerLog[];   // date, completed prayers
  workoutLogs: WorkoutLog[]; // date, type, duration, intensity
  hashishState: HashishState; // startDate, cleanStartDate, longestStreak, currentGoal, dayLogs[]
}
```

## Data Flow

1. Auth.js handles login/register. Session includes userId.
2. `useUserState()` hook calls `GET /api/state` on mount.
3. Mutations update local state immediately, then debounce `PUT /api/state`.
4. API routes use Prisma to read/write PostgreSQL.
5. AI Coach: client POSTs to `/api/coach`, server calls Gemini with full UserState.

## Database (Prisma)

Models: User, Habit, HabitCompletion, Goal, Task, PrayerLog, WorkoutLog, HashishState, HashishDayLog, HashishAttack.

## Environment Variables (.env.local)

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/hassad
AUTH_SECRET=<random>
GEMINI_API_KEY=<key>
```

## Commands

```bash
npm install              # Install deps
npx prisma migrate dev   # Create/apply migrations
npx prisma studio        # Visual DB editor
npm run dev              # Dev server at localhost:3000
npm run build            # Production build
```

## Conventions

- All Arabic text, RTL (`<html lang="ar" dir="rtl">`)
- Font: Tajawal (300, 400, 500, 700)
- Date format: `yyyy-MM-dd` strings everywhere
- IDs: `Date.now().toString()` on client, autoincrement on DB
- All tracker components are `"use client"`
- Color scheme: Indigo (primary), Emerald (prayers), Orange (sports), Red (danger), Slate (neutral)
