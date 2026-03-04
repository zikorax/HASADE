import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserState } from '@/types'

// ──────────────────────────────────────────────
// GET /api/state
// ──────────────────────────────────────────────
export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id as number

  const [
    habits,
    goals,
    prayerLogs,
    workoutLogs,
    hashishState,
    hashishDayLogs,
    sleepLogs,
    quranState,
    quranLogs,
    projects,
    recoveryState,
    recoveryLogs,
    recoveryUrges,
    athkarLogs
  ] = await Promise.all([
    prisma.habit.findMany({
      where: { userId },
      include: { completions: true },
      orderBy: { createdAt: 'asc' }
    }),

    prisma.goal.findMany({
      where: { userId },
      include: { tasks: true }
    }),

    prisma.prayerLog.findMany({ where: { userId } }),

    prisma.workoutLog.findMany({ where: { userId } }),

    prisma.hashishState.findUnique({ where: { userId } }),

    prisma.hashishDayLog.findMany({
      where: { userId },
      include: { attacks: true }
    }),

    prisma.sleepLog.findMany({
      where: { userId },
      orderBy: { date: 'asc' }
    }),

    prisma.quranState.findUnique({ where: { userId } }),

    prisma.quranLog.findMany({
      where: { userId },
      orderBy: { date: 'asc' }
    }),

    prisma.project.findMany({
      where: { userId },
      include: { tasks: true }
    }),

    prisma.recoveryState.findUnique({ where: { userId } }),

    prisma.recoveryLog.findMany({
      where: { userId },
      orderBy: { date: 'asc' }
    }),

    prisma.recoveryUrge.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    }),

    (prisma as any).athkarLog.findMany({ where: { userId } })
  ])

  const state: UserState = {
    habits: habits.map((h: any) => ({
      id: h.id,
      name: h.name,
      category: h.category,
      frequency: h.frequency,
      completedDates: h.completions.map((c: any) => c.date),
      streak: h.streak
    })),

    goals: goals.map((g: any) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      category: g.category,
      deadline: g.deadline,
      progress: g.progress,
      tasks: g.tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        completed: t.completed
      }))
    })),

    logs: [],

    prayerLogs: prayerLogs.map((p: any) => ({
      date: p.date,
      completed: p.completedPrayers
    })),

    workoutLogs: workoutLogs.map((w: any) => ({
      date: w.date,
      type: w.type,
      duration: w.duration,
      intensity: w.intensity
    })),

    hashishState: hashishState
      ? {
        startDate: hashishState.startDate,
        cleanStartDate: hashishState.cleanStartDate ?? null,
        longestStreak: hashishState.longestStreak,
        currentGoal: hashishState.currentGoal,
        dayLogs: hashishDayLogs.map((d: any) => ({
          date: d.date,
          count: d.count,
          smokedDuringWork: d.smokedDuringWork,
          attacks: d.attacks
        }))
      }
      : {
        startDate: new Date().toISOString().split('T')[0],
        cleanStartDate: null,
        longestStreak: 0,
        currentGoal: 7,
        dayLogs: []
      },

    sleepLogs: sleepLogs,

    quranState: quranState
      ? {
        khatmaStartDate: quranState.khatmaStartDate,
        khatmaGoalDays: quranState.khatmaGoalDays,
        streak: quranState.streak,
        logs: quranLogs
      }
      : {
        khatmaStartDate: new Date().toISOString().split('T')[0],
        khatmaGoalDays: 300,
        streak: 0,
        logs: []
      },

    projects: projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      progress: p.progress,
      lastActivity: p.lastActivity,
      targetGoal: p.targetGoal || undefined,
      currentStage: p.currentStage || undefined,
      pomodoroCount: p.pomodoroCount,
      totalSeconds: p.totalSeconds || 0,
      tasks: p.tasks
    })),

    recoveryState: recoveryState
      ? {
        startDate: recoveryState.startDate,
        cleanStartDate: recoveryState.cleanStartDate,
        longestStreak: recoveryState.longestStreak,
        currentGoal: recoveryState.currentGoal,
        logs: recoveryLogs,
        urges: recoveryUrges
      }
      : {
        startDate: new Date().toISOString().split('T')[0],
        cleanStartDate: null,
        longestStreak: 0,
        currentGoal: 7,
        logs: [],
        urges: []
      },

    athkarLogs: athkarLogs
  }

  return NextResponse.json(state)
}

// ──────────────────────────────────────────────
// PUT /api/state
// ──────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id as number
  const state: UserState = await request.json()

  if (!state || typeof state !== "object") {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {

    // ───────────────── HABITS ─────────────────
    for (const habit of state.habits || []) {
      await tx.habit.upsert({
        where: { id: habit.id },
        update: {
          name: habit.name,
          category: habit.category,
          frequency: habit.frequency,
          streak: habit.streak
        },
        create: {
          id: habit.id,
          userId,
          name: habit.name,
          category: habit.category,
          frequency: habit.frequency,
          streak: habit.streak
        }
      })
    }

    const habitIds = state.habits?.map(h => h.id) || []
    if (habitIds.length > 0) {
      await tx.habit.deleteMany({
        where: { userId, id: { notIn: habitIds } }
      })
    }

    // ───────────────── GOALS ─────────────────
    for (const goal of state.goals || []) {
      await tx.goal.upsert({
        where: { id: goal.id },
        update: {
          title: goal.title,
          description: goal.description,
          category: goal.category,
          deadline: goal.deadline,
          progress: goal.progress
        },
        create: {
          id: goal.id,
          userId,
          title: goal.title,
          description: goal.description,
          category: goal.category,
          deadline: goal.deadline,
          progress: goal.progress
        }
      })
    }

    const goalIds = state.goals?.map(g => g.id) || []
    if (goalIds.length > 0) {
      await tx.goal.deleteMany({
        where: { userId, id: { notIn: goalIds } }
      })
    }

    // ───────────────── PROJECTS ─────────────────
    for (const project of state.projects || []) {
      await tx.project.upsert({
        where: { id: project.id },
        update: {
          name: project.name,
          status: project.status,
          progress: project.progress,
          lastActivity: project.lastActivity,
          targetGoal: project.targetGoal,
          currentStage: project.currentStage,
          pomodoroCount: project.pomodoroCount || 0,
          totalSeconds: project.totalSeconds || 0
        },
        create: {
          id: project.id,
          userId,
          name: project.name,
          status: project.status,
          progress: project.progress,
          lastActivity: project.lastActivity,
          targetGoal: project.targetGoal,
          currentStage: project.currentStage,
          pomodoroCount: project.pomodoroCount || 0,
          totalSeconds: project.totalSeconds || 0
        }
      })
    }

    const projectIds = state.projects?.map(p => p.id) || []

    if (projectIds.length > 0) {
      await tx.project.deleteMany({
        where: {
          userId,
          id: { notIn: projectIds }
        }
      })
    }

  })

  return NextResponse.json({ ok: true })
}