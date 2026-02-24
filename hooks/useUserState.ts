'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  UserState,
  Habit,
  Goal,
  Task,
  PrayerName,
  WorkoutLog,
  HashishState,
  SleepLog,
  Category,
  QuranLog,
  QuranState,
  Project,
  ProjectTask,
  RecoveryLog,
  RecoveryUrge,
  RecoveryState,
  AthkarLog,
} from '@/types'

const INITIAL_STATE: UserState = {
  habits: [],
  goals: [],
  logs: [],
  prayerLogs: [],
  workoutLogs: [],
  hashishState: {
    startDate: new Date().toISOString().split('T')[0],
    cleanStartDate: null,
    longestStreak: 0,
    currentGoal: 7,
    dayLogs: [],
  },
  sleepLogs: [],
  quranState: {
    khatmaStartDate: new Date().toISOString().split('T')[0],
    khatmaGoalDays: 300, // Default to a more habit-building pace
    streak: 0,
    logs: [],
  },
  projects: [],
  recoveryState: {
    startDate: new Date().toISOString().split('T')[0],
    cleanStartDate: null,
    longestStreak: 0,
    currentGoal: 7,
    logs: [],
    urges: [],
  },
  athkarLogs: [],
}

export function useUserState() {
  const [userState, setUserState] = useState<UserState>(INITIAL_STATE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fetch on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('/api/state')
        if (res.ok) {
          const data = await res.json()
          setUserState(data)
        }
      } catch (err) {
        console.error('Failed to fetch state:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchState()
  }, [])

  // ── Auto-save (debounced 1.5 s) ───────────────────────────────────────────
  const saveState = useCallback((state: UserState) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      try {
        await fetch('/api/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state),
        })
      } catch (err) {
        console.error('Failed to save state:', err)
      } finally {
        setSaving(false)
      }
    }, 1500)
  }, [])

  const update = useCallback(
    (updater: (prev: UserState) => UserState) => {
      setUserState((prev) => {
        const next = updater(prev)
        saveState(next)
        return next
      })
    },
    [saveState]
  )

  // ── Prayer helpers ─────────────────────────────────────────────────────────
  const togglePrayer = useCallback(
    (date: string, prayer: PrayerName) => {
      update((prev) => {
        const existing = prev.prayerLogs.find((l) => l.date === date)
        let newLogs
        if (existing) {
          const isCompleted = existing.completed.includes(prayer)
          const newCompleted = isCompleted
            ? existing.completed.filter((p) => p !== prayer)
            : [...existing.completed, prayer]
          newLogs = prev.prayerLogs.map((l) =>
            l.date === date ? { ...l, completed: newCompleted } : l
          )
        } else {
          newLogs = [...prev.prayerLogs, { date, completed: [prayer] }]
        }
        return { ...prev, prayerLogs: newLogs }
      })
    },
    [update]
  )

  const markAllAsPrayed = useCallback(
    (date: string) => {
      update((prev) => {
        const allPrayers = Object.values(PrayerName)
        const existing = prev.prayerLogs.find((l) => l.date === date)
        let newLogs
        if (existing) {
          newLogs = prev.prayerLogs.map((l) =>
            l.date === date ? { ...l, completed: allPrayers } : l
          )
        } else {
          newLogs = [...prev.prayerLogs, { date, completed: allPrayers }]
        }
        return { ...prev, prayerLogs: newLogs }
      })
    },
    [update]
  )

  // ── Workout helpers ────────────────────────────────────────────────────────
  const saveWorkout = useCallback(
    (log: WorkoutLog) => {
      update((prev) => {
        const idx = prev.workoutLogs.findIndex((l) => l.date === log.date)
        const newLogs =
          idx > -1
            ? prev.workoutLogs.map((l, i) => (i === idx ? log : l))
            : [...prev.workoutLogs, log]
        return { ...prev, workoutLogs: newLogs }
      })
    },
    [update]
  )

  const deleteWorkout = useCallback(
    (date: string) => {
      update((prev) => ({
        ...prev,
        workoutLogs: prev.workoutLogs.filter((l) => l.date !== date),
      }))
    },
    [update]
  )

  // ── Habit helpers ──────────────────────────────────────────────────────────
  const toggleHabit = useCallback(
    (id: string) => {
      const today = new Date().toISOString().split('T')[0]
      update((prev) => ({
        ...prev,
        habits: prev.habits.map((habit) => {
          if (habit.id !== id) return habit
          const isCompleted = habit.completedDates.includes(today)
          return {
            ...habit,
            completedDates: isCompleted
              ? habit.completedDates.filter((d) => d !== today)
              : [...habit.completedDates, today],
            streak: isCompleted
              ? Math.max(0, habit.streak - 1)
              : habit.streak + 1,
          }
        }),
      }))
    },
    [update]
  )

  const addHabit = useCallback(
    (habitData: Omit<Habit, 'id' | 'completedDates' | 'streak'>) => {
      const newHabit: Habit = {
        ...habitData,
        id: Date.now().toString(),
        completedDates: [],
        streak: 0,
      }
      update((prev) => ({ ...prev, habits: [newHabit, ...prev.habits] }))
    },
    [update]
  )

  // ── Goal helpers ───────────────────────────────────────────────────────────
  const calcProgress = (tasks: Task[]) => {
    if (!tasks.length) return 0
    return Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100)
  }

  const addGoal = useCallback(
    (goalData: Omit<Goal, 'id' | 'progress' | 'tasks'>) => {
      const newGoal: Goal = {
        ...goalData,
        id: Date.now().toString(),
        progress: 0,
        tasks: [],
      }
      update((prev) => ({ ...prev, goals: [newGoal, ...prev.goals] }))
    },
    [update]
  )

  const deleteGoal = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        goals: prev.goals.filter((g) => g.id !== id),
      }))
    },
    [update]
  )

  const addTaskToGoal = useCallback(
    (goalId: string, title: string) => {
      update((prev) => ({
        ...prev,
        goals: prev.goals.map((goal) => {
          if (goal.id !== goalId) return goal
          const newTasks = [
            ...goal.tasks,
            { id: Date.now().toString(), title, completed: false },
          ]
          return { ...goal, tasks: newTasks, progress: calcProgress(newTasks) }
        }),
      }))
    },
    [update]
  )

  const toggleGoalTask = useCallback(
    (goalId: string, taskId: string) => {
      update((prev) => ({
        ...prev,
        goals: prev.goals.map((goal) => {
          if (goal.id !== goalId) return goal
          const newTasks = goal.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          )
          return { ...goal, tasks: newTasks, progress: calcProgress(newTasks) }
        }),
      }))
    },
    [update]
  )

  // ── Hashish helpers ────────────────────────────────────────────────────────
  const updateHashishState = useCallback(
    (newHashishState: HashishState) => {
      update((prev) => ({ ...prev, hashishState: newHashishState }))
    },
    [update]
  )

  // ── Sleep helpers ──────────────────────────────────────────────────────────
  const saveSleepLog = useCallback(
    (log: SleepLog) => {
      update((prev) => {
        const existing = (prev.sleepLogs || []).findIndex((l) => l.date === log.date)
        const newLogs =
          existing > -1
            ? prev.sleepLogs.map((l, i) => (i === existing ? log : l))
            : [...(prev.sleepLogs || []), log]
        return { ...prev, sleepLogs: newLogs }
      })
    },
    [update]
  )

  const deleteSleepLog = useCallback(
    (date: string) => {
      update((prev) => ({
        ...prev,
        sleepLogs: (prev.sleepLogs || []).filter((l) => l.date !== date),
      }))
    },
    [update]
  )

  // ── Quran helpers ──────────────────────────────────────────────────────────
  const calculateQuranStreak = (logs: QuranLog[]) => {
    if (!logs.length) return 0
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let checkDate = new Date(today)

    const todayStr = checkDate.toISOString().split('T')[0]

    // Check if there's a log for today
    const hasToday = sortedLogs.some(l => l.date === todayStr)

    // Start counting back from today or yesterday
    if (!hasToday) {
      checkDate.setDate(checkDate.getDate() - 1)
      const yesterdayStr = checkDate.toISOString().split('T')[0]
      if (!sortedLogs.some(l => l.date === yesterdayStr)) {
        return 0 // Streak broken if neither today nor yesterday has a log
      }
    }

    // Now count backwards continuously
    let checkingDateStr = checkDate.toISOString().split('T')[0]
    let logIndex = 0

    // Filter to unique dates (in case there are multiple logs per day, though unlikely with our unique constraint, better safe)
    const uniqueDates = Array.from(new Set(sortedLogs.map(l => l.date))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    for (const logDate of uniqueDates) {
      if (logDate === checkingDateStr) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
        checkingDateStr = checkDate.toISOString().split('T')[0]
      } else if (new Date(logDate).getTime() < new Date(checkingDateStr).getTime()) {
        // We found a gap
        break
      }
    }

    return currentStreak
  }

  const saveQuranLog = useCallback(
    (log: QuranLog) => {
      update((prev) => {
        const existing = (prev.quranState?.logs || []).findIndex((l) => l.id === log.id || l.date === log.date)
        const newLogs =
          existing > -1
            ? prev.quranState!.logs.map((l, i) => (i === existing ? log : l))
            : [...(prev.quranState?.logs || []), log]

        const newStreak = calculateQuranStreak(newLogs)

        return {
          ...prev,
          quranState: {
            ...prev.quranState!,
            streak: newStreak,
            logs: newLogs
          }
        }
      })
    },
    [update]
  )

  const deleteQuranLog = useCallback(
    (id: string) => {
      update((prev) => {
        const newLogs = (prev.quranState?.logs || []).filter((l) => l.id !== id)
        const newStreak = calculateQuranStreak(newLogs)
        return {
          ...prev,
          quranState: {
            ...prev.quranState!,
            streak: newStreak,
            logs: newLogs
          }
        }
      })
    },
    [update]
  )

  const updateQuranSettings = useCallback(
    (settings: Partial<{ khatmaStartDate: string; khatmaGoalDays: number }>) => {
      update((prev) => ({
        ...prev,
        quranState: {
          ...prev.quranState,
          ...settings
        }
      }))
    },
    [update]
  )

  // ── Project helpers ────────────────────────────────────────────────────────

  const addProject = useCallback(
    (project: Project) => {
      update((prev) => ({
        ...prev,
        projects: [...prev.projects, project],
      }))
    },
    [update]
  )

  const updateProject = useCallback(
    (id: string, updates: Partial<Project>) => {
      update((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      }))
    },
    [update]
  )

  const deleteProject = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        projects: prev.projects.filter((p) => p.id !== id),
      }))
    },
    [update]
  )

  const addProjectTask = useCallback(
    (projectId: string, task: ProjectTask) => {
      update((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => {
          if (p.id !== projectId) return p;

          let updatedTasks = [...p.tasks];
          // If this is the first task, make it the top task
          if (updatedTasks.length === 0) {
            task.isTopTask = true;
          }
          updatedTasks.push(task);

          return { ...p, tasks: updatedTasks };
        }),
      }))
    },
    [update]
  )

  const toggleProjectTask = useCallback(
    (projectId: string, taskId: string) => {
      update((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => {
          if (p.id !== projectId) return p;

          let wasTopTaskCompleted = false;
          const updatedTasks = p.tasks.map(t => {
            if (t.id === taskId) {
              const completing = !t.completed;
              if (t.isTopTask && completing) wasTopTaskCompleted = true;
              return { ...t, completed: completing };
            }
            return t;
          });

          // Re-calculate progress
          const totalTasks = updatedTasks.length;
          const completedTasks = updatedTasks.filter(t => t.completed).length;
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : p.progress;

          // Re-assign top task if the current one was completed
          if (wasTopTaskCompleted) {
            // Find the toggled task and remove its top task status
            const tTask = updatedTasks.find(t => t.id === taskId);
            if (tTask) tTask.isTopTask = false;

            // Find next uncompleted task
            const nextTask = updatedTasks.find(t => !t.completed);
            if (nextTask) nextTask.isTopTask = true;
          }

          return { ...p, tasks: updatedTasks, progress };
        }),
      }))
    },
    [update]
  )

  const deleteProjectTask = useCallback(
    (projectId: string, taskId: string) => {
      update((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => {
          if (p.id !== projectId) return p;

          const taskToDelete = p.tasks.find(t => t.id === taskId);
          const updatedTasks = p.tasks.filter(t => t.id !== taskId);

          // Re-assign top task if we deleted the top task
          if (taskToDelete?.isTopTask) {
            const nextTask = updatedTasks.find(t => !t.completed);
            if (nextTask) nextTask.isTopTask = true;
          }

          // Re-calculate progress
          const totalTasks = updatedTasks.length;
          const completedTasks = updatedTasks.filter(t => t.completed).length;
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return { ...p, tasks: updatedTasks, progress };
        }),
      }))
    },
    [update]
  )

  // ── Recovery helpers ────────────────────────────────────────────────────────

  const saveRecoveryLog = useCallback(
    (log: RecoveryLog) => {
      update((prev) => ({
        ...prev,
        recoveryState: {
          ...prev.recoveryState,
          logs: [
            ...prev.recoveryState.logs.filter((l) => l.date !== log.date),
            log,
          ],
        },
      }))
    },
    [update]
  )

  const addRecoveryUrge = useCallback(
    (urge: RecoveryUrge) => {
      update((prev) => ({
        ...prev,
        recoveryState: {
          ...prev.recoveryState,
          urges: [...prev.recoveryState.urges, urge],
        },
      }))
    },
    [update]
  )

  const updateRecoverySettings = useCallback(
    (settings: Partial<RecoveryState>) => {
      update((prev) => ({
        ...prev,
        recoveryState: {
          ...prev.recoveryState,
          ...settings,
        },
      }))
    },
    [update]
  )

  const saveAthkarLog = useCallback(
    (log: AthkarLog) => {
      update((prev) => {
        const existing = (prev.athkarLogs || []).findIndex((l) => l.date === log.date)
        const newLogs =
          existing > -1
            ? prev.athkarLogs.map((l, i) => (i === existing ? log : l))
            : [...(prev.athkarLogs || []), log]
        return { ...prev, athkarLogs: newLogs }
      })
    },
    [update]
  )

  return {
    userState,
    loading,
    saving,
    // prayer
    togglePrayer,
    markAllAsPrayed,
    // workout
    saveWorkout,
    deleteWorkout,
    // habit
    toggleHabit,
    addHabit,
    // goal
    addGoal,
    deleteGoal,
    addTaskToGoal,
    toggleGoalTask,
    // hashish
    updateHashishState,
    // sleep
    saveSleepLog,
    deleteSleepLog,
    // quran
    saveQuranLog,
    deleteQuranLog,
    updateQuranSettings,
    // projects
    addProject,
    updateProject,
    deleteProject,
    addProjectTask,
    toggleProjectTask,
    deleteProjectTask,
    // recovery
    saveRecoveryLog,
    addRecoveryUrge,
    updateRecoverySettings,
    // athkar
    saveAthkarLog,
  }
}
