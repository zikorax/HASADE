'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from './translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('ar');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('hassad_language') as Language;
        if (saved && (saved === 'ar' || saved === 'en')) {
            setLanguageState(saved);
            document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = saved;
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('hassad_language', lang);
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
    };

    const t = (key: string): string => {
        const keys = key.split('.');
        let current: any = translations[mounted ? language : 'ar'];
        for (const k of keys) {
            if (current[k] === undefined) return key;
            current = current[k];
        }
        return current;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within LanguageProvider');
    return context;
};
