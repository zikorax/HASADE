'use client'

import { PrayerTracker } from '@/components/PrayerTracker'
import { useUserState } from '@/hooks/useUserState'

export default function PrayersPage() {
  const { userState, loading, togglePrayer, markAllAsPrayed } = useUserState()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <PrayerTracker
      prayerLogs={userState.prayerLogs}
      onTogglePrayer={togglePrayer}
      onMarkAllAsPrayed={markAllAsPrayed}
    />
  )
}
