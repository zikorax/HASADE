'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
    Moon,
    Sun,
    Wind,
    Shield,
    Heart,
    Sparkles,
    CheckCircle2,
    Circle,
    Copy,
    Calendar as CalendarIcon,
    ChevronRight,
    ChevronLeft,
    LayoutGrid,
    Trophy,
    PartyPopper,
    ArrowRight,
    X
} from 'lucide-react'
import { useUserState } from '@/hooks/useUserState'
import { AthkarLog } from '@/types'

type Thker = {
    id: number;
    text: string;
    repeat: number;
    benefit: string;
    type: 'morning' | 'evening';
}

const morningAthkar: Thker[] = [
    {
        id: 1,
        text: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لا إِلَهَ إِلا اللَّهُ وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.',
        repeat: 1,
        benefit: 'سؤال خير هذا اليوم والاستعاذة من شره.',
        type: 'morning'
    },
    {
        id: 2,
        text: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ.',
        repeat: 1,
        benefit: 'التوكل على الله في بداية اليوم.',
        type: 'morning'
    },
    {
        id: 3,
        text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ.',
        repeat: 100,
        benefit: 'حطت خطاياه وإن كانت مثل زبد البحر.',
        type: 'morning'
    },
    {
        id: 4,
        text: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شأْنِي كُلَّهُ وَلا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ.',
        repeat: 3,
        benefit: 'استغاثة برحمة الله وتفويض الأمر إليه.',
        type: 'morning'
    }
]

const eveningAthkar: Thker[] = [
    {
        id: 5,
        text: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لا إِلَهَ إِلا اللَّهُ وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.',
        repeat: 1,
        benefit: 'سؤال خير هذه الليلة والاستعاذة من شرها.',
        type: 'evening'
    },
    {
        id: 6,
        text: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ.',
        repeat: 1,
        benefit: 'شكر الله على بلوغ المساء.',
        type: 'evening'
    },
    {
        id: 7,
        text: 'أعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ.',
        repeat: 3,
        benefit: 'حماية من كل سوء في المكان.',
        type: 'evening'
    }
]

export default function AthkarPage() {
    const { userState, saveAthkarLog, loading } = useUserState()
    const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [counts, setCounts] = useState<Record<number, number>>({})
    const [showCalendar, setShowCalendar] = useState(false)
    const [showCompletionOverlay, setShowCompletionOverlay] = useState<'morning' | 'evening' | null>(null)

    // Sync counts when date or userState changes
    useEffect(() => {
        if (!loading) {
            const log = userState.athkarLogs?.find(l => l.date === selectedDate)
            if (log) {
                setCounts(log.counts as any || {})
            } else {
                setCounts({})
            }
        }
    }, [selectedDate, userState.athkarLogs, loading])

    const currentAthkar = activeTab === 'morning' ? morningAthkar : eveningAthkar

    const handleIncrement = (id: number, max: number) => {
        const current = counts[id] || 0
        if (current < max) {
            const newCounts = { ...counts, [id]: current + 1 }
            setCounts(newCounts)

            // Calculate completion before saving
            const morningAllDone = morningAthkar.every(a => (newCounts[a.id] || 0) >= a.repeat)
            const eveningAllDone = eveningAthkar.every(a => (newCounts[a.id] || 0) >= a.repeat)

            // Check if this action JUST finished a section
            const wasMorningDone = morningAthkar.every(a => (counts[a.id] || 0) >= a.repeat)
            const wasEveningDone = eveningAthkar.every(a => (counts[a.id] || 0) >= a.repeat)

            if (morningAllDone && !wasMorningDone && activeTab === 'morning') {
                setShowCompletionOverlay('morning')
            } else if (eveningAllDone && !wasEveningDone && activeTab === 'evening') {
                setShowCompletionOverlay('evening')
            }

            saveAthkarLog({
                date: selectedDate,
                morningCompleted: morningAllDone,
                eveningCompleted: eveningAllDone,
                counts: newCounts as any
            })

            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(20)
            }
        }
    }

    const resetCounts = () => {
        setCounts({})
        saveAthkarLog({
            date: selectedDate,
            morningCompleted: false,
            eveningCompleted: false,
            counts: {}
        })
    }

    // --- Calendar Month Helpers ---
    const currentMonthDate = new Date()
    const daysInMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0).getDate()
    const monthStartDay = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1).getDay()

    const monthDays = useMemo(() => {
        const days = []
        for (let i = 0; i < monthStartDay; i++) days.push(null)
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
            const log = userState.athkarLogs?.find(l => l.date === dateStr)
            days.push({ day: i, date: dateStr, log })
        }
        return days
    }, [userState.athkarLogs, daysInMonth, monthStartDay])

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 pb-32" dir="rtl">
            {/* Completion Overlay */}
            {showCompletionOverlay && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl max-w-sm w-full text-center relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                        {/* Background Decoration */}
                        <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${showCompletionOverlay === 'morning' ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                        <div className={`absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${showCompletionOverlay === 'morning' ? 'bg-orange-400' : 'bg-blue-400'}`} />

                        <div className="relative z-10 flex flex-col items-center">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-inner animate-bounce ${showCompletionOverlay === 'morning' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                <PartyPopper size={48} />
                            </div>

                            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">
                                {showCompletionOverlay === 'morning' ? 'تم إنهاء أذكار الصباح' : 'تم إنهاء أذكار المساء'}
                            </h2>

                            <div className="flex gap-2 mb-6">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${showCompletionOverlay === 'morning' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                    {showCompletionOverlay === 'morning' ? morningAthkar.length : eveningAthkar.length} أذكار مكتملة
                                </span>
                                <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                                    حفظ رباني ✨
                                </span>
                            </div>

                            <p className="text-slate-500 font-medium leading-[1.8] mb-10 text-sm">
                                {showCompletionOverlay === 'morning'
                                    ? 'بدأت يومك بذكر الله وحفظه، فلك شرف الحماية والسكينة طوال النهار.'
                                    : 'ختمت يومك بذكر الله، فلك شرف الحفظ والهدوء وحسن الختام.'}
                            </p>

                            <button
                                onClick={() => setShowCompletionOverlay(null)}
                                className={`w-full py-4 rounded-3xl font-black text-white shadow-xl transition-all active:scale-95 ${showCompletionOverlay === 'morning' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                                تقبل الله منا ومنك
                            </button>

                            <button
                                onClick={() => setShowCompletionOverlay(null)}
                                className="mt-4 text-slate-400 text-sm font-bold hover:text-slate-600"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="text-center md:text-right">
                    <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">أذكار اليوم</h1>
                    <p className="text-slate-500 font-medium italic">"ألا بذكر الله تطمئن القلوب"</p>
                </div>

                <div className="flex items-center gap-3 self-center md:self-auto">
                    <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold transition-all border ${showCalendar ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                    >
                        <CalendarIcon size={18} />
                        <span>النتائج الشهرية</span>
                    </button>
                    <div className="px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 font-bold text-sm">
                        {selectedDate}
                    </div>
                </div>
            </header>

            {/* Monthly Progress Calendar (Toggleable) */}
            {showCalendar && (
                <div className="mb-12 p-8 bg-white border border-slate-100 rounded-[3rem] shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <LayoutGrid size={22} className="text-indigo-500" />
                            سجل المتابعة الشهري
                        </h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                <div className="w-3 h-3 rounded-full bg-amber-400"></div> صبـاحاً
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                <div className="w-3 h-3 rounded-full bg-indigo-400"></div> مسـاءً
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-3 text-center mb-4">
                        {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map(d => (
                            <div key={d} className="text-xs font-black text-slate-300 py-2 uppercase">{d}</div>
                        ))}
                        {monthDays.map((d, i) => {
                            if (!d) return <div key={`empty-${i}`} className="aspect-square" />

                            const isToday = d.date === new Date().toISOString().split('T')[0]
                            const isSelected = d.date === selectedDate

                            return (
                                <button
                                    key={d.date}
                                    onClick={() => setSelectedDate(d.date)}
                                    className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all group ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                                        } ${isToday ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                                >
                                    <span className={`text-[13px] font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}>{d.day}</span>

                                    {/* Dot Indicators */}
                                    <div className="flex gap-0.5 mt-1">
                                        {d.log?.morningCompleted && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        )}
                                        {d.log?.eveningCompleted && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                        )}
                                    </div>

                                    {/* Selected highlight */}
                                    {isSelected && (
                                        <div className="absolute inset-0 border-2 border-indigo-200 rounded-2xl animate-pulse" />
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between text-slate-500 text-xs font-bold">
                        <div className="flex items-center gap-2">
                            <Trophy size={14} className="text-amber-500" />
                            <span>أكملت الأذكار بالكامل في {userState.athkarLogs?.filter(l => l.morningCompleted && l.eveningCompleted).length || 0} أيام</span>
                        </div>
                        <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="text-indigo-600 hover:scale-105 transition-all">العودة لليوم</button>
                    </div>
                </div>
            )}

            {/* Tab Switcher */}
            <div className="flex justify-center mb-10">
                <div className="bg-slate-100 p-1.5 rounded-[2rem] flex gap-1 w-full max-w-sm shadow-inner overflow-hidden relative">
                    <button
                        onClick={() => setActiveTab('morning')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[1.8rem] font-bold transition-all duration-300 z-10 ${activeTab === 'morning' ? 'bg-white text-amber-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Sun size={20} className={activeTab === 'morning' ? 'animate-pulse' : ''} />
                        أذكار الصباح
                    </button>
                    <button
                        onClick={() => setActiveTab('evening')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[1.8rem] font-bold transition-all duration-300 z-10 ${activeTab === 'evening' ? 'bg-white text-indigo-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Moon size={20} className={activeTab === 'evening' ? 'animate-pulse' : ''} />
                        أذكار المساء
                    </button>
                </div>
            </div>

            {/* Stats Quick View */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className={`p-6 rounded-3xl border transition-all ${activeTab === 'morning' ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50/50 border-slate-100'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <Sun size={18} className="text-amber-500" />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">إنجاز الصباح</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800">
                        {morningAthkar.filter(a => (counts[a.id] || 0) >= a.repeat).length} / {morningAthkar.length}
                    </div>
                </div>
                <div className={`p-6 rounded-3xl border transition-all ${activeTab === 'evening' ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <Moon size={18} className="text-indigo-500" />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">إنجاز المساء</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800">
                        {eveningAthkar.filter(a => (counts[a.id] || 0) >= a.repeat).length} / {eveningAthkar.length}
                    </div>
                </div>
            </div>

            {/* Main List */}
            <div className="space-y-6">
                {currentAthkar.map((thker) => {
                    const progress = counts[thker.id] || 0
                    const isCompleted = progress >= thker.repeat

                    return (
                        <div
                            key={thker.id}
                            onClick={() => handleIncrement(thker.id, thker.repeat)}
                            className={`group relative p-8 rounded-[2.5rem] bg-white border transition-all duration-500 cursor-pointer select-none active:scale-[0.98] ${isCompleted
                                ? 'border-emerald-100 bg-emerald-50/30'
                                : 'border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100'
                                }`}
                        >
                            <div className="absolute top-0 right-0 left-0 h-1.5 overflow-hidden rounded-t-[2.5rem]">
                                <div
                                    className={`h-full transition-all duration-500 ${activeTab === 'morning' ? 'bg-amber-400' : 'bg-indigo-400'}`}
                                    style={{ width: `${(progress / thker.repeat) * 100}%` }}
                                />
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="flex justify-between items-start">
                                    <div className={`p-3 rounded-2xl ${activeTab === 'morning' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                        {activeTab === 'morning' ? <Sun size={20} /> : <Moon size={20} />}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">العداد الحـالي</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-4xl font-black tabular-nums transition-colors ${isCompleted ? 'text-emerald-500' : 'text-slate-800'}`}>
                                                {progress}
                                            </span>
                                            <span className="text-slate-300 font-bold">/</span>
                                            <span className="text-xl font-bold text-slate-400 tabular-nums">
                                                {thker.repeat}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 text-right">
                                    <p className={`text-2xl leading-[1.6] font-bold transition-all duration-500 ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                        {thker.text}
                                    </p>

                                    <div className={`p-5 rounded-3xl bg-slate-50/80 border-r-4 ${activeTab === 'morning' ? 'border-amber-200' : 'border-indigo-200'} text-slate-500 text-sm font-medium leading-[1.6]`}>
                                        <div className="flex items-center gap-2 mb-2 font-black text-[10px] uppercase tracking-wider">
                                            <Sparkles size={14} className={activeTab === 'morning' ? 'text-amber-500' : 'text-indigo-500'} />
                                            فائدة الذكر
                                        </div>
                                        {thker.benefit}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(thker.text) }}
                                        className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all hover:scale-110 active:scale-90"
                                    >
                                        <Copy size={18} />
                                    </button>
                                    {isCompleted ? (
                                        <div className="flex items-center gap-2 text-emerald-600 font-black text-sm animate-in zoom-in duration-300">
                                            <CheckCircle2 size={24} />
                                            <span>ذكرته بفضل الله</span>
                                        </div>
                                    ) : (
                                        <div className={`p-2 px-4 rounded-xl text-xs font-black uppercase tracking-tight ${activeTab === 'morning' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                            انقر للتكرار
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Reset FAB */}
            <button
                onClick={resetCounts}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-slate-900 text-white rounded-full font-black text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all z-20 flex items-center gap-2 border border-slate-700/50"
            >
                🔄 تصفير عدادات {selectedDate === new Date().toISOString().split('T')[0] ? 'اليوم' : selectedDate}
            </button>

            <footer className="mt-20 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] py-10 border-t border-slate-50">
                حصاد — رحلتك نحو التوازن الروحي والنفسي
            </footer>
        </div>
    )
}
