import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { ProjectsClient } from './ProjectsClient'

export default async function ProjectsPage() {
    const session = await auth()
    if (!session?.user) {
        redirect('/api/auth/signin')
    }

    return <ProjectsClient />
}
