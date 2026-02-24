'use client'

import React, { useState } from 'react'
import { useUserState } from '@/hooks/useUserState'
import { PrayerName, WorkoutType, Intensity, WorkoutLog } from '@/types'
import {
    Shield,
    Ban,
    Moon,
    BookOpen,
    CheckCircle2,
    Sunrise,
    Sun,
    CloudSun,
    Clock,
    Save,
    ChevronRight,
    ChevronLeft,
    Dumbbell,
    Activity,
    Flame
} from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

export const DailyEntry = () => {
    const {
        userState,
        togglePrayer,
        saveRecoveryLog,
        updateHashishState,
        saveQuranLog,
        saveSleepLog,
        saveWorkout,
        deleteWorkout,
        saving
    } = useUserState()

    const [date, setDate] = useState(new Date())
    const [showSavedFeedback, setShowSavedFeedback] = useState(false)
    const dateStr = format(date, 'yyyy-MM-dd')

    // --- 1. Recovery Logic ---
    const currentRecoveryLog = userState.recoveryState.logs.find(l => l.date === dateStr) || {
        id: Date.now().toString(),
        date: dateStr,
        pressureLevel: 'low' as const,
        isClean: true
    }

    const handleRecoveryPressure = (level: 'low' | 'medium' | 'high') => {
        saveRecoveryLog({ ...currentRecoveryLog, pressureLevel: level })
    }

    const handleRecoveryRelapse = () => {
        saveRecoveryLog({ ...currentRecoveryLog, isClean: !currentRecoveryLog.isClean })
    }

    // --- 2. Hashish Logic ---
    const currentHashishLog = (userState.hashishState.dayLogs || []).find(l => l.date === dateStr) || {
        date: dateStr,
        count: 0,
        attacks: [],
        smokedDuringWork: false
    }

    const updateHashish = (updates: Partial<typeof currentHashishLog>) => {
        const existingLogs = userState.hashishState.dayLogs || []
        const otherLogs = existingLogs.filter(l => l.date !== dateStr)
        const updatedLog = { ...currentHashishLog, ...updates }

        updateHashishState({
            ...userState.hashishState,
            dayLogs: [...otherLogs, updatedLog]
        })
    }

    // --- 3. Prayer Logic ---
    const currentPrayerLog = userState.prayerLogs.find(l => l.date === dateStr) || {
        date: dateStr,
        completed: []
    }

    // --- 4. Quran Logic ---
    const currentQuranLog = (userState.quranState.logs || []).find(l => l.date === dateStr) || {
        id: Date.now().toString(),
        date: dateStr,
        pagesRead: 0
    }

    const handleQuranChange = (pages: number) => {
        saveQuranLog({ ...currentQuranLog, pagesRead: pages })
    }

    // --- 5. Sleep Logic ---
    const currentSleepLog = (userState.sleepLogs || []).find(l => l.date === dateStr) || {
        date: dateStr,
        sleepTime: '23:00',
        wakeTime: '07:00',
        duration: 8
    }

    const handleSleepChange = (updates: Partial<typeof currentSleepLog>) => {
        // Calculate duration if times change
        const newLog = { ...currentSleepLog, ...updates }
        const sleep = newLog.sleepTime.split(':').map(Number)
        const wake = newLog.wakeTime.split(':').map(Number)

        let duration = (wake[0] + wake[1] / 60) - (sleep[0] + sleep[1] / 60)
        if (duration < 0) duration += 24

        saveSleepLog({ ...newLog, duration: parseFloat(duration.toFixed(1)) })
    }

    // --- 6. Sports Logic ---
    const currentWorkoutLog = userState.workoutLogs.find(l => l.date === dateStr)

    const handleWorkoutUpdate = (updates: Partial<WorkoutLog>) => {
        const base = currentWorkoutLog || {
            date: dateStr,
            type: WorkoutType.HOME,
            duration: 30,
            intensity: Intensity.MEDIUM
        }
        saveWorkout({ ...base, ...updates })
    }

    const toggleWorkout = () => {
        if (currentWorkoutLog) {
            deleteWorkout(dateStr)
        } else {
            saveWorkout({
                date: dateStr,
                type: WorkoutType.HOME,
                duration: 30,
                intensity: Intensity.MEDIUM
            })
        }
    }

    const PRAYERS = [
        { name: PrayerName.FAJR, icon: Sunrise },
        { name: PrayerName.DHUHR, icon: Sun },
        { name: PrayerName.ASR, icon: CloudSun },
        { name: PrayerName.MAGHRIB, icon: Sun },
        { name: PrayerName.ISHA, icon: Moon },
    ]

    const handlePrevDay = () => {
        const d = new Date(date)
        d.setDate(d.getDate() - 1)
        setDate(d)
    }

    const handleNextDay = () => {
        const d = new Date(date)
        d.setDate(d.getDate() + 1)
        setDate(d)
    }

    return (
        <div className="space-y-8 pb-32" dir="rtl">
            <header className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">تسجيل اليوم</h1>
                    <p className="text-slate-500 font-medium">{format(date, 'EEEE، d MMMM yyyy', { locale: ar })}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleNextDay} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                    <button onClick={handlePrevDay} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                </div>
            </header>

            {/* Recovery Section (التعافي) */}
            <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Shield size={22} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">التعافي (العادة السرية)</h2>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {(['low', 'medium', 'high'] as const).map((level) => (
                        <button
                            key={level}
                            onClick={() => handleRecoveryPressure(level)}
                            className={`py-3.5 rounded-2xl text-sm font-bold transition-all border ${currentRecoveryLog.pressureLevel === level
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                : 'bg-slate-50 border-transparent text-slate-600 hover:border-slate-200'
                                }`}
                        >
                            {level === 'low' ? 'ضغط منخفض' : level === 'medium' ? 'ضغط متوسط' : 'ضغط عالٍ'}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleRecoveryRelapse}
                    className={`w-full py-4.5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all border ${currentRecoveryLog.isClean
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-red-50 text-red-700 border-red-100 shadow-inner'
                        }`}
                >
                    {currentRecoveryLog.isClean ? <CheckCircle2 size={22} className="text-emerald-500" /> : <Ban size={22} className="text-red-500" />}
                    <span className="text-lg">{currentRecoveryLog.isClean ? 'اليوم نظيف تماماً ✅' : 'حصلت انتكاسة للأسف ❌'}</span>
                </button>
            </section>

            {/* Hashish Section (الحشيش) */}
            <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                        <Ban size={22} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">الحشيش</h2>
                </div>

                <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="font-bold text-slate-700 text-lg">عدد السجائر اليوم:</span>
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => updateHashish({ count: Math.max(0, currentHashishLog.count - 1) })}
                            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-2xl font-bold text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
                        >-</button>
                        <span className="text-3xl font-bold w-10 text-center text-slate-800">{currentHashishLog.count}</span>
                        <button
                            onClick={() => updateHashish({ count: currentHashishLog.count + 1 })}
                            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-2xl font-bold text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
                        >+</button>
                    </div>
                </div>

                <label className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                    <span className="font-bold text-slate-700 text-lg">هل دخنت أثناء العمل؟</span>
                    <div className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={currentHashishLog.smokedDuringWork}
                            onChange={(e) => updateHashish({ smokedDuringWork: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[4px] after:right-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
                    </div>
                </label>
            </section>

            {/* Sports Section (الرياضة) */}
            <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                            <Dumbbell size={22} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">الرياضة</h2>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={!!currentWorkoutLog}
                            onChange={toggleWorkout}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                </div>

                {currentWorkoutLog ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-3 gap-3">
                            {Object.values(WorkoutType).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => handleWorkoutUpdate({ type })}
                                    className={`py-3 rounded-2xl text-sm font-bold transition-all border ${currentWorkoutLog.type === type
                                        ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                                        : 'bg-slate-50 border-transparent text-slate-600 hover:border-slate-200'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Clock size={18} className="text-slate-400" />
                                    <span className="font-bold text-slate-700">المدة (دقائق):</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleWorkoutUpdate({ duration: Math.max(5, currentWorkoutLog.duration - 5) })}
                                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-xl font-bold text-slate-400 hover:text-slate-600"
                                    >-</button>
                                    <span className="text-2xl font-black w-12 text-center text-slate-800">{currentWorkoutLog.duration}</span>
                                    <button
                                        onClick={() => handleWorkoutUpdate({ duration: currentWorkoutLog.duration + 5 })}
                                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-xl font-bold text-slate-400 hover:text-slate-600"
                                    >+</button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-sm font-bold text-slate-500 mr-1">شدة التمرين:</span>
                                <div className="grid grid-cols-3 gap-3">
                                    {Object.values(Intensity).map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => handleWorkoutUpdate({ intensity: level })}
                                            className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${currentWorkoutLog.intensity === level
                                                ? 'bg-orange-500 border-orange-500 text-white'
                                                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center gap-1">
                                                {level === Intensity.HIGH ? <Flame size={14} /> : level === Intensity.MEDIUM ? <Activity size={14} /> : <div className="h-3.5" />}
                                                {level}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <p className="text-slate-400 font-medium">لم يتم تسجيل تمرين لهذا اليوم</p>
                        <button
                            onClick={toggleWorkout}
                            className="mt-3 text-rose-600 font-bold text-sm hover:underline"
                        >+ إضافة تمرين الآن</button>
                    </div>
                )}
            </section>

            {/* Prayers Section (الصلوات) */}
            <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <Sunrise size={22} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">الصلوات الخمس</h2>
                </div>

                <div className="grid grid-cols-5 gap-3">
                    {PRAYERS.map((prayer) => {
                        const isCompleted = currentPrayerLog.completed.includes(prayer.name)
                        return (
                            <button
                                key={prayer.name}
                                onClick={() => togglePrayer(dateStr, prayer.name)}
                                className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border ${isCompleted
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100'
                                    : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200 hover:bg-slate-100'
                                    }`}
                            >
                                <prayer.icon size={26} className={isCompleted ? 'text-white' : 'text-slate-400'} />
                                <span className="text-xs font-bold leading-none">{prayer.name}</span>
                            </button>
                        )
                    })}
                </div>
            </section>

            {/* Quran Section (القرآن) */}
            <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <BookOpen size={22} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">الورد اليومي (القرآن)</h2>
                </div>

                <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-700 text-lg shrink-0">عدد الصفحات المقروءة:</span>
                    <div className="relative flex-1">
                        <input
                            type="number"
                            value={currentQuranLog.pagesRead || ''}
                            onChange={(e) => handleQuranChange(parseInt(e.target.value) || 0)}
                            className="w-full p-4.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-center text-3xl font-bold transition-all placeholder:text-slate-300"
                            placeholder="0"
                        />
                    </div>
                </div>
            </section>

            {/* Sleep Section (النوم) */}
            <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5 text-right">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                        <Moon size={22} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">تتبع النوم</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 block mr-1">وقت النوم</label>
                        <div className="relative">
                            <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            <input
                                type="text"
                                value={currentSleepLog.sleepTime}
                                placeholder="23:00"
                                onChange={(e) => handleSleepChange({ sleepTime: e.target.value.replace(/[^0-9:]/g, '').slice(0, 5) })}
                                className="w-full p-4.5 pr-12 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 focus:bg-white font-bold transition-all text-slate-700 text-center"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 block mr-1">الاستيقاظ</label>
                        <div className="relative">
                            <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            <input
                                type="text"
                                value={currentSleepLog.wakeTime}
                                placeholder="07:00"
                                onChange={(e) => handleSleepChange({ wakeTime: e.target.value.replace(/[^0-9:]/g, '').slice(0, 5) })}
                                className="w-full p-4.5 pr-12 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 focus:bg-white font-bold transition-all text-slate-700 text-center"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex justify-between items-center">
                    <span className="text-purple-700 font-bold">إجمالي ساعات النوم:</span>
                    <span className="text-2xl font-black text-purple-800">{currentSleepLog.duration} ساعة</span>
                </div>
            </section>

            <div className="fixed bottom-6 inset-x-6 md:right-auto md:left-72 md:w-[calc(100%-18rem-3rem)] max-w-4xl mx-auto z-10">
                <button
                    onClick={() => {
                        if (!saving) {
                            setShowSavedFeedback(true)
                            setTimeout(() => setShowSavedFeedback(false), 2000)
                        }
                    }}
                    className={`w-full py-5 rounded-2xl font-bold shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${saving
                        ? 'bg-slate-400 text-white cursor-not-allowed'
                        : showSavedFeedback
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 text-white hover:bg-black hover:shadow-indigo-500/20'
                        }`}
                    disabled={saving}
                >
                    {saving ? (
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : showSavedFeedback ? (
                        <>
                            <CheckCircle2 size={22} />
                            <span className="text-lg">تم الحفظ بنجاح ✨</span>
                        </>
                    ) : (
                        <>
                            <Save size={22} />
                            <span className="text-lg">حفظ جميع البيانات</span>
                        </>
                    )}
                </button>
            </div>

            <footer className="mt-20 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] py-10 border-t border-slate-50">
                حصاد — رحلتك نحو التوازن الروحي والنفسي
            </footer>
        </div>
    )
}
