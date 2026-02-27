import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserState } from '@/types'

// ──────────────────────────────────────────────
// GET /api/state  →  assemble full UserState
// ──────────────────────────────────────────────
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as number

  // Fetch all data in parallel
  const [habits, goals, prayerLogs, workoutLogs, hashishState, hashishDayLogs, sleepLogs, quranState, quranLogs, projects, recoveryState, recoveryLogs, recoveryUrges, athkarLogs] =
    await Promise.all([
      prisma.habit.findMany({
        where: { userId },
        include: { completions: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.goal.findMany({
        where: { userId },
        include: { tasks: true },
      }),
      prisma.prayerLog.findMany({ where: { userId } }),
      prisma.workoutLog.findMany({ where: { userId } }),
      prisma.hashishState.findUnique({ where: { userId } }),
      prisma.hashishDayLog.findMany({
        where: { userId },
        include: { attacks: true },
      }),
      prisma.sleepLog.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
      prisma.quranState.findUnique({ where: { userId } }),
      prisma.quranLog.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
      prisma.project.findMany({
        where: { userId },
        include: { tasks: true },
      }),
      prisma.recoveryState.findUnique({ where: { userId } }),
      prisma.recoveryLog.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
      prisma.recoveryUrge.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      (prisma as any).athkarLog.findMany({ where: { userId } }),
    ])

  // Map to UserState shape
  const state: UserState = {
    habits: habits.map((h: any) => ({
      id: h.id,
      name: h.name,
      category: h.category as any,
      frequency: h.frequency as 'daily' | 'weekly',
      completedDates: h.completions.map((c: any) => c.date),
      streak: h.streak,
    })),
    goals: goals.map((g: any) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      category: g.category as any,
      deadline: g.deadline,
      progress: g.progress,
      tasks: g.tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
      })),
    })),
    logs: [],
    prayerLogs: prayerLogs.map((p: any) => ({
      date: p.date,
      completed: p.completedPrayers as any[],
    })),
    workoutLogs: workoutLogs.map((w: any) => ({
      date: w.date,
      type: w.type as any,
      duration: w.duration,
      intensity: w.intensity as any,
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
          attacks: d.attacks.map((a: any) => ({
            id: a.id,
            time: a.time,
            activity: a.activity,
            reason: a.reason,
            result: a.result as any,
          })),
        })),
      }
      : {
        startDate: new Date().toISOString().split('T')[0],
        cleanStartDate: null,
        longestStreak: 0,
        currentGoal: 7,
        dayLogs: [],
      },
    sleepLogs: (sleepLogs as any[]).map((s: any) => ({
      date: s.date,
      sleepTime: s.sleepTime,
      wakeTime: s.wakeTime,
      duration: s.duration,
    })),
    quranState: quranState
      ? {
        khatmaStartDate: quranState.khatmaStartDate,
        khatmaGoalDays: quranState.khatmaGoalDays,
        streak: quranState.streak,
        logs: quranLogs.map((q: any) => ({
          id: q.id,
          date: q.date,
          pagesRead: q.pagesRead,
        })),
      }
      : {
        khatmaStartDate: new Date().toISOString().split('T')[0],
        khatmaGoalDays: 300,
        streak: 0,
        logs: [],
      },
    projects: projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      progress: p.progress,
      lastActivity: p.lastActivity,
      targetGoal: p.targetGoal || undefined,
      currentStage: p.currentStage || undefined,
      tasks: p.tasks.map((t: any) => ({
        id: t.id,
        projectId: t.projectId,
        title: t.title,
        completed: t.completed,
        isTopTask: t.isTopTask,
        position: t.position,
      }))
    })),
    recoveryState: recoveryState
      ? {
        startDate: recoveryState.startDate,
        cleanStartDate: recoveryState.cleanStartDate,
        longestStreak: recoveryState.longestStreak,
        currentGoal: recoveryState.currentGoal,
        logs: recoveryLogs.map((l: any) => ({
          id: l.id,
          date: l.date,
          pressureLevel: l.pressureLevel as any,
          isClean: l.isClean,
        })),
        urges: recoveryUrges.map((u: any) => ({
          id: u.id,
          date: u.date,
          time: u.time,
          reason: u.reason,
          intensity: u.intensity,
          alternativeUsed: u.alternativeUsed || undefined,
        })),
      }
      : {
        startDate: new Date().toISOString().split('T')[0],
        cleanStartDate: null,
        longestStreak: 0,
        currentGoal: 7,
        logs: [],
        urges: [],
      },
    athkarLogs: (athkarLogs as any[]).map((a: any) => ({
      date: a.date,
      morningCompleted: a.morningCompleted,
      eveningCompleted: a.eveningCompleted,
      counts: (a.counts as any) || {},
    })),
  }

  return NextResponse.json(state)
}

// ──────────────────────────────────────────────
// PUT /api/state  →  bulk upsert full UserState
// ──────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = (session.user as any).id as number

  const state: UserState = await request.json()

  // Run all upserts in a transaction
  await prisma.$transaction(async (tx) => {
    // ── Habits ──────────────────────────────
    for (const habit of state.habits) {
      await tx.habit.upsert({
        where: { id: habit.id },
        update: {
          name: habit.name,
          category: habit.category,
          frequency: habit.frequency,
          streak: habit.streak,
        },
        create: {
          id: habit.id,
          userId,
          name: habit.name,
          category: habit.category,
          frequency: habit.frequency,
          streak: habit.streak,
        },
      })

      // Upsert completions
      for (const date of habit.completedDates) {
        await tx.habitCompletion.upsert({
          where: { habitId_date: { habitId: habit.id, date } },
          update: {},
          create: { habitId: habit.id, date },
        })
      }

      // Remove completions no longer present
      await tx.habitCompletion.deleteMany({
        where: {
          habitId: habit.id,
          date: { notIn: habit.completedDates },
        },
      })
    }

    // Delete habits removed by user
    const habitIds = state.habits.map((h) => h.id)
    await tx.habit.deleteMany({
      where: { userId, id: { notIn: habitIds } },
    })

    // ── Goals ───────────────────────────────
    for (const goal of state.goals) {
      await tx.goal.upsert({
        where: { id: goal.id },
        update: {
          title: goal.title,
          description: goal.description,
          category: goal.category,
          deadline: goal.deadline,
          progress: goal.progress,
        },
        create: {
          id: goal.id,
          userId,
          title: goal.title,
          description: goal.description,
          category: goal.category,
          deadline: goal.deadline,
          progress: goal.progress,
        },
      })

      for (const task of goal.tasks) {
        await tx.task.upsert({
          where: { id: task.id },
          update: { title: task.title, completed: task.completed },
          create: {
            id: task.id,
            goalId: goal.id,
            title: task.title,
            completed: task.completed,
          },
        })
      }

      const taskIds = goal.tasks.map((t) => t.id)
      await tx.task.deleteMany({
        where: { goalId: goal.id, id: { notIn: taskIds } },
      })
    }

    const goalIds = state.goals.map((g) => g.id)
    await tx.goal.deleteMany({
      where: { userId, id: { notIn: goalIds } },
    })

    // ── Prayer Logs ─────────────────────────
    for (const log of state.prayerLogs) {
      await tx.prayerLog.upsert({
        where: { userId_date: { userId, date: log.date } },
        update: { completedPrayers: log.completed as string[] },
        create: {
          userId,
          date: log.date,
          completedPrayers: log.completed as string[],
        },
      })
    }

    // ── Workout Logs ─────────────────────────
    for (const log of state.workoutLogs) {
      await tx.workoutLog.upsert({
        where: { userId_date: { userId, date: log.date } },
        update: { type: log.type, duration: log.duration, intensity: log.intensity },
        create: {
          userId,
          date: log.date,
          type: log.type,
          duration: log.duration,
          intensity: log.intensity,
        },
      })
    }

    const workoutDates = state.workoutLogs.map((w) => w.date)
    await tx.workoutLog.deleteMany({
      where: { userId, date: { notIn: workoutDates } },
    })

    // ── Sleep Logs ────────────────────────────
    for (const log of (state.sleepLogs || [])) {
      await (tx as any).sleepLog.upsert({
        where: { userId_date: { userId, date: log.date } },
        update: { sleepTime: log.sleepTime, wakeTime: log.wakeTime, duration: log.duration },
        create: { userId, date: log.date, sleepTime: log.sleepTime, wakeTime: log.wakeTime, duration: log.duration },
      })
    }
    const sleepDates = (state.sleepLogs || []).map((s) => s.date)
    await (tx as any).sleepLog.deleteMany({
      where: { userId, date: { notIn: sleepDates } },
    })

    // ── Hashish State ─────────────────────────
    const hs = state.hashishState
    await tx.hashishState.upsert({
      where: { userId },
      update: {
        startDate: hs.startDate,
        cleanStartDate: hs.cleanStartDate ?? null,
        longestStreak: hs.longestStreak,
        currentGoal: hs.currentGoal,
      },
      create: {
        userId,
        startDate: hs.startDate,
        cleanStartDate: hs.cleanStartDate ?? null,
        longestStreak: hs.longestStreak,
        currentGoal: hs.currentGoal,
      },
    })

    // ── Hashish Day Logs ──────────────────────
    for (const dayLog of hs.dayLogs) {
      const dbDayLog = await tx.hashishDayLog.upsert({
        where: { userId_date: { userId, date: dayLog.date } },
        update: { count: dayLog.count, smokedDuringWork: dayLog.smokedDuringWork },
        create: {
          userId,
          date: dayLog.date,
          count: dayLog.count,
          smokedDuringWork: dayLog.smokedDuringWork,
        },
      })

      for (const attack of dayLog.attacks) {
        await tx.hashishAttack.upsert({
          where: { id: attack.id },
          update: {
            time: attack.time,
            activity: attack.activity,
            reason: attack.reason,
            result: attack.result,
          },
          create: {
            id: attack.id,
            dayLogId: dbDayLog.id,
            time: attack.time,
            activity: attack.activity,
            reason: attack.reason,
            result: attack.result,
          },
        })
      }

      const attackIds = dayLog.attacks.map((a) => a.id)
      await tx.hashishAttack.deleteMany({
        where: { dayLogId: dbDayLog.id, id: { notIn: attackIds } },
      })
    }

    // ── Quran State ───────────────────────────
    if (state.quranState) {
      await tx.quranState.upsert({
        where: { userId },
        update: {
          khatmaStartDate: state.quranState.khatmaStartDate,
          khatmaGoalDays: state.quranState.khatmaGoalDays,
          streak: state.quranState.streak,
        },
        create: {
          userId,
          khatmaStartDate: state.quranState.khatmaStartDate,
          khatmaGoalDays: state.quranState.khatmaGoalDays,
          streak: state.quranState.streak,
        },
      })

      // Upsert Quran Logs
      for (const log of state.quranState.logs) {
        await tx.quranLog.upsert({
          where: { id: log.id },
          update: {
            date: log.date,
            pagesRead: log.pagesRead,
          },
          create: {
            id: log.id,
            userId,
            date: log.date,
            pagesRead: log.pagesRead,
          },
        })
      }

      // Delete removed Quran logs
      const quranLogIds = state.quranState.logs.map((l) => l.id)
      await tx.quranLog.deleteMany({
        where: { userId, id: { notIn: quranLogIds } },
      })
    }

    // ── Projects ──────────────────────────────
    for (const project of state.projects) {
      await tx.project.upsert({
        where: { id: project.id },
        update: {
          name: project.name,
          status: project.status,
          progress: project.progress,
          lastActivity: project.lastActivity,
          targetGoal: project.targetGoal,
          currentStage: project.currentStage,
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
        },
      })

      // Upsert tasks
      for (const task of project.tasks) {
        await tx.projectTask.upsert({
          where: { id: task.id },
          update: {
            title: task.title,
            completed: task.completed,
            isTopTask: task.isTopTask,
            position: task.position,
          },
          create: {
            id: task.id,
            projectId: project.id,
            title: task.title,
            completed: task.completed,
            isTopTask: task.isTopTask,
            position: task.position,
          },
        })
      }

      // Remove deleted tasks
      const taskIds = project.tasks.map((t) => t.id)
      await tx.projectTask.deleteMany({
        where: { projectId: project.id, id: { notIn: taskIds } },
      })
    }

    // Delete removed projects
    const projectIds = state.projects.map((p) => p.id)
    await tx.project.deleteMany({
      where: { userId, id: { notIn: projectIds } },
    })

    // ── Recovery ──────────────────────────────
    if (state.recoveryState) {
      await tx.recoveryState.upsert({
        where: { userId },
        update: {
          startDate: state.recoveryState.startDate,
          cleanStartDate: state.recoveryState.cleanStartDate,
          longestStreak: state.recoveryState.longestStreak,
          currentGoal: state.recoveryState.currentGoal,
        },
        create: {
          userId,
          startDate: state.recoveryState.startDate,
          cleanStartDate: state.recoveryState.cleanStartDate,
          longestStreak: state.recoveryState.longestStreak,
          currentGoal: state.recoveryState.currentGoal,
        },
      })

      // Upsert logs
      for (const log of state.recoveryState.logs) {
        await tx.recoveryLog.upsert({
          where: { userId_date: { userId, date: log.date } },
          update: {
            pressureLevel: log.pressureLevel,
            isClean: log.isClean,
          },
          create: {
            userId,
            date: log.date,
            pressureLevel: log.pressureLevel,
            isClean: log.isClean,
          },
        })
      }

      // Upsert urges
      for (const urge of state.recoveryState.urges) {
        await tx.recoveryUrge.upsert({
          where: { id: urge.id },
          update: {
            date: urge.date,
            time: urge.time,
            reason: urge.reason,
            intensity: urge.intensity,
            alternativeUsed: urge.alternativeUsed,
          },
          create: {
            id: urge.id,
            userId,
            date: urge.date,
            time: urge.time,
            reason: urge.reason,
            intensity: urge.intensity,
            alternativeUsed: urge.alternativeUsed,
          },
        })
      }
    }

    // ── Athkar Logs ───────────────────────────
    for (const log of (state.athkarLogs || [])) {
      await (tx as any).athkarLog.upsert({
        where: { userId_date: { userId, date: log.date } },
        update: {
          morningCompleted: log.morningCompleted,
          eveningCompleted: log.eveningCompleted,
          counts: log.counts as any,
        },
        create: {
          userId,
          date: log.date,
          morningCompleted: log.morningCompleted,
          eveningCompleted: log.eveningCompleted,
          counts: log.counts as any,
        },
      })
    }
  })

  return NextResponse.json({ ok: true })
}
