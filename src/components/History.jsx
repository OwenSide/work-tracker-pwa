import React, { useState } from 'react';
import { Clock, History as HistoryIcon, Wallet, ArrowRight, Plus, X } from 'lucide-react';
import CountUp from 'react-countup';
import { cn } from '../utils';

export default function History({ shifts, setShifts, hourlyRate, currency }) {
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const [manualStartTime, setManualStartTime] = useState('');
  const [manualEndTime, setManualEndTime] = useState('');

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAddManualShift = () => {
    if (!manualDate || !manualStartTime || !manualEndTime) return;

    const start = new Date(`${manualDate}T${manualStartTime}`);
    let end = new Date(`${manualDate}T${manualEndTime}`);

    if (end < start) end.setDate(end.getDate() + 1);

    const durationMs = end.getTime() - start.getTime();
    const rate = parseFloat(hourlyRate) || 0;
    const earned = (durationMs / 3600000) * rate;

    const newShift = { id: Date.now(), startTime: start.getTime(), endTime: end.getTime(), durationMs, earned };
    setShifts([newShift, ...shifts].sort((a, b) => b.startTime - a.startTime));
    
    setIsManualEntryOpen(false);
    setManualDate('');
    setManualStartTime('');
    setManualEndTime('');
  };

  const totalEarned = shifts.reduce((sum, shift) => sum + shift.earned, 0);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-end mb-6 bg-white/[0.02] p-5 rounded-3xl border border-white/5">
        <div>
          <h2 className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">Всего заработано</h2>
          <div className="text-3xl font-bold flex items-center">
            <span className="text-emerald-400 flex items-center mr-1">{currency}</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              {/* МАГИЯ АНИМАЦИИ ЦИФР */}
              <CountUp end={totalEarned} decimals={2} duration={1.5} separator=" " />
            </span>
          </div>
        </div>
        <div className="bg-emerald-500/10 p-3 rounded-2xl">
          <Wallet className="text-emerald-400" size={28} />
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="text-lg font-semibold text-white/90">История смен</h3>
        <button 
          onClick={() => setIsManualEntryOpen(!isManualEntryOpen)}
          className={cn("p-2 rounded-xl transition-colors", isManualEntryOpen ? "bg-rose-500/20 text-rose-400" : "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30")}
        >
          {isManualEntryOpen ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {isManualEntryOpen && (
        <div className="bg-indigo-500/10 p-5 rounded-3xl border border-indigo-500/20 mb-4 flex flex-col gap-4">
          <h4 className="text-xs text-indigo-300 font-bold uppercase tracking-widest">Добавить вручную</h4>
          <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} className="bg-black/40 text-white border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 w-full" style={{colorScheme: 'dark'}} />
          <div className="flex gap-3 items-center">
            <input type="time" value={manualStartTime} onChange={(e) => setManualStartTime(e.target.value)} className="bg-black/40 text-white border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 flex-1" style={{colorScheme: 'dark'}} />
            <ArrowRight size={16} className="text-gray-500" />
            <input type="time" value={manualEndTime} onChange={(e) => setManualEndTime(e.target.value)} className="bg-black/40 text-white border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 flex-1" style={{colorScheme: 'dark'}} />
          </div>
          <button onClick={handleAddManualShift} disabled={!manualDate || !manualStartTime || !manualEndTime} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3 rounded-xl transition-colors mt-2">
            Сохранить смену
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pb-24 no-scrollbar">
        {shifts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 opacity-60">
            <HistoryIcon size={64} strokeWidth={1} />
            <p className="text-sm tracking-wide">История пока пуста</p>
          </div>
        ) : (
          shifts.map((shift, i) => (
            <div key={shift.id} className="bg-white/[0.03] hover:bg-white/[0.06] transition-colors p-5 rounded-3xl border border-white/5 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-200 font-medium text-lg">
                  {new Date(shift.startTime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
                <span className="font-bold text-emerald-400 text-lg flex items-center gap-1">
                  <span>+</span><span className="flex items-center">{currency}</span>{shift.earned.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center bg-black/20 p-3 rounded-2xl">
                <div className="flex items-center text-sm text-gray-400 font-medium">
                  <span>{new Date(shift.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <ArrowRight size={14} className="mx-2 opacity-50" />
                  <span>{new Date(shift.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="flex items-center text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-xl font-mono text-sm">
                  <Clock size={12} className="mr-2" />
                  {formatTime(shift.durationMs)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}