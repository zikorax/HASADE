'use client'

import React, { useState, useMemo } from 'react';
import { HashishState, HashishDayLog, HashishAttack, AttackResult } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, addMonths, subMonths, parseISO, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ChevronRight, ChevronLeft, Plus, Shield, ShieldOff, Moon, Briefcase, Clock, AlertTriangle, RotateCcw, Zap, Target, TrendingDown, Eye } from 'lucide-react';

interface HashishTrackerProps {
  hashishState: HashishState;
  onUpdateState: (state: HashishState) => void;
}

// Phase limits per week
const PHASE_LIMITS: Record<number, number> = {
  1: 6,
  2: 4,
  3: 2,
  4: 1,
};

const getWeekNumber = (startDate: string): number => {
  const start = parseISO(startDate);
  const now = new Date();
  const days = differenceInDays(now, start);
  const week = Math.floor(days / 7) + 1;
  return Math.min(week, 4);
};

const getDailyLimit = (startDate: string): number => {
  const week = getWeekNumber(startDate);
  return PHASE_LIMITS[week] || 1;
};

export const HashishTracker: React.FC<HashishTrackerProps> = ({ hashishState, onUpdateState }) => {
  const [view, setView] = useState<'day' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAttackForm, setShowAttackForm] = useState(false);

  // Attack form state
  const [attackTime, setAttackTime] = useState('');
  const [attackActivity, setAttackActivity] = useState('');
  const [attackReason, setAttackReason] = useState('');
  const [attackResult, setAttackResult] = useState<AttackResult>(AttackResult.RESISTED);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  // todayLog always refers to TODAY's log (for write operations and today-only sections)
  const todayLog = hashishState.dayLogs.find(l => l.date === todayKey);
  // selectedLog refers to the selected date's log (for display/navigation)
  const selectedLog = hashishState.dayLogs.find(l => l.date === dateKey);
  const dailyLimit = getDailyLimit(hashishState.startDate);
  const currentWeek = getWeekNumber(hashishState.startDate);

  // Calculate stats
  const stats = useMemo(() => {
    // Clean days streak
    let cleanDays = 0;
    if (hashishState.cleanStartDate) {
      const cleanStart = parseISO(hashishState.cleanStartDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if today has any count
      const todayLogCheck = hashishState.dayLogs.find(l => l.date === todayKey);
      if (!todayLogCheck || todayLogCheck.count === 0) {
        cleanDays = differenceInDays(today, cleanStart);
      } else {
        cleanDays = 0;
      }
    }

    // Longest streak
    let longestStreak = hashishState.longestStreak;

    // Is in zero phase (week 4+ or goal is 0)
    const inZeroPhase = currentWeek >= 4;

    // Today's work smoking status
    const todayLogCheck = hashishState.dayLogs.find(l => l.date === todayKey);
    const smokedDuringWorkToday = todayLogCheck?.smokedDuringWork || false;

    // Count work smoking days this week
    const workSmokingDays = hashishState.dayLogs.filter(l => l.smokedDuringWork).length;

    return {
      cleanDays: Math.max(0, cleanDays),
      longestStreak,
      inZeroPhase,
      smokedDuringWorkToday,
      workSmokingDays,
    };
  }, [hashishState, todayKey, currentWeek]);

  // Show fall protocol if in zero phase and today has count > 0
  const showFallProtocol = useMemo(() => {
    if (currentWeek < 4) return false;
    const todayLogCheck = hashishState.dayLogs.find(l => l.date === todayKey);
    return todayLogCheck && todayLogCheck.count > 0;
  }, [hashishState, todayKey, currentWeek]);

  const handleChangeCount = (delta: number) => {
    const existing = hashishState.dayLogs.find(l => l.date === dateKey);
    const newCount = Math.max(0, (existing?.count ?? 0) + delta);
    let newLogs: HashishDayLog[];

    if (existing) {
      newLogs = hashishState.dayLogs.map(l =>
        l.date === dateKey ? { ...l, count: newCount } : l
      );
    } else {
      newLogs = [...hashishState.dayLogs, {
        date: dateKey,
        count: newCount,
        attacks: [],
        smokedDuringWork: false,
      }];
    }

    // Only reset clean start date when adding to today
    const newState: HashishState = {
      ...hashishState,
      dayLogs: newLogs,
      cleanStartDate: (delta > 0 && dateKey === todayKey) ? null : hashishState.cleanStartDate,
    };

    onUpdateState(newState);
  };

  const handleToggleWorkSmoking = (value: boolean) => {
    const existing = hashishState.dayLogs.find(l => l.date === dateKey);
    let newLogs: HashishDayLog[];

    if (existing) {
      newLogs = hashishState.dayLogs.map(l =>
        l.date === dateKey ? { ...l, smokedDuringWork: value } : l
      );
    } else {
      newLogs = [...hashishState.dayLogs, {
        date: dateKey,
        count: 0,
        attacks: [],
        smokedDuringWork: value,
      }];
    }

    onUpdateState({ ...hashishState, dayLogs: newLogs });
  };

  const handleAddAttack = () => {
    if (!attackTime || !attackActivity || !attackReason) return;

    const newAttack: HashishAttack = {
      id: Date.now().toString(),
      time: attackTime,
      activity: attackActivity,
      reason: attackReason,
      result: attackResult,
    };

    const existing = hashishState.dayLogs.find(l => l.date === todayKey);
    let newLogs: HashishDayLog[];

    if (existing) {
      newLogs = hashishState.dayLogs.map(l =>
        l.date === todayKey ? { ...l, attacks: [...l.attacks, newAttack] } : l
      );
    } else {
      newLogs = [...hashishState.dayLogs, {
        date: todayKey,
        count: 0,
        attacks: [newAttack],
        smokedDuringWork: false,
      }];
    }

    onUpdateState({ ...hashishState, dayLogs: newLogs });
    setAttackTime('');
    setAttackActivity('');
    setAttackReason('');
    setAttackResult(AttackResult.RESISTED);
    setShowAttackForm(false);
  };

  const handleMarkCleanDay = () => {
    // If no clean start date, set it to today
    if (!hashishState.cleanStartDate) {
      const newLongest = Math.max(hashishState.longestStreak, 1);
      onUpdateState({
        ...hashishState,
        cleanStartDate: todayKey,
        longestStreak: newLongest,
      });
    } else {
      // Update longest streak
      const cleanDays = stats.cleanDays + 1;
      const newLongest = Math.max(hashishState.longestStreak, cleanDays);
      onUpdateState({
        ...hashishState,
        longestStreak: newLongest,
      });
    }
  };

  const handlePrevDay = () => setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - 1); return d; });
  const handleNextDay = () => setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + 1); return d; });

  const getDayStatus = (date: string): 'clean' | 'within-limit' | 'over-limit' | 'none' => {
    const log = hashishState.dayLogs.find(l => l.date === date);
    if (!log) return 'none';
    if (log.count === 0) return 'clean';
    const limit = getDailyLimit(hashishState.startDate);
    if (log.count <= limit) return 'within-limit';
    return 'over-limit';
  };

  const renderDayView = () => {
    // For display, use selectedLog (selected date). For mutations, todayKey is still used.
    const isSelectedToday = dateKey === todayKey;
    const currentCount = selectedLog?.count || 0;
    const isOverLimit = currentCount > dailyLimit;

    return (
      <div className="space-y-6">

        {/* SECTION 1: Identity Counter */}
        <div className="relative rounded-[2rem] overflow-hidden" style={{ background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)' }}>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(220,38,38,0.08) 0%, transparent 60%)' }}></div>
          <div className="absolute top-0 left-0 w-full h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }}></div>

          <div className="relative z-10 p-8 space-y-6">
            <div className="text-center space-y-3">
              <p className="text-[11px] tracking-[0.3em] uppercase font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>عدّاد الهوية</p>
              <div className="flex items-baseline justify-center gap-3">
                <span className="text-7xl font-black text-white tabular-nums" style={{ fontFeatureSettings: '"tnum"', letterSpacing: '-0.03em' }}>
                  {stats.cleanDays}
                </span>
                <span className="text-lg font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>يوم بدون حشيش</span>
              </div>
            </div>

            <div className="flex justify-center gap-6">
              <div className="text-center px-5 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>أطول سلسلة</p>
                <p className="text-2xl font-black text-amber-400 tabular-nums">{stats.longestStreak}</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>يوم</p>
              </div>
              <div className="text-center px-5 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>الهدف الحالي</p>
                <p className="text-2xl font-black text-white tabular-nums">{hashishState.currentGoal}</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>يوم</p>
              </div>
              <div className="text-center px-5 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>الأسبوع</p>
                <p className="text-2xl font-black text-white tabular-nums">{currentWeek}</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>من 4</p>
              </div>
            </div>

            {/* Progress bar toward goal */}
            {hashishState.currentGoal > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-[11px]">
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>التقدم نحو الهدف</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{stats.cleanDays} / {hashishState.currentGoal}</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, (stats.cleanDays / hashishState.currentGoal) * 100)}%`,
                      background: stats.cleanDays >= hashishState.currentGoal
                        ? 'linear-gradient(90deg, #22c55e, #10b981)'
                        : 'linear-gradient(90deg, #dc2626, #f97316)',
                      boxShadow: '0 0 12px rgba(220,38,38,0.3)'
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: Daily Count (Reduction Phase) */}
        {currentWeek <= 4 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isOverLimit ? 'rgba(220,38,38,0.1)' : 'rgba(245,158,11,0.1)' }}>
                  <TrendingDown size={20} className={isOverLimit ? 'text-red-500' : 'text-amber-500'} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">عدّاد المرات اليومية</h3>
                  <p className="text-xs text-slate-400">الأسبوع {currentWeek} — الحد الأقصى: {dailyLimit}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-5 rounded-2xl" style={{ background: isOverLimit ? 'rgba(220,38,38,0.04)' : 'rgba(241,245,249,1)', border: isOverLimit ? '2px solid rgba(220,38,38,0.15)' : '2px solid transparent' }}>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black tabular-nums ${isOverLimit ? 'text-red-600' : 'text-slate-800'}`}>
                  {currentCount}
                </span>
                <span className="text-slate-400 font-medium">/</span>
                <span className="text-xl font-bold text-slate-400">{dailyLimit}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleChangeCount(-1)}
                  disabled={currentCount === 0}
                  className="flex items-center gap-1 px-4 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 bg-slate-200 text-slate-600 hover:bg-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span>−1</span>
                </button>
                <button
                  onClick={() => handleChangeCount(1)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                  style={{
                    background: isOverLimit ? '#dc2626' : '#1e293b',
                    color: 'white',
                  }}
                >
                  <Plus size={16} />
                  <span>+1</span>
                </button>
              </div>
            </div>

            {isOverLimit && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                <AlertTriangle size={18} className="text-red-500 shrink-0" />
                <p className="text-sm text-red-700 font-medium">تجاوزت الحد. سُجّل.</p>
              </div>
            )}

            {/* Phase indicators */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(week => (
                <div
                  key={week}
                  className={`text-center p-3 rounded-xl border-2 transition-all ${currentWeek === week
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : currentWeek > week
                      ? 'border-slate-200 bg-slate-50 text-slate-400'
                      : 'border-slate-100 text-slate-300'
                    }`}
                >
                  <p className="text-[10px] font-bold uppercase">أسبوع {week}</p>
                  <p className="text-lg font-black">{PHASE_LIMITS[week]}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clean Day Button (when count is 0) */}
        {(!selectedLog || selectedLog.count === 0) && (
          <button
            onClick={handleMarkCleanDay}
            className="w-full p-5 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 text-emerald-700 font-bold flex items-center justify-center gap-3 transition-all hover:bg-emerald-50 hover:border-emerald-300 active:scale-[0.98]"
          >
            <Shield size={20} />
            <span>تأكيد: يوم نظيف</span>
          </button>
        )}

        {/* SECTION 3: Attack Log */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Eye size={20} className="text-slate-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">هجمات {isSelectedToday ? 'اليوم' : format(selectedDate, 'd MMMM', { locale: ar })}</h3>
                <p className="text-xs text-slate-400">{format(selectedDate, 'd MMMM yyyy', { locale: ar })} — سجّل كل لحظة رغبة</p>
              </div>
            </div>
            {isSelectedToday && (
              <button
                onClick={() => setShowAttackForm(!showAttackForm)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition text-slate-600"
              >
                <Plus size={18} />
              </button>
            )}
          </div>

          {showAttackForm && (
            <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">الوقت</label>
                  <input
                    type="time"
                    value={attackTime}
                    onChange={(e) => setAttackTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">أثناء ماذا؟</label>
                  <input
                    type="text"
                    value={attackActivity}
                    onChange={(e) => setAttackActivity(e.target.value)}
                    placeholder="عمل، فراغ، جلسة..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">السبب</label>
                <input
                  type="text"
                  value={attackReason}
                  onChange={(e) => setAttackReason(e.target.value)}
                  placeholder="توتر، ملل، عادة..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">النتيجة</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAttackResult(AttackResult.RESISTED)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${attackResult === AttackResult.RESISTED
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                  >
                    <Shield size={16} />
                    قاومت
                  </button>
                  <button
                    onClick={() => setAttackResult(AttackResult.FELL)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${attackResult === AttackResult.FELL
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                  >
                    <ShieldOff size={16} />
                    سقطت
                  </button>
                </div>
              </div>
              <button
                onClick={handleAddAttack}
                disabled={!attackTime || !attackActivity || !attackReason}
                className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold text-sm transition-all hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                تسجيل
              </button>
            </div>
          )}

          {/* Attack table */}
          {selectedLog && selectedLog.attacks.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">الوقت</th>
                    <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">أثناء</th>
                    <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">السبب</th>
                    <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">النتيجة</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLog.attacks.map((attack) => (
                    <tr key={attack.id} className="border-t border-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-600">{attack.time}</td>
                      <td className="px-4 py-3 text-slate-600">{attack.activity}</td>
                      <td className="px-4 py-3 text-slate-500">{attack.reason}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${attack.result === AttackResult.RESISTED
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                          }`}>
                          {attack.result === AttackResult.RESISTED ? <Shield size={12} /> : <ShieldOff size={12} />}
                          {attack.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-300 text-sm">لا هجمات مسجلة {isSelectedToday ? 'اليوم' : 'في هذا اليوم'}</p>
            </div>
          )}
        </div>

        {/* SECTION 5: Night Work Danger Indicator */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <Moon size={20} className="text-indigo-300" />
              </div>
              <div>
                <h3 className="font-bold text-white">مؤشر الخطر الليلي</h3>
                <p className="text-xs text-indigo-300/60">هل دخّنت أثناء العمل الليلي اليوم؟</p>
              </div>
            </div>

            {/* smokedDuringWork driven from selectedLog */}
            {(() => {
              const smokedSelected = selectedLog?.smokedDuringWork ?? false;
              return (
                <>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleToggleWorkSmoking(false)}
                      className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${!smokedSelected
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-indigo-300/50 hover:text-indigo-200'
                        }`}
                      style={smokedSelected ? { background: 'rgba(255,255,255,0.05)' } : {}}
                    >
                      <Shield size={16} />
                      لا — لم أدخّن
                    </button>
                    <button
                      onClick={() => handleToggleWorkSmoking(true)}
                      className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${smokedSelected
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                        : 'text-indigo-300/50 hover:text-indigo-200'
                        }`}
                      style={!smokedSelected ? { background: 'rgba(255,255,255,0.05)' } : {}}
                    >
                      <Briefcase size={16} />
                      نعم — دخّنت
                    </button>
                  </div>

                  {smokedSelected && (
                    <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>
                      <AlertTriangle size={14} />
                      <span>مُسجَّل. الهدف: تحويل هذا دائماً إلى "لا"</span>
                    </div>
                  )}
                  {!smokedSelected && selectedLog && (
                    <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7' }}>
                      <Shield size={14} />
                      <span>ممتاز، لم تدخّن أثناء العمل {isSelectedToday ? 'اليوم' : 'هذا اليوم'}</span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* SECTION 6: Fall Protocol */}
        {showFallProtocol && (
          <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center">
                <RotateCcw size={20} className="text-slate-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">بروتوكول إعادة الضبط — غدا</h3>
              </div>
            </div>

            <div className="space-y-0">
              {[
                { icon: Zap, text: 'رياضة صباحية' },
                { icon: Clock, text: 'فجر في الوقت' },
                { icon: ShieldOff, text: 'لا سوشيال ميديا ليلا' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                    <item.icon size={14} className="text-slate-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{item.text}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 pt-2">لا جلد ذات. لا نصائح. فقط بروتوكول.</p>
          </div>
        )}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Pad start of month to align with day of week
    const padDays = monthStart.getDay(); // 0=Sun (LTR)

    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedDate(subMonths(selectedDate, 1))} className="text-slate-400 hover:text-slate-600 p-1"><ChevronLeft size={20} /></button>
            <span className="text-slate-700 font-bold min-w-[140px] text-center" dir="rtl">{format(selectedDate, 'MMMM yyyy', { locale: ar })}</span>
            <button onClick={() => setSelectedDate(addMonths(selectedDate, 1))} className="text-slate-400 hover:text-slate-600 p-1"><ChevronRight size={20} /></button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 justify-center text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-slate-500">نظيف</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <span className="text-slate-500">ضمن الحد</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-slate-500">تجاوز</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-3 text-center" dir="ltr">
          {['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'].map(day => (
            <div key={day} className="text-slate-400 text-[10px] font-bold uppercase tracking-widest pb-2">{day}</div>
          ))}

          {/* Padding cells */}
          {Array.from({ length: padDays }).map((_, i) => (
            <div key={`pad-${i}`}></div>
          ))}

          {days.map((day) => {
            const dKey = format(day, 'yyyy-MM-dd');
            const status = getDayStatus(dKey);
            const isTodayDay = isToday(day);
            const log = hashishState.dayLogs.find(l => l.date === dKey);

            const bgColor =
              status === 'clean' ? 'bg-emerald-500' :
                status === 'within-limit' ? 'bg-amber-400' :
                  status === 'over-limit' ? 'bg-red-500' :
                    'bg-slate-100';

            const textColor =
              status === 'none' ? 'text-slate-300' : 'text-white';

            return (
              <div key={dKey} className="flex flex-col items-center gap-1">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${bgColor} ${textColor} ${isTodayDay ? 'ring-2 ring-offset-2 ring-slate-800' : ''
                    }`}
                  onClick={() => { setSelectedDate(day); setView('day'); }}
                >
                  {format(day, 'd')}
                </div>
                {log && log.count > 0 && (
                  <span className="text-[9px] font-bold text-slate-400">{log.count}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Monthly Stats */}
        <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100">
          <div className="text-center p-3 rounded-xl bg-slate-50">
            <p className="text-lg font-black text-slate-700">
              {days.reduce((sum, d) => sum + (hashishState.dayLogs.find(l => l.date === format(d, 'yyyy-MM-dd'))?.count || 0), 0)}
            </p>
            <p className="text-[9px] text-slate-500 font-bold uppercase min-h-[28px] flex items-center justify-center leading-tight">إجمالي المرات</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-emerald-50">
            <p className="text-lg font-black text-emerald-700">
              {days.filter(d => getDayStatus(format(d, 'yyyy-MM-dd')) === 'clean').length}
            </p>
            <p className="text-[9px] text-emerald-600 font-bold uppercase min-h-[28px] flex items-center justify-center leading-tight">أيام نظيفة</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-amber-50">
            <p className="text-lg font-black text-amber-700">
              {days.filter(d => getDayStatus(format(d, 'yyyy-MM-dd')) === 'within-limit').length}
            </p>
            <p className="text-[9px] text-amber-600 font-bold uppercase min-h-[28px] flex items-center justify-center leading-tight">ضمن الحد</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-red-50">
            <p className="text-lg font-black text-red-700">
              {days.filter(d => getDayStatus(format(d, 'yyyy-MM-dd')) === 'over-limit').length}
            </p>
            <p className="text-[9px] text-red-600 font-bold uppercase min-h-[28px] flex items-center justify-center leading-tight">تجاوز</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {isToday(selectedDate) ? 'اليوم، ' : ''}{format(selectedDate, 'd MMMM', { locale: ar })}
          </h1>
          <p className="text-slate-400 mt-1 text-sm">كشف النمط. لا دراما.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrevDay} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50"><ChevronRight size={20} /></button>
          <button onClick={handleNextDay} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50"><ChevronLeft size={20} /></button>
        </div>
      </header>

      {/* View Toggle */}
      <div className="flex justify-center gap-4 bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto">
        <button
          onClick={() => setView('day')}
          className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'day' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
        >
          اليوم
        </button>
        <button
          onClick={() => setView('month')}
          className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
        >
          التقويم
        </button>
      </div>

      {view === 'day' ? renderDayView() : renderMonthView()}
    </div>
  );
};
