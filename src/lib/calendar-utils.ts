export function isActiveDay(date: Date, studyDates: string[]): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return studyDates.includes(dateStr);
}

export function isMissedDay(date: Date, studyDates: string[]): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  if (targetDate >= today) return false;
  return !isActiveDay(date, studyDates);
}

export function generateCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  const grid = [];
  
  // Previous month days
  const prevMonthStart = daysInPrevMonth - firstDay + 1;
  for (let i = prevMonthStart; i <= daysInPrevMonth; i++) {
    grid.push({ day: i, monthOffset: -1 });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    grid.push({ day: i, monthOffset: 0 });
  }
  
  // Next month days
  const remaining = 42 - grid.length;
  for (let i = 1; i <= remaining; i++) {
    grid.push({ day: i, monthOffset: 1 });
  }
  
  return grid;
}
