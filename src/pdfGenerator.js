import { getShiftDetails } from './salary';

// Вспомогательная функция для красивого формата времени (ЧЧ:ММ)
const formatPrintTime = (ms) => {
  const totalSeconds = Math.floor(Math.max(0, Number(ms) || 0) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export function generatePDFReport({ monthData, contractType, hourlyRate, monthlyRate, taxStatus }) {
  const isOprace = contractType === 'oprace';
  const title = isOprace ? 'Отчет о рабочем времени (Umowa o Pracę)' : 'Отчет о рабочем времени (Umowa Zlecenie)';
  
  // Сортируем смены от начала месяца к концу
  const sortedShifts = [...monthData.shifts].sort((a, b) => a.startTime - b.startTime);

  let tableHeaders = '';
  let tableRows = '';

  if (isOprace) {
    tableHeaders = `
      <tr>
        <th width="10%">Дата</th>
        <th width="15%">Тип смены</th>
        <th width="10%">Начало</th>
        <th width="10%">Конец</th>
        <th width="10%">Часы</th>
        <th width="15%">Переработка</th>
        <th width="30%">Заметки</th>
      </tr>
    `;
    tableRows = sortedShifts.map(shift => {
      const d = new Date(shift.startTime);
      const dateStr = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
      
      let typeStr = 'Работа';
      if (shift.type === 'urlop') typeStr = 'Отпуск';
      if (shift.type === 'l4') typeStr = 'Больничный';
      if (shift.isHoliday) typeStr = 'Праздник';

      const startTime = shift.type === 'urlop' || shift.type === 'l4' ? '-' : new Date(shift.startTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
      const endTime = shift.type === 'urlop' || shift.type === 'l4' ? '-' : new Date(shift.endTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
      
      const { overtimeMs } = getShiftDetails({
        durationMs: shift.durationMs, shiftStart: shift.startTime, endTime: shift.endTime,
        isHoliday: shift.isHoliday, shiftType: shift.type || 'standard',
        contractType, hourlyRate, monthlyRate, taxStatus
      });

      return `
        <tr>
          <td>${dateStr}</td>
          <td><strong>${typeStr}</strong></td>
          <td>${startTime}</td>
          <td>${endTime}</td>
          <td><strong>${formatPrintTime(shift.durationMs)}</strong></td>
          <td style="color: ${overtimeMs > 0 ? '#ea580c' : '#374151'}">${overtimeMs > 0 ? formatPrintTime(overtimeMs) : '-'}</td>
          <td class="notes">${shift.note || ''}</td>
        </tr>
      `;
    }).join('');
  } else {
    tableHeaders = `
      <tr>
        <th width="15%">Дата</th>
        <th width="15%">Начало</th>
        <th width="15%">Конец</th>
        <th width="15%">Перерыв</th>
        <th width="15%">Часы работы</th>
        <th width="25%">Заметки</th>
      </tr>
    `;
    tableRows = sortedShifts.map(shift => {
      const d = new Date(shift.startTime);
      const dateStr = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const pauseMin = shift.pauseMs ? Math.round(shift.pauseMs / 60000) + ' мин' : '-';
      return `
        <tr>
          <td>${dateStr}</td>
          <td>${new Date(shift.startTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</td>
          <td>${new Date(shift.endTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</td>
          <td>${pauseMin}</td>
          <td><strong>${formatPrintTime(shift.durationMs)}</strong></td>
          <td class="notes">${shift.note || ''}</td>
        </tr>
      `;
    }).join('');
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Отчет - ${monthData.label}</title>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
          color: #1f2937; 
          padding: 40px; 
          font-size: 13px; 
          background: #fff;
        }
        .header { 
          margin-bottom: 40px; 
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 15px;
        }
        .header h1 { 
          margin: 0 0 5px 0; 
          font-size: 24px; 
          font-weight: 700;
          color: #111827;
        }
        .header h2 { 
          margin: 0; 
          font-size: 16px; 
          font-weight: 500;
          color: #6b7280; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 30px; 
        }
        th, td { 
          border-bottom: 1px solid #e5e7eb; 
          padding: 12px 10px; 
          text-align: center; 
        }
        th { 
          background-color: #f9fafb; 
          font-weight: 600; 
          text-transform: uppercase; 
          font-size: 11px; 
          color: #4b5563; 
          letter-spacing: 0.05em;
        }
        tr:nth-child(even) {
          background-color: #fcfcfc;
        }
        .notes { 
          text-align: left; 
          font-size: 12px; 
          color: #4b5563;
        }
        .summary { 
          background-color: #f3f4f6;
          padding: 20px;
          border-radius: 8px;
          margin-top: 30px;
          display: inline-block;
          min-width: 300px;
        }
        .summary-block { 
          margin-bottom: 8px; 
          font-size: 15px; 
          color: #374151;
        }
        .summary-block:last-child {
          margin-bottom: 0;
        }
        .summary-block strong {
          color: #111827;
          font-size: 16px;
          margin-left: 10px;
        }
        @media print {
          body { padding: 0; background: transparent; }
          .summary { border: 1px solid #e5e7eb; background: transparent; }
          @page { margin: 1.5cm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <h2>Месяц: ${monthData.label}</h2>
      </div>
      <table>
        <thead>${tableHeaders}</thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="summary">
        <div class="summary-block">Итого часов работы: <strong>${formatPrintTime(monthData.totalDuration)}</strong></div>
        ${isOprace && monthData.overtimeMs > 0 ? `<div class="summary-block">Из них переработки: <strong>${formatPrintTime(monthData.overtimeMs)}</strong></div>` : ''}
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 250);
  } else {
    alert("Пожалуйста, разрешите всплывающие окна для этого сайта, чтобы сгенерировать PDF.");
  }
}