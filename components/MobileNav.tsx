'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { id: 'daily', label: 'سجل', icon: '📝', href: '/daily' },
  { id: 'dashboard', label: 'الرئيسية', icon: '📊', href: '/dashboard' },
  { id: 'prayers', label: 'الصلوات', icon: '🕌', href: '/prayers' },
  { id: 'sports', label: 'الرياضة', icon: '🏃', href: '/sports' },
  { id: 'habits', label: 'العادات', icon: '🔄', href: '/habits' },
  { id: 'goals', label: 'الأهداف', icon: '🎯', href: '/goals' },
  { id: 'hashish', label: 'الحشيش', icon: '🚫', href: '/hashish' },
  { id: 'recovery', label: 'التعافي', icon: '🛡️', href: '/recovery' },
  { id: 'sleep', label: 'النوم', icon: '🌙', href: '/sleep' },
  { id: 'projects', label: 'المشاريع', icon: '🚀', href: '/projects' },
  { id: 'quran', label: 'القرآن', icon: '📖', href: '/quran' },
  { id: 'athkar', label: 'الأذكار', icon: '📿', href: '/athkar' },
  { id: 'expiations', label: 'مكفرات', icon: '✨', href: '/expiations' },
  { id: 'coach', label: 'المدرب', icon: '🤖', href: '/coach' },
]

export function MobileNav() {
  const pathname = usePathname()

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
