import React, { useState, useEffect } from 'react';
import { Clock, History as HistoryIcon, Settings as SettingsIcon, Coins } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useIndexedDB } from './db';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Settings from './components/Settings';
import { cn } from './utils';

export default function App() {
  const currency = <Coins size="1em" strokeWidth={2.5} className="inline-block relative -top-[1px] mr-1" />;
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [hourlyRate, setHourlyRate, rateLoaded] = useIndexedDB('hourlyRate', '15');
  const [activeShift, setActiveShift, shiftLoaded] = useIndexedDB('activeShift', null);
  const [shifts, setShifts, shiftsLoaded] = useIndexedDB('shifts', []);
  const [elapsed, setElapsed] = useState(0);

  const isAppReady = rateLoaded && shiftLoaded && shiftsLoaded;

  useEffect(() => {
    let interval;
    if (activeShift) {
      setElapsed(Date.now() - activeShift.startTime);
      interval = setInterval(() => setElapsed(Date.now() - activeShift.startTime), 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeShift]);

  const startShift = () => setActiveShift({ startTime: Date.now() });

  const stopShift = () => {
    if (!activeShift) return;
    const endTime = Date.now();
    const durationMs = endTime - activeShift.startTime;
    const rate = parseFloat(hourlyRate) || 0;
    const earned = (durationMs / 3600000) * rate;

    const newShift = { id: Date.now(), startTime: activeShift.startTime, endTime, durationMs, earned };
    setShifts([newShift, ...shifts]);
    setActiveShift(null);
  };

  if (!isAppReady) {
    return (
      <div className="h-[100dvh] w-full bg-[#0a0a0c] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Анимации для framer-motion
  const pageVariants = {
    initial: { opacity: 0, y: 15, scale: 0.98 },
    in: { opacity: 1, y: 0, scale: 1 },
    out: { opacity: 0, y: -15, scale: 0.98 }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#0a0a0c] text-gray-100 flex flex-col font-sans overflow-hidden selection:bg-indigo-500/30">
      <header className="bg-white/[0.01] backdrop-blur-xl px-6 py-5 border-b border-white/5 z-20">
        <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-wide text-center">
          Work<span className="text-indigo-400">Tracker</span>
        </h1>
      </header>

      <main className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900/40 via-[#0a0a0c] to-[#0a0a0c]">
        {/* Обертка для переходов */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="h-full w-full absolute inset-0"
          >
            {activeTab === 'dashboard' && <Dashboard activeShift={activeShift} startShift={startShift} stopShift={stopShift} elapsed={elapsed} hourlyRate={hourlyRate} currency={currency} />}
            {activeTab === 'history' && <History shifts={shifts} setShifts={setShifts} hourlyRate={hourlyRate} currency={currency} />}
            {activeTab === 'settings' && <Settings hourlyRate={hourlyRate} setHourlyRate={setHourlyRate} currency={currency} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="absolute bottom-0 w-full p-4 z-20 pointer-events-none">
        <nav className="pointer-events-auto bg-gray-900/80 backdrop-blur-2xl border border-white/10 flex justify-around p-2 rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] max-w-sm mx-auto">
          {[
            { id: 'dashboard', icon: Clock, label: 'Таймер' },
            { id: 'history', icon: HistoryIcon, label: 'История' },
            { id: 'settings', icon: SettingsIcon, label: 'Настройки' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 w-24 relative",
                activeTab === tab.id ? "text-white bg-white/10 scale-100" : "text-gray-500 hover:text-gray-300 scale-95 hover:bg-white/5"
              )}
            >
              <tab.icon size={22} className={cn("mb-1.5 transition-transform duration-300", activeTab === tab.id && "scale-110 text-indigo-400")} />
              <span className="text-[10px] uppercase font-bold tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}