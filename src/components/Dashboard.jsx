import React from 'react';
import { Play, Square, Pause, PlayCircle } from 'lucide-react';
import { cn } from '../utils';

export default function Dashboard({ activeShift, startShift, stopShift, togglePause, elapsed, hourlyRate, currency }) {
  const currentEarned = (elapsed / 3600000) * parseFloat(hourlyRate || 0);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isPaused = activeShift?.isPaused;

  return (
    <div className="flex flex-col items-center justify-center h-full pb-20 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 transition-all duration-1000", activeShift ? (isPaused ? "bg-amber-500" : "bg-indigo-500") : "bg-transparent")}></div>
      </div>

      <div className="z-10 flex flex-col items-center w-full px-6">
        <div className="mb-12 flex flex-col items-center">
          <span className="text-sm font-semibold tracking-widest text-gray-400 uppercase mb-3">
            {isPaused ? 'Пауза' : 'Заработано сейчас'}
          </span>
          <div className={cn("text-6xl font-bold flex items-center transition-colors duration-500", activeShift ? (isPaused ? "text-amber-400" : "text-emerald-400") : "text-gray-600")}>
            <span className={cn("mr-2", activeShift ? (isPaused ? "text-amber-500" : "text-emerald-500") : "text-gray-700")}>{currency}</span>
            {currentEarned.toFixed(2)}
          </div>
        </div>

        <div className="mb-16 flex flex-col items-center">
          <span className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase mb-3">Время смены</span>
          <div className={cn("text-5xl font-mono tracking-wider transition-all duration-300", activeShift ? "text-white" : "text-gray-600", isPaused && "opacity-60 animate-pulse text-amber-200")}>
            {formatTime(elapsed)}
          </div>
        </div>

        <div className="flex items-center justify-center h-48 w-full relative">
          {!activeShift ? (
            <button
              onClick={startShift}
              className="group relative flex flex-col items-center justify-center w-40 h-40 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-full shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:shadow-[0_0_60px_rgba(79,70,229,0.5)] transition-all duration-300 active:scale-95"
            >
              <div className="absolute inset-1 rounded-full border border-white/20"></div>
              <Play size={40} className="text-white ml-2 mb-2 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
              <span className="text-white font-bold tracking-widest uppercase text-sm">Старт</span>
            </button>
          ) : (
            <div className="flex gap-6">
              {/* Кнопка СТОП */}
              <button
                onClick={stopShift}
                className="group relative flex flex-col items-center justify-center w-28 h-28 bg-gradient-to-tr from-rose-600 to-rose-400 rounded-full shadow-[0_0_30px_rgba(225,29,72,0.3)] transition-all duration-300 active:scale-95"
              >
                <Square size={24} fill="currentColor" className="text-white mb-1.5 drop-shadow-md group-hover:scale-110 transition-transform" />
                <span className="text-white font-bold tracking-widest uppercase text-xs">Стоп</span>
              </button>
              
              {/* Кнопка ПАУЗА / ПРОДОЛЖИТЬ */}
              <button
                onClick={togglePause}
                className={cn("group relative flex flex-col items-center justify-center w-28 h-28 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-all duration-300 active:scale-95", isPaused ? "bg-gradient-to-tr from-emerald-600 to-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]" : "bg-gradient-to-tr from-amber-500 to-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.3)]")}
              >
                {isPaused ? (
                  <>
                    <Play size={28} className="text-white ml-1 mb-1 drop-shadow-md group-hover:scale-110 transition-transform" />
                    <span className="text-white font-bold tracking-widest uppercase text-[10px]">Дальше</span>
                  </>
                ) : (
                  <>
                    <Pause size={28} fill="currentColor" className="text-white mb-1 drop-shadow-md group-hover:scale-110 transition-transform" />
                    <span className="text-white font-bold tracking-widest uppercase text-[10px]">Пауза</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}