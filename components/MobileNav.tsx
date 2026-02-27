'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export function MobileNav() {
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
    <nav className="md:hidden sticky bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around p-2 shadow-lg z-50 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex flex-col items-center gap-1 min-w-[52px] py-1 px-1 ${isActive ? 'text-indigo-600' : 'text-slate-400'
              }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
