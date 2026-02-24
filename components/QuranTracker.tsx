'use client'

import React, { useState, useMemo } from 'react'
import { QuranLog, QuranState } from '@/types'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, addMonths, subMonths, parseISO, differenceInDays } from 'date-fns'
import { ar } from 'date-fns/locale'
import { ChevronRight, ChevronLeft, BookOpen, Trash2, Plus, Target, Book, Sparkles, Settings, X } from 'lucide-react'

interface QuranTrackerProps {
    quranState: QuranState
    onSaveLog: (log: QuranLog) => void
    onDeleteLog: (id: string) => void
    onUpdateSettings: (settings: Partial<{ khatmaStartDate: string; khatmaGoalDays: number }>) => void
}

const TOTAL_QURAN_PAGES = 604;

export const QuranTracker: React.FC<QuranTrackerProps> = ({
    quranState,
    onSaveLog,
    onDeleteLog,
    onUpdateSettings
}) => {
    const [view, setView] = useState<'day' | 'month'>('day')
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [showSettings, setShowSettings] = useState(false)
    const [khatmaGoalInput, setKhatmaGoalInput] = useState(quranState.khatmaGoalDays.toString())

    // Editor State
    const [pagesRead, setPagesRead] = useState<string>('')

    // Derive today's reading if any
    const todayKey = format(new Date(), 'yyyy-MM-dd')
    const todayLogs = quranState.logs.filter(l => l.date === todayKey)

    // Progress calculations
    const totalPagesRead = useMemo(() => {
        return quranState.logs.reduce((sum, log) => sum + log.pagesRead, 0)
    }, [quranState.logs])

    const khatmaProgress = Math.min(100, Math.round((totalPagesRead / TOTAL_QURAN_PAGES) * 100))
    const pagesRemaining = Math.max(0, TOTAL_QURAN_PAGES - totalPagesRead)

    const daysElapsed = differenceInDays(new Date(), parseISO(quranState.khatmaStartDate))
    const daysRemaining = Math.max(0, quranState.khatmaGoalDays - daysElapsed)

    // Suggested daily reading to finish on time
    const targetDailyPages = Math.ceil(TOTAL_QURAN_PAGES / quranState.khatmaGoalDays);
    const requiredDailyPages = daysRemaining > 0 ? Math.ceil(pagesRemaining / daysRemaining) : pagesRemaining;

    const handleSave = () => {
        const pages = parseInt(pagesRead)
        if (isNaN(pages) || pages < 1) return

        const newLog: QuranLog = {
            id: Date.now().toString(),
            date: format(selectedDate, 'yyyy-MM-dd'),
            pagesRead: pages
        }

        onSaveLog(newLog)
        setPagesRead('')
    }

    // ── Month view helpers ─────────────────────────────────────────────────────
    const monthStart = startOfMonth(selectedDate)
    const monthEnd = endOfMonth(selectedDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const padCells = monthStart.getDay() // Sun=0 LTR

    const renderDayView = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Streak Card */}
            <div className="bg-[#0f2922] p-8 rounded-3xl border border-[#1a4035] shadow-xl text-white relative overflow-hidden flex flex-col items-center text-center justify-center">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl -z-10 rounded-full" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 blur-3xl -z-10 rounded-full" />

                <div className="bg-[#1a4035] p-4 rounded-full mb-6 relative">
                    <div className="absolute inset-0 bg-emerald-400/20 blur-xl rounded-full" />
                    <BookOpen className="text-emerald-400 relative z-10" size={40} />
                </div>

                <h3 className="text-5xl font-black mb-2 flex items-baseline justify-center gap-2">
                    {quranState.streak} <span className="text-xl font-medium text-emerald-100/60">أيام</span>
                </h3>
                <span className="text-emerald-400 text-sm font-bold tracking-widest uppercase">متواصلة</span>
            </div>

            {/* Daily Input Area (Secondary Layout) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />

                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">ورد اليوم</h3>
                        <p className="text-xs text-slate-500">{format(new Date(), 'd MMMM yyyy', { locale: ar })}</p>
                    </div>
                </div>

                <div className="flex items-end gap-4 mb-6">
                    <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">عدد الصفحات</label>
                        <input
                            type="number"
                            min="1" max="604"
                            value={pagesRead}
                            onChange={e => setPagesRead(e.target.value)}
                            placeholder="مثال: 4"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 font-black text-2xl text-center focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-emerald-700 placeholder:text-slate-300 placeholder:font-medium"
                        />
                    </div>
                    <div className="flex-1 mb-2 text-right">
                        <div className="bg-slate-50 inline-flex flex-col px-4 py-2 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">الهدف اليومي</span>
                            <span className="font-bold text-slate-700 text-lg flex items-end gap-1">{requiredDailyPages} <span className="text-xs mb-1 text-slate-400">صفحات</span></span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={!pagesRead || parseInt(pagesRead) < 1}
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
                >
                    <Plus size={18} />
                    تسجيل القراءة
                </button>
            </div>

            {/* Today's Logs List */}
            {todayLogs.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                        <h3 className="font-bold text-slate-700 text-sm">سجلات اليوم</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {todayLogs.map(log => (
                            <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex flex-col items-center justify-center">
                                        <span className="text-sm font-black">{log.pagesRead}</span>
                                        <span className="text-[8px] font-bold uppercase tracking-wider">صفحة</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700">{log.pagesRead} صفحات مقرؤة</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{format(parseISO(log.date), 'd MMMM', { locale: ar })}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onDeleteLog(log.id)}
                                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Khatma Progress (Secondary Info) */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm overflow-hidden relative">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-700 text-sm">رحلة الختمة</h3>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{khatmaProgress}%</span>
                </div>

                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div
                        className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${khatmaProgress}%` }}
                    />
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>متبقي {pagesRemaining} صفحة</span>
                    <span>كلي {totalPagesRead} من {TOTAL_QURAN_PAGES}</span>
                </div>
            </div>
        </div>
    )

    const renderMonthView = () => (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-10">
                <div className="flex gap-2">
                    <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-md shadow-emerald-100 transition-all">شهر</button>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedDate(subMonths(selectedDate, 1))} className="text-slate-400 hover:text-emerald-600 transition-colors"><ChevronLeft size={20} /></button>
                    <span className="text-slate-700 font-bold min-w-[120px] text-center" dir="rtl">{format(selectedDate, 'MMMM yyyy', { locale: ar })}</span>
                    <button onClick={() => setSelectedDate(addMonths(selectedDate, 1))} className="text-slate-400 hover:text-emerald-600 transition-colors"><ChevronRight size={20} /></button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-y-8 text-center" dir="ltr">
                {['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'].map(day => (
                    <div key={day} className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{day}</div>
                ))}

                {Array.from({ length: padCells }).map((_, i) => (
                    <div key={`pad-${i}`} className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12" />
                    </div>
                ))}

                {days.map((day) => {
                    const dKey = format(day, 'yyyy-MM-dd')
                    const dayLogs = quranState.logs.filter(l => l.date === dKey)
                    const totalPagesForDay = dayLogs.reduce((sum, l) => sum + l.pagesRead, 0)
                    const isTod = isToday(day)
                    const isSel = isSameDay(selectedDate, day)
                    const hasRead = totalPagesForDay > 0

                    return (
                        <div
                            key={dKey}
                            onClick={() => { setSelectedDate(day); setView('day'); }}
                            className="flex flex-col items-center gap-2 cursor-pointer group"
                        >
                            <span className={`text-xs transition-all ${isSel ? 'text-white font-bold bg-emerald-600 w-6 h-6 flex items-center justify-center rounded-full' :
                                isTod ? 'text-emerald-600 font-bold underline underline-offset-4' : 'text-slate-500 group-hover:text-emerald-600'
                                }`}>
                                {format(day, 'd')}
                            </span>
                            <div className={`relative w-12 h-12 flex flex-col items-center justify-center rounded-2xl transition-all ${hasRead ? 'bg-emerald-500 shadow-lg shadow-emerald-100/50 text-white' : 'bg-slate-50 text-slate-200 group-hover:bg-slate-100'
                                }`}>
                                {hasRead ? (
                                    <>
                                        <BookOpen size={18} />
                                        <span className="text-[9px] font-bold mt-0.5">{totalPagesForDay}</span>
                                    </>
                                ) : (
                                    <Plus size={16} />
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="mt-10 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                <div className="text-center group">
                    <p className="text-3xl font-black text-slate-800 transition-transform group-hover:scale-110 duration-500">
                        {quranState.logs.filter(l => format(parseISO(l.date), 'M') === format(selectedDate, 'M')).reduce((sum, l) => sum + l.pagesRead, 0)}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">صفحة هذا الشهر</p>
                </div>
                <div className="text-center group">
                    <p className="text-3xl font-black text-emerald-600 transition-transform group-hover:scale-110 duration-500">
                        {targetDailyPages}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">الورد المستهدف الأساسي</p>
                </div>
            </div>
        </div>
    )

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-24 relative">
            <header className="flex justify-between items-start">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-800">
                        القرآن، {format(new Date(), 'd MMMM', { locale: ar })}
                    </h1>
                    <p className="text-slate-400 text-sm">نور قلبك بتلاوة كتاب الله.</p>
                </div>
                <button
                    onClick={() => {
                        setKhatmaGoalInput(quranState.khatmaGoalDays.toString())
                        setShowSettings(true)
                    }}
                    className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                >
                    <Settings size={22} />
                </button>
            </header>

            <div className="flex justify-center bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto gap-1">
                <button
                    onClick={() => setView('day')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'day' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    اليوم
                </button>
                <button
                    onClick={() => setView('month')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'month' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    التقدم
                </button>
            </div>

            {view === 'day' ? renderDayView() : renderMonthView()}

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Target size={18} className="text-emerald-500" />
                                إعدادات الختمة
                            </h3>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="text-slate-400 hover:text-slate-600 bg-white shadow-sm border border-slate-100 p-2 rounded-xl transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">هدف الختمة (بالأيام)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        value={khatmaGoalInput}
                                        onChange={(e) => setKhatmaGoalInput(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 pr-12 font-black text-2xl text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                        dir="rtl"
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">يوم</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    لتختم القرآن في {khatmaGoalInput || 0} يوم، تحتاج لقراءة حوالي <span className="font-bold text-emerald-600">{Math.ceil(TOTAL_QURAN_PAGES / (parseInt(khatmaGoalInput) || 30))}</span> صفحة يومياً.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    const days = parseInt(khatmaGoalInput)
                                    if (days > 0) {
                                        onUpdateSettings({ khatmaGoalDays: days })
                                        setShowSettings(false)
                                    }
                                }}
                                disabled={!khatmaGoalInput || parseInt(khatmaGoalInput) < 1}
                                className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-50"
                            >
                                حفظ الإعدادات
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
