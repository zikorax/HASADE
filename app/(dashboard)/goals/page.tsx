'use client'

import { GoalTracker } from '@/components/GoalTracker'
import { useUserState } from '@/hooks/useUserState'

export default function GoalsPage() {
  const {
    userState,
    loading,
    addGoal,
    deleteGoal,
    addTaskToGoal,
    toggleGoalTask,
  } = useUserState()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <GoalTracker
      goals={userState.goals}
      onAddGoal={addGoal}
      onDeleteGoal={deleteGoal}
      onAddTask={addTaskToGoal}
      onToggleTask={toggleGoalTask}
    />
  )
}
