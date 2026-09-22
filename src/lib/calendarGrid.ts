export interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
}

export function getMonthGrid(year: number, month: number): CalendarDay[][] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Montag = 0
  const gridStart = new Date(year, month, 1 - startOffset);

  const weeks: CalendarDay[][] = [];
  const cursor = new Date(gridStart);

  for (let w = 0; w < 6; w++) {
    const week: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      week.push({ date: new Date(cursor), inCurrentMonth: cursor.getMonth() === month });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (cursor.getMonth() !== month && w >= 3) break;
  }

  return weeks;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
