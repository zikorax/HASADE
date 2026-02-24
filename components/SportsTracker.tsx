'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { WorkoutLog, WorkoutType, Intensity } from '../types';
import { Flame, Trophy, Calendar, Clock, Activity, Dumbbell, Home, Timer, ChevronRight, ChevronLeft, CheckCircle2, Trash2, Edit2, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SportsTrackerProps {
  workoutLogs: WorkoutLog[];
  onSaveWorkout: (log: WorkoutLog) => void;
  onDeleteWorkout: (date: string) => void;
}

export const SportsTracker: React.FC<SportsTrackerProps> = ({ workoutLogs, onSaveWorkout, onDeleteWorkout }) => {
  const [view, setView] = useState<'day' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [workoutType, setWorkoutType] = useState<WorkoutType>(WorkoutType.GYM);
  const [duration, setDuration] = useState<number>(30);
  const [intensity, setIntensity] = useState<Intensity>(Intensity.MEDIUM);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const existingWorkout = workoutLogs.find(log => log.date === dateKey);

  // Sync form with existing workout when date changes or editing starts
  useEffect(() => {
    if (existingWorkout) {
      setWorkoutType(existingWorkout.type);
      setDuration(existingWorkout.duration);
      setIntensity(existingWorkout.intensity);
      setIsEditing(false);
    } else {
      setIsEditing(true);
      // Reset to defaults for new entry
      setWorkoutType(WorkoutType.GYM);
      setDuration(30);
      setIntensity(Intensity.MEDIUM);
    }
  }, [dateKey, existingWorkout]);

  // Calculate Streaks and Levels
  const stats = useMemo(() => {
    let currentStreak = 0;
    let longestStreak = 0;

    // Current Streak
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    const todayKey = format(checkDate, 'yyyy-MM-dd');
    const hasToday = workoutLogs.some(log => log.date === todayKey);

    // For streak calculation, if today isn't done yet, we check from yesterday
    let streakCheckDate = new Date(checkDate);
    if (!hasToday) {
      streakCheckDate.setDate(streakCheckDate.getDate() - 1);
    }

    while (workoutLogs.some(log => log.date === format(streakCheckDate, 'yyyy-MM-dd'))) {
      currentStreak++;
      streakCheckDate.setDate(streakCheckDate.getDate() - 1);
    }

    // Warning: No two consecutive days
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = format(yesterday, 'yyyy-MM-dd');
    const hasYesterday = workoutLogs.some(log => log.date === yesterdayKey);
    const consecutiveMissWarning = !hasToday && !hasYesterday;

    // Longest Streak
    const allDates = [...new Set(workoutLogs.map(l => l.date))].sort() as string[];
    if (allDates.length > 0) {
      let currentLongest = 1;
      for (let i = 1; i < allDates.length; i++) {
        const prevStr = allDates[i - 1] as string;
        const currStr = allDates[i] as string;
        if (prevStr && currStr) {
          const prev = new Date(prevStr);
          const curr = new Date(currStr);
          const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
          if (diff === 1) {
            currentLongest++;
          } else {
            longestStreak = Math.max(longestStreak, currentLongest);
            currentLongest = 1;
          }
        }
      }
      longestStreak = Math.max(longestStreak, currentLongest);
    }

    // This Week Stats
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 6 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 6 });
    const thisWeekLogs = workoutLogs.filter(log => {
      const d = parseISO(log.date);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    });
    const thisWeekCount = thisWeekLogs.length;
    const weeklyCommitment = Math.round((thisWeekCount / 7) * 100);

    // Levels and Milestones
    const levels = [
      { min: 0, name: 'بداية الرحلة', next: 3 },
      { min: 3, name: 'منضبط مبتدئ', next: 7 },
      { min: 7, name: 'رياضي واعد', next: 14 },
      { min: 14, name: 'وحش اللياقة', next: 30 },
      { min: 30, name: 'أسطورة الانضباط', next: 100 },
    ];

    const currentLevel = levels.reverse().find(l => currentStreak >= l.min) || levels[levels.length - 1];
    const progressToNext = currentStreak;
    const nextMilestone = currentLevel.next;
    const levelProgress = Math.min(100, (currentStreak / nextMilestone) * 100);

    return {
      currentStreak,
      longestStreak,
      thisWeekCount,
      weeklyCommitment,
      consecutiveMissWarning,
      hasToday,
      hasYesterday,
      currentLevel,
      nextMilestone,
      levelProgress
    };
  }, [workoutLogs]);

  const handleSave = () => {
    onSaveWorkout({
      date: dateKey,
      type: workoutType,
      duration,
      intensity
    });
    setIsEditing(false);
  };

  const handlePrevDay = () => setSelectedDate(prev => new Date(prev.setDate(prev.getDate() - 1)));
  const handleNextDay = () => setSelectedDate(prev => new Date(prev.setDate(prev.getDate() + 1)));

  const renderDayView = () => (
    <div className="space-y-8">
      {/* 1. Identity & Level Header */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-[-20px] right-[-20px] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">المستوى الحالي</span>
              <h2 className="text-3xl font-black mt-1">{stats.currentLevel.name}</h2>
            </div>
            <div className="bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-tighter">أطول سلسلة</p>
              <p className="text-lg font-black text-orange-400">{stats.longestStreak} يوم</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400">التقدم نحو المستوى التالي</span>
              <span className="text-indigo-400">{stats.currentStreak} / {stats.nextMilestone} أيام</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="bg-gradient-to-r from-indigo-600 to-violet-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                style={{ width: `${stats.levelProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-500">
                <Flame size={20} fill="currentColor" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">السلسلة الحالية</p>
                <p className="font-bold">{stats.currentStreak} أيام</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
                <Activity size={20} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">التزام الأسبوع</p>
                <p className="font-bold">{stats.weeklyCommitment}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Warnings & Stability */}
      {stats.consecutiveMissWarning && (
        <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[2rem] flex items-center gap-4 animate-bounce">
          <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
            <Activity size={24} />
          </div>
          <div>
            <h4 className="font-black text-red-900">تحذير: الانقطاع المتتالي!</h4>
            <p className="text-sm text-red-700">"لا يومين متتاليين بدون رياضة" - هذا هو قانون المنضبطين.</p>
          </div>
        </div>
      )}

      {!stats.hasToday && stats.hasYesterday && (
        <div className="bg-amber-50 border-2 border-amber-100 p-6 rounded-[2rem] flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
            <Timer size={24} />
          </div>
          <div>
            <h4 className="font-black text-amber-900">يوم الحسم!</h4>
            <p className="text-sm text-amber-700">لقد تدربت بالأمس، لا تكسر السلسلة اليوم وحافظ على استقرارك.</p>
          </div>
        </div>
      )}

      {/* 3. Workout Content */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        {existingWorkout && !isEditing ? (
          <div className="space-y-8">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                  {existingWorkout.type === WorkoutType.GYM && <Dumbbell size={32} />}
                  {existingWorkout.type === WorkoutType.RUNNING && <Activity size={32} />}
                  {existingWorkout.type === WorkoutType.HOME && <Home size={32} />}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">{existingWorkout.type}</h3>
                  <p className="text-emerald-600 font-medium">أثبتّ انضباطك اليوم ✅</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={() => onDeleteWorkout(dateKey)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                <Clock className="text-indigo-500" size={20} />
                <div>
                  <p className="text-xs text-slate-400">المدة</p>
                  <p className="font-bold text-slate-700">{existingWorkout.duration} دقيقة</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                <Activity className="text-orange-500" size={20} />
                <div>
                  <p className="text-xs text-slate-400">الشدة</p>
                  <p className="font-bold text-slate-700">{existingWorkout.intensity}</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700">
              <CheckCircle2 size={20} />
              <span className="font-medium">تم تسجيل هذا التمرين بنجاح!</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-slate-800">
                {existingWorkout ? 'تعديل سجل الانضباط' : 'أكّد هويتك الرياضية اليوم'}
              </h3>
              {existingWorkout && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-sm text-slate-400 hover:text-slate-600"
                >
                  إلغاء
                </button>
              )}
            </div>

            {/* Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500">نوع التمرين</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: WorkoutType.GYM, icon: Dumbbell, label: 'جيم' },
                  { id: WorkoutType.RUNNING, icon: Activity, label: 'جري' },
                  { id: WorkoutType.HOME, icon: Home, label: 'منزل' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setWorkoutType(type.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${workoutType === type.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-slate-100 hover:border-slate-200 text-slate-400'
                      }`}
                  >
                    <type.icon size={24} />
                    <span className="text-xs font-bold">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-500">المدة (دقيقة)</label>
                <span className="text-indigo-600 font-bold">{duration} دقيقة</span>
              </div>
              <input
                type="range" min="5" max="120" step="5"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Intensity */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-500">الشدة</label>
              <div className="flex gap-2">
                {[Intensity.LOW, Intensity.MEDIUM, Intensity.HIGH].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setIntensity(lvl)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${intensity === lvl
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              <Timer size={20} />
              {existingWorkout ? 'حفظ التعديلات' : 'تسجيل التمرين'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderMonthView = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-2">
            <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-600 text-white">شهر</button>
            <button className="px-4 py-1.5 rounded-full text-sm font-medium text-slate-400">أسبوع</button>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedDate(subMonths(selectedDate, 1))} className="text-slate-400 hover:text-indigo-600"><ChevronLeft size={20} /></button>
            <span className="text-slate-700 font-bold min-w-[120px] text-center">{format(selectedDate, 'MMMM yyyy', { locale: ar })}</span>
            <button onClick={() => setSelectedDate(addMonths(selectedDate, 1))} className="text-slate-400 hover:text-indigo-600"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-8 text-center" dir="ltr">
          {['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'].map(day => (
            <div key={day} className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{day}</div>
          ))}

          {/* Padding for first week */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`pad-${i}`} className="w-12 h-12" />
          ))}

          {days.map((day) => {
            const dKey = format(day, 'yyyy-MM-dd');
            const log = workoutLogs.find(l => l.date === dKey);
            const isTodayDay = isToday(day);
            const isSelected = isSameDay(day, selectedDate);

            return (
              <div
                key={dKey}
                onClick={() => { setSelectedDate(day); setView('day'); }}
                className="flex flex-col items-center gap-2 cursor-pointer group"
              >
                <span className={`text-xs transition-all ${isSelected ? 'text-white font-bold bg-indigo-600 w-6 h-6 flex items-center justify-center rounded-full' :
                  isTodayDay ? 'text-indigo-600 font-bold underline underline-offset-4' : 'text-slate-500 group-hover:text-indigo-600'
                  }`}>
                  {format(day, 'd')}
                </span>
                <div className={`relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${log ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-slate-50 text-slate-200 group-hover:bg-slate-100'
                  }`}>
                  {log ? (
                    log.type === WorkoutType.GYM ? <Dumbbell size={20} /> :
                      log.type === WorkoutType.RUNNING ? <Activity size={20} /> :
                        <Home size={20} />
                  ) : (
                    <Plus size={16} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-3xl font-black text-slate-800">{workoutLogs.filter(l => format(parseISO(l.date), 'M') === format(selectedDate, 'M')).length}</p>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">تمارين هذا الشهر</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-slate-800">{stats.thisWeekCount}</p>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">تمارين هذا الأسبوع</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {isToday(selectedDate) ? 'اليوم، ' : ''}{format(selectedDate, 'd MMMM', { locale: ar })}
          </h1>
          <p className="text-slate-500 mt-1">الانضباط هو ما يصنع الفارق، استمر في بناء هويتك الجديدة.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrevDay} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50"><ChevronRight size={20} /></button>
          <button onClick={handleNextDay} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50"><ChevronLeft size={20} /></button>
        </div>
      </header>

      <div className="flex justify-center gap-4 bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto">
        <button
          onClick={() => setView('day')}
          className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'day' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          اليوم
        </button>
        <button
          onClick={() => setView('month')}
          className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          التقويم
        </button>
      </div>

      {view === 'day' ? renderDayView() : renderMonthView()}
    </div>
  );
};
