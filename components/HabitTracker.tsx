'use client'

import React, { useState } from 'react';
import { Habit, Category } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface HabitTrackerProps {
  habits: Habit[];
  onToggle: (id: string) => void;
  onAdd: (habit: Omit<Habit, 'id' | 'completedDates' | 'streak'>) => void;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ habits, onToggle, onAdd }) => {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<Category>(Category.PERSONAL);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAdd({ name: newName, category: newCategory, frequency: 'daily' });
      setNewName('');
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">عاداتي اليومية</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          {showForm ? 'إلغاء' : '+ عادة جديدة'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-600 mb-2 text-right">اسم العادة</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="مثال: قراءة 10 صفحات"
              required
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-slate-600 mb-2 text-right">التصنيف</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as Category)}
              className="w-full px-4 py-2 border rounded-lg outline-none"
            >
              {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 w-full md:w-auto">
            إضافة
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.map((habit) => {
          const isCompletedToday = habit.completedDates.includes(today);
          return (
            <div key={habit.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onToggle(habit.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompletedToday 
                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                    : 'border-slate-200 group-hover:border-indigo-300'
                  }`}
                >
                  {isCompletedToday ? '✓' : ''}
                </button>
                <div>
                  <h3 className={`font-semibold ${isCompletedToday ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {habit.name}
                  </h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[habit.category]}`}>
                    {habit.category}
                  </span>
                </div>
              </div>
              <div className="text-left">
                <span className="text-xs text-slate-400 block uppercase">التتابع</span>
                <span className="font-bold text-indigo-600">{habit.streak} يوم</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
