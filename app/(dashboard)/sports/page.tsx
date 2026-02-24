'use client'

import { SportsTracker } from '@/components/SportsTracker'
import { useUserState } from '@/hooks/useUserState'

export default function SportsPage() {
  const { userState, loading, saveWorkout, deleteWorkout } = useUserState()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <SportsTracker
      workoutLogs={userState.workoutLogs}
      onSaveWorkout={saveWorkout}
      onDeleteWorkout={deleteWorkout}
    />
  )
}
