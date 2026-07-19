import React, { useRef } from 'react';
import { Download, Trash2, AlertTriangle, FileCode, Upload, Briefcase, GraduationCap, User } from 'lucide-react';
import { cn } from '../utils';

export default function Settings({ contractType, setContractType, hourlyRate, setHourlyRate, monthlyRate, setMonthlyRate, taxStatus, setTaxStatus, shifts, setShifts }) {
  const fileInputRef = useRef(null);

  // ЭКСПОРТ В JSON
  const handleExportJSON = () => {
    if (!shifts || shifts.length === 0) {
      alert('Нет данных для экспорта. Добавьте хотя бы одну смену.');
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(shifts, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `WorkTracker_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  // ИМПОРТ ИЗ JSON
  const handleImportFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedShifts = JSON.parse(e.target.result);
        
        if (!Array.isArray(importedShifts)) throw new Error('Неверный формат');

        if (shifts.length > 0) {
          if (window.confirm(`Найдено ${importedShifts.length} смен.\n\nОбъединить их с текущей историей?\n\n(ОК - объединить базы. Отмена - ЗАМЕНИТЬ текущие данные)`)) {
            const merged = [...shifts, ...importedShifts].reduce((acc, current) => {
              const x = acc.find(item => item.id === current.id);
              if (!x) return acc.concat([current]);
              return acc;
            }, []).sort((a, b) => b.startTime - a.startTime);
            
            setShifts(merged);
            alert('Смены успешно добавлены и объединены!');
          } else {
            if (window.confirm('ВНИМАНИЕ! Это действие удалит ваши текущие смены. Точно продолжить?')) {
              setShifts(importedShifts.sort((a, b) => b.startTime - a.startTime));
              alert('База данных успешно заменена!');
            }
          }
        } else {
          setShifts(importedShifts.sort((a, b) => b.startTime - a.startTime));
          alert(`Успешно загружено ${importedShifts.length} смен!`);
        }
      } catch (err) {
        alert('Ошибка при чтении файла. Убедитесь, что это правильный .json бэкап.');
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
            <button onClick={() => setContractType('zlecenie')} className={cn("flex-1 py-3 rounded-xl text-sm font-semibold transition-all", contractType === 'zlecenie' ? "bg-indigo-500/20 text-indigo-300 shadow-sm" : "text-gray-500 hover:text-gray-300")}>Umowa Zlecenie</button>
            <button onClick={() => setContractType('oprace')} className={cn("flex-1 py-3 rounded-xl text-sm font-semibold transition-all", contractType === 'oprace' ? "bg-indigo-500/20 text-indigo-300 shadow-sm" : "text-gray-500 hover:text-gray-300")}>Umowa o Pracę</button>
          </div>
        </div>

        {/* Финансы */}
        <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">
              {contractType === 'oprace' ? 'Brutto в месяц' : 'Netto в час'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
                <span className="text-xl text-emerald-400 font-bold">zł</span>
              </div>
              <input
                type="number" step="any"
                value={contractType === 'oprace' ? monthlyRate : hourlyRate}
                onChange={(e) => contractType === 'oprace' ? setMonthlyRate(e.target.value) : setHourlyRate(e.target.value)}
                className="w-full bg-black/30 text-white border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500 text-xl font-semibold transition-all shadow-inner"
              />
            </div>
          </div>

          {contractType === 'oprace' && (
            <>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 relative z-10 mt-6 pt-6 border-t border-white/5">Налоговый статус</label>
              <div className="grid grid-cols-3 gap-2 relative z-10">
                <button onClick={() => setTaxStatus('standard')} className={cn("flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all", taxStatus === 'standard' ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300 shadow-sm" : "bg-black/30 border-white/5 text-gray-500 hover:bg-white/5")}><User size={20}/> <span className="text-[10px] uppercase font-bold text-center">Standard<br/>(&gt;26 лет)</span></button>
                <button onClick={() => setTaxStatus('under26')} className={cn("flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all", taxStatus === 'under26' ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300 shadow-sm" : "bg-black/30 border-white/5 text-gray-500 hover:bg-white/5")}><Briefcase size={20}/> <span className="text-[10px] uppercase font-bold text-center">PIT-0<br/>(&lt;26 лет)</span></button>
                <button onClick={() => setTaxStatus('student')} className={cn("flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all", taxStatus === 'student' ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300 shadow-sm" : "bg-black/30 border-white/5 text-gray-500 hover:bg-white/5")}><GraduationCap size={20}/> <span className="text-[10px] uppercase font-bold text-center">Студент<br/>(до 26 лет)</span></button>
              </div>
              <p className="text-amber-500/70 text-[10px] uppercase tracking-wide mt-3 text-center relative z-10">На Umowie o Pracę статус студента не дает освобождения от ZUS</p>
            </>
          )}
        </div>

        {/* Блок: Данные (Бэкап JSON) */}
        <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 backdrop-blur-md">
          <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Управление данными (JSON)</label>
          <div className="space-y-3">
            <button onClick={handleExportJSON} className="w-full flex items-center justify-between bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 p-4 rounded-2xl transition-colors group">
              <div className="flex items-center gap-3"><div className="bg-indigo-500/20 p-2 rounded-xl group-hover:scale-110 transition-transform"><Download size={20} /></div><div className="flex flex-col items-start"><span className="font-semibold text-white">Экспорт данных</span><span className="text-xs text-indigo-300/70">Скачать файл .json</span></div></div><FileCode size={20} className="opacity-50" />
            </button>
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportFile} className="hidden" />
            <button onClick={handleImportClick} className="w-full flex items-center justify-between bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 p-4 rounded-2xl transition-colors group">
              <div className="flex items-center gap-3"><div className="bg-emerald-500/20 p-2 rounded-xl group-hover:scale-110 transition-transform"><Upload size={20} /></div><div className="flex flex-col items-start"><span className="font-semibold text-white">Импорт данных</span><span className="text-xs text-emerald-300/70">Загрузить из файла</span></div></div><FileCode size={20} className="opacity-50" />
            </button>
            <button onClick={handleClearData} className="w-full flex items-center justify-between bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 border border-rose-500/10 p-4 rounded-2xl mt-6 group">
              <div className="flex items-center gap-3"><div className="bg-rose-500/10 p-2 rounded-xl group-hover:scale-110 transition-transform"><AlertTriangle size={20} /></div><div className="flex flex-col items-start"><span className="font-semibold text-white">Очистить данные</span><span className="text-xs text-rose-400/70">Удалить всю историю</span></div></div><Trash2 size={20} className="opacity-50" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}