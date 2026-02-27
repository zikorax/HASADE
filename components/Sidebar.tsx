'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const tabs = [
    { id: 'daily', label: t('sidebar.daily'), icon: '📝', href: '/daily' },
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: '📊', href: '/dashboard' },
    { id: 'prayers', label: t('sidebar.prayers'), icon: '🕌', href: '/prayers' },
    { id: 'sports', label: t('sidebar.sports'), icon: '🏃', href: '/sports' },
    { id: 'habits', label: t('sidebar.habits'), icon: '🔄', href: '/habits' },
    { id: 'goals', label: t('sidebar.goals'), icon: '🎯', href: '/goals' },
    { id: 'hashish', label: t('sidebar.hashish'), icon: '🚫', href: '/hashish' },
    { id: 'recovery', label: t('sidebar.masturbation'), icon: '🛡️', href: '/recovery' },
    { id: 'sleep', label: t('sidebar.sleep'), icon: '🌙', href: '/sleep' },
    { id: 'projects', label: t('sidebar.projects'), icon: '🚀', href: '/projects' },
    { id: 'quran', label: t('sidebar.quran'), icon: '📖', href: '/quran' },
    { id: 'athkar', label: t('sidebar.athkar'), icon: '📿', href: '/athkar' },
    { id: 'expiations', label: t('sidebar.expiations'), icon: '✨', href: '/expiations' },
    { id: 'coach', label: t('sidebar.aiCoach'), icon: '🤖', href: '/coach' },
    { id: 'settings', label: t('sidebar.settings'), icon: '⚙️', href: '/settings' },
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-l border-slate-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl">
          🌾
        </div>
        <h1 className="text-2xl font-bold text-slate-800">حَصاد</h1>
      </div>

      <nav className="flex-1 space-y-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </nav>

      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all w-full mt-4"
      >
        <span className="text-xl">🚪</span>
        <span>{t('sidebar.logout')}</span>
      </button>
    </aside>
  )
}

