import { Timestamp } from 'firebase/firestore';

export const MS_PER_DAY = 86400000;
export const MS_PER_WEEK = 7 * MS_PER_DAY;

/**
 * Returns the Monday 00:00:00.000 of the week containing the given date
 */
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Returns the Sunday 23:59:59.999 of the week containing the given date
 * (based on Monday start)
 */
export function endOfWeekSunday(date: Date): Date {
  const monday = startOfWeekMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6); // Add 6 days to get Sunday
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

/**
 * Formats a date as "Jan 5" using Intl.DateTimeFormat
 */
export function formatShortDate(d: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Formats a week range from Monday to Sunday
 */
export function formatWeekRange(monday: Date): {
  fromLabel: string;
  toLabel: string;
  fromDate: Date;
  toDate: Date;
} {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return {
    fromLabel: formatShortDate(monday),
    toLabel: formatShortDate(sunday),
    fromDate: monday,
    toDate: sunday,
  };
}

/**
 * Returns the integer number of weeks between two Monday-midnight dates
 */
export function weeksBetweenMondays(aMonday: Date, bMonday: Date): number {
  const diffMs = bMonday.getTime() - aMonday.getTime();
  return Math.floor(diffMs / MS_PER_WEEK);
}

/**
 * Computes the rotation week based on schedule start date and cycle length
 */
export function getRotationWeek(
  scheduleStartDate: Date,
  today: Date,
  cycleLength: number
): {
  rotationWeek: number;
  rotationIndex: number;
  weeksElapsed: number;
} {
  const scheduleMonday = startOfWeekMonday(scheduleStartDate);
  const todayMonday = startOfWeekMonday(today);
  
  const weeksElapsed = weeksBetweenMondays(scheduleMonday, todayMonday);
  const rotationIndex = weeksElapsed % cycleLength;
  const rotationWeek = rotationIndex + 1;
  
  return {
    rotationWeek,
    rotationIndex,
    weeksElapsed,
  };
}

/**
 * Converts Firestore Timestamp to Date, handling null/undefined
 */
export function timestampToDate(timestamp: Timestamp | null | undefined): Date | null {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return timestamp.toDate();
  }
  // Fallback for serverTimestamp() placeholders
  return new Date();
}

/**
 * Gets all Monday week starts that intersect a given month (calendar-accurate, Monday-start)
 * Algorithm: Include all weeks from firstWeekMonday to lastWeekMonday (inclusive)
 */
export function getWeeksForMonth(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0); // Last day of month
  
  const firstWeekMonday = startOfWeekMonday(firstOfMonth);
  const lastWeekMonday = startOfWeekMonday(lastOfMonth);
  
  const weeks: Date[] = [];
  let currentMonday = new Date(firstWeekMonday);
  
  // Include all weeks from firstWeekMonday to lastWeekMonday (inclusive)
  // This matches standard calendar rows - all weeks that intersect the month
  while (currentMonday <= lastWeekMonday) {
    weeks.push(new Date(currentMonday));
    // Move to next Monday
    currentMonday = new Date(currentMonday);
    currentMonday.setDate(currentMonday.getDate() + 7);
  }
  
  return weeks;
}

