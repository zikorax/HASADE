'use client'

import React from 'react'
import { QuranTracker } from '@/components/QuranTracker'
import { useUserState } from '@/hooks/useUserState'
import { Loader2 } from 'lucide-react'

export default function QuranPage() {
    const { userState, saveQuranLog, deleteQuranLog, updateQuranSettings, loading } = useUserState()

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20 md:pb-0">
            <QuranTracker
                quranState={userState.quranState}
                onSaveLog={saveQuranLog}
                onDeleteLog={deleteQuranLog}
                onUpdateSettings={updateQuranSettings}
            />
        </div>
    )
}
