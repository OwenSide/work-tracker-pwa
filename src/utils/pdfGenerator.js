import { getShiftDetails } from '../utils/salary';
import i18n from '../i18n'; // Импортируем i18n напрямую!

// Вспомогательная функция для красивого формата времени (ЧЧ:ММ)
const formatPrintTime = (ms) => {
  const totalSeconds = Math.floor(Math.max(0, Number(ms) || 0) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export function generatePDFReport({ monthData, contractType, hourlyRate, monthlyRate, taxStatus }) {
  const t = i18n.t.bind(i18n); // Получаем функцию перевода
  const lng = i18n.language || 'ru-RU'; // Получаем текущий язык для дат

  const isOprace = contractType === 'oprace';
  const title = isOprace ? t('pdf.titleOprace') : t('pdf.titleZlecenie');
  
  // Сортируем смены от начала месяца к концу
  const sortedShifts = [...monthData.shifts].sort((a, b) => a.startTime - b.startTime);

  let tableHeaders = '';
  let tableRows = '';

  if (isOprace) {
    tableHeaders = `
      <tr>
        <th width="10%">${t('pdf.date')}</th>
        <th width="15%">${t('pdf.shiftType')}</th>
        <th width="10%">${t('pdf.start')}</th>
        <th width="10%">${t('pdf.end')}</th>
        <th width="10%">${t('pdf.hours')}</th>
        <th width="15%">${t('pdf.overtime')}</th>
        <th width="30%">${t('pdf.notes')}</th>
      </tr>
    `;
    tableRows = sortedShifts.map(shift => {
      const d = new Date(shift.startTime);
      const dateStr = d.toLocaleDateString(lng, { day: '2-digit', month: '2-digit', year: 'numeric' });
      
      let typeStr = t('pdf.typeWork');
      if (shift.type === 'urlop') typeStr = t('pdf.typeVacation');
      if (shift.type === 'l4') typeStr = t('pdf.typeSick');
      if (shift.isHoliday) typeStr = t('pdf.typeHoliday');

      const startTime = shift.type === 'urlop' || shift.type === 'l4' ? '-' : new Date(shift.startTime).toLocaleTimeString(lng, {hour: '2-digit', minute:'2-digit'});
      const endTime = shift.type === 'urlop' || shift.type === 'l4' ? '-' : new Date(shift.endTime).toLocaleTimeString(lng, {hour: '2-digit', minute:'2-digit'});
      
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
        <th width="15%">${t('pdf.date')}</th>
        <th width="15%">${t('pdf.start')}</th>
        <th width="15%">${t('pdf.end')}</th>
        <th width="15%">${t('pdf.break')}</th>
        <th width="15%">${t('pdf.workHours')}</th>
        <th width="25%">${t('pdf.notes')}</th>
      </tr>
    `;
    tableRows = sortedShifts.map(shift => {
      const d = new Date(shift.startTime);
      const dateStr = d.toLocaleDateString(lng, { day: '2-digit', month: '2-digit', year: 'numeric' });
      const pauseMin = shift.pauseMs ? Math.round(shift.pauseMs / 60000) + ' ' + t('pdf.minutes') : '-';
      return `
        <tr>
          <td>${dateStr}</td>
          <td>${new Date(shift.startTime).toLocaleTimeString(lng, {hour: '2-digit', minute:'2-digit'})}</td>
          <td>${new Date(shift.endTime).toLocaleTimeString(lng, {hour: '2-digit', minute:'2-digit'})}</td>
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
      <title>${t('pdf.report')} - ${monthData.label}</title>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
          color: #1f2937; 
          padding: 40px; 
          font-size: 13px; 
          background: #fff;
        }
        .no-print-btn {
          display: inline-block;
          margin-bottom: 25px;
          padding: 10px 20px;
          background-color: #ef4444;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .no-print-btn:active {
          background-color: #dc2626;
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
          .no-print-btn { display: none !important; }
          @page { margin: 1.5cm; }
        }
      </style>
    </head>
    <body>
      <button class="no-print-btn" onclick="window.close()">${t('pdf.close')}</button>
      
      <div class="header">
        <h1>${title}</h1>
        <h2>${t('pdf.month')}: ${monthData.label}</h2>
      </div>
      <table>
        <thead>${tableHeaders}</thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="summary">
        <div class="summary-block">${t('pdf.totalHours')} <strong>${formatPrintTime(monthData.totalDuration)}</strong></div>
        ${isOprace && monthData.overtimeMs > 0 ? `<div class="summary-block">${t('pdf.ofWhichOvertime')} <strong>${formatPrintTime(monthData.overtimeMs)}</strong></div>` : ''}
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
    alert(t('pdf.popupWarning'));
  }
}