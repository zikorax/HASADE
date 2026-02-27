import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'

export const metadata: Metadata = {
  title: 'حصاد - نظام التتبع الشامل',
  description: 'نظام شامل لتتبع العادات والأهداف والصلوات والرياضة',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-tajawal" suppressHydrationWarning>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
