import React, { useState, useEffect } from 'react';
import { Clock, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useIndexedDB } from './db';
import { getShiftDetails } from './salary'; // <-- ИМПОРТИРУЕМ НАШУ ЛОГИКУ
import Dashboard from './components/Dashboard';
import History from './components/History';
import Settings from './components/Settings';
import { cn } from './utils';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [currencySymbol, setCurrencySymbol, currencyLoaded] = useIndexedDB('currencySymbol', 'zł');
  const [shifts, setShifts, shiftsLoaded] = useIndexedDB('shifts', []);
  const [activeShift, setActiveShift, shiftLoaded] = useIndexedDB('activeShift', null);
  const [elapsed, setElapsed] = useState(0);

  const [contractType, setContractType, contractLoaded] = useIndexedDB('contractType', 'zlecenie'); 
  const [hourlyRate, setHourlyRate, rateLoaded] = useIndexedDB('hourlyRate', '28.10'); 
  const [monthlyRate, setMonthlyRate, monthlyLoaded] = useIndexedDB('monthlyRate', '4300'); 
  const [taxStatus, setTaxStatus, taxLoaded] = useIndexedDB('taxStatus', 'standard'); 

  const isAppReady = rateLoaded && shiftLoaded && shiftsLoaded && currencyLoaded && contractLoaded && monthlyLoaded && taxLoaded;

  useEffect(() => {
    let interval;
    if (activeShift) {
      const calculateElapsed = () => {
        const now = Date.now();
        let pauseTime = activeShift.totalPauseTime || 0;
        if (activeShift.isPaused) {
          pauseTime += (now - activeShift.pauseStartTime);
        }
        setElapsed(Math.max(0, now - activeShift.startTime - pauseTime));
      };
      
      calculateElapsed();
      interval = setInterval(calculateElapsed, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeShift]);

  const startShift = (isHoliday = false) => {
    // const testTimeOffset = (7 * 3600000) + (59 * 60000) + (50 * 1000);
    setActiveShift({ 
      // startTime: Date.now() - testTimeOffset,
      startTime: Date.now(),
      isPaused: false,
      totalPauseTime: 0,
      pauseStartTime: null,
      isHoliday
    });
  };

  const togglePause = () => {
    if (!activeShift) return;
    const now = Date.now();
    
    if (activeShift.isPaused) {
      const currentPauseDuration = now - activeShift.pauseStartTime;
      setActiveShift({
        ...activeShift,
        isPaused: false,
        totalPauseTime: (activeShift.totalPauseTime || 0) + currentPauseDuration,
        pauseStartTime: null
      });
    } else {
      setActiveShift({
        ...activeShift,
        isPaused: true,
        pauseStartTime: now
      });
    }
  };

  const stopShift = () => {
    if (!activeShift) return;
    const endTime = Date.now();
    
    let finalPauseTime = activeShift.totalPauseTime || 0;
    if (activeShift.isPaused) finalPauseTime += (endTime - activeShift.pauseStartTime);

    const durationMs = Math.max(0, endTime - activeShift.startTime - finalPauseTime);
    
    // ИСПОЛЬЗУЕМ ВЫНЕСЕННУЮ ЛОГИКУ ДЛЯ ПОДСЧЕТА ДЕНЕГ
    const { earned } = getShiftDetails({
      durationMs,
      shiftStart: activeShift.startTime,
      isHoliday: activeShift.isHoliday,
      contractType, hourlyRate, monthlyRate, taxStatus
    });

    const newShift = { 
      id: Date.now(), 
      startTime: activeShift.startTime, 
      endTime, 
      durationMs, 
      earned,
      pauseMs: finalPauseTime,
      note: activeShift.isHoliday ? '🎁 Праздник (x2)' : ''
    };
    
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

  return (
    <div className="h-[100dvh] w-full bg-[#0a0a0c] text-gray-100 flex flex-col font-sans overflow-hidden">
      
      <div style={{ height: 'max(1.5rem, env(safe-area-inset-top))' }} className="w-full shrink-0 z-50 pointer-events-none" />

      <main className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900/40 via-[#0a0a0c] to-[#0a0a0c]">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }} className="h-full w-full absolute inset-0">
            {activeTab === 'dashboard' && <Dashboard activeShift={activeShift} startShift={startShift} stopShift={stopShift} togglePause={togglePause} elapsed={elapsed} contractType={contractType} hourlyRate={hourlyRate} monthlyRate={monthlyRate} taxStatus={taxStatus} currency={currencySymbol} />}
            {activeTab === 'history' && <History shifts={shifts} setShifts={setShifts} hourlyRate={hourlyRate} currency={currencySymbol} contractType={contractType} monthlyRate={monthlyRate} taxStatus={taxStatus} />}
            {activeTab === 'settings' && <Settings contractType={contractType} setContractType={setContractType} hourlyRate={hourlyRate} setHourlyRate={setHourlyRate} monthlyRate={monthlyRate} setMonthlyRate={setMonthlyRate} taxStatus={taxStatus} setTaxStatus={setTaxStatus} currency={currencySymbol} setCurrency={setCurrencySymbol} shifts={shifts} setShifts={setShifts} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <div 
        className="absolute bottom-0 w-full px-4 z-20 pointer-events-none"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <nav className="pointer-events-auto bg-gray-900/80 backdrop-blur-2xl border border-white/10 flex justify-around p-2 rounded-3xl max-w-sm mx-auto shadow-2xl">
          {[
            { id: 'dashboard', icon: Clock, label: 'Таймер' },
            { id: 'history', icon: HistoryIcon, label: 'История' },
            { id: 'settings', icon: SettingsIcon, label: 'Настройки' }
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 w-24 relative", activeTab === tab.id ? "text-white bg-white/10 scale-100" : "text-gray-500 hover:text-gray-300 scale-95")}>
              <tab.icon size={22} className={cn("mb-1.5 transition-transform", activeTab === tab.id && "text-indigo-400")} />
              <span className="text-[10px] uppercase font-bold tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}