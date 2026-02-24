'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const tabs = [
  { id: 'daily', label: 'تسجيل اليوم', icon: '📝', href: '/daily' },
  { id: 'dashboard', label: 'لوحة التحكم', icon: '📊', href: '/dashboard' },
  { id: 'prayers', label: 'الصلوات', icon: '🕌', href: '/prayers' },
  { id: 'sports', label: 'الرياضة', icon: '🏃', href: '/sports' },
  { id: 'habits', label: 'العادات', icon: '🔄', href: '/habits' },
  { id: 'goals', label: 'الأهداف', icon: '🎯', href: '/goals' },
  { id: 'hashish', label: 'الحشيش', icon: '🚫', href: '/hashish' },
  { id: 'recovery', label: 'العادة السرية', icon: '🛡️', href: '/recovery' },
  { id: 'sleep', label: 'النوم', icon: '🌙', href: '/sleep' },
  { id: 'projects', label: 'المشاريع', icon: '🚀', href: '/projects' },
  { id: 'quran', label: 'القرآن', icon: '📖', href: '/quran' },
  { id: 'athkar', label: 'أذكار اليوم', icon: '📿', href: '/athkar' },
  { id: 'expiations', label: 'مكفرات الذنوب', icon: '✨', href: '/expiations' },
  { id: 'coach', label: 'المدرب الذكي', icon: '🤖', href: '/coach' },
]

export function Sidebar() {
  const pathname = usePathname()

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
        <span>تسجيل الخروج</span>
      </button>
    </aside>
  )
}
