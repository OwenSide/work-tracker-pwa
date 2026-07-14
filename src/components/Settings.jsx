import React, { useRef } from 'react';
import { Download, Trash2, AlertTriangle, FileSpreadsheet, Upload, Briefcase, GraduationCap, User } from 'lucide-react';
import { cn } from '../utils';

export default function Settings({ contractType, setContractType, hourlyRate, setHourlyRate, monthlyRate, setMonthlyRate, taxStatus, setTaxStatus, currency, setCurrency, shifts, setShifts }) {
  const fileInputRef = useRef(null);

  const handleExportCSV = () => {
    if (!shifts || shifts.length === 0) {
      alert('Нет данных для экспорта. Добавьте хотя бы одну смену.');
      return;
    }

    const headers = ['Дата', 'Начало', 'Конец', 'Перерыв (мин)', 'Длительность (часы)', 'Заработано', 'Заметка'];
    const rows = shifts.map(s => {
      const date = new Date(s.startTime).toLocaleDateString('ru-RU');
      const start = new Date(s.startTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
      const end = new Date(s.endTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
      const pause = s.pauseMs ? Math.round(s.pauseMs / 60000) : 0;
      const duration = (s.durationMs / 3600000).toFixed(2);
      const earned = s.earned.toFixed(2);
      const note = s.note ? `"${s.note.replace(/"/g, '""')}"` : '';

      return [date, start, end, pause, duration, earned, note].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WorkTracker_Backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parseCSVLine = (line) => {
        let result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          let c = line[i];
          if (c === '"') {
            if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
            else inQuotes = !inQuotes;
          } else if (c === ',' && !inQuotes) {
            result.push(cur);
            cur = '';
          } else {
            cur += c;
          }
        }
        result.push(cur);
        return result;
      };

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length <= 1) {
        alert('Файл пуст или не содержит данных.');
        return;
      }

      try {
        const importedShifts = [];
        for (let i = 1; i < lines.length; i++) {
          const row = parseCSVLine(lines[i]);
          if (row.length < 6) continue;

          const [day, month, year] = row[0].split('.');
          if (!day || !month || !year) continue;

          const [sH, sM] = row[1].split(':');
          const [eH, eM] = row[2].split(':');

          const startD = new Date(year, month - 1, day, sH, sM);
          let endD = new Date(year, month - 1, day, eH, eM);
          if (endD < startD) endD.setDate(endD.getDate() + 1);

          const pauseMs = parseInt(row[3] || 0) * 60000;
          const earned = parseFloat(row[5] || 0);
          const note = row[6] || '';
          const durationMs = Math.max(0, endD.getTime() - startD.getTime() - pauseMs);

          importedShifts.push({
            id: Date.now() + i,
            startTime: startD.getTime(),
            endTime: endD.getTime(),
            pauseMs,
            durationMs,
            earned,
            note
          });
        }

        if (importedShifts.length === 0) {
          alert('Не удалось распознать смены.');
          return;
        }

        if (shifts.length > 0) {
          if (window.confirm(`Найдено ${importedShifts.length} смен.\n\nДобавить их к существующей истории?\n\n(ОК - объединить базы. Отмена - ЗАМЕНИТЬ текущие данные)`)) {
            const merged = [...shifts, ...importedShifts].sort((a, b) => b.startTime - a.startTime);
            setShifts(merged);
            alert('Смены успешно добавлены!');
          } else {
            if (window.confirm('ВНИМАНИЕ! Это действие удалит ваши текущие смены. Точно продолжить?')) {
              setShifts(importedShifts.sort((a, b) => b.startTime - a.startTime));
              alert('База данных успешно обновлена!');
            }
          }
        } else {
          setShifts(importedShifts.sort((a, b) => b.startTime - a.startTime));
          alert(`Успешно загружено ${importedShifts.length} смен!`);
        }
      } catch (err) {
        alert('Ошибка при чтении файла.');
        console.error(err);
      }
      event.target.value = null;
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (!shifts || shifts.length === 0) return alert('База данных уже пуста.');
    if (window.confirm('ВНИМАНИЕ! Вы уверены?')) {
      if (window.confirm('Точно? Данные не восстановить.')) {
        setShifts([]);
        alert('Данные удалены.');
      }
    }
  };

  return (
    <div className="p-6 h-full animate-fade-in overflow-y-auto pb-32 no-scrollbar">
      <h2 className="text-3xl font-bold mb-8 text-white tracking-tight">Настройки</h2>
      
      <div className="space-y-6">
        
        {/* Тип договора */}
        <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 backdrop-blur-md">
          <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Тип договора</label>
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
            <button onClick={() => setContractType('zlecenie')} className={cn("flex-1 py-3 rounded-xl text-sm font-semibold transition-all", contractType === 'zlecenie' ? "bg-indigo-500/20 text-indigo-300" : "text-gray-500 hover:text-gray-300")}>Umowa Zlecenie</button>
            <button onClick={() => setContractType('oprace')} className={cn("flex-1 py-3 rounded-xl text-sm font-semibold transition-all", contractType === 'oprace' ? "bg-indigo-500/20 text-indigo-300" : "text-gray-500 hover:text-gray-300")}>Umowa o Pracę</button>
          </div>
        </div>

        {/* Финансы */}
        <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
          
          <div className="flex gap-3 relative z-10 mb-6">
            <div className="flex-1">
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">
                {contractType === 'oprace' ? 'Brutto в месяц' : 'Brutto в час'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none"><span className="text-xl text-emerald-400 font-bold">{currency}</span></div>
                <input
                  type="number" step="any"
                  value={contractType === 'oprace' ? monthlyRate : hourlyRate}
                  onChange={(e) => contractType === 'oprace' ? setMonthlyRate(e.target.value) : setHourlyRate(e.target.value)}
                  className="w-full bg-black/30 text-white border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500 text-xl font-semibold transition-all"
                />
              </div>
            </div>
            <div className="w-24">
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 text-center">Валюта</label>
              <input type="text" maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full bg-black/30 text-white border border-white/10 rounded-2xl py-4 px-2 text-center focus:outline-none focus:border-indigo-500 text-xl font-semibold uppercase" />
            </div>
          </div>

          <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 relative z-10">Налоговый статус</label>
          <div className="grid grid-cols-3 gap-2 relative z-10">
            <button onClick={() => setTaxStatus('standard')} className={cn("flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all", taxStatus === 'standard' ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300" : "bg-black/30 border-white/5 text-gray-500")}><User size={20}/> <span className="text-[10px] uppercase font-bold text-center">Standard<br/>(&gt;26 лет)</span></button>
            <button onClick={() => setTaxStatus('under26')} className={cn("flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all", taxStatus === 'under26' ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300" : "bg-black/30 border-white/5 text-gray-500")}><Briefcase size={20}/> <span className="text-[10px] uppercase font-bold text-center">PIT-0<br/>(&lt;26 лет)</span></button>
            <button onClick={() => setTaxStatus('student')} className={cn("flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all", taxStatus === 'student' ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300" : "bg-black/30 border-white/5 text-gray-500")}><GraduationCap size={20}/> <span className="text-[10px] uppercase font-bold text-center">Студент<br/>(до 26 лет)</span></button>
          </div>
          {contractType === 'oprace' && taxStatus === 'student' && (
            <p className="text-amber-500/70 text-[10px] uppercase tracking-wide mt-3 text-center">На Umowie o Pracę статус студента не дает освобождения от ZUS</p>
          )}
        </div>

        {/* Блок: Данные (Бэкап) */}
        <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 backdrop-blur-md">
          <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Управление данными</label>
          <div className="space-y-3">
            <button onClick={handleExportCSV} className="w-full flex items-center justify-between bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 p-4 rounded-2xl transition-colors group">
              <div className="flex items-center gap-3"><div className="bg-indigo-500/20 p-2 rounded-xl"><Download size={20} /></div><div className="flex flex-col items-start"><span className="font-semibold text-white">Экспорт данных</span><span className="text-xs text-indigo-300/70">Скачать файл .csv</span></div></div><FileSpreadsheet size={20} className="opacity-50" />
            </button>
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportFile} className="hidden" />
            <button onClick={handleImportClick} className="w-full flex items-center justify-between bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 p-4 rounded-2xl transition-colors group">
              <div className="flex items-center gap-3"><div className="bg-emerald-500/20 p-2 rounded-xl"><Upload size={20} /></div><div className="flex flex-col items-start"><span className="font-semibold text-white">Импорт данных</span><span className="text-xs text-emerald-300/70">Загрузить из файла</span></div></div><FileSpreadsheet size={20} className="opacity-50" />
            </button>
            <button onClick={handleClearData} className="w-full flex items-center justify-between bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 border border-rose-500/10 p-4 rounded-2xl mt-6 group">
              <div className="flex items-center gap-3"><div className="bg-rose-500/10 p-2 rounded-xl"><AlertTriangle size={20} /></div><div className="flex flex-col items-start"><span className="font-semibold text-white">Очистить данные</span><span className="text-xs text-rose-400/70">Удалить всю историю</span></div></div><Trash2 size={20} className="opacity-50" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}