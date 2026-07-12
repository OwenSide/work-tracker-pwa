import React, { useRef } from 'react';
import { Download, Trash2, AlertTriangle, FileSpreadsheet, Upload } from 'lucide-react';

// Добавился пропс setCurrency
export default function Settings({ hourlyRate, setHourlyRate, currency, setCurrency, shifts, setShifts }) {
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
          alert('Не удалось распознать смены. Убедитесь, что это файл бэкапа WorkTracker.');
          return;
        }

        if (shifts.length > 0) {
          if (window.confirm(`Найдено ${importedShifts.length} смен.\n\nДобавить их к существующей истории?\n\n(ОК - объединить базы. Отмена - полностью ЗАМЕНИТЬ текущие данные на данные из файла)`)) {
            const merged = [...shifts, ...importedShifts].sort((a, b) => b.startTime - a.startTime);
            setShifts(merged);
            alert('Смены успешно добавлены к вашей истории!');
          } else {
            if (window.confirm('ВНИМАНИЕ! Это действие удалит ваши текущие смены и запишет только смены из файла. Точно продолжить?')) {
              setShifts(importedShifts.sort((a, b) => b.startTime - a.startTime));
              alert('База данных успешно обновлена из файла!');
            }
          }
        } else {
          setShifts(importedShifts.sort((a, b) => b.startTime - a.startTime));
          alert(`Успешно загружено ${importedShifts.length} смен!`);
        }
      } catch (err) {
        alert('Ошибка при чтении файла. Убедитесь, что формат не был изменен.');
        console.error(err);
      }
      
      event.target.value = null;
    };
    
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (!shifts || shifts.length === 0) {
      alert('База данных уже пуста.');
      return;
    }
    if (window.confirm('ВНИМАНИЕ! Это действие безвозвратно удалит всю историю смен.\nВы уверены?')) {
      if (window.confirm('Точно? Вы не сможете восстановить эти данные, если не сделали бэкап.')) {
        setShifts([]);
        alert('Все данные успешно удалены.');
      }
    }
  };

  return (
    <div className="p-6 h-full animate-fade-in overflow-y-auto pb-32 no-scrollbar">
      <h2 className="text-3xl font-bold mb-8 text-white tracking-tight">Настройки</h2>
      
      <div className="space-y-6">
        
        {/* Блок: Финансы (Ставка и Валюта) */}
        <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>

          <div className="flex gap-3 relative z-10">
            {/* Поле: Ставка */}
            <div className="flex-1">
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">
                Ставка / час
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="text-xl text-emerald-400 font-bold">{currency}</span>
                </div>
                <input
                  type="number"
                  step="any"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black/30 text-white border border-white/10 rounded-2xl py-4 pl-10 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xl font-semibold transition-all"
                />
              </div>
            </div>

            {/* Поле: Валюта */}
            <div className="w-24">
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 text-center">
                Валюта
              </label>
              <input
                type="text"
                maxLength={3}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="$"
                className="w-full bg-black/30 text-white border border-white/10 rounded-2xl py-4 px-2 text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xl font-semibold transition-all uppercase"
              />
            </div>
          </div>

          <div className="mt-5 bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex gap-3 items-start relative z-10">
            <div className="mt-0.5 text-indigo-400">💡</div>
            <p className="text-indigo-200/70 text-sm leading-relaxed">
              Изменение ставки повлияет только на новые смены.
            </p>
          </div>
        </div>

        {/* Блок: Данные (Бэкап) */}
        <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 backdrop-blur-md">
          <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
            Управление данными
          </label>
          
          <div className="space-y-3">
            <button 
              onClick={handleExportCSV}
              className="w-full flex items-center justify-between bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 p-4 rounded-2xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
                  <Download size={20} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-white">Экспорт бэкапа</span>
                  <span className="text-xs text-indigo-300/70">Скачать файл .csv</span>
                </div>
              </div>
              <FileSpreadsheet size={20} className="opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>

            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportFile} className="hidden" />
            <button 
              onClick={handleImportClick}
              className="w-full flex items-center justify-between bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 p-4 rounded-2xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
                  <Upload size={20} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-white">Импорт данных</span>
                  <span className="text-xs text-emerald-300/70">Загрузить из файла</span>
                </div>
              </div>
              <FileSpreadsheet size={20} className="opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>

            <button 
              onClick={handleClearData}
              className="w-full flex items-center justify-between bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 border border-rose-500/10 p-4 rounded-2xl transition-colors group mt-6"
            >
              <div className="flex items-center gap-3">
                <div className="bg-rose-500/10 p-2 rounded-xl group-hover:scale-110 transition-transform">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-white">Очистить данные</span>
                  <span className="text-xs text-rose-400/70">Удалить всю историю</span>
                </div>
              </div>
              <Trash2 size={20} className="opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}