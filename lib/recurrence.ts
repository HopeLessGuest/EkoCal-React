import { Event, RecurrenceFrequency } from './types';
import { formatDateToYMD } from './dateUtils';

/**
 * Generates all occurrences of an event that fall within a given date window.
 * @param event The event object, which may have a recurrence rule.
 * @param viewStart The start date of the window to check for occurrences.
 * @param viewEnd The end date of the window to check for occurrences.
 * @returns An array of occurrence objects, each with a `start` and `end` Date.
 */
export const generateOccurrences = (
  event: Event,
  viewStart: Date,
  viewEnd: Date
): { start: Date; end: Date }[] => {
  if (!event.eventTimeRanges || event.eventTimeRanges.length === 0) {
    return [];
  }
  
  // Handle non-recurring events
  if (!event.eventRecurrenceRule) {
    const occurrences = [];
    for (const range of event.eventTimeRanges) {
      const startDate = new Date(range.timeRangeStart + 'T00:00:00');
      const endDate = new Date(range.timeRangeEnd + 'T00:00:00');
      if (startDate <= viewEnd && endDate >= viewStart) {
        occurrences.push({ start: startDate, end: endDate });
      }
    }
    return occurrences;
  }

  // Handle recurring events
  const anchor = event.eventTimeRanges[0];
  const anchorStartDate = new Date(anchor.timeRangeStart + 'T00:00:00');
  const anchorEndDate = new Date(anchor.timeRangeEnd + 'T00:00:00');

  const occurrences = [];
  const rule = event.eventRecurrenceRule;
  const until = new Date(rule.ruleEndDate + 'T23:59:59');
  
  // The duration of a single occurrence in milliseconds
  const durationMs = anchorEndDate.getTime() - anchorStartDate.getTime();
  if (durationMs < 0) return []; // Invalid event end date

  let cursor = new Date(anchorStartDate);
  
  // To prevent infinite loops, e.g., with invalid rules
  let safetyBreak = 0; 
  const maxIterations = 365 * 5; // Limit to 5 years of occurrences

  while (cursor <= until && safetyBreak < maxIterations) {
    safetyBreak++;

    let isValidOccurrence = false;
    if (rule.ruleFrequency === RecurrenceFrequency.WEEKLY) {
      if (rule.ruleWeeklyDays?.includes(cursor.getDay())) {
        isValidOccurrence = true;
      }
    } else if (rule.ruleFrequency === RecurrenceFrequency.MONTHLY) {
      if (rule.ruleMonthlyDays?.includes(cursor.getDate())) {
        isValidOccurrence = true;
      }
    }

    if (isValidOccurrence) {
      const occurrenceEnd = new Date(cursor.getTime() + durationMs);
      // Add if the occurrence overlaps with the view window
      if (cursor <= viewEnd && occurrenceEnd >= viewStart) {
        occurrences.push({ start: new Date(cursor), end: occurrenceEnd });
      }
    }

    // Move cursor to the next day
    cursor.setDate(cursor.getDate() + 1);
  }

  return occurrences;
};