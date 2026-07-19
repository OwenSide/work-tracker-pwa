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

// Новая функция: Высчитывает миллисекунды, попавшие в промежуток 22:00 - 06:00
export function getNightHoursMs(startMs, endMs) {
  let nightMs = 0;
  const s = new Date(startMs);
  
  const checkNight = (baseDate) => {
    const nightStart = new Date(baseDate);
    nightStart.setHours(22, 0, 0, 0);
    const nightEnd = new Date(baseDate);
    nightEnd.setDate(nightEnd.getDate() + 1);
    nightEnd.setHours(6, 0, 0, 0);
    
    const overlapStart = Math.max(startMs, nightStart.getTime());
    const overlapEnd = Math.min(endMs, nightEnd.getTime());
    
    if (overlapEnd > overlapStart) nightMs += (overlapEnd - overlapStart);
  };

  // Проверяем две ночи (если смена началась вечером сегодня, или если началась в 2 ночи прошлого дня)
  checkNight(new Date(s.getFullYear(), s.getMonth(), s.getDate()));
  checkNight(new Date(s.getFullYear(), s.getMonth(), s.getDate() - 1));

  return nightMs;
}

export function getShiftDetails({ durationMs, shiftStart, endTime, isHoliday, shiftType = 'standard', contractType, hourlyRate, monthlyRate, taxStatus }) {
  let nettoHour = 0;

  if (contractType === 'zlecenie') {
    nettoHour = parseFloat(hourlyRate) || 0;
  } else if (contractType === 'oprace') {
    const monthlyNetto = calculateMonthlyNetto(monthlyRate, taxStatus);
    const workHoursInMonth = getWorkingHoursInMonth(shiftStart);
    nettoHour = workHoursInMonth > 0 ? monthlyNetto / workHoursInMonth : 0;
  }

  // ОБРАБОТКА ОТПУСКА И БОЛЬНИЧНОГО
  if (shiftType === 'urlop') {
    // Отпуск: 8 часов по 100% ставке
    return { earned: 8 * nettoHour, isHoliday: false, isWeekend: false, isOvertime: false, overtimeMs: 0, nightMs: 0, nettoHour };
  }
  
  if (shiftType === 'l4') {
    // Больничный: 8 часов по 80% ставке (стандарт Польши)
    return { earned: (8 * nettoHour) * 0.8, isHoliday: false, isWeekend: false, isOvertime: false, overtimeMs: 0, nightMs: 0, nettoHour };
  }

  // СТАНДАРТНАЯ РАБОТА
  const hoursElapsed = durationMs / 3600000;
  const actualEnd = endTime || (shiftStart + durationMs);
  
  let earned = 0;
  let isHolidayStatus = false;
  let isWeekendStatus = false;
  let isOvertime = false;
  let overtimeMs = 0;
  let nightMs = 0;
  let nightBonus = 0;

  if (contractType === 'oprace') {
    const shiftDate = new Date(shiftStart);
    const isWeekend = shiftDate.getDay() === 0 || shiftDate.getDay() === 6;
    
    // Считаем ночные часы (доплата +20%)
    nightMs = getNightHoursMs(shiftStart, actualEnd);
    nightBonus = (nightMs / 3600000) * (nettoHour * 0.2);

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

  return { earned: earned + nightBonus, isHoliday: isHolidayStatus, isWeekend: isWeekendStatus, isOvertime, overtimeMs, nightMs, nettoHour };
}