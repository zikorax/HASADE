'use client'

import React, { useState } from 'react';
import { Goal, Task, Category } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface GoalTrackerProps {
  goals: Goal[];
  onAddGoal: (goal: Omit<Goal, 'id' | 'progress' | 'tasks'>) => void;
  onDeleteGoal: (id: string) => void;
  onAddTask: (goalId: string, title: string) => void;
  onToggleTask: (goalId: string, taskId: string) => void;
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({ 
  goals, onAddGoal, onDeleteGoal, onAddTask, onToggleTask 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<Category>(Category.PERSONAL);
  const [newDeadline, setNewDeadline] = useState('');
  const [taskInputs, setTaskInputs] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onAddGoal({
        title: newTitle,
        description: newDesc,
        category: newCategory,
        deadline: newDeadline || new Date().toISOString().split('T')[0],
      });
      setNewTitle('');
      setNewDesc('');
      setShowForm(false);
    }
  };

  const handleAddTask = (goalId: string) => {
    const title = taskInputs[goalId];
    if (title?.trim()) {
      onAddTask(goalId, title);
      setTaskInputs({ ...taskInputs, [goalId]: '' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">الأهداف الاستراتيجية</h2>
          <p className="text-slate-500 text-sm mt-1">قسم أهدافك الكبيرة إلى خطوات صغيرة ملموسة.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-md shadow-indigo-100 flex items-center gap-2"
        >
          {showForm ? 'إغلاق' : '🎯 هدف جديد'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">عنوان الهدف</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                placeholder="مثال: تعلم تطوير تطبيقات الويب"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">وصف مختصر</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition h-24"
                placeholder="ما الذي تريد تحقيقه بالضبط؟"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">التصنيف</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as Category)}
                className="w-full px-4 py-2.5 border rounded-xl outline-none appearance-none bg-slate-50"
              >
                {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">تاريخ الإنجاز المستهدف</label>
              <input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="pt-4">
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
                اعتماد الهدف
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {goals.map((goal) => (
          <div key={goal.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase ${CATEGORY_COLORS[goal.category]}`}>
                    {goal.category}
                  </span>
                  <h3 className="text-xl font-bold text-slate-800 mt-3">{goal.title}</h3>
                  <p className="text-slate-500 text-sm mt-1">{goal.description}</p>
                </div>
                <button 
                  onClick={() => onDeleteGoal(goal.id)}
                  className="text-slate-300 hover:text-rose-500 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-slate-600">التقدم</span>
                  <span className="text-indigo-600 font-bold">{goal.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-700 ease-out" 
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">المهام الفرعية</h4>
                {goal.tasks.map((task) => (
                  <div 
                    key={task.id} 
                    onClick={() => onToggleTask(goal.id, task.id)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition group"
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                      task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200 group-hover:border-indigo-300'
                    }`}>
                      {task.completed && <span className="text-white text-[10px]">✓</span>}
                    </div>
                    <span className={`text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto border-t p-4 bg-slate-50/50 flex gap-2">
              <input
                type="text"
                placeholder="إضافة مهمة سريعة..."
                value={taskInputs[goal.id] || ''}
                onChange={(e) => setTaskInputs({ ...taskInputs, [goal.id]: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTask(goal.id)}
                className="flex-1 bg-white border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button 
                onClick={() => handleAddTask(goal.id)}
                className="bg-white border text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {goals.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center text-slate-400">
            <div className="text-5xl mb-4 opacity-20">🎯</div>
            <p>ابدأ حصادك اليوم بإضافة هدفك الكبير الأول.</p>
          </div>
        )}
      </div>
    </div>
  );
};
