'use client'

import React, { useState, useEffect } from 'react';
import { PrayerName, PrayerLog } from '../types';
import { CheckCircle2, Circle, Bell, BellOff, ChevronRight, ChevronLeft, Moon, Sun, CloudSun, Sunrise } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PrayerTrackerProps {
  prayerLogs: PrayerLog[];
  onTogglePrayer: (date: string, prayer: PrayerName) => void;
  onMarkAllAsPrayed: (date: string) => void;
}

const PRAYER_INFO = [
  { name: PrayerName.FAJR, icon: Sunrise, time: '05:40' },
  { name: PrayerName.DHUHR, icon: Sun, time: '12:49' },
  { name: PrayerName.ASR, icon: CloudSun, time: '15:53' },
  { name: PrayerName.MAGHRIB, icon: Sun, time: '18:22' },
  { name: PrayerName.ISHA, icon: Moon, time: '19:36' },
];

// Convert "HH:mm" to total minutes since midnight
const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const PrayerTracker: React.FC<PrayerTrackerProps> = ({ prayerLogs, onTogglePrayer, onMarkAllAsPrayed }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'month'>('day');
  const [now, setNow] = useState(new Date());

  // Tick every minute to keep the card live
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const dateKey = format(currentDate, 'yyyy-MM-dd');
  const currentLog = prayerLogs.find(log => log.date === dateKey) || { date: dateKey, completed: [] };
  const completedCount = currentLog.completed.length;

  // ── Current & next prayer calculation ──────────────────
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Find which prayer window we're currently in
  // "current" = last prayer whose time has passed
  let currentPrayerIdx = 0;
  for (let i = 0; i < PRAYER_INFO.length; i++) {
    if (nowMinutes >= timeToMinutes(PRAYER_INFO[i].time)) {
      currentPrayerIdx = i;
    }
  }
  const currentPrayer = PRAYER_INFO[currentPrayerIdx];

  // Next prayer (wraps to Fajr of next day)
  const nextPrayerIdx = (currentPrayerIdx + 1) % PRAYER_INFO.length;
  const nextPrayer = PRAYER_INFO[nextPrayerIdx];

  // Minutes until next prayer
  let nextPrayerMinutes = timeToMinutes(nextPrayer.time);
  let minutesUntilNext = nextPrayerMinutes - nowMinutes;
  if (minutesUntilNext <= 0) minutesUntilNext += 24 * 60; // next day
  const hoursUntil = Math.floor(minutesUntilNext / 60);
  const minsUntil = minutesUntilNext % 60;

  const prayerEmoji: Record<string, string> = {
    [PrayerName.FAJR]: '🌅',
    [PrayerName.DHUHR]: '☀️',
    [PrayerName.ASR]: '🌤️',
    [PrayerName.MAGHRIB]: '🌇',
    [PrayerName.ISHA]: '🌙',
  };

  const countdownText = hoursUntil > 0
    ? `${nextPrayer.name} خلال ${hoursUntil} ساعة و ${minsUntil} دقيقة`
    : `${nextPrayer.name} خلال ${minsUntil} دقيقة`;

  const handlePrevDay = () => setCurrentDate(prev => new Date(prev.setDate(prev.getDate() - 1)));
  const handleNextDay = () => setCurrentDate(prev => new Date(prev.setDate(prev.getDate() + 1)));

  const handlePrevMonth = () => setCurrentDate(prev => addMonths(prev, -1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

  const renderDayView = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0a2e28] text-white p-6 rounded-3xl border border-[#1a4d44] shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-emerald-400 text-sm font-medium">الآن</span>
              <h3 className="text-2xl font-bold mt-1">{currentPrayer.name} {prayerEmoji[currentPrayer.name]}</h3>
              <div className="text-4xl font-bold mt-2">{currentPrayer.time}</div>
            </div>
          </div>
          <div className="mt-8 text-emerald-400/70 text-sm">
            {countdownText}
          </div>
        </div>

        <div className="bg-[#0a2e28] text-white p-6 rounded-3xl border border-[#1a4d44] shadow-xl flex items-center justify-between">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-[#1a4d44]"
              />
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={364.4}
                strokeDashoffset={364.4 - (364.4 * completedCount) / 5}
                className="text-emerald-500 transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{completedCount}/5</span>
              <span className="text-xs text-emerald-400/70">تمت الصلاة</span>
            </div>
          </div>
          <div className="text-right">
            <div className={`p-2 rounded-full inline-block mb-2 ${
              completedCount === 5 ? 'bg-emerald-500/20' :
              completedCount >= 3 ? 'bg-amber-500/20' :
              completedCount >= 1 ? 'bg-orange-500/20' :
              'bg-slate-500/10'
            }`}>
              <CheckCircle2 className={`w-6 h-6 ${
                completedCount === 5 ? 'text-emerald-500' :
                completedCount >= 3 ? 'text-amber-400' :
                completedCount >= 1 ? 'text-orange-400' :
                'text-slate-500'
              }`} />
            </div>
            <p className="text-sm font-medium" style={{ color:
              completedCount === 5 ? '#34d399' :
              completedCount >= 3 ? '#fbbf24' :
              completedCount >= 1 ? '#fb923c' :
              '#64748b'
            }}>
              {completedCount === 5 ? 'أداء رائع! 🌟' :
               completedCount === 4 ? 'ممتاز، صلاة واحدة متبقية' :
               completedCount === 3 ? 'جيد، استمر 💪' :
               completedCount === 2 ? 'لا تستسلم، واصل' :
               completedCount === 1 ? 'بداية، أكمل يومك' :
               'لم تُصلَّ بعد'}
            </p>
          </div>
        </div>
      </div>

      {/* Prayer List */}
      <div className="bg-[#0a2e28] rounded-3xl border border-[#1a4d44] overflow-hidden">
        {PRAYER_INFO.map((prayer) => {
          const isCompleted = currentLog.completed.includes(prayer.name);
          return (
            <div 
              key={prayer.name}
              className="flex items-center justify-between p-5 border-b border-[#1a4d44] last:border-0 hover:bg-[#123d35] transition cursor-pointer"
              onClick={() => onTogglePrayer(dateKey, prayer.name)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? 'bg-emerald-500 text-white' : 'border-2 border-emerald-500/30 text-emerald-500/50'}`}>
                  {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </div>
                <div>
                  <h4 className="font-bold text-white flex items-center gap-2">
                    {prayer.name}
                    {prayer.name === currentPrayer.name && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">الآن</span>}
                  </h4>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-emerald-400/70 font-mono">{prayer.time}</span>
                <BellOff size={18} className="text-emerald-400/30" />
              </div>
            </div>
          );
        })}
      </div>

      <button 
        onClick={() => onMarkAllAsPrayed(dateKey)}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-emerald-900/20"
      >
        تحديد الكل كمصلى
      </button>
    </div>
  );

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Week starts Sunday (LTR): Sun=col0, Mon=col1 … Sat=col6
    // getDay() returns 0=Sun … 6=Sat, which maps directly
    const padCells = monthStart.getDay();

    const handleDayClick = (day: Date) => {
      setCurrentDate(day);
      setView('day');
    };

    // Circular arc ring — exactly like the screenshot
    const PrayerRing = ({
      count,
      isSelected,
      isTodayDay,
      dayNum,
    }: {
      count: number;
      isSelected: boolean;
      isTodayDay: boolean;
      dayNum: string;
    }) => {
      const SIZE = 38;
      const SW = 5;           // stroke-width
      const R = (SIZE - SW) / 2;
      const CIRC = 2 * Math.PI * R;
      const filled = (count / 5) * CIRC;
      const gap = CIRC - filled;

      // track: dark ring always visible
      const trackColor = '#1a4d44';
      // arc: bright emerald, dimmer if partial
      const arcOpacity = count === 0 ? 0 : count === 5 ? 1 : 0.72;

      return (
        <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            style={{ transform: 'rotate(-90deg)' }}
            overflow="visible"
          >
            {/* Track ring */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={trackColor}
              strokeWidth={SW}
            />
            {/* Progress arc */}
            {count > 0 && (
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke="#10b981"
                strokeWidth={SW}
                strokeDasharray={`${filled} ${gap}`}
                strokeLinecap="round"
                opacity={arcOpacity}
                style={{ transition: 'stroke-dasharray 0.4s ease' }}
              />
            )}
          </svg>

          {/* Day number centered inside ring */}
          <span
            className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold leading-none select-none"
            style={{
              color: isSelected
                ? '#fff'
                : isTodayDay
                ? '#6ee7b7'
                : '#94a3b8',
            }}
          >
            {isSelected ? (
              <span
                className="flex items-center justify-center rounded-full bg-emerald-500 text-white font-bold"
                style={{ width: 22, height: 22, fontSize: 10 }}
              >
                {dayNum}
              </span>
            ) : (
              dayNum
            )}
          </span>
        </div>
      );
    };

    return (
      <div
        dir="ltr"
        className="rounded-3xl border border-[#1a4d44] shadow-2xl overflow-hidden"
        style={{ background: '#0b2d26' }}
      >
        {/* ── Month nav ─────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <button
            onClick={handlePrevMonth}
            className="w-9 h-9 flex items-center justify-center rounded-full text-emerald-400 hover:bg-[#1a4d44] hover:text-white transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-white font-bold text-sm tracking-wide" dir="rtl">
            {format(currentDate, 'MMMM yyyy', { locale: ar })}
          </span>
          <button
            onClick={handleNextMonth}
            className="w-9 h-9 flex items-center justify-center rounded-full text-emerald-400 hover:bg-[#1a4d44] hover:text-white transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* ── Day-name header (Sun → Sat) LTR Arabic ── */}
        <div className="grid grid-cols-7 pb-1" style={{ padding: '0 4px 4px' }}>
          {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((d) => (
            <div
              key={d}
              className="text-center font-semibold leading-tight"
              style={{ color: '#5fa88a', paddingBottom: 8, fontSize: '10px' }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* ── Days grid ─────────────────────────────── */}
        <div className="grid grid-cols-7 pb-5 gap-y-1" style={{ padding: '0 4px 20px' }}>
          {/* leading empty cells — same height as day cells */}
          {Array.from({ length: padCells }).map((_, i) => (
            <div key={`pad-${i}`} style={{ height: 48 }} />
          ))}

          {days.map((day) => {
            const dKey = format(day, 'yyyy-MM-dd');
            const log = prayerLogs.find(l => l.date === dKey);
            const count = log ? log.completed.length : 0;
            const isTodayDay = isToday(day);
            const isSelected = isSameDay(day, currentDate);

            return (
              <div
                key={dKey}
                onClick={() => handleDayClick(day)}
                className="flex flex-col items-center justify-center cursor-pointer rounded-2xl transition-all hover:bg-[#1a4d44]/30"
                style={{ height: 48 }}
              >
                <PrayerRing
                  count={count}
                  isSelected={isSelected}
                  isTodayDay={isTodayDay}
                  dayNum={format(day, 'd')}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">اليوم، {format(currentDate, 'd MMMM', { locale: ar })}</h1>
          <p className="text-slate-500 mt-1">3 رمضان 1447 هـ</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleNextDay} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50"><ChevronRight size={20} /></button>
          <button onClick={handlePrevDay} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50"><ChevronLeft size={20} /></button>
        </div>
      </header>

      <div className="flex justify-center gap-4 bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto">
        <button 
          onClick={() => setView('day')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'day' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
        >
          اليوم
        </button>
        <button 
          onClick={() => setView('month')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'month' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
        >
          التقدم
        </button>
      </div>

      {view === 'day' ? renderDayView() : renderMonthView()}
    </div>
  );
};
