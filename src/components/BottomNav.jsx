import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/utils';

export default function BottomNav({ activeTab, setActiveTab }) {
  const { t } = useTranslation();

  const tabs = [
    { id: 'dashboard', icon: Clock, label: t('nav.timer') },
    { id: 'history', icon: HistoryIcon, label: t('nav.history') },
    { id: 'settings', icon: SettingsIcon, label: t('nav.settings') }
  ];

  return (
    <div className="fixed bottom-5 left-0 w-full z-50 flex justify-center pointer-events-none">
 
      <nav className="pointer-events-auto bg-[#121214]/85 backdrop-blur-2xl border border-white/10 p-1.5 rounded-full flex items-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={cn(
                "relative flex items-center justify-center rounded-full transition-all duration-300 ease-out", 
                isActive ? "px-5 py-3.5 text-white" : "px-4 py-3.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              )}
            >
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
              
              <div className={cn(
                "relative z-10 overflow-hidden transition-all duration-300 ease-out flex items-center", 
                isActive ? "max-w-[110px] opacity-100 ml-2.5" : "max-w-0 opacity-0 ml-0"
              )}>
                <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
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