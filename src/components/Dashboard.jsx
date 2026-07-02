import React from 'react';
import { Play, Square } from 'lucide-react';

export default function Dashboard({ activeShift, startShift, stopShift, elapsed, hourlyRate, currency }) {
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentRate = parseFloat(hourlyRate) || 0;
  const currentEarned = ((elapsed / 3600000) * currentRate).toFixed(2);

  return (
    // Добавлен pb-28 для сдвига контента вверх и уменьшены отступы space-y-8
    <div className="flex flex-col items-center justify-center h-full pb-28 space-y-8 p-6 animate-fade-in relative">
      {activeShift && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      )}

      <div className="w-full flex flex-col items-center gap-6">
        <div className="flex flex-col items-center">
          <span className="text-gray-400/80 text-xs font-bold uppercase tracking-[0.2em] mb-3">Заработано сейчас</span>
          <div className="flex items-start justify-center gap-1">
            <span className="mt-2 text-2xl text-emerald-500/60 font-bold flex items-center">{currency}</span>
            <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-300 to-emerald-600 tracking-tighter drop-shadow-[0_0_25px_rgba(52,211,153,0.2)]">
              {activeShift ? currentEarned : "0.00"}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-gray-400/80 text-xs font-bold uppercase tracking-[0.2em] mb-2">Время смены</span>
          <div className="text-5xl font-mono tabular-nums font-light text-white/90 tracking-tight">
            {formatTime(elapsed)}
          </div>
        </div>
      </div>

      {/* Кнопка уменьшена до w-48 h-48 */}
      <button
        onClick={activeShift ? stopShift : startShift}
        className={`relative group mt-4 w-48 h-48 rounded-full flex flex-col items-center justify-center text-white font-black text-xl tracking-widest transition-all duration-500 active:scale-[0.92]
          ${activeShift 
            ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-[0_0_40px_rgba(225,29,72,0.4)]' 
            : 'bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.6)]'}`}
      >
        {activeShift && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
            <div className="absolute inset-[-10px] rounded-full border border-rose-500/30 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]"></div>
          </>
        )}
        
        <div className="relative z-10 flex flex-col items-center drop-shadow-md">
          {activeShift 
            ? <Square size={40} className="mb-3 text-white" fill="currentColor" strokeWidth={0} /> 
            : <Play size={44} className="mb-2 ml-2 text-white" fill="currentColor" strokeWidth={0} />}
          {activeShift ? 'СТОП' : 'СТАРТ'}
        </div>
      </button>
    </div>
  );
}