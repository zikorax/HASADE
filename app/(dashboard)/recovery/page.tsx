'use client'

import { RecoveryTracker } from '@/components/RecoveryTracker'
import { useUserState } from '@/hooks/useUserState'

export default function RecoveryPage() {
    const {
        userState,
        loading,
        saveRecoveryLog,
        addRecoveryUrge,
        updateRecoverySettings
    } = useUserState()

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <RecoveryTracker
            state={userState.recoveryState}
            onSaveLog={saveRecoveryLog}
            onAddUrge={addRecoveryUrge}
            onUpdateState={updateRecoverySettings}
        />
    )
}
