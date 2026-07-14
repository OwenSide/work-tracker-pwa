import React, { useState, useMemo } from 'react';
import { Clock, History as HistoryIcon, Wallet, ArrowRight, Plus, X, CalendarDays, ChevronDown, ChevronUp, Trash2, Pencil, Coffee, MessageSquare, Gift, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils';

export default function History({ shifts, setShifts, hourlyRate, currency, contractType, monthlyRate, taxStatus }) {
  const [activeTab, setActiveTab] = useState('current');
  const [expandedArchive, setExpandedArchive] = useState(null);
  
  // Ручное добавление
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const [manualStartTime, setManualStartTime] = useState('');
  const [manualEndTime, setManualEndTime] = useState('');
  const [manualBreak, setManualBreak] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [manualHoliday, setManualHoliday] = useState(false);

  // Редактирование
  const [editingShiftId, setEditingShiftId] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editBreak, setEditBreak] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editHoliday, setEditHoliday] = useState(false);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(Math.max(0, Number(ms) || 0) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours} ч ${minutes} мин`;
  };

  const handleDeleteShift = (id) => {
    if (window.confirm('Точно удалить эту смену?')) setShifts(shifts.filter(shift => shift.id !== id));
  };

  const handleDeleteMonth = (e, monthId, monthLabel) => {
    e.stopPropagation();
    if (window.confirm(`Точно удалить весь архив за ${monthLabel}?`)) {
      const [year, month] = monthId.split('-').map(Number);
      setShifts(shifts.filter(shift => {
        const d = new Date(shift.startTime);
        return !(d.getFullYear() === year && d.getMonth() === month);
      }));
      if (expandedArchive === monthId) setExpandedArchive(null);
    }
  };

  // УМНЫЙ КАЛЬКУЛЯТОР ДЕНЕГ
  const calculateEarnedNetto = (durationMs, shiftStartMs, isHoliday) => {
    const hoursElapsed = (Number(durationMs) || 0) / 3600000;
    let bruttoHour = 0;

    if (contractType === 'oprace') {
      const startD = new Date(shiftStartMs);
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
      if (taxStatus === 'student') multiplier = 1;
      else if (taxStatus === 'under26') multiplier = 0.78;
    } else if (contractType === 'oprace') {
      if (taxStatus === 'student' || taxStatus === 'under26') multiplier = 0.78;
      else multiplier = 0.73;
    }

    const nettoHour = bruttoHour * multiplier;

    if (contractType === 'oprace') {
      const isWeekend = new Date(shiftStartMs).getDay() === 0 || new Date(shiftStartMs).getDay() === 6;
      if (isHoliday || isWeekend) {
        return hoursElapsed * (nettoHour * 2); 
      } else {
        if (hoursElapsed > 8) {
          return (8 * nettoHour) + ((hoursElapsed - 8) * (nettoHour * 1.5)); 
        }
        return hoursElapsed * nettoHour;
      }
    }

    return hoursElapsed * nettoHour;
  };

  const handleEditClick = (shift) => {
    setIsManualEntryOpen(false);

    const startD = new Date(shift.startTime);
    const endD = new Date(shift.endTime);
    setEditDate(`${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-${String(startD.getDate()).padStart(2, '0')}`);
    setEditStartTime(`${String(startD.getHours()).padStart(2, '0')}:${String(startD.getMinutes()).padStart(2, '0')}`);
    setEditEndTime(`${String(endD.getHours()).padStart(2, '0')}:${String(endD.getMinutes()).padStart(2, '0')}`);
    setEditBreak(shift.pauseMs ? Math.round(shift.pauseMs / 60000).toString() : '');
    
    const isHol = shift.isHoliday === true || (shift.note && typeof shift.note === 'string' && shift.note.includes('Праздник'));
    setEditHoliday(isHol);
    
    let cleanNote = shift.note || '';
    if (cleanNote.includes('🎁 Праздник (x2) | ')) cleanNote = cleanNote.replace('🎁 Праздник (x2) | ', '');
    else if (cleanNote.includes('🎁 Праздник (x2)')) cleanNote = cleanNote.replace('🎁 Праздник (x2)', '');
    
    setEditNote(cleanNote.trim());
    setEditingShiftId(shift.id);
  };

  const handleSaveEdit = () => {
    if (!editDate || !editStartTime || !editEndTime) return;
    const start = new Date(`${editDate}T${editStartTime}`);
    if (start > new Date()) { alert('Время начала не может быть в будущем!'); return; }
    
    let end = new Date(`${editDate}T${editEndTime}`);
    if (end < start) end.setDate(end.getDate() + 1);

    const pauseMs = (parseInt(editBreak) || 0) * 60000;
    const durationMs = Math.max(0, end.getTime() - start.getTime() - pauseMs);
    
    const earned = calculateEarnedNetto(durationMs, start.getTime(), editHoliday);
    
    let finalNote = editNote.trim();
    if (contractType === 'oprace' && editHoliday) {
      finalNote = finalNote ? `🎁 Праздник (x2) | ${finalNote}` : '🎁 Праздник (x2)';
    }

    const updatedShifts = shifts.map(shift => shift.id === editingShiftId ? { ...shift, startTime: start.getTime(), endTime: end.getTime(), durationMs, earned, pauseMs, note: finalNote, isHoliday: editHoliday } : shift)
      .sort((a, b) => b.startTime - a.startTime);

    setShifts(updatedShifts);
    setEditingShiftId(null);
  };

  const handleAddManualShift = () => {
    if (!manualDate || !manualStartTime || !manualEndTime) return;
    const start = new Date(`${manualDate}T${manualStartTime}`);
    if (start > new Date()) { alert('Время начала не может быть в будущем!'); return; }
    
    let end = new Date(`${manualDate}T${manualEndTime}`);
    if (end < start) end.setDate(end.getDate() + 1);

    const pauseMs = (parseInt(manualBreak) || 0) * 60000;
    const durationMs = Math.max(0, end.getTime() - start.getTime() - pauseMs);
    
    const earned = calculateEarnedNetto(durationMs, start.getTime(), manualHoliday);
    
    let finalNote = manualNote.trim();
    if (contractType === 'oprace' && manualHoliday) {
      finalNote = finalNote ? `🎁 Праздник (x2) | ${finalNote}` : '🎁 Праздник (x2)';
    }

    const newShift = { id: Date.now(), startTime: start.getTime(), endTime: end.getTime(), durationMs, earned, pauseMs, note: finalNote, isHoliday: manualHoliday };
    setShifts([newShift, ...shifts].sort((a, b) => b.startTime - a.startTime));
    
    setIsManualEntryOpen(false);
    setManualDate(''); setManualStartTime(''); setManualEndTime(''); setManualBreak(''); setManualNote(''); setManualHoliday(false);
  };

  // ИСПРАВЛЕННАЯ ЛОГИКА АРХИВА И ПОДСЧЕТОВ
  const { currentMonthData, archiveMonths, globalStats } = useMemo(() => {
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${now.getMonth()}`;
    const groups = {};
    
    const gStats = { earned: 0, overtimeMs: 0 };
    
    shifts.forEach(shift => {
      const d = new Date(shift.startTime);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      
      if (!groups[key]) {
        let monthName = d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
        monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1).replace(' г.', '');
        groups[key] = { 
          id: key, label: monthName, sortValue: d.getTime(), shifts: [], 
          earned: 0, totalDuration: 0, overtimeMs: 0 
        };
      }
      
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const isHol = shift.isHoliday === true || (typeof shift.note === 'string' && shift.note.includes('Праздник'));
      
      let shiftOvertime = 0;
      const safeDuration = Number(shift.durationMs) || 0;

      if (isHol || isWeekend) {
        shiftOvertime = safeDuration; 
      } else {
        shiftOvertime = Math.max(0, safeDuration - (8 * 3600000)); 
      }

      // ЖЕЛЕЗОБЕТОННАЯ ЗАЩИТА: Если earned пустой или NaN, он станет 0
      const safeEarned = Number(shift.earned) || 0;

      groups[key].shifts.push(shift);
      groups[key].earned += safeEarned; 
      groups[key].totalDuration += safeDuration;
      groups[key].overtimeMs += shiftOvertime;
      
      gStats.earned += safeEarned;
      gStats.overtimeMs += shiftOvertime;
    });

    const current = groups[currentKey] || { shifts: [], earned: 0, totalDuration: 0, overtimeMs: 0 }; 
    const archives = Object.values(groups).filter(g => g.id !== currentKey).sort((a, b) => b.sortValue - a.sortValue);
    
    return { currentMonthData: current, archiveMonths: archives, globalStats: gStats };
  }, [shifts]);

  const today = new Date();
  const maxDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const handleSafeDateChange = (e, setter) => {
    const selectedDate = e.target.value;
    if (selectedDate > maxDateString) {
      alert('Нельзя выбрать дату из будущего!');
      setter(maxDateString);
    } else {
      setter(selectedDate);
    }
  };

  const renderShiftItem = (shift, hideDelete = false) => {
    if (editingShiftId === shift.id) {
      return (
        <div key={shift.id} className="bg-indigo-500/10 p-5 rounded-3xl border border-indigo-500/30 flex flex-col gap-4 shadow-lg shadow-indigo-500/5">
          <div className="flex justify-between items-center">
            <h4 className="text-xs text-indigo-300 font-bold uppercase tracking-widest">Редактирование</h4>
            <button onClick={() => setEditingShiftId(null)} className="text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
          </div>
          
          <input 
            type="date" 
            max={maxDateString} 
            value={editDate} 
            onChange={(e) => handleSafeDateChange(e, setEditDate)}
            className="block min-w-0 w-full max-w-full appearance-none bg-black/50 text-white border border-white/10 rounded-xl py-2.5 px-4 focus:outline-none focus:border-indigo-400 text-sm" 
            style={{colorScheme: 'dark'}} 
          />
          
          <div className="flex gap-2 items-center">
            <input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} className="block min-w-0 flex-1 appearance-none bg-black/50 text-white border border-white/10 rounded-xl py-2.5 px-4 focus:outline-none focus:border-indigo-400 text-sm" style={{colorScheme: 'dark'}} />
            <ArrowRight size={14} className="text-indigo-400 shrink-0" />
            <input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} className="block min-w-0 flex-1 appearance-none bg-black/50 text-white border border-white/10 rounded-xl py-2.5 px-4 focus:outline-none focus:border-indigo-400 text-sm" style={{colorScheme: 'dark'}} />
          </div>
          
          <div className="flex gap-2 flex-col sm:flex-row">
            <div className="flex items-center gap-3 bg-black/50 border border-white/10 rounded-xl py-2.5 px-4 sm:w-1/3 min-w-0">
              <Coffee size={16} className="text-gray-400 shrink-0" />
              <input type="number" placeholder="Перерыв (мин)" value={editBreak} onChange={(e) => setEditBreak(e.target.value)} className="bg-transparent text-white focus:outline-none w-full min-w-0 text-sm placeholder:text-gray-600" />
            </div>
            <div className="flex items-center gap-3 bg-black/50 border border-white/10 rounded-xl py-2.5 px-4 flex-1 min-w-0">
              <MessageSquare size={16} className="text-gray-400 shrink-0" />
              <input type="text" placeholder="Заметка к смене" value={editNote} onChange={(e) => setEditNote(e.target.value)} className="bg-transparent text-white focus:outline-none w-full min-w-0 text-sm placeholder:text-gray-600" />
            </div>
          </div>

          {contractType === 'oprace' && (
            <button 
              onClick={() => setEditHoliday(!editHoliday)}
              className={cn("w-full py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all border", editHoliday ? "bg-amber-500/20 text-amber-400 border-amber-500/50" : "bg-black/50 text-gray-500 border-white/10 hover:bg-white/10")}
            >
              <Gift size={16} /> Праздничный тариф (x2)
            </button>
          )}

          <div className="flex gap-2 mt-1">
            <button onClick={handleSaveEdit} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">Сохранить</button>
          </div>
        </div>
      );
    }

    return (
      <div key={shift.id} className="bg-white/[0.03] hover:bg-white/[0.06] transition-colors p-5 rounded-3xl border border-white/5 flex flex-col gap-3 group">
        <div className="flex justify-between items-center">
          <span className="text-gray-200 font-medium text-lg">{new Date(shift.startTime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
          <div className="flex items-center gap-1">
            <span className="font-bold text-emerald-400 text-lg flex items-center gap-1 mr-2">
              <span>+</span><span className="flex items-center">{currency}</span>{(Number(shift.earned) || 0).toFixed(2)}
            </span>
            {!hideDelete && (
              <>
                <button onClick={() => handleEditClick(shift)} className="text-gray-500 hover:text-indigo-400 bg-transparent hover:bg-indigo-500/10 p-2 rounded-xl transition-all" title="Редактировать"><Pencil size={18} /></button>
                <button onClick={() => handleDeleteShift(shift.id)} className="text-gray-500 hover:text-rose-400 bg-transparent hover:bg-rose-500/10 p-2 rounded-xl transition-all" title="Удалить"><Trash2 size={18} /></button>
              </>
            )}
          </div>
        </div>
        
        <div className="flex flex-col bg-black/20 p-3 rounded-2xl gap-2">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center text-sm text-gray-400 font-medium">
              <span>{new Date(shift.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              <ArrowRight size={14} className="mx-2 opacity-50" />
              <span>{new Date(shift.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div className="flex gap-2">
              {shift.pauseMs > 0 && (
                <div className="flex items-center text-amber-500/90 bg-amber-500/10 px-2 py-1 rounded-lg font-mono text-xs" title="Время перерыва">
                  <Coffee size={12} className="mr-1.5" />{Math.round(shift.pauseMs / 60000)} м
                </div>
              )}
              <div className="flex items-center text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-xl font-mono text-sm">
                <Clock size={12} className="mr-2" />{formatTime(shift.durationMs)}
              </div>
            </div>
          </div>
          
          {shift.note && (
            <div className="flex items-start gap-2 pt-2 mt-1 border-t border-white/5 text-gray-400 text-sm">
              <MessageSquare size={14} className="mt-0.5 shrink-0 opacity-70" />
              <span className="leading-snug italic break-words min-w-0">{shift.note}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const displayStats = activeTab === 'current' ? currentMonthData : globalStats;
  const showBadges = contractType === 'oprace' && activeTab === 'current' && displayStats.overtimeMs > 0;
  
  // Безопасный вывод суммы
  const mainAmount = Number(displayStats?.earned || 0).toFixed(2);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-end mb-6 bg-white/[0.02] p-5 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="relative z-10 w-full pr-12">
          <h2 className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">{activeTab === 'current' ? 'Заработано в этом месяце' : 'Всего за всё время'}</h2>
          <div className="text-3xl font-bold flex items-center">
            <span className="text-emerald-400 flex items-center mr-1">{currency}</span>
            {/* Прямой вывод текста вместо анимации CountUp */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight">
              {mainAmount}
            </span>
          </div>
          
          {showBadges && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 w-fit px-3 py-1.5 rounded-xl border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <Flame size={14} className="animate-pulse" />
              <span className="uppercase tracking-widest">Переработки: {formatTime(displayStats.overtimeMs)}</span>
            </div>
          )}
        </div>
        
        <div className="absolute right-5 top-5 bg-emerald-500/10 p-3 rounded-2xl z-10"><Wallet className="text-emerald-400" size={28} /></div>
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="flex bg-black/40 p-1.5 rounded-2xl mb-6 border border-white/5">
        <button onClick={() => setActiveTab('current')} className={cn("flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2", activeTab === 'current' ? "bg-indigo-500/20 text-indigo-300 shadow-sm" : "text-gray-500 hover:text-gray-300")}><Clock size={16} />Текущий</button>
        <button onClick={() => setActiveTab('archive')} className={cn("flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2", activeTab === 'archive' ? "bg-indigo-500/20 text-indigo-300 shadow-sm" : "text-gray-500 hover:text-gray-300")}><CalendarDays size={16} />Архив</button>
      </div>

      {activeTab === 'current' && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-lg font-semibold text-white/90">Смены месяца</h3>
            <button 
              onClick={() => {
                if (!isManualEntryOpen) setEditingShiftId(null);
                setIsManualEntryOpen(!isManualEntryOpen);
              }} 
              className={cn("p-2 rounded-xl transition-colors", isManualEntryOpen ? "bg-rose-500/20 text-rose-400" : "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30")}
            >
              {isManualEntryOpen ? <X size={20} /> : <Plus size={20} />}
            </button>
          </div>

          {isManualEntryOpen && (
            <div className="bg-indigo-500/10 p-5 rounded-3xl border border-indigo-500/20 mb-4 flex flex-col gap-4">
              <h4 className="text-xs text-indigo-300 font-bold uppercase tracking-widest">Добавить вручную</h4>
              
              <input 
                type="date" 
                max={maxDateString} 
                value={manualDate} 
                onChange={(e) => handleSafeDateChange(e, setManualDate)}
                className="block min-w-0 w-full max-w-full appearance-none bg-black/40 text-white border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500" 
                style={{colorScheme: 'dark'}} 
              />
              
              <div className="flex gap-3 items-center">
                <input type="time" value={manualStartTime} onChange={(e) => setManualStartTime(e.target.value)} className="block min-w-0 flex-1 appearance-none bg-black/40 text-white border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500" style={{colorScheme: 'dark'}} />
                <ArrowRight size={16} className="text-gray-500 shrink-0" />
                <input type="time" value={manualEndTime} onChange={(e) => setManualEndTime(e.target.value)} className="block min-w-0 flex-1 appearance-none bg-black/40 text-white border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500" style={{colorScheme: 'dark'}} />
              </div>
              
              <div className="flex gap-2 flex-col sm:flex-row">
                <div className="flex items-center gap-3 bg-black/40 text-white border border-white/5 rounded-xl py-3 px-4 sm:w-1/3 min-w-0">
                  <Coffee size={16} className="text-gray-500 shrink-0" />
                  <input type="number" placeholder="Перерыв (мин)" value={manualBreak} onChange={(e) => setManualBreak(e.target.value)} className="bg-transparent min-w-0 focus:outline-none w-full placeholder:text-gray-600" />
                </div>
                <div className="flex items-center gap-3 bg-black/40 text-white border border-white/5 rounded-xl py-3 px-4 flex-1 min-w-0">
                  <MessageSquare size={16} className="text-gray-500 shrink-0" />
                  <input type="text" placeholder="Заметка (необязательно)" value={manualNote} onChange={(e) => setManualNote(e.target.value)} className="bg-transparent min-w-0 focus:outline-none w-full placeholder:text-gray-600" />
                </div>
              </div>

              {contractType === 'oprace' && (
                <button 
                  onClick={() => setManualHoliday(!manualHoliday)}
                  className={cn("w-full py-3 rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all border", manualHoliday ? "bg-amber-500/20 text-amber-400 border-amber-500/50" : "bg-black/40 text-gray-500 border-white/5 hover:bg-white/5")}
                >
                  <Gift size={16} /> Праздничный тариф (x2)
                </button>
              )}

              <button onClick={handleAddManualShift} disabled={!manualDate || !manualStartTime || !manualEndTime} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3 rounded-xl transition-colors mt-2">Сохранить</button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 pb-36 no-scrollbar">
            {currentMonthData.shifts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 opacity-60"><HistoryIcon size={64} strokeWidth={1} /><p className="text-sm tracking-wide">В этом месяце смен пока нет</p></div>
            ) : (currentMonthData.shifts.map(shift => renderShiftItem(shift, false)))}
          </div>
        </motion.div>
      )}

      {activeTab === 'archive' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 overflow-y-auto space-y-4 pb-36 no-scrollbar">
          {archiveMonths.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 opacity-60"><CalendarDays size={64} strokeWidth={1} /><p className="text-sm tracking-wide">Архив пока пуст</p></div>
          ) : (
            archiveMonths.map(month => (
              <div key={month.id} className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
                <div className="w-full flex flex-col hover:bg-white/[0.02] transition-colors relative">
                  <div className="flex justify-between items-start w-full p-5">
                    <div className="flex-1 cursor-pointer flex flex-col gap-2" onClick={() => setExpandedArchive(expandedArchive === month.id ? null : month.id)}>
                      <span className="text-white font-semibold text-lg">{month.label}</span>
                      
                      <div className="flex flex-wrap gap-4 mt-1">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Заработано</span>
                          <span className="text-emerald-400 font-bold flex items-center text-sm"><span className="flex items-center mr-1">{currency}</span>{(Number(month.earned) || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Всего часов</span>
                          <span className="text-indigo-300 font-mono text-sm">{formatTime(month.totalDuration)}</span>
                        </div>
                        
                        {contractType === 'oprace' && month.overtimeMs > 0 && (
                          <div className="flex flex-col">
                            <span className="text-[10px] text-amber-500/70 uppercase tracking-wider font-bold mb-0.5 flex items-center gap-1"><Flame size={10}/> Переработки</span>
                            <span className="text-amber-400 font-mono text-sm">{formatTime(month.overtimeMs)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2 mt-1">
                      <button onClick={(e) => handleDeleteMonth(e, month.id, month.label)} className="text-gray-600 hover:text-rose-400 bg-transparent hover:bg-rose-500/10 p-2 rounded-xl transition-all z-10"><Trash2 size={18} /></button>
                      <div className="p-2 text-gray-400 pointer-events-none">{expandedArchive === month.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
                    </div>
                  </div>
                </div>
                <AnimatePresence>
                  {expandedArchive === month.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/5 bg-black/20">
                      <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto pb-10 no-scrollbar">{month.shifts.map(shift => renderShiftItem(shift, true))}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
}