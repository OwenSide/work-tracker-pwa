import React, { useState, useMemo } from 'react';
import { Clock, History as HistoryIcon, Wallet, ArrowRight, Plus, X, CalendarDays, ChevronDown, ChevronUp, Trash2, Pencil, Coffee, MessageSquare, Gift, Flame, Sun, Briefcase, Pill, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getShiftDetails } from '../utils/salary';
import { generatePDFReport } from '../utils/pdfGenerator';
import { cn } from '../utils/utils';

export default function History({ shifts, setShifts, hourlyRate, currency, contractType, monthlyRate, taxStatus }) {
  const [activeTab, setActiveTab] = useState('current');
  const [expandedArchive, setExpandedArchive] = useState(null);
  
  // Ручное добавление
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [shiftType, setShiftType] = useState('standard'); 
  const [manualDate, setManualDate] = useState('');
  const [manualEndDate, setManualEndDate] = useState(''); 
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
    return `${hours}ч ${minutes}м`;
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
    if (cleanNote.includes('🌴 Отпуск (100%) | ')) cleanNote = cleanNote.replace('🌴 Отпуск (100%) | ', '');
    if (cleanNote.includes('💊 Больничный L4 (80%) | ')) cleanNote = cleanNote.replace('💊 Больничный L4 (80%) | ', '');
    
    setEditNote(cleanNote.trim());
    setEditingShiftId(shift.id);
  };

  const handleSaveEdit = () => {
    if (!editDate || !editStartTime || !editEndTime) return;
    const start = new Date(`${editDate}T${editStartTime}`);
    
    let end = new Date(`${editDate}T${editEndTime}`);
    if (end < start) end.setDate(end.getDate() + 1);

    const pauseMs = (parseInt(editBreak) || 0) * 60000;
    const durationMs = Math.max(0, end.getTime() - start.getTime() - pauseMs);
    
    const editingShift = shifts.find(s => s.id === editingShiftId);
    const type = editingShift?.type || 'standard';

    const { earned } = getShiftDetails({
      durationMs, shiftStart: start.getTime(), endTime: end.getTime(),
      isHoliday: editHoliday, shiftType: type,
      contractType, hourlyRate, monthlyRate, taxStatus
    });
    
    let finalNote = editNote.trim();
    if (type === 'urlop') finalNote = finalNote ? `🌴 Отпуск (100%) | ${finalNote}` : '🌴 Отпуск (100%)';
    else if (type === 'l4') finalNote = finalNote ? `💊 Больничный L4 (80%) | ${finalNote}` : '💊 Больничный L4 (80%)';
    else if (contractType === 'oprace' && editHoliday) finalNote = finalNote ? `🎁 Праздник (x2) | ${finalNote}` : '🎁 Праздник (x2)';

    const updatedShifts = shifts.map(shift => shift.id === editingShiftId ? { ...shift, startTime: start.getTime(), endTime: end.getTime(), durationMs, earned, pauseMs, note: finalNote, isHoliday: editHoliday } : shift)
      .sort((a, b) => b.startTime - a.startTime);

    setShifts(updatedShifts);
    setEditingShiftId(null);
  };

  const handleAddManualShift = () => {
    if (!manualDate) return;
    let newShifts = [];
    let finalNote = manualNote.trim();

    if (shiftType === 'urlop' || shiftType === 'l4') {
      const endDateStr = manualEndDate || manualDate;
      let currentDate = new Date(manualDate);
      const endDate = new Date(endDateStr);

      if (endDate < currentDate) return alert('Дата окончания не может быть раньше даты начала!');

      const baseNote = shiftType === 'urlop' 
        ? (finalNote ? `🌴 Отпуск (100%) | ${finalNote}` : '🌴 Отпуск (100%)') 
        : (finalNote ? `💊 Больничный L4 (80%) | ${finalNote}` : '💊 Больничный L4 (80%)');

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          const start = new Date(currentDate); start.setHours(8, 0, 0, 0);
          const end = new Date(currentDate); end.setHours(16, 0, 0, 0);
          const durationMs = 8 * 3600000;

          const { earned } = getShiftDetails({
            durationMs, shiftStart: start.getTime(), endTime: end.getTime(),
            isHoliday: false, shiftType: shiftType,
            contractType, hourlyRate, monthlyRate, taxStatus
          });

          newShifts.push({
            id: Date.now() + Math.random(), startTime: start.getTime(), endTime: end.getTime(),
            durationMs, earned, pauseMs: 0, note: baseNote, isHoliday: false, type: shiftType
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      if (!manualStartTime || !manualEndTime) return;
      const start = new Date(`${manualDate}T${manualStartTime}`);
      const end = new Date(`${manualDate}T${manualEndTime}`);
      if (end < start) end.setDate(end.getDate() + 1);
      const pauseMs = (parseInt(manualBreak) || 0) * 60000;
      const durationMs = Math.max(0, end.getTime() - start.getTime() - pauseMs);

      const { earned } = getShiftDetails({
        durationMs, shiftStart: start.getTime(), endTime: end.getTime(),
        isHoliday: manualHoliday, shiftType: shiftType,
        contractType, hourlyRate, monthlyRate, taxStatus
      });
      
      if (contractType === 'oprace' && manualHoliday && shiftType === 'standard') {
        finalNote = finalNote ? `🎁 Праздник (x2) | ${finalNote}` : '🎁 Праздник (x2)';
      }

      newShifts.push({ id: Date.now(), startTime: start.getTime(), endTime: end.getTime(), durationMs, earned, pauseMs, note: finalNote, isHoliday: manualHoliday, type: shiftType });
    }

    if (newShifts.length > 0) setShifts([...newShifts, ...shifts].sort((a, b) => b.startTime - a.startTime));
    else alert('В выбранном диапазоне нет рабочих дней (выбраны только выходные).');
    
    setIsManualEntryOpen(false);
    setManualDate(''); setManualEndDate(''); setManualStartTime(''); setManualEndTime(''); setManualBreak(''); setManualNote(''); setManualHoliday(false); setShiftType('standard');
  };

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
        groups[key] = { id: key, label: monthName, sortValue: d.getTime(), shifts: [], earned: 0, totalDuration: 0, overtimeMs: 0 };
      }
      
      const isHol = shift.isHoliday === true || (typeof shift.note === 'string' && shift.note.includes('Праздник'));
      const safeDuration = Number(shift.durationMs) || 0;
      const type = shift.type || 'standard';

      const { overtimeMs: shiftOvertime } = getShiftDetails({
        durationMs: safeDuration, shiftStart: shift.startTime, endTime: shift.endTime,
        isHoliday: isHol, shiftType: type, contractType, hourlyRate, monthlyRate, taxStatus
      });

      const safeEarned = Number(shift.earned) || 0;

      groups[key].shifts.push(shift);
      groups[key].earned += safeEarned; 
      groups[key].totalDuration += safeDuration;
      groups[key].overtimeMs += shiftOvertime;
      
      gStats.earned += safeEarned;
      gStats.overtimeMs += shiftOvertime;
    });

    const current = groups[currentKey] || { shifts: [], label: 'Текущий месяц', earned: 0, totalDuration: 0, overtimeMs: 0 }; 
    const archives = Object.values(groups).filter(g => g.id !== currentKey).sort((a, b) => b.sortValue - a.sortValue);
    
    return { currentMonthData: current, archiveMonths: archives, globalStats: gStats };
  }, [shifts, contractType, hourlyRate, monthlyRate, taxStatus]);

  const renderShiftItem = (shift, hideDelete = false) => {
    if (editingShiftId === shift.id) {
      return (
        <div key={shift.id} className="bg-zinc-900 border border-zinc-700 p-4 rounded-2xl flex flex-col gap-3 shadow-lg my-2">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Редактирование</h4>
            <button onClick={() => setEditingShiftId(null)} className="text-zinc-500 hover:text-white p-1"><X size={18} /></button>
          </div>
          
          {/* Инпут даты без ограничений */}
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3">
            <CalendarDays size={16} className="text-zinc-500 shrink-0" />
            <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="bg-transparent text-white focus:outline-none w-full text-sm appearance-none" style={{colorScheme: 'dark'}} />
          </div>
          
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3">
              <Clock size={16} className="text-zinc-500 shrink-0" />
              <input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} className="bg-transparent text-white focus:outline-none w-full text-sm appearance-none" style={{colorScheme: 'dark'}} />
            </div>
            <ArrowRight size={14} className="text-zinc-600 shrink-0" />
            <div className="flex items-center gap-2 flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3">
              <Clock size={16} className="text-zinc-500 shrink-0" />
              <input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} className="bg-transparent text-white focus:outline-none w-full text-sm appearance-none" style={{colorScheme: 'dark'}} />
            </div>
          </div>
          
          <div className="flex gap-2 flex-col sm:flex-row">
            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 sm:w-1/3">
              <Coffee size={16} className="text-zinc-500 shrink-0" />
              <input type="number" placeholder="Пауза" value={editBreak} onChange={(e) => setEditBreak(e.target.value)} className="bg-transparent text-white focus:outline-none w-full text-sm placeholder:text-zinc-600" />
            </div>
            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 flex-1">
              <MessageSquare size={16} className="text-zinc-500 shrink-0" />
              <input type="text" placeholder="Заметка" value={editNote} onChange={(e) => setEditNote(e.target.value)} className="bg-transparent text-white focus:outline-none w-full text-sm placeholder:text-zinc-600" />
            </div>
          </div>

          {contractType === 'oprace' && (!shift.type || shift.type === 'standard') && (
            <button onClick={() => setEditHoliday(!editHoliday)} className={cn("w-full py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 border", editHoliday ? "bg-amber-500 text-black border-amber-500" : "bg-transparent text-zinc-400 border-zinc-700")}>
              <Gift size={14} /> Праздничный тариф
            </button>
          )}
          
          <button onClick={handleSaveEdit} className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-2.5 rounded-xl text-sm mt-1">
            Сохранить
          </button>
        </div>
      );
    }

    return (
      <div key={shift.id} className="group relative flex flex-col py-3.5 px-4 bg-zinc-900/40 hover:bg-zinc-800/60 border border-white/5 rounded-2xl transition-colors">
        <div className="flex justify-between items-center mb-2">
          <span className="text-zinc-100 font-medium text-sm tracking-wide">
            {new Date(shift.startTime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' })}
          </span>
          <div className="flex items-center gap-3">
            <span className="font-medium text-emerald-400 text-sm tracking-tight">
              {currency}{(Number(shift.earned) || 0).toFixed(2)}
            </span>
            {!hideDelete && (
              <div className="flex opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                <button onClick={() => handleEditClick(shift)} className="text-zinc-500 hover:text-white transition-colors" title="Редактировать"><Pencil size={14} /></button>
                <button onClick={() => handleDeleteShift(shift.id)} className="text-zinc-500 hover:text-rose-400 transition-colors ml-2" title="Удалить"><Trash2 size={14} /></button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <div className="flex items-center text-xs text-zinc-400 font-mono">
              <span>{new Date(shift.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              <ArrowRight size={12} className="mx-1.5 text-zinc-600" />
              <span>{new Date(shift.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              {shift.pauseMs > 0 && (
                <span className="ml-2 pl-2 border-l border-white/10 text-zinc-500 flex items-center gap-1">
                  <Coffee size={10} /> {Math.round(shift.pauseMs / 60000)}м
                </span>
              )}
            </div>
            {shift.note && (
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs mt-0.5">
                <MessageSquare size={10} className="shrink-0" />
                <span className="truncate max-w-[200px] font-light">{shift.note}</span>
              </div>
            )}
          </div>
          <div className="text-xs font-mono text-zinc-300 bg-zinc-800/50 px-2 py-1 rounded-md border border-white/[0.03]">
            {formatTime(shift.durationMs)}
          </div>
        </div>
      </div>
    );
  };

  const displayStats = activeTab === 'current' ? currentMonthData : globalStats;
  const showBadges = contractType === 'oprace' && activeTab === 'current' && displayStats.overtimeMs > 0;
  const mainAmount = Number(displayStats?.earned || 0).toFixed(2);

  return (
    <div className="p-3 sm:p-5 h-full flex flex-col bg-black">
      
      {/* Компактная шапка */}
      <div className="relative mb-5 bg-zinc-900/60 p-5 rounded-[1.5rem] border border-white/10 overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none"></div>
        
        <div className="relative z-10 flex justify-between items-center">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
              {activeTab === 'current' ? 'За месяц' : 'Общий баланс'}
            </span>
            <div className="text-3xl font-light text-white flex items-center tracking-tight">
              <span className="text-emerald-500 font-light mr-1.5 text-2xl">{currency}</span>
              {mainAmount}
            </div>
          </div>
          
          <div className="bg-zinc-800/50 p-3 rounded-xl border border-white/5">
            <Wallet className="text-zinc-400" size={20} strokeWidth={1.5} />
          </div>
        </div>

        {showBadges && (
          <div className="relative z-10 mt-3 flex items-center gap-1.5 text-[11px] font-medium text-black bg-amber-400 w-fit px-2.5 py-1 rounded-md">
            <Flame size={12} className="animate-pulse" />
            <span className="uppercase tracking-wider">Переработки: {formatTime(displayStats.overtimeMs)}</span>
          </div>
        )}
      </div>

      {/* Компактные табы */}
      <div className="flex bg-zinc-900 p-1 rounded-xl mb-4 border border-white/5 shrink-0">
        <button onClick={() => setActiveTab('current')} className={cn("flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5", activeTab === 'current' ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-zinc-300")}>
          <Clock size={14} /> Текущий
        </button>
        <button onClick={() => setActiveTab('archive')} className={cn("flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5", activeTab === 'archive' ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-zinc-300")}>
          <CalendarDays size={14} /> Архив
        </button>
      </div>

      {/* Контейнер списков */}
      <div className="flex-1 min-h-0 flex flex-col relative">
        {activeTab === 'current' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex-1 min-h-0 flex flex-col">
            <div className="flex justify-between items-center mb-3 px-1 shrink-0">
              <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wider">Смены месяца</h3>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => generatePDFReport({ monthData: currentMonthData, contractType, hourlyRate, monthlyRate, taxStatus })} 
                  className="p-1.5 rounded-lg transition-all bg-zinc-900 text-zinc-400 hover:bg-white hover:text-black border border-white/5" 
                >
                  <Printer size={16} />
                </button>
                <button 
                  onClick={() => { if (!isManualEntryOpen) setEditingShiftId(null); setIsManualEntryOpen(!isManualEntryOpen); }} 
                  className={cn("p-1.5 rounded-lg transition-all border", isManualEntryOpen ? "bg-zinc-800 text-white border-zinc-700" : "bg-white text-black border-transparent")}
                >
                  {isManualEntryOpen ? <X size={16} /> : <Plus size={16} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
              <AnimatePresence>
                {isManualEntryOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col gap-4">
                      
                      <div className="flex justify-between items-center mb-[-0.5rem]">
                        <h4 className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Ручное добавление</h4>
                      </div>

                      {contractType === 'oprace' && (
                        <div className="flex bg-zinc-950 p-1 rounded-xl border border-white/5">
                          <button onClick={() => setShiftType('standard')} className={cn("flex-1 py-2 rounded-lg text-xs font-medium transition-all flex justify-center items-center gap-1.5", shiftType === 'standard' ? "bg-zinc-800 text-white" : "text-zinc-500")}><Briefcase size={12}/> Работа</button>
                          <button onClick={() => setShiftType('urlop')} className={cn("flex-1 py-2 rounded-lg text-xs font-medium transition-all flex justify-center items-center gap-1.5", shiftType === 'urlop' ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-500")}><Sun size={12}/> Urlop</button>
                          <button onClick={() => setShiftType('l4')} className={cn("flex-1 py-2 rounded-lg text-xs font-medium transition-all flex justify-center items-center gap-1.5", shiftType === 'l4' ? "bg-rose-500/20 text-rose-400" : "text-zinc-500")}><Pill size={12}/> L4</button>
                        </div>
                      )}

                      {shiftType !== 'standard' ? (
                        <div className="flex gap-2 items-center">
                          <div className="flex-1 flex flex-col gap-1">
                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider pl-1">С</label>
                            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3">
                              <CalendarDays size={14} className="text-zinc-500 shrink-0" />
                              <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} className="bg-transparent text-white focus:outline-none w-full text-sm appearance-none" style={{colorScheme: 'dark'}} />
                            </div>
                          </div>
                          <ArrowRight size={14} className="text-zinc-600 mt-5 shrink-0" />
                          <div className="flex-1 flex flex-col gap-1">
                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider pl-1">По</label>
                            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3">
                              <CalendarDays size={14} className="text-zinc-500 shrink-0" />
                              <input type="date" value={manualEndDate} onChange={(e) => setManualEndDate(e.target.value)} className="bg-transparent text-white focus:outline-none w-full text-sm appearance-none" style={{colorScheme: 'dark'}} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3">
                          <CalendarDays size={16} className="text-zinc-500 shrink-0" />
                          <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} className="bg-transparent text-white focus:outline-none w-full text-sm appearance-none" style={{colorScheme: 'dark'}} />
                        </div>
                      )}

                      {shiftType === 'standard' && (
                        <>
                          <div className="flex gap-2 items-center">
                            <div className="flex items-center gap-2 flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3">
                              <Clock size={14} className="text-zinc-500 shrink-0" />
                              <input type="time" value={manualStartTime} onChange={(e) => setManualStartTime(e.target.value)} className="bg-transparent text-white focus:outline-none w-full text-sm appearance-none" style={{colorScheme: 'dark'}} />
                            </div>
                            <ArrowRight size={14} className="text-zinc-600 shrink-0" />
                            <div className="flex items-center gap-2 flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3">
                              <Clock size={14} className="text-zinc-500 shrink-0" />
                              <input type="time" value={manualEndTime} onChange={(e) => setManualEndTime(e.target.value)} className="bg-transparent text-white focus:outline-none w-full text-sm appearance-none" style={{colorScheme: 'dark'}} />
                            </div>
                          </div>
                          
                          <div className="flex gap-2 flex-col sm:flex-row">
                            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 sm:w-1/3"><Coffee size={14} className="text-zinc-500 shrink-0" /><input type="number" placeholder="Пауза" value={manualBreak} onChange={(e) => setManualBreak(e.target.value)} className="bg-transparent text-white focus:outline-none w-full text-sm placeholder:text-zinc-600" /></div>
                            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 flex-1"><MessageSquare size={14} className="text-zinc-500 shrink-0" /><input type="text" placeholder="Заметка (опционально)" value={manualNote} onChange={(e) => setManualNote(e.target.value)} className="bg-transparent text-white focus:outline-none w-full text-sm placeholder:text-zinc-600" /></div>
                          </div>
                          {contractType === 'oprace' && (
                            <button onClick={() => setManualHoliday(!manualHoliday)} className={cn("w-full py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 border mt-1", manualHoliday ? "bg-amber-500 text-black border-amber-500" : "bg-transparent text-zinc-400 border-zinc-800")}><Gift size={14} /> Праздничный тариф</button>
                          )}
                        </>
                      )}
                      
                      <button onClick={handleAddManualShift} disabled={!manualDate || (shiftType === 'standard' && (!manualStartTime || !manualEndTime))} className="w-full bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-semibold py-3 rounded-xl transition-colors text-sm">Добавить</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-2">
                {currentMonthData.shifts.length === 0 ? (
                  <div className="py-10 flex flex-col items-center justify-center text-zinc-600 space-y-3"><HistoryIcon size={32} strokeWidth={1} /><p className="text-xs tracking-widest uppercase">Нет записей</p></div>
                ) : (currentMonthData.shifts.map(shift => renderShiftItem(shift, false)))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'archive' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto pb-24 no-scrollbar flex flex-col gap-3">
              {archiveMonths.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center text-zinc-600 space-y-3"><CalendarDays size={32} strokeWidth={1} /><p className="text-xs tracking-widest uppercase">Архив пуст</p></div>
              ) : (
                archiveMonths.map(month => (
                  <div key={month.id} className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="flex justify-between items-center w-full p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors" onClick={() => setExpandedArchive(expandedArchive === month.id ? null : month.id)}>
                      <div className="flex flex-col gap-1">
                        <span className="text-white font-medium text-sm">{month.label}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-emerald-400">{currency}{(Number(month.earned) || 0).toFixed(2)}</span>
                          <span className="text-zinc-500">•</span>
                          <span className="text-zinc-400 font-mono">{formatTime(month.totalDuration)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); generatePDFReport({ monthData: month, contractType, hourlyRate, monthlyRate, taxStatus }); }} 
                          className="text-zinc-500 hover:text-white p-2 rounded-lg transition-all bg-zinc-800/50" 
                        >
                          <Printer size={14} />
                        </button>
                        <button onClick={(e) => handleDeleteMonth(e, month.id, month.label)} className="text-zinc-600 hover:text-rose-400 p-2 rounded-lg transition-all"><Trash2 size={14} /></button>
                        <div className="text-zinc-500 ml-1">{expandedArchive === month.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {expandedArchive === month.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }} 
                          className="border-t border-white/[0.04] bg-black/20 overflow-hidden"
                        >
                          <div className="p-3 flex flex-col gap-2 max-h-[55vh] overflow-y-auto no-scrollbar overscroll-contain">
                            {month.shifts.map(shift => renderShiftItem(shift, true))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}