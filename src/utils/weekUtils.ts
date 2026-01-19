import { Timestamp } from 'firebase/firestore';

export const MS_PER_DAY = 86400000;
export const MS_PER_WEEK = 7 * MS_PER_DAY;

/**
 * Returns the Monday 00:00:00.000 LOCAL time of the week containing the given date
 * Helper: getWeekStartMonday - ensures Monday at 00:00:00 local time
 */
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0); // Set to 00:00:00.000 LOCAL time
  return monday;
}

/**
 * Alias for startOfWeekMonday - returns Monday 00:00:00 LOCAL time
 */
export function getWeekStartMonday(date: Date): Date {
  return startOfWeekMonday(date);
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
 * Helper: getWeekEndSunday - returns Sunday date for display (or end of day)
 */
export function getWeekEndSunday(date: Date): Date {
  const monday = getWeekStartMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6); // Add 6 days to get Sunday
  sunday.setHours(23, 59, 59, 999); // End of day
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
 * Uses calendar-safe UTC date-only calculation to avoid DST issues
 */
export function weeksBetweenMondays(aMonday: Date, bMonday: Date): number {
  // Normalize both to Monday 00:00:00 local
  const a = getWeekStartMonday(aMonday);
  const b = getWeekStartMonday(bMonday);
  
  // Use UTC date-only to avoid DST issues
  const aUTC = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bUTC = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  
  const diffMs = bUTC - aUTC;
  const diffDays = Math.floor(diffMs / MS_PER_DAY);
  const weeksElapsed = Math.floor(diffDays / 7);
  
  return weeksElapsed;
}

/**
 * Computes the rotation index for a specific week using calendar-safe calculation
 * This function avoids DST issues by using UTC date-only calculations
 * 
 * @param scheduleStartMonday - Monday 00:00:00 local of the schedule start
 * @param weekStartMonday - Monday 00:00:00 local of the target week
 * @param cycleLength - Number of weeks in the rotation cycle
 * @returns Rotation index (0 to cycleLength-1)
 */
export function getRotationIndexForWeek(
  scheduleStartMonday: Date,
  weekStartMonday: Date,
  cycleLength: number
): number {
  // Normalize both dates to Monday 00:00:00 local
  const scheduleMonday = getWeekStartMonday(scheduleStartMonday);
  const targetMonday = getWeekStartMonday(weekStartMonday);
  
  // Use UTC date-only to avoid DST issues
  const scheduleUTC = Date.UTC(scheduleMonday.getFullYear(), scheduleMonday.getMonth(), scheduleMonday.getDate());
  const targetUTC = Date.UTC(targetMonday.getFullYear(), targetMonday.getMonth(), targetMonday.getDate());
  
  const diffMs = targetUTC - scheduleUTC;
  const diffDays = Math.floor(diffMs / MS_PER_DAY);
  const weeksElapsed = Math.floor(diffDays / 7);
  
  // Calculate rotation index with safe negative handling
  const rotationIndex = ((weeksElapsed % cycleLength) + cycleLength) % cycleLength;
  
  return rotationIndex;
}

/**
 * Computes the rotation week based on schedule start date and cycle length
 * Uses normalized Monday 00:00:00 dates for accurate week calculations
 * Now uses calendar-safe getRotationIndexForWeek internally
 */
export function getRotationWeek(
  scheduleStartDate: Date,
  targetDate: Date,
  cycleLength: number
): {
  rotationWeek: number;
  rotationIndex: number;
  weeksElapsed: number;
} {
  // Normalize both dates to Monday 00:00:00 LOCAL time
  const scheduleMonday = getWeekStartMonday(scheduleStartDate);
  const targetWeekMonday = getWeekStartMonday(targetDate);
  
  // Use calendar-safe calculation
  const rotationIndex = getRotationIndexForWeek(scheduleMonday, targetWeekMonday, cycleLength);
  
  // Calculate weeksElapsed using calendar-safe method
  const weeksElapsed = weeksBetweenMondays(scheduleMonday, targetWeekMonday);
  
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

