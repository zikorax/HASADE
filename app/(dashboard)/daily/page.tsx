'use client'

import { DailyEntry } from '@/components/DailyEntry'
import { useUserState } from '@/hooks/useUserState'

export default function DailyPage() {
    const { userState, loading } = useUserState()

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <DailyEntry />
        </div>
    )
}
