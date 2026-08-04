import React, { useRef } from 'react';
import { Download, Trash2, AlertTriangle, FileCode, Upload, Briefcase, GraduationCap, User, Settings as SettingsIcon, ShieldCheck } from 'lucide-react';
import { cn } from '../utils/utils';

export default function Settings({ 
  contractType, setContractType, 
  hourlyRate, setHourlyRate, 
  monthlyRate, setMonthlyRate, 
  taxStatus, setTaxStatus, 
  shifts, setShifts 
}) {
  const fileInputRef = useRef(null);

  // ЭКСПОРТ В JSON (Смены + Настройки)
  const handleExportJSON = () => {
    if (!shifts || shifts.length === 0) {
      alert('Нет данных для экспорта. Добавьте хотя бы одну смену.');
      return;
    }

    const backupData = {
      version: 1,
      contractType,
      hourlyRate,
      monthlyRate,
      taxStatus,
      shifts
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `WorkTracker_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  // ИМПОРТ ИЗ JSON (Смены + Настройки)
  const handleImportFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        
        let importedShifts = [];
        let importedConfig = null;

        if (Array.isArray(parsed)) {
          importedShifts = parsed;
        } else if (parsed && Array.isArray(parsed.shifts)) {
          importedShifts = parsed.shifts;
          importedConfig = parsed;
        } else {
          throw new Error('Неверный формат');
        }

        if (importedConfig) {
          if (importedConfig.contractType) setContractType(importedConfig.contractType);
          if (importedConfig.hourlyRate) setHourlyRate(importedConfig.hourlyRate);
          if (importedConfig.monthlyRate) setMonthlyRate(importedConfig.monthlyRate);
          if (importedConfig.taxStatus) setTaxStatus(importedConfig.taxStatus);
        }

        if (shifts.length > 0) {
          if (window.confirm(`Найдено ${importedShifts.length} смен и настройки.\n\nОбъединить смены с текущей историей?\n\n(ОК - объединить базы. Отмена - ЗАМЕНИТЬ текущие данные)`)) {
            const merged = [...shifts, ...importedShifts].reduce((acc, current) => {
              const x = acc.find(item => item.id === current.id);
              if (!x) return acc.concat([current]);
              return acc;
            }, []).sort((a, b) => b.startTime - a.startTime);
            
            setShifts(merged);
            alert('Настройки и смены успешно загружены и объединены!');
          } else {
            if (window.confirm('ВНИМАНИЕ! Это действие удалит ваши текущие смены. Точно продолжить?')) {
              setShifts(importedShifts.sort((a, b) => b.startTime - a.startTime));
              alert('База данных и настройки успешно обновлены!');
            }
          }
        } else {
          setShifts(importedShifts.sort((a, b) => b.startTime - a.startTime));
          alert(`Успешно загружено настроек и ${importedShifts.length} смен!`);
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
    <div className="p-4 sm:p-6 h-full flex flex-col bg-black overflow-y-auto no-scrollbar pb-32">
      
      {/* Премиальный заголовок */}
      <div className="flex items-center gap-3 mb-8 mt-2 px-2">
        <div className="bg-zinc-900 border border-white/5 p-2.5 rounded-2xl">
          <SettingsIcon size={24} className="text-zinc-300" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-light text-white tracking-wide">Настройки</h2>
      </div>
      
      <div className="space-y-6 max-w-2xl">
        
        {/* Блок: Тип договора */}
        <div className="bg-zinc-900/60 p-5 rounded-[1.5rem] border border-white/[0.04] backdrop-blur-md">
          <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-3 ml-1">Тип договора</label>
          <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-white/5">
            <button 
              onClick={() => setContractType('zlecenie')} 
              className={cn("flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-300", contractType === 'zlecenie' ? "bg-white text-black shadow-md" : "text-zinc-500 hover:text-zinc-300")}
            >
              Umowa Zlecenie
            </button>
            <button 
              onClick={() => setContractType('oprace')} 
              className={cn("flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-300", contractType === 'oprace' ? "bg-white text-black shadow-md" : "text-zinc-500 hover:text-zinc-300")}
            >
              Umowa o Pracę
            </button>
          </div>
        </div>

        {/* Блок: Финансы и Статус */}
        <div className="bg-zinc-900/60 p-5 rounded-[1.5rem] border border-white/[0.04] backdrop-blur-md relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none"></div>
          
          <div className="relative z-10">
            <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-3 ml-1">
              {contractType === 'oprace' ? 'Brutto в месяц' : 'Netto в час'}
            </label>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center px-4 py-1.5 focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/30 transition-all">
              <span className="text-2xl text-emerald-500/80 font-light mr-3 select-none">zł</span>
              <input
                type="number" step="any"
                value={contractType === 'oprace' ? monthlyRate : hourlyRate}
                onChange={(e) => contractType === 'oprace' ? setMonthlyRate(e.target.value) : setHourlyRate(e.target.value)}
                className="w-full bg-transparent text-white text-2xl font-light py-3 focus:outline-none placeholder:text-zinc-700"
                placeholder="0.00"
              />
            </div>
          </div>

          {contractType === 'oprace' && (
            <div className="relative z-10 mt-6 pt-6 border-t border-white/[0.04]">
              <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-3 ml-1">Налоговый статус</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setTaxStatus('standard')} 
                  className={cn("flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all", taxStatus === 'standard' ? "bg-white text-black border-transparent shadow-md" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700")}
                >
                  <User size={20} strokeWidth={taxStatus === 'standard' ? 2 : 1.5} /> 
                  <span className="text-[10px] uppercase font-bold text-center tracking-wide leading-tight">Standard<br/><span className="opacity-70 font-medium tracking-normal">(&gt;26 лет)</span></span>
                </button>
                <button 
                  onClick={() => setTaxStatus('under26')} 
                  className={cn("flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all", taxStatus === 'under26' ? "bg-white text-black border-transparent shadow-md" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700")}
                >
                  <Briefcase size={20} strokeWidth={taxStatus === 'under26' ? 2 : 1.5} /> 
                  <span className="text-[10px] uppercase font-bold text-center tracking-wide leading-tight">PIT-0<br/><span className="opacity-70 font-medium tracking-normal">(&lt;26 лет)</span></span>
                </button>
                <button 
                  onClick={() => setTaxStatus('student')} 
                  className={cn("flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all", taxStatus === 'student' ? "bg-white text-black border-transparent shadow-md" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700")}
                >
                  <GraduationCap size={20} strokeWidth={taxStatus === 'student' ? 2 : 1.5} /> 
                  <span className="text-[10px] uppercase font-bold text-center tracking-wide leading-tight">Студент<br/><span className="opacity-70 font-medium tracking-normal">(до 26 лет)</span></span>
                </button>
              </div>
              <div className="mt-4 flex items-start gap-2 bg-zinc-950/50 p-3 rounded-xl border border-white/5">
                <AlertTriangle size={14} className="text-zinc-500 shrink-0 mt-0.5" />
                <p className="text-zinc-400 text-xs font-light leading-snug">
                  На <span className="font-medium text-zinc-300">Umowie o Pracę</span> статус студента не дает освобождения от ZUS.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Блок: Управление данными */}
        <div className="mb-2">
          <label className="block text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-2 ml-3">Резервное копирование</label>
          <div className="bg-zinc-900/60 rounded-[1.5rem] border border-white/[0.04] backdrop-blur-md overflow-hidden flex flex-col">
            
            {/* Экспорт */}
            <button onClick={handleExportJSON} className="flex items-center justify-between p-4 bg-transparent hover:bg-white/[0.02] transition-colors border-b border-white/[0.04] group text-left">
              <div className="flex items-center gap-4">
                <div className="bg-zinc-800 p-2.5 rounded-xl group-hover:bg-zinc-700 transition-colors">
                  <Download size={18} className="text-zinc-300" strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm text-zinc-200">Резервная копия</span>
                  <span className="text-xs text-zinc-500 font-light">Скачать историю смен на устройство</span>
                </div>
              </div>
              <FileCode size={18} className="text-zinc-600" />
            </button>
            
            {/* Импорт */}
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportFile} className="hidden" />
            <button onClick={handleImportClick} className="flex items-center justify-between p-4 bg-transparent hover:bg-white/[0.02] transition-colors border-b border-white/[0.04] group text-left">
              <div className="flex items-center gap-4">
                <div className="bg-zinc-800 p-2.5 rounded-xl group-hover:bg-zinc-700 transition-colors">
                  <Upload size={18} className="text-zinc-300" strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm text-zinc-200">Восстановить данные</span>
                  <span className="text-xs text-zinc-500 font-light">Загрузить смены из сохраненного файла</span>
                </div>
              </div>
              <FileCode size={18} className="text-zinc-600" />
            </button>

            {/* Очистка данных */}
            <button onClick={handleClearData} className="flex items-center justify-between p-4 bg-transparent hover:bg-rose-500/5 transition-colors group text-left">
              <div className="flex items-center gap-4">
                <div className="bg-rose-500/10 p-2.5 rounded-xl group-hover:bg-rose-500/20 transition-colors">
                  <Trash2 size={18} className="text-rose-500" strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm text-rose-500">Очистить данные</span>
                  <span className="text-xs text-zinc-500 font-light">Безвозвратное удаление</span>
                </div>
              </div>
            </button>

          </div>
        </div>

        <div className="mt-6 pb-6 flex justify-center px-4">
          <div className="flex items-center gap-2 bg-zinc-900/40 px-4 py-2 rounded-full border border-white/[0.03]">
            <ShieldCheck size={14} className="text-zinc-500 shrink-0" />
            <span className="text-[10px] text-zinc-500 font-light tracking-wider">
              Все данные хранятся только на вашем устройстве
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}