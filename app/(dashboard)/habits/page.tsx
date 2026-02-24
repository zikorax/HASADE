'use client'

import { HabitTracker } from '@/components/HabitTracker'
import { useUserState } from '@/hooks/useUserState'

export default function HabitsPage() {
  const { userState, loading, toggleHabit, addHabit } = useUserState()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <HabitTracker
      habits={userState.habits}
      onToggle={toggleHabit}
      onAdd={addHabit}
    />
  )
}
