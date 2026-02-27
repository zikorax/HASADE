'use client'

import React from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function SettingsPage() {
    const { language, setLanguage, t } = useLanguage()

    return (
        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-slate-800">{t('settings.title')}</h1>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-semibold text-slate-700 mb-4">{t('settings.language')}</h2>

                <div className="flex flex-col sm:flex-row gap-4">
                    <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${language === 'ar' ? 'border-indigo-500 bg-indigo-50 shadow-md ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white'}`}>
                        <input
                            type="radio"
                            name="language"
                            value="ar"
                            checked={language === 'ar'}
                            onChange={() => setLanguage('ar')}
                            className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                        />
                        <span className="font-bold text-slate-700 text-lg">{t('settings.arabic')}</span>
                    </label>

                    <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${language === 'en' ? 'border-indigo-500 bg-indigo-50 shadow-md ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white'}`}>
                        <input
                            type="radio"
                            name="language"
                            value="en"
                            checked={language === 'en'}
                            onChange={() => setLanguage('en')}
                            className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                        />
                        <span className="font-bold text-slate-700 text-lg">{t('settings.english')}</span>
                    </label>
                </div>
            </div>
        </div>
    )
}
