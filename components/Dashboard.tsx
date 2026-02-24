'use client'

import React from 'react';
import { UserState, Category } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Rocket, Target, Zap, Activity, CheckCircle2, Layout, Moon, Ban, BookOpen, ShieldCheck, Clock } from 'lucide-react';
import { CATEGORY_COLORS } from '../constants';
import { differenceInDays, parseISO } from 'date-fns';

export const Dashboard: React.FC<{ userState: UserState }> = ({ userState }) => {
  const habitsCompletedToday = userState.habits.filter(h =>
    h.completedDates.includes(new Date().toISOString().split('T')[0])
  ).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const prayersCompletedToday = userState.prayerLogs.find(l => l.date === todayStr)?.completed.length || 0;

  // Calculate Sports Streak for Dashboard
  const sportsStreak = (() => {
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    while (userState.workoutLogs.some(log => log.date === checkDate.toISOString().split('T')[0])) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  })();

  const totalHabits = userState.habits.length;
  const habitPercentage = totalHabits > 0 ? Math.round((habitsCompletedToday / totalHabits) * 100) : 0;
  const prayerPercentage = Math.round((prayersCompletedToday / 5) * 100);

  // Project Analytics
  const activeProjects = userState.projects.filter(p => p.status === 'active');
  const avgProjectProgress = activeProjects.length > 0
    ? Math.round(activeProjects.reduce((acc, p) => acc + p.progress, 0) / activeProjects.length)
    : 0;

  // Sobriety (Hashish) Analytics
  const soberDays = userState.hashishState.cleanStartDate
    ? differenceInDays(new Date(), parseISO(userState.hashishState.cleanStartDate))
    : 0;

  // Sleep Analytics
  const lastSleepLog = userState.sleepLogs[userState.sleepLogs.length - 1];
  const lastSleepDuration = lastSleepLog ? lastSleepLog.duration : 0;

  // Quran Analytics
  const quranPagesToday = userState.quranState.logs.find(l => l.date === todayStr)?.pagesRead || 0;
  const quranStreak = userState.quranState.streak;

  // Data for Category breakdown
  const categoryData = Object.values(Category).map(cat => ({
    name: cat,
    count: userState.habits.filter(h => h.category === cat).length
  })).filter(d => d.count > 0);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316'];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-800">مرحباً بك في حصادك اليوم 🌿</h1>
        <p className="text-slate-500 mt-2">راقب تقدمك وحافظ على استمراريتك.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {/* Stat Cards */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-[-10px] left-[-10px] w-24 h-24 bg-indigo-50 rounded-full -z-0 opacity-50"></div>
          <div className="z-10">
            <span className="text-slate-500 text-sm">إنجاز العادات</span>
            <div className="text-4xl font-bold text-indigo-600 mt-2">{habitPercentage}%</div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 z-10 overflow-hidden">
            <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${habitPercentage}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-[-10px] left-[-10px] w-24 h-24 bg-emerald-50 rounded-full -z-0 opacity-50"></div>
          <div className="z-10">
            <span className="text-slate-500 text-sm">أداء الصلوات</span>
            <div className="text-4xl font-bold text-emerald-600 mt-2">{prayersCompletedToday}/5</div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-4 z-10 overflow-hidden">
            <div className="bg-emerald-600 h-full transition-all duration-1000" style={{ width: `${prayerPercentage}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-[-10px] left-[-10px] w-24 h-24 bg-orange-50 rounded-full -z-0 opacity-50"></div>
          <div className="z-10">
            <span className="text-slate-500 text-sm">سلسلة الرياضة</span>
            <div className="text-4xl font-bold text-orange-600 mt-2">{sportsStreak} 🔥</div>
          </div>
          <p className="text-xs text-slate-400 mt-4">استمر في الحركة!</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <span className="text-slate-500 text-sm">الأهداف النشطة</span>
            <div className="text-4xl font-bold text-emerald-600 mt-2">{userState.goals.length}</div>
          </div>
          <p className="text-xs text-slate-400 mt-4">لديك أهداف قيد المتابعة</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <span className="text-slate-500 text-sm">أطول تتابع</span>
            <div className="text-4xl font-bold text-amber-600 mt-2">
              {Math.max(...userState.habits.map(h => h.streak), 0)} يوم
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">استمر في العطاء!</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-[-10px] left-[-10px] w-24 h-24 bg-indigo-50 rounded-full -z-0 opacity-50"></div>
          <div className="z-10 flex justify-between items-start">
            <span className="text-slate-500 text-sm font-bold">المشاريع</span>
            <Rocket size={18} className="text-indigo-400" />
          </div>
          <div className="z-10 mt-2">
            <div className="text-4xl font-black text-indigo-600">{activeProjects.length}</div>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">نشط حالياً</p>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 z-10 overflow-hidden">
            <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${avgProjectProgress}%` }}></div>
          </div>
        </div>

        {/* Sobriety Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute top-[-10px] left-[-10px] w-24 h-24 bg-red-50 rounded-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="z-10 flex justify-between items-start">
            <span className="text-slate-500 text-sm font-bold">التعافي</span>
            <ShieldCheck size={18} className="text-red-400" />
          </div>
          <div className="z-10 mt-2">
            <div className="text-4xl font-black text-red-600">{soberDays}</div>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">يوم نظيف</p>
          </div>
          <div className="z-10 flex items-center gap-1 mt-4 text-[11px] font-bold text-slate-400">
            <Activity size={12} />
            <span>أطول سلسلة: {userState.hashishState.longestStreak}</span>
          </div>
        </div>

        {/* Sleep Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute top-[-10px] left-[-10px] w-24 h-24 bg-slate-100 rounded-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="z-10 flex justify-between items-start">
            <span className="text-slate-500 text-sm font-bold">النوم</span>
            <Moon size={18} className="text-slate-400" />
          </div>
          <div className="z-10 mt-2">
            <div className="text-4xl font-black text-slate-800">{lastSleepDuration}h</div>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">آخر جلسة</p>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 z-10 overflow-hidden">
            <div className="bg-slate-800 h-full transition-all duration-1000" style={{ width: `${Math.min((lastSleepDuration / 8) * 100, 100)}%` }}></div>
          </div>
        </div>

        {/* Quran Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute top-[-10px] left-[-10px] w-24 h-24 bg-amber-50 rounded-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="z-10 flex justify-between items-start">
            <span className="text-slate-500 text-sm font-bold">القرآن الكريم</span>
            <BookOpen size={18} className="text-amber-400" />
          </div>
          <div className="z-10 mt-2">
            <div className="text-4xl font-black text-amber-600">{quranPagesToday}</div>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">صفحة اليوم</p>
          </div>
          <div className="z-10 flex items-center gap-1 mt-4 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg w-fit">
            <Zap size={12} fill="currentColor" />
            <span>سلسلة: {quranStreak} أيام</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown Chart */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[400px]">
          <h3 className="text-xl font-bold text-slate-800 mb-6">توزيع التركيز حسب التصنيف</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-slate-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Task Progress (Placeholder) */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 mb-6">أهم المهام والمشاريع 🚀</h3>
          <div className="space-y-4">
            {/* Project Top Tasks */}
            {activeProjects.slice(0, 3).map(project => {
              const topTask = project.tasks.find(t => t.isTopTask && !t.completed) || project.tasks.find(t => !t.completed);
              if (!topTask) return null;
              return (
                <div key={`proj-${project.id}`} className="flex items-center justify-between p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl hover:bg-indigo-100/50 transition cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                      <Rocket size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{project.name}</h4>
                      <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider">{topTask.title}</span>
                    </div>
                  </div>
                  <div className="text-sm font-black text-indigo-600">{project.progress}%</div>
                </div>
              );
            })}

            {/* Goals */}
            {userState.goals.slice(0, 2).map(goal => (
              <div key={`goal-${goal.id}`} className="flex items-center justify-between p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl hover:bg-emerald-50/50 transition cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                    <Target size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{goal.title}</h4>
                    <span className="text-xs text-slate-500">ينتهي في {goal.deadline}</span>
                  </div>
                </div>
                <div className="text-sm font-black text-emerald-600">{goal.progress}%</div>
              </div>
            ))}

            {(activeProjects.length === 0 && userState.goals.length === 0) && (
              <div className="text-center py-10 text-slate-400">لا توجد مهام أو مشاريع نشطة حالياً.</div>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-20 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] py-10 border-t border-slate-50">
        حصاد — رحلتك نحو التوازن الروحي والنفسي
      </footer>
    </div>
  );
};
