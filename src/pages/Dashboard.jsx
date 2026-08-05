import React, { useState, useMemo, useRef } from 'react';
import { Play, Square, Pause, Coffee, Gift, Flame, Sun, Moon, ChevronsRight } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import ProgressCircle from '../components/ProgressCircle';
import { getShiftDetails } from '../utils/salary';
import { cn } from '../utils/utils';

export default function Dashboard({ activeShift, startShift, stopShift, togglePause, elapsed, contractType, hourlyRate, monthlyRate, taxStatus, currency }) {
  const [isHolidaySelection, setIsHolidaySelection] = useState(false);
  
  // Рефы и контроллеры для Slide-to-Stop
  const trackRef = useRef(null);
  const controls = useAnimation();

  // ОПТИМИЗАЦИЯ: Вычисляем данные на лету с помощью useMemo
  const shiftData = useMemo(() => {
    if (!activeShift) {
      return { earned: 0, isHoliday: false, isWeekend: false, isOvertime: false, overtimeMs: 0, nightMs: 0 };
    }

    return getShiftDetails({
      durationMs: elapsed,
      shiftStart: activeShift.startTime,
      endTime: Date.now(),
      isHoliday: activeShift.isHoliday,
      shiftType: 'standard',
      contractType, hourlyRate, monthlyRate, taxStatus
    });
  }, [elapsed, activeShift, contractType, hourlyRate, monthlyRate, taxStatus]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return { h, m, s };
  };

  const handleDragEnd = async (e, info) => {
    const trackWidth = trackRef.current?.offsetWidth || 250;
    const sliderWidth = 60; 
    const threshold = (trackWidth - sliderWidth) * 0.65; 

    if (info.offset.x >= threshold) {
      await controls.start({ x: trackWidth - sliderWidth - 12, transition: { duration: 0.2 } });
      
      controls.set({ x: 0 });
      
      stopShift();
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
    }
  };

  const { h, m, s } = formatTime(elapsed);
  const ot = formatTime(shiftData.overtimeMs);
  const nt = formatTime(shiftData.nightMs);
  
  const isRunning = activeShift && !activeShift.isPaused;
  const isPaused = activeShift && activeShift.isPaused;
  const isNightTime = shiftData.nightMs > 0;

  let glassBg = "bg-gradient-to-br from-white/5 to-white/[0.01]";
  
  if (shiftData.isHoliday) {
    glassBg = "bg-gradient-to-br from-amber-500/30 to-amber-900/10";
  } else if (shiftData.isWeekend) {
    glassBg = "bg-gradient-to-br from-cyan-500/30 to-cyan-900/10";
  } else if (shiftData.isOvertime) {
    glassBg = "bg-gradient-to-br from-emerald-500/30 to-emerald-900/10";
  } else if (isNightTime && isRunning) {
    glassBg = "bg-gradient-to-br from-blue-500/30 to-blue-900/10";
  } else if (isRunning) {
    glassBg = "bg-gradient-to-br from-indigo-500/30 to-indigo-900/10";
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 pb-24 relative overflow-hidden bg-[#030303]">
      
      {/* Кнопка выбора праздника (x2) */}
      <AnimatePresence>
        {contractType === 'oprace' && !activeShift && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-10 right-8 z-30"
          >
            <button 
              onClick={() => setIsHolidaySelection(!isHolidaySelection)} 
              className={cn(
                "group p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 backdrop-blur-xl relative overflow-hidden w-16 h-16 border shadow-[inset_0_1px_10px_rgba(255,255,255,0.1),0_10px_30px_rgba(0,0,0,0.5)]", 
                isHolidaySelection 
                  ? "bg-gradient-to-br from-amber-500/30 to-amber-700/10 border-amber-400/40 text-amber-300" 
                  : "bg-gradient-to-br from-white/10 to-transparent border-white/10 text-gray-400 hover:text-gray-200"
              )}
            >
              <Gift size={22} className={cn("transition-transform duration-300", isHolidaySelection && "scale-110 animate-pulse")} />
              <span className="text-[10px] font-bold uppercase tracking-widest leading-none">x2</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Бейджики состояний сверху */}
      <div className="absolute top-10 w-full flex justify-center z-20 h-10">
        <AnimatePresence mode="wait">
          {shiftData.isHoliday && (
            <motion.div key="holiday" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="px-5 py-2 rounded-full backdrop-blur-md bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-[inset_0_1px_8px_rgba(245,158,11,0.3),0_10px_20px_rgba(0,0,0,0.5)]">
              <Gift size={16}/> Праздничный тариф (x2)
            </motion.div>
          )}
          {!shiftData.isHoliday && shiftData.isWeekend && (
            <motion.div key="weekend" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="px-5 py-2 rounded-full backdrop-blur-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-[inset_0_1px_8px_rgba(6,182,212,0.3),0_10px_20px_rgba(0,0,0,0.5)]">
              <Sun size={16}/> Выходной (x2)
            </motion.div>
          )}
          {!shiftData.isHoliday && !shiftData.isWeekend && shiftData.isOvertime && (
            <motion.div key="overtime" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="px-5 py-2 rounded-full backdrop-blur-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-[inset_0_1px_8px_rgba(16,185,129,0.3),0_10px_20px_rgba(0,0,0,0.5)]">
              <Flame size={16} className="animate-pulse"/> Overtime x1.5
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ЦЕНТРАЛЬНЫЙ БЛОК ТАЙМЕРА - ОТКЛЮЧИЛИ СТАРТОВУЮ АНИМАЦИЮ */}
      <motion.div 
        initial={false} 
        animate={{ scale: 1, opacity: 1 }} 
        className="relative mb-14 mt-4 flex justify-center items-center w-80 h-80"
      >
        <ProgressCircle 
          elapsed={elapsed} 
          shiftData={shiftData} 
          isRunning={isRunning} 
          isPaused={isPaused} 
        />

        <div className={cn(
          "absolute inset-0 rounded-full border border-white/5 flex flex-col items-center justify-center transition-all duration-700 overflow-hidden",
          "backdrop-blur-2xl shadow-[inset_0_0_50px_rgba(255,255,255,0.03),0_20px_60px_rgba(0,0,0,0.8)]",
          glassBg
        )}>
          <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none opacity-60 rounded-t-full" />
          
          {isPaused ? (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-amber-400/90 relative z-20">
              <Coffee size={48} className="mb-4 opacity-80" />
              <span className="text-2xl font-bold tracking-widest uppercase text-shadow-sm">Пауза</span>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full mt-2 relative z-20">
              <div className="flex flex-col items-center mb-4">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 opacity-80">Заработано (Netto)</span>
                <div className={cn("text-6xl font-black flex items-center tracking-tighter transition-colors duration-500", shiftData.isHoliday ? "text-amber-300" : shiftData.isWeekend ? "text-cyan-300" : "text-emerald-300")}>
                  <span className="mr-2 opacity-60 text-3xl font-bold">{currency}</span>
                  {shiftData.earned.toFixed(2)}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 opacity-80">Время смены</span>
                <div className="flex items-baseline space-x-1 tabular-nums tracking-tight mb-1 text-white/90">
                  <span className="text-4xl font-bold">{h}</span>
                  <span className="text-2xl pb-0.5 opacity-50">:</span>
                  <span className="text-4xl font-bold">{m}</span>
                  <span className="text-2xl pb-0.5 opacity-50">:</span>
                  <span className={cn("text-4xl font-bold transition-colors duration-500", shiftData.isHoliday ? "text-amber-300" : shiftData.isWeekend ? "text-cyan-300" : shiftData.isOvertime ? "text-emerald-300" : "text-indigo-300")}>{s}</span>
                </div>
              </div>
              
              <AnimatePresence>
                {shiftData.overtimeMs > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="flex flex-col items-center overflow-hidden"
                  >
                    <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest bg-black/20 backdrop-blur-md", shiftData.isHoliday ? "border-amber-500/30 text-amber-300" : shiftData.isWeekend ? "border-cyan-500/30 text-cyan-300" : "border-emerald-500/30 text-emerald-300")}>
                      {shiftData.isHoliday ? <Gift size={12} /> : shiftData.isWeekend ? <Sun size={12} /> : <Flame size={12} />}
                      <span className="tabular-nums">{ot.h}:{ot.m}:{ot.s}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isNightTime && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="flex flex-col items-center overflow-hidden"
                  >
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest bg-black/20 backdrop-blur-md border-blue-500/30 text-blue-300">
                      <Moon size={12} />
                      <span className="tabular-nums">Ночные: {nt.h}:{nt.m}:{nt.s}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      {/* КНОПКИ УПРАВЛЕНИЯ */}
      <div className="flex gap-3 z-20 w-full max-w-sm px-4">
        {!activeShift ? (
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.96 }}
            onClick={() => startShift(isHolidaySelection)} 
            className="flex-1 rounded-full py-6 flex items-center justify-center transition-colors duration-500 group bg-gradient-to-b from-indigo-500 to-indigo-700 text-white border border-indigo-400/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.2),0_10px_24px_-4px_rgba(99,102,241,0.6)]"
          >
            <Play size={22} fill="currentColor" className="mr-3 group-hover:scale-110 transition-transform duration-500 drop-shadow-md" /> 
            <span className="font-bold text-lg tracking-widest uppercase drop-shadow-md">Старт</span>
          </motion.button>
        ) : (
          <>
            {/* Кнопка Паузы (Слева) */}
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={togglePause} 
              className={cn(
                "w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all duration-500 border relative overflow-hidden shrink-0", 
                isPaused 
                  ? "bg-gradient-to-b from-amber-400 to-amber-600 text-white border-amber-300/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),0_10px_24px_-4px_rgba(245,158,11,0.6)]" 
                  : "bg-zinc-900/90 text-gray-300 hover:text-white border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_20px_rgba(0,0,0,0.5)]" 
              )}
            >
              <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              {isPaused 
                ? <Play size={24} fill="currentColor" className="drop-shadow-md relative z-10 ml-1" /> 
                : <Pause size={24} fill="currentColor" className="opacity-90 drop-shadow-sm relative z-10" />
              }
            </motion.button>
            
            {/* Слайдер "Сдвинь для Стопа" (Справа) */}
            <div ref={trackRef} className="relative flex-1 h-[72px] bg-[#0a0a0a] rounded-full border border-white/5 flex items-center p-1.5 overflow-hidden shadow-[inset_0_3px_15px_rgba(0,0,0,0.8)]">
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none pl-12 pr-2">
                <span className="text-zinc-600 font-bold text-[11px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] opacity-80">
                  ЗАВЕРШИТЬ
                </span>
              </div>
              
              <motion.div 
                drag="x"
                dragConstraints={{ left: 0, right: trackRef.current ? trackRef.current.offsetWidth - 72 : 250 }}
                dragElastic={0.05}
                onDragEnd={handleDragEnd}
                animate={controls}
                initial={{ x: 0 }} 
                whileTap={{ scale: 0.95 }}
                className="w-[60px] h-[60px] bg-gradient-to-b from-rose-500 to-rose-700 rounded-full flex items-center justify-center z-10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_4px_12px_rgba(225,29,72,0.6)] cursor-grab active:cursor-grabbing border border-rose-400/30"
              >
                <ChevronsRight size={24} className="text-white drop-shadow-md relative z-10" />
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}