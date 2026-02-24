'use client'

import { HashishTracker } from '@/components/HashishTracker'
import { useUserState } from '@/hooks/useUserState'

export default function HashishPage() {
  const { userState, loading, updateHashishState } = useUserState()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <HashishTracker
      hashishState={userState.hashishState}
      onUpdateState={updateHashishState}
    />
  )
}
