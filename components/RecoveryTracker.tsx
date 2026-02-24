'use client'

import React, { useState } from 'react'
import { RecoveryState, RecoveryLog, RecoveryUrge } from '@/types'
import { ShieldCheck, Flame, Target, AlertCircle, Activity, Clock, Zap, Plus, X, Thermometer, Brain, Wind, Droplets, Dumbbell, Map, BookOpen, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { format, differenceInDays, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { ar } from 'date-fns/locale'

interface RecoveryTrackerProps {
    state: RecoveryState
    onSaveLog: (log: RecoveryLog) => void
    onAddUrge: (urge: RecoveryUrge) => void
    onUpdateState: (settings: Partial<RecoveryState>) => void
}

export const RecoveryTracker: React.FC<RecoveryTrackerProps> = ({
    state,
    onSaveLog,
    onAddUrge,
    onUpdateState
}) => {
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [showUrgeModal, setShowUrgeModal] = useState(false)
    const [showProtocol, setShowProtocol] = useState(false)
    const [urgeForm, setUrgeForm] = useState({
        reason: 'fatigue',
        intensity: 3,
        alternativeUsed: 'breath'
    })

    const selectedDateKey = format(selectedDate, 'yyyy-MM-dd')
    const isToday = isSameDay(selectedDate, new Date())
    const isFuture = selectedDate > new Date()
    // ── Streak Calculations ──────────────────────────────────────────────────
    const getCalculatedStreak = () => {
        // Sort logs descending to find the most recent relapse
        const sortedLogs = [...state.logs].sort((a, b) => b.date.localeCompare(a.date))
        const lastRelapse = sortedLogs.find(l => !l.isClean)

        const todayDate = new Date()
        todayDate.setHours(0, 0, 0, 0)

        // If a relapse happened today, streak is 0
        if (lastRelapse && isSameDay(parseISO(lastRelapse.date), todayDate)) {
            return 0
        }

        // Search for the start of the current clean streak
        // We start from today and go backwards
        let streak = 0
        const checkDate = new Date(todayDate)

        while (true) {
            const dKey = format(checkDate, 'yyyy-MM-dd')
            const log = state.logs.find(l => l.date === dKey)

            // If we find a relapse, streak ends
            if (log && !log.isClean) break

            // If we reach a date before the first log AND before the startDate, streak ends
            if (checkDate < parseISO(state.startDate || state.cleanStartDate || dKey)) {
                // Check if we have logs for this day. If we started before logs, we count from start date.
                break
            }

            streak++
            checkDate.setDate(checkDate.getDate() - 1)

            // Safety break
            if (streak > 10000) break
        }

        // The above counts "days that were clean". 
        // If today hasn't been logged yet, but yesterday was clean, streak includes today.
        // However, usually users prefer "completed days".
        // Let's stick to the difference between today and the clean start date for consistency.
        const effectiveCleanStart = state.cleanStartDate || lastRelapse?.date || state.startDate
        const diff = differenceInDays(new Date(), parseISO(effectiveCleanStart))
        return Math.max(0, diff)
    }

    const soberDays = getCalculatedStreak()

    // Dynamically calculate longest streak if current is higher
    const displayedLongestStreak = Math.max(state.longestStreak, soberDays)

    const selectedDateLog = state.logs.find(l => l.date === selectedDateKey)

    const handlePressureSelect = (level: 'low' | 'medium' | 'high') => {
        onSaveLog({
            id: Math.random().toString(),
            date: selectedDateKey,
            pressureLevel: level,
            isClean: selectedDateLog?.isClean ?? true
        })
    }

    const handleRelapse = () => {
        const currentlyRelapsed = selectedDateLog?.isClean === false

        if (currentlyRelapsed) {
            if (confirm('هل تريد تصحيح السجل وتغيير الحالة إلى "منضبط"؟')) {
                onSaveLog({
                    id: selectedDateLog?.id || Math.random().toString(),
                    date: selectedDateKey,
                    pressureLevel: selectedDateLog?.pressureLevel || 'low',
                    isClean: true
                })
                // If we corrected Today's relapse, we might need to reset cleanStartDate?
                // This is tricky without history, but many users just want to "undo" a wrong click.
            }
            return
        }

        if (confirm('هل أنت متأكد؟ لا نحكم عليك، المهم هو الصدق والعودة فوراً.')) {
            onSaveLog({
                id: Math.random().toString(),
                date: selectedDateKey,
                pressureLevel: selectedDateLog?.pressureLevel ?? 'low',
                isClean: false
            })
            if (isToday) {
                onUpdateState({ cleanStartDate: new Date().toISOString() })
            }
        }
    }

    const handleUrgeSubmit = () => {
        onAddUrge({
            id: Date.now().toString(),
            date: selectedDateKey,
            time: format(new Date(), 'HH:mm'),
            ...urgeForm
        })
        setShowUrgeModal(false)
    }

    const handlePrevDay = () => setSelectedDate(prev => new Date(prev.setDate(prev.getDate() - 1)))
    const handleNextDay = () => setSelectedDate(prev => new Date(prev.setDate(prev.getDate() + 1)))

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-24">
            {/* Date Navigator */}
            <header className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-2xl">
                        🛡️
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">
                            {isToday ? 'اليوم' : format(selectedDate, 'EEEE, d MMMM', { locale: ar })}
                        </h1>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">مسار الانضباط والتعافي</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleNextDay} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                    <button onClick={handlePrevDay} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                </div>
            </header>

            {/* 1. Counter Section */}
            <header className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-right">
                        <h1 className="text-3xl font-black text-slate-800 mb-2">عدّاد السيطرة 🛡️</h1>
                        <p className="text-slate-500 font-medium italic">"إنما النصر صبر ساعة"</p>
                        <button
                            onClick={() => {
                                const newDate = prompt('أدخل تاريخ بداية الالتزام (YYYY-MM-DD):', state.cleanStartDate || state.startDate)
                                if (newDate) onUpdateState({ cleanStartDate: newDate })
                            }}
                            className="mt-4 text-[10px] font-bold text-indigo-400 hover:text-indigo-600 transition-colors uppercase tracking-widest flex items-center gap-1 mx-auto md:mr-0"
                        >
                            <Clock size={10} />
                            تعديل تاريخ البداية
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 px-6 py-4 rounded-3xl text-center">
                            <span className="block text-3xl font-black text-emerald-600 leading-none">{soberDays}</span>
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">أيام منضبط</span>
                        </div>
                        <div className="bg-slate-50 px-4 py-4 rounded-3xl text-center">
                            <span className="block text-xl font-bold text-slate-600 leading-none">{displayedLongestStreak}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">أطول سلسلة</span>
                        </div>
                        <div className="bg-indigo-50 px-4 py-4 rounded-3xl text-center border border-indigo-100">
                            <span className="block text-xl font-bold text-indigo-600 leading-none">{state.currentGoal}</span>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">الهدف</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. Daily Pressure Indicator */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm text-center">
                <h3 className="text-xl font-black text-slate-800 mb-2">مؤشر الضغط اليومي 🌡️</h3>
                <p className="text-sm font-bold text-slate-400 mb-8 tracking-tight uppercase">ما هو مستوى التوتر أو الرغبة اليوم؟</p>

                <div className="flex justify-center gap-4">
                    {[
                        { id: 'low', label: 'منخفض', color: 'bg-emerald-50 text-emerald-600 border-emerald-100 ring-emerald-500/10' },
                        { id: 'medium', label: 'متوسط', color: 'bg-amber-50 text-amber-600 border-amber-100 ring-amber-500/10' },
                        { id: 'high', label: 'مرتفع', color: 'bg-red-50 text-red-600 border-red-100 ring-red-500/10' }
                    ].map((lvl) => (
                        <button
                            key={lvl.id}
                            disabled={isFuture}
                            onClick={() => handlePressureSelect(lvl.id as any)}
                            className={`flex-1 py-4 rounded-2xl font-black border-2 transition-all ${selectedDateLog?.pressureLevel === lvl.id
                                ? `${lvl.color} border-current ring-4`
                                : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                                } ${isFuture ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                            {lvl.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 3. Urge Log Section */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                        <Zap size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">سجل "لحظة الرغبة"</h3>
                    <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8">توثيق اللحظة هو أول خطوة لكسر النمط.</p>
                    <button
                        onClick={() => setShowUrgeModal(true)}
                        disabled={isFuture}
                        className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Plus size={20} />
                        توثيق الآن
                    </button>
                </div>

                {/* 4. Protocol Section */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-200 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 animate-pulse" />
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-6">
                        <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-xl font-black mb-2">بروتوكول التفريغ</h3>
                    <p className="text-indigo-200/80 font-medium text-sm leading-relaxed mb-8">إذا شعرت أن الضغط خرج عن السيطرة..</p>
                    <button
                        onClick={() => setShowProtocol(true)}
                        className="w-full bg-white text-indigo-900 font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all active:scale-95"
                    >
                        <Activity size={20} />
                        تشغيل البروتوكول
                    </button>
                </div>
            </div>

            {/* Fallback Action */}
            <div className="text-center pt-8">
                <button
                    onClick={handleRelapse}
                    disabled={isFuture}
                    className={`font-bold transition-colors border-b border-dashed pb-1 disabled:opacity-30 ${selectedDateLog?.isClean === false
                        ? 'text-red-500 border-red-200 hover:text-emerald-600 hover:border-emerald-200'
                        : 'text-slate-300 border-slate-200 hover:text-red-400'
                        }`}
                >
                    {selectedDateLog?.isClean === false
                        ? 'هل تريد تصحيح سجل اليوم؟ (تعليم كـ منضبط)'
                        : 'للأسف.. حدث سقوط اليوم؟ سجل بصدق'}
                </button>
            </div>

            {/* 5. Calendar Section */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                    تمثيل المسار الهبيل
                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">آخر 30 يوم</span>
                </h3>
                <div className="flex flex-wrap gap-2 justify-center" dir="ltr">
                    {Array.from({ length: 30 }).map((_, i) => {
                        const date = new Date(selectedDate)
                        date.setDate(date.getDate() - (29 - i))
                        const dStr = format(date, 'yyyy-MM-dd')
                        const log = state.logs.find(l => l.date === dStr)
                        const isClean = log ? log.isClean : true
                        const hasLog = !!log

                        return (
                            <div
                                key={i}
                                onClick={() => setSelectedDate(new Date(date))}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black cursor-pointer transition-all ${isSameDay(date, selectedDate) ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110 z-10' : ''
                                    } ${!hasLog ? 'bg-slate-50 text-slate-300' :
                                        !isClean ? 'bg-red-500 text-white shadow-lg shadow-red-200' :
                                            log?.pressureLevel === 'high' ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' :
                                                log?.pressureLevel === 'medium' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' :
                                                    'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                    }`}
                                title={format(date, 'PPP', { locale: ar })}
                            >
                                {format(date, 'd')}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Urge Modal */}
            {showUrgeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 self-center">
                        <header className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-slate-800">توثيق الرغبة</h3>
                            <button onClick={() => setShowUrgeModal(false)} className="bg-slate-100 p-2 rounded-xl text-slate-400"><X size={20} /></button>
                        </header>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">ما سبب الرغبة؟</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'work', label: 'ضغط عمل', icon: <Thermometer size={14} /> },
                                        { id: 'failure', label: 'فشل/إحباط', icon: <X size={14} /> },
                                        { id: 'discussion', label: 'نقاش حاد', icon: <AlertCircle size={14} /> },
                                        { id: 'fatigue', label: 'تعب جسدي', icon: <Zap size={14} /> }
                                    ].map(r => (
                                        <button
                                            key={r.id}
                                            onClick={() => setUrgeForm({ ...urgeForm, reason: r.id })}
                                            className={`flex items-center gap-2 p-3 rounded-2xl text-sm font-bold border-2 transition-all ${urgeForm.reason === r.id ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'bg-slate-50 border-transparent text-slate-500'
                                                }`}
                                        >
                                            {r.icon}
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">الشدة (1-5)</label>
                                <input
                                    type="range" min="1" max="5" value={urgeForm.intensity}
                                    onChange={e => setUrgeForm({ ...urgeForm, intensity: parseInt(e.target.value) })}
                                    className="w-full accent-indigo-600"
                                />
                                <div className="flex justify-between text-[10px] font-black text-slate-400 mt-2 px-1">
                                    <span>خفيفة</span>
                                    <span>متوسّطة</span>
                                    <span>قصوى</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">البديل الذي ستستخدمه</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'walk', label: 'مشي 10 دقائق', icon: <Map size={14} /> },
                                        { id: 'breath', label: 'تنفس عميق', icon: <Wind size={14} /> },
                                        { id: 'shower', label: 'دوش سريع', icon: <Droplets size={14} /> },
                                        { id: 'quran', label: 'قرآن', icon: <BookOpen size={14} /> },
                                        { id: 'sports', label: 'رياضة', icon: <Dumbbell size={14} /> }
                                    ].map(a => (
                                        <button
                                            key={a.id}
                                            onClick={() => setUrgeForm({ ...urgeForm, alternativeUsed: a.id })}
                                            className={`flex items-center gap-2 p-3 rounded-2xl text-sm font-bold border-2 transition-all ${urgeForm.alternativeUsed === a.id ? 'bg-emerald-50 border-emerald-600 text-emerald-600' : 'bg-slate-50 border-transparent text-slate-500'
                                                }`}
                                        >
                                            {a.icon}
                                            {a.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleUrgeSubmit}
                                className="w-full bg-indigo-600 text-white font-black py-4 rounded-3xl shadow-lg shadow-indigo-200 hover:bg-indigo-500 transition-all active:scale-95 mt-4"
                            >
                                تثبيت البديل والالتزام
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Protocol Modal */}
            {showProtocol && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-8 self-center">
                        <h3 className="text-3xl font-black text-slate-800 text-center mb-8">خطوات التفريغ ⚡</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'اخرج من مكانك لمدة 5 دقائق (تغيير الجو)', icon: <Map className="text-indigo-600" /> },
                                { label: 'نفس بطيء (4 شهيق - 4 حبس - 4 زفير)', icon: <Wind className="text-indigo-600" /> },
                                { label: 'حركة جسدية عنيفة (20 ضغط)', icon: <Dumbbell className="text-indigo-600" /> },
                                { label: 'غسل الوجه أو الرأس بماء بارد جداً', icon: <Droplets className="text-indigo-600" /> }
                            ].map((step, i) => (
                                <div key={i} className="flex gap-4 items-center p-5 bg-slate-50 rounded-[24px]">
                                    <div className="bg-white p-3 rounded-xl shadow-sm">{step.icon}</div>
                                    <p className="font-bold text-slate-700">{step.label}</p>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowProtocol(false)}
                            className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl mt-10 hover:bg-slate-800 transition-all"
                        >
                            تمت السيطرة بنجاح
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
