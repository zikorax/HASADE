'use client'

import { Dashboard } from '@/components/Dashboard'
import { useUserState } from '@/hooks/useUserState'

export default function DashboardPage() {
  const { userState, loading } = useUserState()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  return <Dashboard userState={userState} />
}
