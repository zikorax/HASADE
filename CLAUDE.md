# CLAUDE.md — Hassad Project Context

## Project Overview

**Name:** حصاد (Hassad) — Comprehensive Self-Tracking System
**Purpose:** Arabic (RTL) personal development and self-accountability web app for a Muslim user undertaking serious personal reform. Tracks habits, prayers, Quran reading, sports, goals, projects, sleep, a hashish cessation program, and a general recovery tracker. All data persisted in PostgreSQL via Prisma. Authentication via Auth.js (NextAuth v5).

**Design philosophy:** Single-user-in-practice (one person's data), but multi-user architecture. All mutations are optimistic (UI updates instantly), then debounce-saved 1.5s later. The entire UserState is sent as one JSON body on every save (monolithic state sync).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, server + client components) |
| Language | TypeScript 5.8 (strict) |
| Styling | Tailwind CSS 3.4 + @tailwindcss/forms (PostCSS build-time only, NO CDN) |
| Font | Tajawal (Google Fonts, Arabic-optimized, weights 300/400/500/700) |
| Database | PostgreSQL via Prisma ORM 6.9 |
| Auth | Auth.js (NextAuth v5 beta) — JWT sessions, Credentials provider (email/password) |
| AI | Google Gemini API (`@google/genai` v1.38, model: `gemini-3-flash-preview`) — server-side only |
| Charts | Recharts 3.7 |
| Icons | Lucide React 0.575 |
| Dates | date-fns 4.1 (Arabic locale available) |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities |
| Validation | Zod 3.24 |
| Password hashing | bcryptjs (marked as serverExternalPackages in next.config.ts) |

---

## Directory Structure

```
hassad/
  CLAUDE.md                        # This file — full project context
  next.config.ts                   # Next.js config (bcryptjs as serverExternalPackages)
  tailwind.config.ts               # Tailwind with Tajawal font + @tailwindcss/forms
  postcss.config.mjs               # PostCSS standard config
  tsconfig.json                    # TypeScript compiler config
  package.json
  .env.local                       # DATABASE_URL, AUTH_SECRET, GEMINI_API_KEY
  auth.ts                          # Auth.js full config (dynamic imports for edge safety)
  middleware.ts                    # Route protection (manual cookie check, edge-safe)
  types.ts                         # ALL shared TypeScript interfaces and enums
  constants.tsx                    # CATEGORY_COLORS map + MOOD_EMOJIS array

  app/
    layout.tsx                     # Root layout: <html lang="ar" dir="rtl">, LanguageProvider
    globals.css                    # Tailwind directives + Google Fonts import + body styles
    page.tsx                       # Root "/" — checks session, redirects to /login or /dashboard
    loading.tsx                    # Global loading spinner (Arabic "جاري التحميل...")

    login/
      page.tsx                     # Login + Register combined (public, client component)

    (dashboard)/                   # Route group — all authenticated pages
      layout.tsx                   # Server: checks auth(), renders Sidebar + MobileNav + SessionProvider
      dashboard/page.tsx           # Overview page
      daily/page.tsx               # Unified daily entry (all trackers on one form)
      prayers/page.tsx
      sports/page.tsx
      habits/page.tsx
      goals/page.tsx
      hashish/page.tsx
      recovery/page.tsx            # General recovery tracker ("Secret Habit")
      sleep/page.tsx
      quran/page.tsx
      projects/
        page.tsx                   # Server component — auth check, renders ProjectsClient
        ProjectsClient.tsx         # Client wrapper with all project mutation hooks
      athkar/page.tsx              # FULLY STANDALONE — all UI inline (449 lines), no separate component
      expiations/page.tsx          # Static Islamic expiations reference — no DB mutations
      coach/page.tsx               # AI Coach chat
      settings/page.tsx            # Language switcher (AR/EN)

    api/
      auth/[...nextauth]/route.ts  # Auth.js GET + POST handlers
      auth/register/route.ts       # POST — create user + hash password + default HashishState
      state/route.ts               # GET: assemble full UserState (14 parallel queries)
                                   # PUT: bulk upsert entire UserState in one $transaction
      coach/route.ts               # POST — Gemini AI proxy (receives userState + prompt)

  components/                      # All "use client" components
    Sidebar.tsx                    # Desktop right sidebar, 15 nav items, signOut, useLanguage
    MobileNav.tsx                  # Mobile sticky bottom nav, same 15 items, horizontally scrollable
    Layout.tsx                     # LEGACY — older single-page pattern, unused in current routing
    Dashboard.tsx                  # 9 stat cards + pie chart + project/goal preview
    DailyEntry.tsx                 # All-in-one daily log (Recovery + Hashish + Sports + Prayers + Quran + Sleep)
    HabitTracker.tsx               # Habit list with toggle, streak, add form
    GoalTracker.tsx                # Goal cards with progress bar, tasks, add/delete
    PrayerTracker.tsx              # Day/month view; 5 prayers toggle; countdown timer; hardcoded prayer times
    SportsTracker.tsx              # Day/month view; workout form; level system (5 levels by streak)
    HashishTracker.tsx             # Day/month view; 4-week tapering; attack log; clean-day tracker
    RecoveryTracker.tsx            # Sober counter; pressure indicator; urge modal; protocol modal; 30-day heatmap
    SleepTracker.tsx               # Day/month view; sleep/wake time inputs; 14-day ComposedChart
    QuranTracker.tsx               # Day/month view; page logging; khatma progress; streak recalculated client-side
    ProjectsTracker.tsx            # Project list + detail; DnD sortable tasks; Pomodoro integration
    PomodoroTimer.tsx              # 25/5 timer; SVG ring; auto break; calls onSessionComplete callback
    AICoach.tsx                    # Chat UI; auto-analysis on mount; full userState sent to Gemini

  hooks/
    useUserState.ts                # THE central hook — all state, fetching, auto-save, every mutation

  lib/
    prisma.ts                      # PrismaClient singleton (globalThis pattern for HMR safety)
    i18n/
      LanguageContext.tsx          # React context for AR/EN switching (localStorage persisted)
      translations.ts              # Translation strings (currently only sidebar nav + settings)

  prisma/
    schema.prisma                  # 19 DB models

  services/                        # Empty — reserved for future server-side abstractions
```

---

## All Pages and Their Purpose

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | app/page.tsx | Redirects to /dashboard or /login |
| `/login` | login/page.tsx | Login + Register |
| `/daily` | DailyEntry.tsx | Unified daily entry — 6 trackers in one form |
| `/dashboard` | Dashboard.tsx | Overview: stats, charts, project/goal preview |
| `/prayers` | PrayerTracker.tsx | 5 daily prayers; day + month calendar view |
| `/sports` | SportsTracker.tsx | Workout logging; streak levels; day + month view |
| `/habits` | HabitTracker.tsx | Daily/weekly habits with streaks |
| `/goals` | GoalTracker.tsx | Strategic goals with sub-tasks and progress |
| `/hashish` | HashishTracker.tsx | Hashish cessation — 4-week tapering program |
| `/recovery` | RecoveryTracker.tsx | General addiction recovery ("Secret Habit") |
| `/sleep` | SleepTracker.tsx | Sleep time tracking + 14-day chart |
| `/quran` | QuranTracker.tsx | Quran pages + khatma progress + streak |
| `/projects` | ProjectsTracker.tsx | Projects + DnD tasks + Pomodoro timer |
| `/athkar` | (inline in page.tsx) | Morning/evening Athkar counter + calendar |
| `/expiations` | (inline in page.tsx) | Static Islamic expiations reference |
| `/coach` | AICoach.tsx | Gemini AI chat with full UserState context |
| `/settings` | (inline in page.tsx) | AR/EN language toggle |

---

## How to Add a New Page

1. Create `app/(dashboard)/newpage/page.tsx`
2. Add route to nav arrays in `components/Sidebar.tsx` and `components/MobileNav.tsx`
3. Create component in `components/NewTracker.tsx`
4. Add types/interfaces to `types.ts`
5. Add data field to `UserState` interface in `types.ts`
6. Add Prisma models to `prisma/schema.prisma`, run `npx prisma migrate dev`
7. Add mutation helpers to `hooks/useUserState.ts`
8. Update `app/api/state/route.ts` — add query to GET handler and upsert/delete to PUT handler

---

## Full Data Model (types.ts)

### Enums

```typescript
enum Category { HEALTH, FINANCE, SPIRITUAL, CAREER, SOCIAL, LEARNING, PERSONAL }
enum PrayerName { FAJR, DHUHR, ASR, MAGHRIB, ISHA }
enum WorkoutType { GYM, RUNNING, HOME }
enum Intensity { LOW, MEDIUM, HIGH }
enum AttackResult { RESISTED, FELL }
```

### UserState — The Master Object

```typescript
interface UserState {
  habits: Habit[]               // Daily/weekly habits with streaks
  goals: Goal[]                 // Strategic goals with sub-tasks
  logs: DailyLog[]              // LEGACY — unused in current UI/API
  prayerLogs: PrayerLog[]       // Which prayers completed per day
  workoutLogs: WorkoutLog[]     // One workout per day
  hashishState: HashishState    // Full cessation program state
  sleepLogs: SleepLog[]         // Sleep/wake times per night
  quranState: QuranState        // Khatma settings + streak
  quranLogs: QuranLog[]         // Pages read per day
  projects: Project[]           // Projects with tasks + pomodoro count
  recoveryState: RecoveryState  // Recovery program settings
  recoveryLogs: RecoveryLog[]   // Daily pressure + clean/relapse per day
  recoveryUrges: RecoveryUrge[] // Logged cravings with coping strategies
  athkarLogs: AthkarLog[]       // Morning/evening Athkar completion per day
}
```

### Key Interface Details

```typescript
interface Habit { id, name, category: Category, frequency: 'daily'|'weekly', completedDates: string[], streak: number }
interface Goal { id, title, description, category, deadline, progress: number, tasks: Task[] }
interface Task { id, title, completed: boolean }
interface PrayerLog { date: string, completed: PrayerName[] }
interface WorkoutLog { date, type: WorkoutType, duration: number, intensity: Intensity }
interface HashishState { startDate, cleanStartDate: string|null, longestStreak, currentGoal, dayLogs: HashishDayLog[] }
interface HashishDayLog { date, count, attacks: HashishAttack[], smokedDuringWork: boolean }
interface HashishAttack { id, time, activity, reason, result: AttackResult }
interface SleepLog { date, sleepTime: string, wakeTime: string, duration: number }
interface QuranState { khatmaStartDate, khatmaGoalDays: number, streak: number, logs: QuranLog[] }
interface QuranLog { id, date, pagesRead: number }
interface Project { id, name, status, progress, lastActivity, targetGoal?, currentStage?, pomodoroCount?, tasks: ProjectTask[] }
interface ProjectTask { id, projectId, title, completed, isTopTask, position, recurrence?, lastCompletedDate? }
interface RecoveryState { startDate, cleanStartDate: string|null, longestStreak, currentGoal, logs: RecoveryLog[], urges: RecoveryUrge[] }
interface RecoveryLog { id, date, pressureLevel: 'low'|'medium'|'high', isClean: boolean }
interface RecoveryUrge { id, date, time, reason, intensity: number, alternativeUsed? }
interface AthkarLog { date, morningCompleted, eveningCompleted, counts: Record<string, number> }
```

---

## Database Schema (19 Prisma Models)

```
User               — id(Int), email(unique), passwordHash, createdAt
Habit              — id(String client-gen), userId, name, category, frequency, streak
HabitCompletion    — habitId + date (unique together)
Goal               — id(String), userId, title, description, category, deadline, progress
Task               — id(String), goalId, title, completed
PrayerLog          — userId + date (unique), completedPrayers: String[]
WorkoutLog         — userId + date (unique), type, duration, intensity
HashishState       — userId(unique), startDate, cleanStartDate?, longestStreak, currentGoal
HashishDayLog      — userId + date (unique), count, smokedDuringWork
HashishAttack      — id(String), dayLogId, time, activity, reason, result
SleepLog           — userId + date (unique), sleepTime, wakeTime, duration(Float)
QuranState         — userId(unique), khatmaStartDate, khatmaGoalDays(default 300), streak
QuranLog           — userId + date (unique), pagesRead
Project            — id(String), userId, name, status, progress, lastActivity, targetGoal?, currentStage?, pomodoroCount, createdAt, updatedAt
ProjectTask        — id(String), projectId, title, completed, isTopTask, position, recurrence?, lastCompletedDate?
RecoveryState      — userId(PK=unique), startDate, cleanStartDate?, longestStreak, currentGoal
RecoveryLog        — userId + date (unique), pressureLevel, isClean
RecoveryUrge       — userId, date, time, reason, intensity, alternativeUsed?, createdAt
AthkarLog          — userId + date (unique), morningCompleted, eveningCompleted, counts(Json)
```

---

## API Routes

### `POST /api/auth/register`
Creates user (bcrypt 12 rounds) + default HashishState record. Validates with Zod.

### `GET /api/state`
Runs **14 Prisma queries in parallel** via `Promise.all()`. Maps DB records → `UserState`. Provides defaults for hashishState, quranState, recoveryState if not yet created.

### `PUT /api/state`
Wraps everything in a **single `$transaction`**. For each entity: upserts present records + `deleteMany` absent records (full sync). Handles all 19 models.

### `POST /api/coach`
Builds Arabic system prompt identifying AI as Hassad's personal coach. Serializes full `userState` as JSON into context. Calls `gemini-3-flash-preview` (temp 0.7). Returns `{ text }`.

---

## Data Flow

### Initial Load
```
Component mounts → useUserState() hook
  → fetch GET /api/state
  → 14 parallel Prisma queries
  → client receives UserState JSON
  → recalculates Quran streak client-side (never trust DB value)
  → resets expired recurring project tasks (daily/monthly)
  → setUserState(data) → UI renders
```

### Mutation Flow (e.g., toggle prayer)
```
User clicks prayer button
  → togglePrayer(date, prayer) called
  → update(updater): setUserState(newState) [INSTANT — no loading]
  → saveState(newState) called
  → clears previous 1.5s debounce timer, sets new one
  → [1500ms later] PUT /api/state { body: fullUserState }
  → prisma.$transaction([all upserts + deletes])
  → { ok: true }
```

### AI Coach Flow
```
/coach page mounts
  → POST /api/coach { userState } (no prompt = initial analysis)
  → Gemini receives full state as context
  → returns Arabic analysis text
User sends message
  → POST /api/coach { userState, prompt: message }
  → Gemini responds with personalized advice
```

---

## Key Patterns and Conventions

### State Management
- **Single hook** `useUserState.ts` owns ALL state and ALL mutations
- **Optimistic updates** — `setUserState` fires instantly before any DB call
- **Debounce 1500ms** — mutations batch into one save per 1.5s window
- **Monolithic sync** — entire `UserState` sent on every save (not partial patches)

### Quran Streak
Never stored in DB permanently. Always recalculated client-side from `logs[]` array on load and every mutation. `calculateQuranStreak()` counts consecutive days from today/yesterday backwards.

### Project "Top Task" System
`isTopTask: boolean` marks the most important next task. When the top task is completed, the hook automatically promotes the next uncompleted task (by position). Dashboard shows top task per project with no user effort.

### Recurring Project Tasks
On app load, hook checks all project tasks:
- `recurrence='daily'` + completed yesterday or earlier → reset `completed=false`
- `recurrence='monthly'` + completed in prior month → reset `completed=false`
If any resets occur, immediately fires `PUT /api/state` to persist.

### ID Generation
- Client-created records: `Date.now().toString()` (e.g., `"1709299200000"`)
- DB auto-increment for system records (PrayerLog, WorkoutLog, etc.)

### Date/Time Conventions
- All dates: `"yyyy-MM-dd"` strings (e.g., `"2026-03-01"`)
- All times: `"HH:mm"` strings (e.g., `"23:30"`)
- Never `Date` objects in state or DB — avoids JSON timezone bugs

### Auth Architecture
- `middleware.ts` — manually checks 4 possible auth cookie names (v4/v5, http/https) — edge-safe workaround
- `auth.ts` — dynamic imports for `prisma` and `bcryptjs` inside `authorize()` to avoid edge runtime errors
- Session contains `user.id: number` (userId) after JWT callback

### Prayer Times
Hardcoded in `PrayerTracker.tsx`: Fajr 05:40, Dhuhr 12:49, Asr 15:53, Maghrib 18:22, Isha 19:36. Not fetched from any API.

### RTL Layout
`<html lang="ar" dir="rtl">` at root. Some calendar sub-components use `dir="ltr"` explicitly to keep grid order correct inside RTL parent.

### i18n
`LanguageContext` + `translations.ts` support AR/EN switching (localStorage). Currently only sidebar nav + settings page are translated. All tracker components have hardcoded Arabic text.

### Athkar Page
Unlike all other trackers, `/athkar/page.tsx` contains the entire UI inline (449 lines) — no separate component file. `morningAthkar` and `eveningAthkar` arrays are defined directly in the page file.

### Hashish State on Registration
`POST /api/auth/register` immediately creates a `HashishState` DB record with `startDate = today, currentGoal = 7`. This ensures the hashish tracker works from day one.

### DnD in Projects
`@dnd-kit` with `SortableContext` (vertical list strategy). `moveProjectTask()` in the hook handles array splice + position renumber + isTopTask reassignment.

### Pomodoro Timer
`PomodoroTimer.tsx` — 25 min focus / 5 min break cycle. SVG ring progress. On session complete: plays `/alarm.mp3`, calls `onSessionComplete()` → hook increments `project.pomodoroCount`.

---

## Color Scheme

| Color | Usage |
|-------|-------|
| Indigo | Primary — habits, goals, projects, general UI |
| Emerald | Spiritual — prayers, Quran |
| Orange/Amber | Sports, Athkar (morning) |
| Purple | Sleep tracker |
| Slate | Neutral backgrounds, hashish (dark theme) |
| Red | Danger states, relapses |

---

## Environment Variables (.env.local)

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/hassad
AUTH_SECRET=<random 32+ char string>
GEMINI_API_KEY=<Google AI Studio key>
```

---

## Commands

```bash
npm install                    # Install dependencies
npx prisma migrate dev         # Create and apply DB migrations
npx prisma studio              # Visual DB editor at localhost:5555
npm run dev                    # Dev server at localhost:3000
npm run build                  # Production build
npm run lint                   # ESLint check
```
