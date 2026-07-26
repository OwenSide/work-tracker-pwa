import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useIndexedDB } from './db';
import { getShiftDetails } from './salary'; 
import Dashboard from './components/Dashboard';
import History from './components/History';
import Settings from './components/Settings';
import BottomNav from './components/BottomNav';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Глобальные стейты базы данных
  const [shifts, setShifts, shiftsLoaded] = useIndexedDB('shifts', []);
  const [activeShift, setActiveShift, shiftLoaded] = useIndexedDB('activeShift', null);
  const [elapsed, setElapsed] = useState(0);

  const [contractType, setContractType, contractLoaded] = useIndexedDB('contractType', 'zlecenie'); 
  const [hourlyRate, setHourlyRate, rateLoaded] = useIndexedDB('hourlyRate', '28.10'); 
  const [monthlyRate, setMonthlyRate, monthlyLoaded] = useIndexedDB('monthlyRate', '4300'); 
  const [taxStatus, setTaxStatus, taxLoaded] = useIndexedDB('taxStatus', 'standard'); 

  const isAppReady = rateLoaded && shiftLoaded && shiftsLoaded && contractLoaded && monthlyLoaded && taxLoaded;

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
    setActiveShift({ 
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
      // Заменили на глубокий черный #030303
      <div className="h-[100dvh] w-full bg-[#030303] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    // Заменили фон на #030303 и добавили отступ pt-[max(1.5rem,env(safe-area-inset-top))] для iOS
    <div className="h-[100dvh] w-full bg-[#030303] text-gray-100 flex flex-col font-sans overflow-hidden pt-[max(1.5rem,env(safe-area-inset-top))]">
      
      {/* Сделали градиент от очень легкого белого свечения в центре к глубокому черному #030303 по краям */}
      <main className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.02] via-[#030303] to-[#030303]">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }} className="h-full w-full absolute inset-0">
            {activeTab === 'dashboard' && <Dashboard activeShift={activeShift} startShift={startShift} stopShift={stopShift} togglePause={togglePause} elapsed={elapsed} contractType={contractType} hourlyRate={hourlyRate} monthlyRate={monthlyRate} taxStatus={taxStatus} currency="zł" />}
            {activeTab === 'history' && <History shifts={shifts} setShifts={setShifts} hourlyRate={hourlyRate} currency="zł" contractType={contractType} monthlyRate={monthlyRate} taxStatus={taxStatus} />}
            {activeTab === 'settings' && <Settings contractType={contractType} setContractType={setContractType} hourlyRate={hourlyRate} setHourlyRate={setHourlyRate} monthlyRate={monthlyRate} setMonthlyRate={setMonthlyRate} taxStatus={taxStatus} setTaxStatus={setTaxStatus} shifts={shifts} setShifts={setShifts} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Вынесенный компонент навигации */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
    </div>
  );
}