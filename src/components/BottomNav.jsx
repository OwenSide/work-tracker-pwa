import React from 'react';
import { Clock, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', icon: Clock, label: 'Таймер' },
    { id: 'history', icon: HistoryIcon, label: 'История' },
    { id: 'settings', icon: SettingsIcon, label: 'Настройки' }
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 w-full z-50 flex justify-center pointer-events-none"
      // Исправляем iOS: берем либо 16px (для обычных экранов), либо зону "полоски" снизу на iPhone
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      {/* Плавающая премиальная капсула */}
      <nav className="pointer-events-auto bg-[#121214]/80 backdrop-blur-2xl border border-white/10 p-1.5 rounded-full flex items-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] mb-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={cn(
                "relative flex items-center justify-center rounded-full transition-all duration-300 ease-out", 
                isActive ? "px-5 py-3.5 text-white" : "px-4 py-3.5 text-gray-500 hover:text-gray-300 hover:bg-white/5"
              )}
            >
              {/* Анимированный ползунок фона (магия Framer Motion) */}
              {isActive && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 bg-white/10 rounded-full border border-white/5"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              
              <tab.icon 
                size={20} 
                className={cn("relative z-10 transition-colors duration-300", isActive && "text-indigo-400")} 
              />
              
              {/* Текст выезжает только у активного таба */}
              <div className={cn(
                "relative z-10 overflow-hidden transition-all duration-300 ease-out flex items-center", 
                isActive ? "max-w-[80px] opacity-100 ml-2.5" : "max-w-0 opacity-0 ml-0"
              )}>
                <span className="text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}