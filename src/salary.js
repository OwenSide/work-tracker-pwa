// src/salary.js

export function getWorkingHoursInMonth(dateString) {
  const startD = new Date(dateString);
  const year = startD.getFullYear();
  const month = startD.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  let workDays = 0;
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i).getDay();
    if (d !== 0 && d !== 6) workDays++;
  }
  return workDays * 8;
}

export function calculateMonthlyNetto(brutto, taxStatus) {
  const bruttoNum = parseFloat(brutto) || 0;
  if (bruttoNum <= 0) return 0;

  const zus = bruttoNum * 0.1371;
  const baseAfterZus = bruttoNum - zus;
  const zdrowotne = baseAfterZus * 0.09;

  let zaliczkaPit = 0;
  if (taxStatus === 'standard') {
    const kup = 250; 
    let podstawa = Math.round(baseAfterZus - kup);
    if (podstawa < 0) podstawa = 0;

    let pit = (podstawa * 0.12) - 300;
    if (pit < 0) pit = 0;
    
    zaliczkaPit = Math.round(pit);
  }

  return bruttoNum - zus - zdrowotne - zaliczkaPit;
}

export function getShiftDetails({ durationMs, shiftStart, isHoliday, contractType, hourlyRate, monthlyRate, taxStatus }) {
  const hoursElapsed = durationMs / 3600000;
  let nettoHour = 0;

  if (contractType === 'zlecenie') {
    nettoHour = parseFloat(hourlyRate) || 0;
  } else if (contractType === 'oprace') {
    const monthlyNetto = calculateMonthlyNetto(monthlyRate, taxStatus);
    const workHoursInMonth = getWorkingHoursInMonth(shiftStart);
    nettoHour = workHoursInMonth > 0 ? monthlyNetto / workHoursInMonth : 0;
  }

  let earned = 0;
  let isHolidayStatus = false;
  let isWeekendStatus = false;
  let isOvertime = false;
  let overtimeMs = 0;

  if (contractType === 'oprace') {
    const shiftDate = new Date(shiftStart);
    // 0 - Воскресенье, 6 - Суббота
    const isWeekend = shiftDate.getDay() === 0 || shiftDate.getDay() === 6;
    // const isWeekend = false;
    
    // Приоритет надбавок: Праздник (вручную) -> Выходной (авто) -> Переработка
    if (isHoliday) {
      isHolidayStatus = true;
      earned = hoursElapsed * (nettoHour * 2);
      overtimeMs = durationMs; 
    } else if (isWeekend) {
      isWeekendStatus = true;
      earned = hoursElapsed * (nettoHour * 2);
      overtimeMs = durationMs; 
    } else {
      if (hoursElapsed > 8) {
        isOvertime = true;
        earned = (8 * nettoHour) + ((hoursElapsed - 8) * (nettoHour * 1.5)); 
        overtimeMs = durationMs - (8 * 3600000);
      } else {
        earned = hoursElapsed * nettoHour;
      }
    }
  } else {
    earned = hoursElapsed * nettoHour;
  }

  // Возвращаем разделенные статусы
  return { earned, isHoliday: isHolidayStatus, isWeekend: isWeekendStatus, isOvertime, overtimeMs, nettoHour };
}