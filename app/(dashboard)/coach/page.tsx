'use client'

import { AICoach } from '@/components/AICoach'
import { useUserState } from '@/hooks/useUserState'

export default function CoachPage() {
  const { userState, loading } = useUserState()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  return <AICoach userState={userState} />
}
