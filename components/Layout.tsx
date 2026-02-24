
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: '📊' },
    { id: 'prayers', label: 'الصلوات', icon: '🕌' },
    { id: 'sports', label: 'الرياضة', icon: '🏃' },
    { id: 'habits', label: 'العادات', icon: '🔄' },
    { id: 'goals', label: 'الأهداف', icon: '🎯' },
    { id: 'hashish', label: 'الحشيش', icon: '🚫' },
    { id: 'coach', label: 'المدرب الذكي', icon: '🤖' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-l p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl">
            🌾
          </div>
          <h1 className="text-2xl font-bold text-slate-800">حَصاد</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden sticky bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3 shadow-lg z-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 ${
              activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
