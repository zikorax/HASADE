import type { Metadata } from 'next'
import './globals.css'

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
      <body className="font-tajawal" suppressHydrationWarning>{children}</body>
    </html>
  )
}
