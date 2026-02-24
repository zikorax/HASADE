import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { SessionProvider } from 'next-auth/react'
import { Sidebar } from '@/components/Sidebar'
import { MobileNav } from '@/components/MobileNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
        <MobileNav />
      </div>
    </SessionProvider>
  )
}
