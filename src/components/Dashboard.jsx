import React, { useState, useEffect } from 'react';
import { Play, Square, Pause, Coffee, Gift, Flame } from 'lucide-react';
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

    // ИСПРАВЛЕННАЯ ЛОГИКА НАЛОГОВ
    let multiplier = 0.73; 
    if (contractType === 'zlecenie') {
      if (taxStatus === 'student') multiplier = 1;
      else if (taxStatus === 'under26') multiplier = 0.78;
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

  // Цвет кольца
  let ringColor = "border-indigo-500/30";
  if (isDouble) ringColor = "border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.2)]";
  else if (isOvertime) ringColor = "border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.2)]";
  else if (isRunning) ringColor = "border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.2)]";

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 pb-24 relative">
      
      {/* Бейджи статуса */}
      <div className="absolute top-8 w-full flex justify-center gap-2">
        {contractType === 'oprace' && !activeShift && (
          <button onClick={() => setIsHolidaySelection(!isHolidaySelection)} className={cn("px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all border", isHolidaySelection ? "bg-amber-500/20 text-amber-400 border-amber-500/50" : "bg-black/40 text-gray-500 border-white/5 hover:bg-white/5")}>
            <Gift size={14} /> Праздник (x2)
          </button>
        )}
        
        {isDouble && <div className="px-4 py-2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase flex items-center gap-2 animate-pulse"><Gift size={14}/> Праздничный тариф x2</div>}
        {isOvertime && <div className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase flex items-center gap-2 animate-pulse"><Flame size={14}/> Overtime x1.5</div>}
      </div>

      <div className="relative mb-12">
        <div className={cn("w-72 h-72 rounded-full border-[10px] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-700", ringColor)}>
          {isPaused ? (
            <div className="flex flex-col items-center text-amber-400 animate-pulse">
              <Coffee size={40} className="mb-4" />
              <span className="text-xl font-bold tracking-widest uppercase">Пауза</span>
            </div>
          ) : (
            <>
              <div className="flex items-baseline space-x-1 tabular-nums tracking-tight">
                <span className="text-6xl font-black text-white">{h}</span><span className="text-4xl text-gray-500 pb-1">:</span>
                <span className="text-6xl font-black text-white">{m}</span><span className="text-4xl text-gray-500 pb-1">:</span>
                <span className="text-6xl font-black text-indigo-400">{s}</span>
              </div>
              <div className="mt-6 flex flex-col items-center">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Заработано (Netto)</span>
                <div className={cn("text-3xl font-bold flex items-center", isDouble ? "text-amber-400" : isOvertime ? "text-emerald-400" : "text-emerald-400")}>
                  <span className="mr-1">{currency}</span>{currentNetto.toFixed(2)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-4 z-10 w-full max-w-xs">
        {!activeShift ? (
          <button onClick={() => startShift(isHolidaySelection)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl py-5 flex items-center justify-center shadow-lg transition-all active:scale-95 group">
            <Play size={24} fill="currentColor" className="mr-2 group-hover:scale-110 transition-transform" /> <span className="font-bold text-lg tracking-wide">СТАРТ</span>
          </button>
        ) : (
          <>
            <button onClick={togglePause} className={cn("flex-1 rounded-3xl py-5 flex items-center justify-center shadow-lg transition-all active:scale-95", isPaused ? "bg-amber-500 text-black hover:bg-amber-400" : "bg-white/10 text-white hover:bg-white/20 border border-white/5")}>
              {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
            </button>
            <button onClick={stopShift} className="flex-[2] bg-rose-600 hover:bg-rose-500 text-white rounded-3xl py-5 flex items-center justify-center shadow-lg transition-all active:scale-95">
              <Square size={20} fill="currentColor" className="mr-2" /> <span className="font-bold text-lg tracking-wide">СТОП</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}