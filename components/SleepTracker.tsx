'use client'

import React, { useState, useMemo } from 'react'
import { SleepLog } from '../types'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isToday, addMonths, subMonths, parseISO,
} from 'date-fns'
import { ar } from 'date-fns/locale'
import { ChevronRight, ChevronLeft, Moon, Sun, AlertTriangle, Trash2, Plus } from 'lucide-react'
import {
  ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis,
  Tooltip, ReferenceLine, Cell,
} from 'recharts'

interface SleepTrackerProps {
  sleepLogs: SleepLog[]
  onSave: (log: SleepLog) => void
  onDelete: (date: string) => void
}

// Convert HH:mm → decimal hours (e.g. "23:30" → 23.5)
function timeToDecimal(t: string): number {
  if (!t || !t.includes(':')) return 0
  const [h, m] = t.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return 0
  return h + m / 60
}

// Calculate sleep duration from HH:mm sleep → HH:mm wake (handles crossing midnight)
function calcDuration(sleepTime: string, wakeTime: string): number {
  if (!sleepTime || !wakeTime || !sleepTime.includes(':') || !wakeTime.includes(':')) return 0
  const [sh, sm] = sleepTime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  if (isNaN(sh) || isNaN(sm) || isNaN(wh) || isNaN(wm)) return 0
  let sleepMins = sh * 60 + sm
  let wakeMins = wh * 60 + wm
  if (wakeMins <= sleepMins) wakeMins += 24 * 60 // crossed midnight
  return parseFloat(((wakeMins - sleepMins) / 60).toFixed(1))
}

function sleepColor(hours: number): { bg: string; text: string; label: string; ring: string } {
  if (hours >= 7) return { bg: '#0f3d2e', text: '#34d399', label: 'ممتاز', ring: '#10b981' }
  if (hours >= 6) return { bg: '#3a2e0a', text: '#fbbf24', label: 'مقبول', ring: '#f59e0b' }
  return { bg: '#3d0f0f', text: '#f87171', label: 'قصير', ring: '#ef4444' }
}

// ── Sleep / Wake Chart ────────────────────────────────────────────────────────
// Shows last 14 days as stacked bars: dark segment = sleeping, light = awake padding
// Y-axis: hours 18 → 32 (18:00 tonight → 08:00 next morning)

interface ChartEntry {
  label: string       // short day label e.g. "الخ 15"
  sleepStart: number  // hour decimal (may be > 24 if past midnight of previous day)
  duration: number    // hours slept
  wakeDecimal: number // for tooltip
  sleepDecimal: number
  rawDuration: number
}

const CUSTOM_TOOLTIP = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as ChartEntry
  if (!d) return null
  const sleepH = Math.floor(d.sleepDecimal % 24)
  const sleepM = Math.round((d.sleepDecimal % 1) * 60)
  const wakeH = Math.floor(d.wakeDecimal % 24)
  const wakeM = Math.round((d.wakeDecimal % 1) * 60)
  const fmt = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  return (
    <div className="rounded-2xl px-4 py-3 text-sm shadow-xl" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="font-bold text-white mb-1">{d.label}</p>
      <p style={{ color: '#818cf8' }}>🌙 نام: {fmt(sleepH, sleepM)}</p>
      <p style={{ color: '#fbbf24' }}>☀️ صحا: {fmt(wakeH, wakeM)}</p>
      <p style={{ color: d.rawDuration >= 7 ? '#34d399' : d.rawDuration >= 6 ? '#fbbf24' : '#f87171' }}>
        ⏱ {d.rawDuration}h
      </p>
    </div>
  )
}

function SleepChart({ logs }: { logs: SleepLog[] }) {
  if (logs.length < 1) return null

  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
  const recent = sorted.slice(-14)

  const data: ChartEntry[] = recent.map(log => {
    const sleepDec = timeToDecimal(log.sleepTime)
    const wakeDec = timeToDecimal(log.wakeTime)
    // Normalize: if wake <= sleep, wake crossed midnight → add 24
    const wakeAdj = wakeDec <= sleepDec ? wakeDec + 24 : wakeDec

    const dayLabel = format(parseISO(log.date), 'EEE d', { locale: ar })
    return {
      label: dayLabel,
      sleepStart: sleepDec,
      duration: wakeAdj - sleepDec,
      wakeDecimal: wakeAdj,
      sleepDecimal: sleepDec,
      rawDuration: log.duration,
    }
  })

  // Y domain: from earliest sleep - 0.5 to latest wake + 0.5
  const minY = Math.min(...data.map(d => d.sleepStart)) - 0.5
  const maxY = Math.max(...data.map(d => d.wakeDecimal)) + 0.5

  const yTick = (v: number) => {
    const h = Math.floor(v % 24)
    const m = Math.round((v % 1) * 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  return (
    <div
      className="rounded-3xl p-5"
      style={{ background: '#0b1120', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="mb-4">
        <h3 className="font-bold text-white text-sm">جدول النوم والاستيقاظ</h3>
        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>آخر {recent.length} يوم — متى نمت ومتى صحيت</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: '#475569', fontSize: 10, fontFamily: 'Tajawal' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[minY, maxY]}
            tickFormatter={yTick}
            tick={{ fill: '#475569', fontSize: 10, fontFamily: 'Tajawal' }}
            axisLine={false}
            tickLine={false}
            width={42}
            ticks={Array.from({ length: Math.ceil(maxY - minY) + 1 }, (_, i) => Math.floor(minY) + i).filter(v => Number.isInteger(v))}
          />
          <Tooltip content={<CUSTOM_TOOLTIP />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          {/* Reference lines at midnight (24) */}
          <ReferenceLine y={24} stroke="rgba(129,140,248,0.25)" strokeDasharray="4 3" />
          {/* Invisible base bar to push sleep bar up */}
          <Bar dataKey="sleepStart" stackId="a" fill="transparent" isAnimationActive={false} />
          {/* Sleep duration bar */}
          <Bar dataKey="duration" stackId="a" radius={[6, 6, 0, 0]} isAnimationActive={true}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.rawDuration >= 7
                    ? '#10b981'
                    : entry.rawDuration >= 6
                      ? '#f59e0b'
                      : '#ef4444'
                }
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-3">
        {[
          { color: '#10b981', label: '7h+ ممتاز' },
          { color: '#f59e0b', label: '6–7h مقبول' },
          { color: '#ef4444', label: 'أقل من 6h' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
            <span className="text-[10px]" style={{ color: '#475569' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export const SleepTracker: React.FC<SleepTrackerProps> = ({ sleepLogs, onSave, onDelete }) => {
  const [view, setView] = useState<'day' | 'month'>('day')
  const [calDate, setCalDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editSleep, setEditSleep] = useState('23:00')
  const [editWake, setEditWake] = useState('07:00')

  // Form state
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const todayLog = sleepLogs.find(l => l.date === todayKey)

  const [sleepTime, setSleepTime] = useState(todayLog?.sleepTime || '23:00')
  const [wakeTime, setWakeTime] = useState(todayLog?.wakeTime || '07:00')

  const handleSelectDate = (dKey: string) => {
    if (selectedDate === dKey) { setSelectedDate(null); return }
    const existing = sleepLogs.find(l => l.date === dKey)
    setEditSleep(existing?.sleepTime || '23:00')
    setEditWake(existing?.wakeTime || '07:00')
    setSelectedDate(dKey)
  }

  const handleEditSave = () => {
    if (!selectedDate) return
    const dur = calcDuration(editSleep, editWake)
    onSave({ date: selectedDate, sleepTime: editSleep, wakeTime: editWake, duration: dur })
    setSelectedDate(null)
  }

  const duration = useMemo(() => calcDuration(sleepTime, wakeTime), [sleepTime, wakeTime])
  const isShort = duration < 6
  const color = sleepColor(duration)

  const handleSave = () => {
    onSave({ date: todayKey, sleepTime, wakeTime, duration })
  }

  // ── Month view helpers ─────────────────────────────────────────────────────
  const monthStart = startOfMonth(calDate)
  const monthEnd = endOfMonth(calDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const padCells = monthStart.getDay() // Sun=0 LTR

  const avgSleep = useMemo(() => {
    if (!sleepLogs.length) return 0
    return parseFloat((sleepLogs.reduce((s, l) => s + l.duration, 0) / sleepLogs.length).toFixed(1))
  }, [sleepLogs])

  const goodDays = sleepLogs.filter(l => l.duration >= 7).length
  const okDays = sleepLogs.filter(l => l.duration >= 6 && l.duration < 7).length
  const badDays = sleepLogs.filter(l => l.duration < 6).length

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-800">
          النوم، {format(new Date(), 'd MMMM', { locale: ar })}
        </h1>
        <p className="text-slate-400 text-sm">تتبّع نومك. العين لا تكذب.</p>
      </header>

      {/* ── View Toggle ─────────────────────────────────────────────────────── */}
      <div className="flex justify-center bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto gap-1">
        <button
          onClick={() => setView('day')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'day' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
            }`}
        >
          اليوم
        </button>
        <button
          onClick={() => setView('month')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
            }`}
        >
          التقويم
        </button>
      </div>

      {view === 'day' ? (
        <>
          {/* ── Duration Display ────────────────────────────────────────────── */}
          <div
            className="rounded-3xl p-8 flex flex-col items-center gap-3 border"
            style={{
              background: 'linear-gradient(145deg, #0b0f1a 0%, #111827 100%)',
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            {/* Moon icon */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-1"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <Moon size={26} style={{ color: '#818cf8' }} />
            </div>

            {/* Big hours */}
            <div className="text-center">
              <span
                className="text-7xl font-black tabular-nums"
                style={{ color: color.text, letterSpacing: '-0.04em' }}
              >
                {duration}
              </span>
              <span className="text-2xl font-medium ml-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                ساعة
              </span>
            </div>

            {/* Status badge */}
            <span
              className="px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase"
              style={{ background: color.bg, color: color.text, border: `1px solid ${color.ring}40` }}
            >
              {color.label}
            </span>

            {/* Warning */}
            {isShort && (
              <div
                className="flex items-center gap-2 mt-2 px-4 py-2.5 rounded-2xl text-sm font-medium"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <AlertTriangle size={15} />
                <span>نمت أقل من 6 ساعات — جسدك يحتاج راحة أكثر</span>
              </div>
            )}
          </div>

          {/* ── Time Inputs ─────────────────────────────────────────────────── */}
          <div
            className="rounded-3xl p-6 space-y-5"
            style={{ background: '#fff', border: '1px solid #f1f5f9' }}
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Sleep time */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Moon size={13} className="text-indigo-400" />
                  وقت النوم
                </label>
                <input
                  type="text"
                  value={sleepTime}
                  placeholder="23:00"
                  onChange={e => setSleepTime(e.target.value.replace(/[^0-9:]/g, '').slice(0, 5))}
                  className="w-full px-3 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:border-indigo-400 focus:bg-white focus:outline-none text-slate-800 text-lg font-bold text-center transition"
                />
              </div>
              {/* Wake time */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Sun size={13} className="text-amber-400" />
                  وقت الاستيقاظ
                </label>
                <input
                  type="text"
                  value={wakeTime}
                  placeholder="07:00"
                  onChange={e => setWakeTime(e.target.value.replace(/[^0-9:]/g, '').slice(0, 5))}
                  className="w-full px-3 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:border-indigo-400 focus:bg-white focus:outline-none text-slate-800 text-lg font-bold text-center transition"
                />
              </div>
            </div>

            {/* Duration bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>0h</span>
                <span style={{ color: color.text }} className="font-bold">{duration}h</span>
                <span>10h</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (duration / 10) * 100)}%`,
                    background: `linear-gradient(90deg, ${color.ring}, ${color.ring}99)`,
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-4 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98] hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}
            >
              {todayLog ? 'تحديث سجل اليوم' : 'حفظ سجل اليوم'}
            </button>

            {todayLog && (
              <button
                onClick={() => onDelete(todayKey)}
                className="w-full py-3 rounded-2xl font-medium text-red-400 text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition"
              >
                <Trash2 size={14} />
                حذف سجل اليوم
              </button>
            )}
          </div>

          {/* ── Stats row ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'متوسط النوم', value: `${avgSleep}h`, color: '#818cf8' },
              { label: 'أيام ممتازة', value: goodDays, color: '#34d399' },
              { label: 'أيام قصيرة', value: badDays, color: '#f87171' },
            ].map(stat => (
              <div
                key={stat.label}
                className="rounded-2xl p-4 text-center"
                style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}
              >
                <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ── Sleep / Wake chart ──────────────────────────────────────────── */}
          <SleepChart logs={sleepLogs} />

          {/* ── Recent logs ─────────────────────────────────────────────────── */}
          {sleepLogs.length > 0 && (
            <div
              className="rounded-3xl overflow-hidden"
              style={{ background: '#fff', border: '1px solid #f1f5f9' }}
            >
              <div className="px-5 py-4 border-b border-slate-50">
                <h3 className="font-bold text-slate-700 text-sm">آخر السجلات</h3>
              </div>
              {[...sleepLogs].reverse().slice(0, 7).map(log => {
                const c = sleepColor(log.duration)
                return (
                  <div
                    key={log.date}
                    className="flex items-center justify-between px-5 py-4 border-b border-slate-50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: c.ring }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {format(parseISO(log.date), 'd MMMM', { locale: ar })}
                        </p>
                        <p className="text-xs text-slate-400">
                          {log.sleepTime} → {log.wakeTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-sm font-black"
                        style={{ color: c.text }}
                      >
                        {log.duration}h
                      </span>
                      <button
                        onClick={() => onDelete(log.date)}
                        className="text-slate-300 hover:text-red-400 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        /* ── Month View (Sports Style) ───────────────────────────────────── */
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in fade-in duration-500">
          <div className="flex justify-between items-center mb-10">
            <div className="flex gap-2">
              <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-md shadow-indigo-100 transition-all">شهر</button>
              <button className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-400 hover:text-slate-600 transition-all">أسبوع</button>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCalDate(d => subMonths(d, 1))}
                className="text-slate-400 hover:text-indigo-600 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-slate-700 font-bold min-w-[120px] text-center" dir="rtl">
                {format(calDate, 'MMMM yyyy', { locale: ar })}
              </span>
              <button
                onClick={() => setCalDate(d => addMonths(d, 1))}
                className="text-slate-400 hover:text-indigo-600 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
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
              const dKey = format(day, 'yyyy-MM-dd');
              const log = sleepLogs.find(l => l.date === dKey);
              const isTod = isToday(day);
              const isSel = selectedDate === dKey;
              const c = log ? sleepColor(log.duration) : null;

              return (
                <div
                  key={dKey}
                  onClick={() => { handleSelectDate(dKey); }}
                  className="flex flex-col items-center gap-2 cursor-pointer group"
                >
                  <span className={`text-xs transition-all ${isSel ? 'text-white font-bold bg-indigo-600 w-6 h-6 flex items-center justify-center rounded-full' :
                    isTod ? 'text-indigo-600 font-bold underline underline-offset-4' : 'text-slate-500 group-hover:text-indigo-600'
                    }`}>
                    {format(day, 'd')}
                  </span>
                  <div className={`relative w-12 h-12 flex flex-col items-center justify-center rounded-2xl transition-all ${log ? 'shadow-lg text-white' : 'bg-slate-50 text-slate-200 group-hover:bg-slate-100'
                    }`}
                    style={log ? { backgroundColor: c?.ring } : {}}
                  >
                    {log ? (
                      <>
                        <Moon size={18} />
                        <span className="text-[9px] font-bold mt-0.5">{log.duration}h</span>
                      </>
                    ) : (
                      <Plus size={16} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Editor Overlay ─────────────────────────────────────── */}
          {selectedDate && (() => {
            const selLog = sleepLogs.find(l => l.date === selectedDate)
            const editDur = calcDuration(editSleep, editWake)
            const editColor = sleepColor(editDur)
            return (
              <div className="mt-10 rounded-3xl bg-slate-900 p-6 text-white shadow-2xl animate-in slide-in-from-bottom-5 duration-300 relative overflow-hidden border border-slate-800 mx-4 sm:mx-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -z-10" />

                <div className="flex items-center justify-between mb-6">
                  <div dir="rtl">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">تعديل سجل التاريخ</p>
                    <h4 className="text-xl font-black">{format(parseISO(selectedDate), 'd MMMM yyyy', { locale: ar })}</h4>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-3xl font-black tabular-nums" style={{ color: editColor.text }}>{editDur}h</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <Moon size={12} className="text-indigo-400" /> وقت النوم
                    </label>
                    <input
                      type="text"
                      value={editSleep}
                      placeholder="23:00"
                      onChange={e => setEditSleep(e.target.value.replace(/[^0-9:]/g, '').slice(0, 5))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-bold text-center focus:outline-none focus:bg-white focus:text-slate-900 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <Sun size={12} className="text-amber-400" /> الاستيقاظ
                    </label>
                    <input
                      type="text"
                      value={editWake}
                      placeholder="07:00"
                      onChange={e => setEditWake(e.target.value.replace(/[^0-9:]/g, '').slice(0, 5))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-bold text-center focus:outline-none focus:bg-white focus:text-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleEditSave}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all text-sm"
                  >
                    {selLog ? 'تحديث السجل' : 'إضافة سجل'}
                  </button>
                  {selLog && (
                    <button
                      onClick={() => { onDelete(selectedDate); setSelectedDate(null) }}
                      className="px-4 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-bold transition-all active:scale-95 border border-red-500/20"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl font-bold transition-all text-sm"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )
          })()}

          {/* Monthly Stats Summary (Sports Style) */}
          <div className="mt-10 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
            <div className="text-center group">
              <p className="text-3xl font-black text-slate-800 transition-transform group-hover:scale-110 duration-500">
                {sleepLogs.filter(l => format(parseISO(l.date), 'M') === format(calDate, 'M')).length}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">سجلات هذا الشهر</p>
            </div>
            <div className="text-center group">
              <p className="text-3xl font-black text-indigo-600 transition-transform group-hover:scale-110 duration-500">
                {avgSleep}h
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">متوسط جودة النوم</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
