import React, { useState, useEffect } from 'react';
import { Play, Square, Pause, Coffee, Gift, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils';

export default function Dashboard({ activeShift, startShift, stopShift, togglePause, elapsed, contractType, hourlyRate, monthlyRate, taxStatus, currency }) {
  const [currentNetto, setCurrentNetto] = useState(0);
  const [isHolidaySelection, setIsHolidaySelection] = useState(false);
  const [isOvertime, setIsOvertime] = useState(false);
  const [isDouble, setIsDouble] = useState(false);

  useEffect(() => {
    if (!activeShift) {
      setCurrentNetto(0);
      setIsOvertime(false);
      setIsDouble(false);
      return;
    }

    const hoursElapsed = elapsed / 3600000;
    
    // Считаем Netto час
    let bruttoHour = 0;
    if (contractType === 'oprace') {
      const startD = new Date(activeShift.startTime);
      const daysInMonth = new Date(startD.getFullYear(), startD.getMonth() + 1, 0).getDate();
      let workDays = 0;
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(startD.getFullYear(), startD.getMonth(), i).getDay();
        if (d !== 0 && d !== 6) workDays++;
      }
      bruttoHour = parseFloat(monthlyRate) / (workDays * 8) || 0;
    } else {
      bruttoHour = parseFloat(hourlyRate) || 0;
    }

    let multiplier = 0.73; 
    if (contractType === 'zlecenie') {
      multiplier = 1; // Для Zlecenie берем ставку "как есть", без вычетов
    } else if (contractType === 'oprace') {
      if (taxStatus === 'student' || taxStatus === 'under26') multiplier = 0.78;
      else multiplier = 0.73;
    }

    const nettoHour = bruttoHour * multiplier;

    // Логика умножения
    if (contractType === 'oprace') {
      const isWeekend = new Date(activeShift.startTime).getDay() === 0 || new Date(activeShift.startTime).getDay() === 6;
      if (activeShift.isHoliday || isWeekend) {
        setIsDouble(true);
        setCurrentNetto(hoursElapsed * (nettoHour * 2));
      } else {
        setIsDouble(false);
        if (hoursElapsed > 8) {
          setIsOvertime(true);
          setCurrentNetto((8 * nettoHour) + ((hoursElapsed - 8) * (nettoHour * 1.5)));
        } else {
          setIsOvertime(false);
          setCurrentNetto(hoursElapsed * nettoHour);
        }
      }
    } else {
      setCurrentNetto(hoursElapsed * nettoHour);
    }
  }, [elapsed, activeShift, contractType, hourlyRate, monthlyRate, taxStatus]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return { h, m, s };
  };

  const { h, m, s } = formatTime(elapsed);
  const isRunning = activeShift && !activeShift.isPaused;
  const isPaused = activeShift && activeShift.isPaused;

  // Расчет времени переработки в текущей смене
  let overtimeMs = 0;
  if (contractType === 'oprace' && activeShift) {
    if (isDouble) {
      overtimeMs = elapsed; // В выходной всё время — это переработка
    } else if (isOvertime) {
      overtimeMs = elapsed - (8 * 3600000); // В будни переработка всё, что больше 8 часов
    }
  }
  const ot = formatTime(overtimeMs);

  // Стилизация кольца и свечения
  let ringColor = "border-white/5";
  let glowColor = "bg-transparent";
  
  if (isDouble) {
    ringColor = "border-amber-500/60";
    glowColor = "bg-amber-500/20";
  } else if (isOvertime) {
    ringColor = "border-emerald-500/60";
    glowColor = "bg-emerald-500/20";
  } else if (isRunning) {
    ringColor = "border-indigo-500/60";
    glowColor = "bg-indigo-500/20";
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 pb-24 relative overflow-hidden">
      
      {/* Кнопка "Праздник" (Показывается только если таймер остановлен и выбрана Umowa o Pracę) */}
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
                "group p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 border shadow-lg backdrop-blur-md relative overflow-hidden w-16 h-16", 
                isHolidaySelection 
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]" 
                  : "bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-gray-300"
              )}
            >
              <Gift size={22} className={cn("transition-transform duration-300", isHolidaySelection && "scale-110 animate-pulse")} />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">x2</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Верхние информационные бейджи (Во время работы) */}
      <div className="absolute top-10 w-full flex justify-center z-20 h-10">
        <AnimatePresence mode="wait">
          {isDouble && (
            <motion.div key="double" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="px-5 py-2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Gift size={16}/> Праздничный тариф
            </motion.div>
          )}
          {!isDouble && isOvertime && (
            <motion.div key="overtime" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="px-5 py-2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Flame size={16} className="animate-pulse"/> Overtime x1.5
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ГЛАВНЫЙ КРУГ */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative mb-14 mt-4 flex justify-center items-center"
      >
        {/* Мягкое свечение на фоне (Glow) */}
        <div className={cn("absolute inset-0 rounded-full blur-[60px] transition-all duration-1000", glowColor, isRunning ? "scale-110" : "scale-100 opacity-0")} />
        
        {/* Само кольцо */}
        <div className={cn("relative z-10 w-80 h-80 rounded-full border-[6px] flex flex-col items-center justify-center bg-black/50 backdrop-blur-xl transition-all duration-700 shadow-2xl", ringColor)}>
          {isPaused ? (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-amber-400">
              <Coffee size={48} className="mb-4 opacity-80" />
              <span className="text-2xl font-black tracking-widest uppercase">Пауза</span>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full mt-2">
              
              {/* Заработок */}
              <div className="flex flex-col items-center relative z-20 mb-4">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 opacity-80">Заработано (Netto)</span>
                <div className={cn("text-6xl font-black flex items-center tracking-tighter transition-colors duration-500", isDouble ? "text-amber-400" : isOvertime ? "text-emerald-400" : "text-emerald-400")}>
                  <span className="mr-2 opacity-50 text-3xl font-bold">{currency}</span>
                  {currentNetto.toFixed(2)}
                </div>
              </div>

              {/* Таймер */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 opacity-80">Время смены</span>
                <div className="flex items-baseline space-x-1 tabular-nums tracking-tight opacity-90 mb-1">
                  <span className="text-4xl font-bold text-white">{h}</span>
                  <span className="text-2xl text-gray-500 pb-0.5 opacity-50">:</span>
                  <span className="text-4xl font-bold text-white">{m}</span>
                  <span className="text-2xl text-gray-500 pb-0.5 opacity-50">:</span>
                  <span className={cn("text-4xl font-bold transition-colors duration-500", isDouble ? "text-amber-400" : isOvertime ? "text-emerald-400" : "text-indigo-400")}>{s}</span>
                </div>
              </div>
              
              {/* Мини-счетчик переработки (Появляется плавно под таймером) */}
              <AnimatePresence>
                {overtimeMs > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="flex flex-col items-center overflow-hidden"
                  >
                    <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest backdrop-blur-md", isDouble ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400")}>
                      {isDouble ? <Gift size={12} /> : <Flame size={12} />}
                      <span className="tabular-nums">{ot.h}:{ot.m}:{ot.s}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          )}
        </div>
      </motion.div>

      {/* КНОПКИ УПРАВЛЕНИЯ */}
      <div className="flex gap-4 z-20 w-full max-w-sm px-4">
        {!activeShift ? (
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.95 }}
            onClick={() => startShift(isHolidaySelection)} 
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl py-6 flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-colors group"
          >
            <Play size={24} fill="currentColor" className="mr-3 group-hover:scale-110 transition-transform" /> 
            <span className="font-black text-xl tracking-widest uppercase">Старт</span>
          </motion.button>
        ) : (
          <>
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={togglePause} 
              className={cn("flex-1 rounded-3xl py-6 flex items-center justify-center shadow-lg transition-colors border", isPaused ? "bg-amber-500 text-black border-amber-500 hover:bg-amber-400" : "bg-white/5 text-white border-white/10 hover:bg-white/10")}
            >
              {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.95 }}
              onClick={stopShift} 
              className="flex-[2] bg-rose-600 hover:bg-rose-500 text-white rounded-3xl py-6 flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.3)] transition-colors group"
            >
              <Square size={22} fill="currentColor" className="mr-3 group-hover:scale-90 transition-transform" /> 
              <span className="font-black text-xl tracking-widest uppercase">Стоп</span>
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}