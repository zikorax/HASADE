'use client'

import React from 'react'
import { ProjectsTracker } from '@/components/ProjectsTracker'
import { useUserState } from '@/hooks/useUserState'
import { Moon } from 'lucide-react'

export function ProjectsClient() {
    const {
        userState,
        loading,
        addProject,
        updateProject,
        deleteProject,
        addProjectTask,
        toggleProjectTask,
        deleteProjectTask
    } = useUserState()

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <ProjectsTracker
            projects={userState.projects || []}
            onAddProject={addProject}
            onUpdateProject={updateProject}
            onDeleteProject={deleteProject}
            onAddTask={addProjectTask}
            onToggleTask={toggleProjectTask}
            onDeleteTask={deleteProjectTask}
        />
    )
}
