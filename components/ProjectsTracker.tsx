'use client'

import React, { useState } from 'react'
import { Project, ProjectTask } from '@/types'
import { Plus, Target, Clock, CheckCircle2, ChevronLeft, ChevronRight, Layers, Trash2, LayoutGrid, AlertTriangle } from 'lucide-react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { ar } from 'date-fns/locale'

interface ProjectsTrackerProps {
    projects: Project[]
    onAddProject: (project: Project) => void
    onUpdateProject: (id: string, updates: Partial<Project>) => void
    onDeleteProject: (id: string) => void
    onAddTask: (projectId: string, task: ProjectTask) => void
    onToggleTask: (projectId: string, taskId: string) => void
    onDeleteTask: (projectId: string, taskId: string) => void
}

export const ProjectsTracker: React.FC<ProjectsTrackerProps> = ({
    projects,
    onAddProject,
    onUpdateProject,
    onDeleteProject,
    onAddTask,
    onToggleTask,
    onDeleteTask
}) => {
    const [activeProject, setActiveProject] = useState<string | null>(null)
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
    }

    if (activeProject) {
        const project = projects.find(p => p.id === activeProject)
        if (project) {
            return (
                <ProjectDetail
                    project={project}
                    onBack={() => setActiveProject(null)}
                    onUpdateProject={onUpdateProject}
                    onDeleteProject={onDeleteProject}
                    onAddTask={onAddTask}
                    onToggleTask={onToggleTask}
                    onDeleteTask={onDeleteTask}
                />
            )
        }
    }

    const activeProjects = projects.filter(p => p.status === 'active')

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeProjects.map(project => {
                    const topTask = project.tasks.find(t => t.isTopTask && !t.completed) || project.tasks.find(t => !t.completed);
                    const daysSinceActivity = differenceInDays(new Date(), parseISO(project.lastActivity));

                    return (
                        <div
                            key={project.id}
                            onClick={() => setActiveProject(project.id)}
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
                                        <span className="text-indigo-600">{project.progress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                                            style={{ width: `${project.progress}%` }}
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
                                <span>{project.tasks.filter(t => !t.completed).length} مهام متبقية</span>
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
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({
    project,
    onBack,
    onUpdateProject,
    onDeleteProject,
    onAddTask,
    onToggleTask,
    onDeleteTask
}) => {
    const pendingTasks = project.tasks.filter(t => !t.completed)
    const completedTasks = project.tasks.filter(t => t.completed)

    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [editGoal, setEditGoal] = useState(false)
    const [goalInput, setGoalInput] = useState(project.targetGoal || '')
    const [editStage, setEditStage] = useState(false)
    const [stageInput, setStageInput] = useState(project.currentStage || '')
    const [showDeleteModal, setShowDeleteModal] = useState(false)

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
            isTopTask: false
        })
        setNewTaskTitle('')
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
                        <span>{project.progress}% مكتمل</span>
                    </div>
                </div>
                <button onClick={() => setShowDeleteModal(true)} className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors">
                    <Trash2 size={20} />
                </button>
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

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 mb-1">المهام القادمة</h3>
                        <p className="text-sm font-bold text-slate-400">ما هي الخطوات التالية لتحقيق هدفك؟</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {pendingTasks.map((task) => (
                        <div
                            key={task.id}
                            className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${task.isTopTask ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        onToggleTask(project.id, task.id)
                                        onUpdateProject(project.id, { lastActivity: new Date().toISOString() })
                                    }}
                                    className="w-6 h-6 rounded-full border-2 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 transition-colors shrink-0"
                                />
                                <div>
                                    {task.isTopTask && <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block mb-1">المهمة الأهم</span>}
                                    <span className={`font-bold ${task.isTopTask ? 'text-indigo-900' : 'text-slate-700'}`}>{task.title}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => onDeleteTask(project.id, task.id)}
                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all px-2"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}

                    <div className="flex items-center gap-3 p-2 mt-4">
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                            placeholder="ما هي المهمة التالية..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                        />
                        <button
                            onClick={handleAddTask}
                            disabled={!newTaskTitle.trim()}
                            className="bg-slate-900 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                {completedTasks.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">مهام منجزة مؤخراً</h4>
                        <div className="space-y-2">
                            {completedTasks.slice(-3).map(task => (
                                <div key={task.id} className="flex items-center gap-3 text-slate-400">
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                    <span className="font-medium line-through">{task.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
