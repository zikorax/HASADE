'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Project, ProjectTask } from '@/types'
import { useRouter } from 'next/navigation'
import { Plus, Target, Clock, CheckCircle2, ChevronLeft, ChevronRight, Layers, Trash2, LayoutGrid, AlertTriangle, Edit2, Check, X, ArrowUp, ArrowDown, GripVertical, Repeat } from 'lucide-react'
import { format, differenceInDays, parseISO, subDays } from 'date-fns'
import { PomodoroTimer } from './PomodoroTimer'
import { ar } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProjectsTrackerProps {
    projects: Project[]
    onAddProject: (project: Project) => void
    onUpdateProject: (id: string, updates: Partial<Project>) => void
    onDeleteProject: (id: string) => void
    onAddTask: (projectId: string, task: ProjectTask) => void
    onToggleTask: (projectId: string, taskId: string) => void
    onDeleteTask: (projectId: string, taskId: string) => void
    onUpdateTask: (projectId: string, taskId: string, updates: Partial<ProjectTask>) => void
    onReorderTasks: (projectId: string, taskId: string, direction: 'up' | 'down') => void
    onMoveTask: (projectId: string, activeId: string, overId: string) => void
    activeProjectId?: string | null
}

export const ProjectsTracker: React.FC<ProjectsTrackerProps> = ({
    projects,
    onAddProject,
    onUpdateProject,
    onDeleteProject,
    onAddTask,
    onToggleTask,
    onDeleteTask,
    onUpdateTask,
    onReorderTasks,
    onMoveTask,
    activeProjectId = null
}) => {
    const router = useRouter()
    const [localActiveProject, setLocalActiveProject] = useState<string | null>(null)

    // Sync local state with prop if needed, or use prop directly
    const currentActiveId = activeProjectId !== null ? activeProjectId : localActiveProject;

    const [showAddProject, setShowAddProject] = useState(false)
    const [newProjectName, setNewProjectName] = useState('')

    const handleCreateProject = () => {
        if (!newProjectName.trim()) return;
        const newProject: Project = {
            id: Date.now().toString(),
            name: newProjectName,
            status: 'active',
            progress: 0,
            lastActivity: new Date().toISOString(),
            tasks: [],
        }
        onAddProject(newProject)
        setNewProjectName('')
        setShowAddProject(false)
        router.push(`/projects/${newProject.id}`)
    }

    if (currentActiveId) {
        const project = projects.find(p => p.id === currentActiveId)
        if (project) {
            return (
                <ProjectDetail
                    project={project}
                    onBack={() => {
                        if (activeProjectId) {
                            router.push('/projects')
                        } else {
                            setLocalActiveProject(null)
                        }
                    }}
                    onUpdateProject={onUpdateProject}
                    onDeleteProject={onDeleteProject}
                    onAddTask={onAddTask}
                    onToggleTask={onToggleTask}
                    onDeleteTask={onDeleteTask}
                    onUpdateTask={onUpdateTask}
                    onReorderTasks={onReorderTasks}
                    onMoveTask={onMoveTask}
                />
            )
        }
    }

    const activeProjects = projects.filter(p => p.status === 'active')

    const [chartFilter, setChartFilter] = useState<'7days' | 'lastMonth' | 'thisMonth' | 'all'>('7days')

    const projectColors = useMemo(() => [
        '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'
    ], [])

    const projectColorMap = useMemo(() => {
        const map = new Map<string, string>()
        activeProjects.forEach((p, idx) => {
            map.set(p.id, projectColors[idx % projectColors.length])
        })
        return map
    }, [activeProjects, projectColors])

    const globalChartData = useMemo(() => {
        const today = new Date()
        let datesToInclude: string[] = []

        if (chartFilter === '7days') {
            datesToInclude = Array.from({ length: 7 }, (_, i) => format(subDays(today, 6 - i), 'yyyy-MM-dd'))
        } else if (chartFilter === 'lastMonth') {
            const lastDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
            const daysInPrevMonth = lastDayOfPrevMonth.getDate()
            datesToInclude = Array.from({ length: daysInPrevMonth }, (_, i) => {
                return format(new Date(today.getFullYear(), today.getMonth() - 1, daysInPrevMonth - i), 'yyyy-MM-dd')
            })
        } else if (chartFilter === 'thisMonth') {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
            const daysSoFar = differenceInDays(today, startOfMonth) + 1
            datesToInclude = Array.from({ length: daysSoFar }, (_, i) => format(subDays(today, daysSoFar - 1 - i), 'yyyy-MM-dd'))
        } else if (chartFilter === 'all') {
            let maxDays = 7
            projects.forEach(p => {
                p.timeSessions?.forEach(s => {
                    const dAgo = differenceInDays(today, parseISO(s.date))
                    if (dAgo > maxDays) maxDays = dAgo
                })
            })
            if (maxDays > 365) maxDays = 365 // Cap at 1 year max for performance/UI
            datesToInclude = Array.from({ length: maxDays }, (_, i) => format(subDays(today, maxDays - 1 - i), 'yyyy-MM-dd'))
        }

        return datesToInclude.map(dateStr => {
            const dataPoint: any = {
                date: dateStr,
                displayDate: format(parseISO(dateStr), chartFilter === 'all' || chartFilter === 'lastMonth' ? 'dd MMM' : 'EEEE', { locale: ar })
            }
            let totalSeconds = 0

            activeProjects.forEach(p => {
                const session = p.timeSessions?.find(s => s.date === dateStr)
                if (session && session.seconds > 0) {
                    const mins = Math.ceil(session.seconds / 60)
                    dataPoint[p.id] = mins
                    totalSeconds += session.seconds
                }
            })
            dataPoint.totalMinutes = Math.ceil(totalSeconds / 60)
            return dataPoint
        })
    }, [projects, activeProjects, chartFilter])

    const hasGlobalData = globalChartData.some(d => d.totalMinutes > 0)


    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-24">
            <header className="flex justify-between items-end">
                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">المشاريع النشطة</h1>
                    <p className="text-slate-500 font-medium">تركيز مطلق. أين نضع طاقتنا اليوم؟</p>
                </div>
                <button
                    onClick={() => setShowAddProject(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
                >
                    <Plus size={18} />
                    مشروع جديد
                </button>
            </header>

            {showAddProject && (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-4 space-y-4">
                    <h3 className="font-bold text-slate-800">تسمية المشروع</h3>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            autoFocus
                            value={newProjectName}
                            onChange={e => setNewProjectName(e.target.value)}
                            placeholder="اسم المشروع العظيم القادم..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        />
                        <button
                            onClick={handleCreateProject}
                            disabled={!newProjectName.trim()}
                            className="bg-indigo-600 text-white px-6 rounded-2xl font-bold hover:bg-indigo-500 transition-all disabled:opacity-50"
                        >
                            إنشاء
                        </button>
                    </div>
                    <button
                        onClick={() => setShowAddProject(false)}
                        className="text-sm font-bold text-slate-400 hover:text-slate-600 px-2"
                    >
                        إلغاء
                    </button>
                </div>
            )}

            {activeProjects.length === 0 && !showAddProject && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <LayoutGrid size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-600 mb-2">لا توجد مشاريع نشطة</h3>
                    <p className="text-slate-400">ابدأ بمهام واضحة ومركزة لتحقيق أهدافك.</p>
                </div>
            )}

            {/* Global Time Chart */}
            {activeProjects.length > 0 && (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 mb-1">التركيز على جميع المشاريع</h3>
                            <p className="text-sm font-bold text-slate-400">تتبع إنتاجيتك واستثمار وقتك إجمالاً</p>
                        </div>
                        <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto overflow-x-auto">
                            {[
                                { id: '7days', label: 'آخر 7 أيام' },
                                { id: 'thisMonth', label: 'هذا الشهر' },
                                { id: 'lastMonth', label: 'الشهر الماضي' },
                                { id: 'all', label: 'كل الوقت' }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setChartFilter(filter.id as any)}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${chartFilter === filter.id
                                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        {hasGlobalData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={globalChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis
                                        dataKey="displayDate"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                                        dy={10}
                                        minTickGap={20}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                                        tickFormatter={(val) => `${val}د`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                const totalMins = payload.reduce((acc, curr) => acc + (curr.value as number), 0);
                                                const formatTime = (mins: number) => {
                                                    const h = Math.floor(mins / 60);
                                                    const m = mins % 60;
                                                    if (h > 0 && m > 0) return `${h}س ${m}د`;
                                                    if (h > 0) return `${h} ساعة`;
                                                    return `${m} دقيقة`;
                                                };
                                                return (
                                                    <div className="bg-slate-800 text-white p-3 rounded-2xl shadow-xl border border-slate-700 min-w-[150px]">
                                                        <div className="text-slate-400 text-xs font-bold mb-2 pb-2 border-b border-slate-700/50 flex justify-between items-center">
                                                            <span>{label}</span>
                                                            <span className="text-white bg-indigo-500/20 px-2 py-0.5 rounded text-[10px]">{formatTime(totalMins)} الإجمالي</span>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            {payload.map((entry: any, index: number) => {
                                                                const project = activeProjects.find(p => p.id === entry.dataKey);
                                                                if (!project) return null;
                                                                return (
                                                                    <div key={index} className="flex justify-between items-center text-xs font-bold gap-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                                                                            <span className="truncate max-w-[100px]">{project.name}</span>
                                                                        </div>
                                                                        <span>{formatTime(entry.value as number)}</span>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    {activeProjects.map(project => (
                                        <Bar
                                            key={project.id}
                                            dataKey={project.id}
                                            stackId="a"
                                            fill={projectColorMap.get(project.id)}
                                            maxBarSize={40}
                                            radius={0}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                                <Clock size={32} className="mb-3 text-slate-300" />
                                <p className="font-bold">لم تقم بتسجيل أي وقت في هذه الفترة</p>
                                <p className="text-sm text-slate-400 mt-1">اختر فترة زمنية أخرى أو ابدأ بالتركيز اليوم!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeProjects.map(project => {
                    const topTask = project.tasks.find(t => t.isTopTask && !t.completed) || project.tasks.find(t => !t.completed);
                    const daysSinceActivity = differenceInDays(new Date(), parseISO(project.lastActivity));
                    const nonRecurringTasks = project.tasks.filter(t => !t.recurrence || t.recurrence === 'none');
                    const completedCount = nonRecurringTasks.filter(t => t.completed).length;
                    const computedProgress = nonRecurringTasks.length > 0 ? Math.round((completedCount / nonRecurringTasks.length) * 100) : 0;

                    return (
                        <div
                            key={project.id}
                            onClick={() => router.push(`/projects/${project.id}`)}
                            className="group cursor-pointer bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 relative overflow-hidden flex flex-col h-full"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -z-10 rounded-full group-hover:bg-indigo-500/10 transition-all" />

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest mb-3">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        نشط
                                    </span>
                                    <h2 className="text-2xl font-black text-slate-800">{project.name}</h2>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                    <ChevronLeft size={24} />
                                </div>
                            </div>

                            <div className="space-y-4 flex-1">
                                <div>
                                    <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
                                        <span>التقدم</span>
                                        <span className="text-indigo-600">{computedProgress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                                            style={{ width: `${computedProgress}%` }}
                                        />
                                    </div>
                                </div>

                                {topTask && (
                                    <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 flex gap-3 items-start">
                                        <Target size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">المهمة الأهم حالياً</p>
                                            <p className="text-sm font-bold text-slate-700 leading-snug">{topTask.title}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between text-xs font-medium text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <Clock size={14} />
                                    {daysSinceActivity === 0 ? 'نشط اليوم' : `آخر نشاط منذ ${daysSinceActivity} أيام`}
                                </span>
                                <div className="flex items-center gap-3">
                                    {(project.totalSeconds || 0) > 0 && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">
                                            <Clock size={10} />
                                            {Math.floor((project.totalSeconds || 0) / 3600) > 0 && `${Math.floor((project.totalSeconds || 0) / 3600)}س `}
                                            {Math.floor(((project.totalSeconds || 0) % 3600) / 60)}د
                                        </span>
                                    )}
                                    <span>{project.tasks.filter(t => !t.completed).length} مهام متبقية</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

interface ProjectDetailProps {
    project: Project
    onBack: () => void
    onUpdateProject: (id: string, updates: Partial<Project>) => void
    onDeleteProject: (id: string) => void
    onAddTask: (projectId: string, task: ProjectTask) => void
    onToggleTask: (projectId: string, taskId: string) => void
    onDeleteTask: (projectId: string, taskId: string) => void
    onUpdateTask: (projectId: string, taskId: string, updates: Partial<ProjectTask>) => void
    onReorderTasks: (projectId: string, taskId: string, direction: 'up' | 'down') => void
    onMoveTask: (projectId: string, activeId: string, overId: string) => void
}

interface SortableTaskItemProps {
    task: ProjectTask;
    projectId: string;
    isEditing: boolean;
    editTaskTitle: string;
    setEditTaskTitle: (title: string) => void;
    onSaveTaskEdit: (taskId: string) => void;
    onCancelEdit: () => void;
    onStartEdit: (task: ProjectTask) => void;
    onToggleTask: (projectId: string, taskId: string) => void;
    onDeleteTask: (projectId: string, taskId: string) => void;
    onUpdateTask: (projectId: string, taskId: string, updates: Partial<ProjectTask>) => void;
    onUpdateProject: (projectId: string, updates: any) => void;
}

const SortableTaskItem = (props: SortableTaskItemProps) => {
    const { task, projectId, isEditing, editTaskTitle, setEditTaskTitle, onSaveTaskEdit, onCancelEdit, onStartEdit, onToggleTask, onDeleteTask, onUpdateTask, onUpdateProject } = props;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${isDragging ? 'opacity-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl bg-white scale-[1.02]' : (task.isTopTask ? 'bg-indigo-50/40 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300')}`}
        >

            <div className="flex items-center gap-4 flex-1">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500 rounded transition-colors">
                    <GripVertical size={20} />
                </div>
                <button
                    onClick={() => {
                        onToggleTask(projectId, task.id)
                        onUpdateProject(projectId, { lastActivity: new Date().toISOString() })
                    }}
                    className={`w-6 h-6 rounded-full border-2 transition-colors shrink-0 flex items-center justify-center ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50'}`}
                >
                    {task.completed && <Check size={14} className="text-white" />}
                </button>
                <div className="flex-1">
                    {task.isTopTask && <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block mb-1">المهمة الأهم</span>}
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input
                                autoFocus
                                type="text"
                                value={editTaskTitle}
                                onChange={e => setEditTaskTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && onSaveTaskEdit(task.id)}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 font-bold text-slate-800 focus:outline-none"
                            />
                            <button onClick={() => onSaveTaskEdit(task.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                <Check size={18} />
                            </button>
                            <button onClick={onCancelEdit} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                    ) : (
                        <span className={`font-bold ${task.isTopTask ? 'text-indigo-900' : 'text-slate-700'}`}>{task.title}</span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                    onClick={() => {
                        onUpdateProject(projectId, { lastActivity: new Date().toISOString() })
                        onUpdateTask(projectId, task.id, { isTopTask: !task.isTopTask })
                    }}
                    title={task.isTopTask ? 'إلغاء كمهمة أهم' : 'تعيين كمهمة أهم'}
                    className={`p-2 rounded-xl transition-colors ${task.isTopTask ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:bg-slate-100 hover:text-amber-500'}`}
                >
                    <ArrowUp size={16} />
                </button>
                <button
                    onClick={() => onStartEdit(task)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                >
                    <Edit2 size={16} />
                </button>
                <button
                    onClick={() => onDeleteTask(projectId, task.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

const ProjectDetail: React.FC<ProjectDetailProps> = ({
    project,
    onBack,
    onUpdateProject,
    onDeleteProject,
    onAddTask,
    onToggleTask,
    onDeleteTask,
    onUpdateTask,
    onReorderTasks,
    onMoveTask
}) => {
    const sortedTasks = [...project.tasks].sort((a, b) => a.position - b.position)
    const pendingTasks = sortedTasks.filter(t => !t.completed && (!t.recurrence || t.recurrence === 'none'))
    const completedTasks = sortedTasks.filter(t => t.completed && (!t.recurrence || t.recurrence === 'none'))
    const dailyTasks = sortedTasks.filter(t => t.recurrence === 'daily')
    const monthlyTasks = sortedTasks.filter(t => t.recurrence === 'monthly')

    const [chartFilter, setChartFilter] = useState<'7days' | 'lastMonth' | 'thisMonth' | 'all'>('7days')

    // Prepare chart data based on filter
    const chartData = useMemo(() => {
        const today = new Date();
        let datesToInclude: string[] = []

        if (chartFilter === '7days') {
            datesToInclude = Array.from({ length: 7 }, (_, i) => format(subDays(today, 6 - i), 'yyyy-MM-dd'))
        } else if (chartFilter === 'lastMonth') {
            const lastDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
            const daysInPrevMonth = lastDayOfPrevMonth.getDate()
            datesToInclude = Array.from({ length: daysInPrevMonth }, (_, i) => {
                return format(new Date(today.getFullYear(), today.getMonth() - 1, daysInPrevMonth - i), 'yyyy-MM-dd')
            })
        } else if (chartFilter === 'thisMonth') {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
            const daysSoFar = differenceInDays(today, startOfMonth) + 1
            datesToInclude = Array.from({ length: daysSoFar }, (_, i) => format(subDays(today, daysSoFar - 1 - i), 'yyyy-MM-dd'))
        } else if (chartFilter === 'all') {
            let maxDays = 7
            project.timeSessions?.forEach(s => {
                const dAgo = differenceInDays(today, parseISO(s.date))
                if (dAgo > maxDays) maxDays = dAgo
            })
            if (maxDays > 365) maxDays = 365
            datesToInclude = Array.from({ length: maxDays }, (_, i) => format(subDays(today, maxDays - 1 - i), 'yyyy-MM-dd'))
        }

        const sessionsMap = new Map((project.timeSessions || []).map(s => [s.date, s.seconds]));

        return datesToInclude.map(dateStr => {
            const seconds = sessionsMap.get(dateStr) || 0;
            return {
                date: dateStr,
                displayDate: format(parseISO(dateStr), chartFilter === 'all' || chartFilter === 'lastMonth' ? 'dd MMM' : 'EEEE', { locale: ar }),
                minutes: Math.ceil(seconds / 60)
            };
        });
    }, [project.timeSessions, chartFilter]);

    const hasChartData = chartData.some(d => d.minutes > 0);

    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [newTaskRecurrence, setNewTaskRecurrence] = useState<'none' | 'daily' | 'monthly'>('none')
    const [editGoal, setEditGoal] = useState(false)
    const [goalInput, setGoalInput] = useState(project.targetGoal || '')
    const [editStage, setEditStage] = useState(false)
    const [stageInput, setStageInput] = useState(project.currentStage || '')
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [completedPage, setCompletedPage] = useState(0)
    const COMPLETED_PER_PAGE = 5

    // Editing task state
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
    const [editTaskTitle, setEditTaskTitle] = useState('')

    // Project-level timer
    const [showTimerModal, setShowTimerModal] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            onMoveTask(project.id, active.id as string, over.id as string);
            onUpdateProject(project.id, { lastActivity: new Date().toISOString() })
        }
    };

    const handleSaveGoal = () => {
        onUpdateProject(project.id, { targetGoal: goalInput, lastActivity: new Date().toISOString() })
        setEditGoal(false)
    }

    const handleSaveStage = () => {
        onUpdateProject(project.id, { currentStage: stageInput, lastActivity: new Date().toISOString() })
        setEditStage(false)
    }

    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;
        onAddTask(project.id, {
            id: Date.now().toString(),
            projectId: project.id,
            title: newTaskTitle,
            completed: false,
            isTopTask: false,
            position: project.tasks.length,
            recurrence: newTaskRecurrence,
            lastCompletedDate: undefined
        })
        setNewTaskTitle('')
        setNewTaskRecurrence('none')
        onUpdateProject(project.id, { lastActivity: new Date().toISOString() })
    }

    const handleSaveTaskEdit = (taskId: string) => {
        if (!editTaskTitle.trim()) return;
        onUpdateTask(project.id, taskId, { title: editTaskTitle })
        setEditingTaskId(null)
        onUpdateProject(project.id, { lastActivity: new Date().toISOString() })
    }

    const handleConfirmDelete = () => {
        onDeleteProject(project.id);
        onBack();
        setShowDeleteModal(false);
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-24 animate-in slide-in-from-left-8 duration-300">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold transition-colors"
            >
                <ChevronRight size={18} />
                عودة للمشاريع
            </button>

            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">{project.name}</h1>
                    <div className="flex items-center gap-4 text-sm font-bold text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            مشروع نشط
                        </span>
                        <span>•</span>
                        <span>{(pendingTasks.length + completedTasks.length) > 0 ? Math.round((completedTasks.length / (pendingTasks.length + completedTasks.length)) * 100) : 0}% مكتمل</span>
                        {(project.totalSeconds || 0) > 0 && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-indigo-500">
                                    <Clock size={14} />
                                    {Math.floor((project.totalSeconds || 0) / 3600) > 0 && `${Math.floor((project.totalSeconds || 0) / 3600)}س `}
                                    {Math.floor(((project.totalSeconds || 0) % 3600) / 60)}د
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowTimerModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                    >
                        <Clock size={18} />
                        مؤقت بومودورو
                    </button>
                    <button onClick={() => setShowDeleteModal(true)} className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors">
                        <Trash2 size={20} />
                    </button>
                </div>
            </header>

            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 self-center">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 mx-auto">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 text-center mb-2">حذف المشروع؟</h3>
                        <p className="text-slate-500 text-center font-medium leading-relaxed mb-8">
                            هل أنت متأكد من حذف <span className="font-bold text-slate-800">"{project.name}"</span>؟ سيتم حذف جميع المهام والبيانات المرتبطة به ولا يمكن التراجع عن هذا الإجراء.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleConfirmDelete}
                                className="flex-1 bg-red-500 text-white font-bold py-4 rounded-2xl hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/20"
                            >
                                نعم، احذف المشروع
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pomodoro Timer Modal */}
            {showTimerModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-sm">
                        <button
                            title="إغلاق المؤقت"
                            onClick={() => setShowTimerModal(false)}
                            className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
                        >
                            <X size={28} />
                        </button>
                        <PomodoroTimer
                            pomodorosCompleted={project.pomodoroCount || 0}
                            autoStart={true}
                            taskTitle={project.name}
                            onTick={(seconds) => {
                                // Add cumulative seconds
                                const newTotal = (project.totalSeconds || 0) + seconds;

                                // Update today's session
                                const todayStr = format(new Date(), 'yyyy-MM-dd');
                                const currentSessions = project.timeSessions ? [...project.timeSessions] : [];
                                const todaySessionIndex = currentSessions.findIndex(s => s.date === todayStr);

                                if (todaySessionIndex >= 0) {
                                    currentSessions[todaySessionIndex].seconds += seconds;
                                } else {
                                    currentSessions.push({ date: todayStr, seconds });
                                }

                                onUpdateProject(project.id, {
                                    totalSeconds: newTotal,
                                    timeSessions: currentSessions
                                });
                            }}
                            onSessionComplete={() => {
                                onUpdateProject(project.id, {
                                    pomodoroCount: (project.pomodoroCount || 0) + 1,
                                    lastActivity: new Date().toISOString()
                                });
                            }}
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-3xl text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl -z-10 rounded-full" />
                    <Target size={24} className="text-indigo-300 mb-4" />
                    <h3 className="text-[11px] font-bold text-indigo-200 uppercase tracking-widest mb-2">الهدف النهائي</h3>
                    {editGoal ? (
                        <div className="space-y-3">
                            <textarea
                                value={goalInput}
                                onChange={e => setGoalInput(e.target.value)}
                                placeholder="مثال: إطلاق النسخة التجريبية..."
                                className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 ring-white/30 text-lg font-bold resize-none h-24"
                            />
                            <div className="flex gap-2">
                                <button onClick={handleSaveGoal} className="bg-white text-indigo-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors">حفظ</button>
                                <button onClick={() => setEditGoal(false)} className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/20 transition-colors">إلغاء</button>
                            </div>
                        </div>
                    ) : (
                        <div className="cursor-pointer" onClick={() => {
                            setGoalInput(project.targetGoal || '')
                            setEditGoal(true)
                        }}>
                            {project.targetGoal ? (
                                <p className="text-xl font-bold leading-snug">{project.targetGoal}</p>
                            ) : (
                                <p className="text-indigo-300/60 font-medium">لم يتم تحديد الهدف النهائي. انقر للتحديد.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden border-b-4 border-b-amber-400">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 blur-2xl -z-10 rounded-full" />
                    <Layers size={24} className="text-amber-500 mb-4" />
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">المرحلة الحالية</h3>
                    {editStage ? (
                        <div className="space-y-3">
                            <input
                                value={stageInput}
                                onChange={e => setStageInput(e.target.value)}
                                placeholder="مثال: بناء الواجهة..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 ring-amber-400/30 text-lg font-bold"
                            />
                            <div className="flex gap-2">
                                <button onClick={handleSaveStage} className="bg-amber-400 text-amber-950 px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-500 transition-colors">حفظ</button>
                                <button onClick={() => setEditStage(false)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors">إلغاء</button>
                            </div>
                        </div>
                    ) : (
                        <div className="cursor-pointer" onClick={() => {
                            setStageInput(project.currentStage || '')
                            setEditStage(true)
                        }}>
                            {project.currentStage ? (
                                <p className="text-xl font-bold text-slate-800 leading-snug">{project.currentStage}</p>
                            ) : (
                                <p className="text-slate-400 font-medium">ما هي المرحلة الحالية؟ انقر للتعيين.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Time Tracking Chart Section */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 mb-1">الوقت المنفق</h3>
                        <p className="text-sm font-bold text-slate-400">تتبع تركيزك على المشروع</p>
                    </div>
                    <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto overflow-x-auto">
                        {[
                            { id: '7days', label: 'آخر 7 أيام' },
                            { id: 'thisMonth', label: 'هذا الشهر' },
                            { id: 'lastMonth', label: 'الشهر الماضي' },
                            { id: 'all', label: 'كل الوقت' }
                        ].map(filter => (
                            <button
                                key={filter.id}
                                onClick={() => setChartFilter(filter.id as any)}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${chartFilter === filter.id
                                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-64 w-full">
                    {hasChartData ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <XAxis
                                    dataKey="displayDate"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                    tickFormatter={(val) => `${val}د`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const mins = payload[0].value as number;
                                            const formatTime = () => {
                                                const h = Math.floor(mins / 60);
                                                const m = mins % 60;
                                                if (h > 0) return `${h}س ${m}د`;
                                                return `${m} دقيقة`;
                                            };
                                            return (
                                                <div className="bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl border border-slate-700">
                                                    {formatTime()}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="minutes" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.minutes > 0 ? '#6366f1' : '#e2e8f0'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                            <Clock size={32} className="mb-2 text-slate-300" />
                            <p className="font-bold">لم تقم بتسجيل أي وقت مؤخراً</p>
                            <p className="text-sm text-slate-400 mt-1">شغل مؤقت بومودورو للبدء!</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 mb-1">المهام القادمة</h3>
                        <p className="text-sm font-bold text-slate-400">ما هي الخطوات التالية لتحقيق هدفك؟</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={pendingTasks.map(t => t.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {pendingTasks.map((task) => (
                                <SortableTaskItem
                                    key={task.id}
                                    task={task}
                                    projectId={project.id}
                                    isEditing={editingTaskId === task.id}
                                    editTaskTitle={editTaskTitle}
                                    setEditTaskTitle={setEditTaskTitle}
                                    onSaveTaskEdit={handleSaveTaskEdit}
                                    onCancelEdit={() => setEditingTaskId(null)}
                                    onStartEdit={(t) => {
                                        setEditingTaskId(t.id)
                                        setEditTaskTitle(t.title)
                                    }}
                                    onToggleTask={onToggleTask}
                                    onDeleteTask={onDeleteTask}
                                    onUpdateTask={onUpdateTask}
                                    onUpdateProject={onUpdateProject}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>

                    <div className="flex flex-col gap-2 p-2 mt-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                                placeholder="ما هي المهمة التالية..."
                                className="flex-1 bg-transparent px-4 py-3 font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none transition-all"
                            />
                            <button
                                onClick={handleAddTask}
                                disabled={!newTaskTitle.trim()}
                                className="bg-slate-900 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition-colors shrink-0"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 px-4 pb-3">
                            <button
                                onClick={() => setNewTaskRecurrence('none')}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${newTaskRecurrence === 'none' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-200'}`}
                            >
                                مرة واحدة
                            </button>
                            <button
                                onClick={() => setNewTaskRecurrence('daily')}
                                className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${newTaskRecurrence === 'daily' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-200'}`}
                            >
                                <Repeat size={12} />
                                يومياً
                            </button>
                            <button
                                onClick={() => setNewTaskRecurrence('monthly')}
                                className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${newTaskRecurrence === 'monthly' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-200'}`}
                            >
                                <Repeat size={12} />
                                شهرياً
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recurring Tasks sections */}
                {(dailyTasks.length > 0 || monthlyTasks.length > 0) && (
                    <div className="mt-8 pt-8 border-t border-slate-100 space-y-8">
                        {dailyTasks.length > 0 && (
                            <div>
                                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
                                    <Repeat size={16} className="text-indigo-500" />
                                    عادات ومهام يومية
                                </h4>
                                <div className="space-y-2">
                                    {dailyTasks.map((task) => (
                                        <SortableTaskItem
                                            key={task.id}
                                            task={task}
                                            projectId={project.id}
                                            isEditing={editingTaskId === task.id}
                                            editTaskTitle={editTaskTitle}
                                            setEditTaskTitle={setEditTaskTitle}
                                            onSaveTaskEdit={handleSaveTaskEdit}
                                            onCancelEdit={() => setEditingTaskId(null)}
                                            onStartEdit={(t) => {
                                                setEditingTaskId(t.id)
                                                setEditTaskTitle(t.title)
                                            }}
                                            onToggleTask={onToggleTask}
                                            onDeleteTask={onDeleteTask}
                                            onUpdateTask={onUpdateTask}
                                            onUpdateProject={onUpdateProject}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {monthlyTasks.length > 0 && (
                            <div>
                                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
                                    <Repeat size={16} className="text-indigo-500" />
                                    أهداف ومهام شهرية
                                </h4>
                                <div className="space-y-2">
                                    {monthlyTasks.map((task) => (
                                        <SortableTaskItem
                                            key={task.id}
                                            task={task}
                                            projectId={project.id}
                                            isEditing={editingTaskId === task.id}
                                            editTaskTitle={editTaskTitle}
                                            setEditTaskTitle={setEditTaskTitle}
                                            onSaveTaskEdit={handleSaveTaskEdit}
                                            onCancelEdit={() => setEditingTaskId(null)}
                                            onStartEdit={(t) => {
                                                setEditingTaskId(t.id)
                                                setEditTaskTitle(t.title)
                                            }}
                                            onToggleTask={onToggleTask}
                                            onDeleteTask={onDeleteTask}
                                            onUpdateTask={onUpdateTask}
                                            onUpdateProject={onUpdateProject}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {completedTasks.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">مهام منجزة ({completedTasks.length})</h4>
                        </div>
                        <div className="space-y-2">
                            {completedTasks.slice(completedPage * COMPLETED_PER_PAGE, (completedPage + 1) * COMPLETED_PER_PAGE).map(task => {
                                let daysPassed = 0;
                                if (task.lastCompletedDate && task.createdAt) {
                                    daysPassed = differenceInDays(new Date(task.lastCompletedDate), new Date(task.createdAt));
                                }
                                return (
                                    <div key={task.id} className="flex flex-col gap-1 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                            <span className="font-medium line-through flex-1">{task.title}</span>
                                        </div>
                                        {task.createdAt && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mr-7">
                                                <Target size={10} className="text-indigo-400" />
                                                <span>مدة الإنجاز: {daysPassed} {daysPassed === 1 ? 'يوم' : daysPassed === 2 ? 'يومان' : daysPassed >= 3 && daysPassed <= 10 ? 'أيام' : 'يوماً'}</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                        {completedTasks.length > COMPLETED_PER_PAGE && (
                            <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-slate-100">
                                <button
                                    onClick={() => setCompletedPage(p => Math.max(0, p - 1))}
                                    disabled={completedPage === 0}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                                >
                                    <ChevronRight size={14} />
                                    السابق
                                </button>
                                <span className="text-xs font-bold text-slate-400">
                                    {completedPage + 1} / {Math.ceil(completedTasks.length / COMPLETED_PER_PAGE)}
                                </span>
                                <button
                                    onClick={() => setCompletedPage(p => Math.min(Math.ceil(completedTasks.length / COMPLETED_PER_PAGE) - 1, p + 1))}
                                    disabled={completedPage >= Math.ceil(completedTasks.length / COMPLETED_PER_PAGE) - 1}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                                >
                                    التالي
                                    <ChevronLeft size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
