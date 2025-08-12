// Defines the frequency of a recurring event.
export enum RecurrenceFrequency {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

// Defines a single period of time for an event.
export interface TimeRange {
  timeRangeId: string; // A unique identifier for React keys.
  timeRangeStart: string; // YYYY-MM-DD
  timeRangeEnd: string; // YYYY-MM-DD
}

// Defines a recurrence pattern for an event.
export interface RecurrenceRule {
  ruleFrequency: RecurrenceFrequency;
  // For WEEKLY: An array of day indices (0=Sun, 1=Mon, ..., 6=Sat)
  ruleWeeklyDays?: number[]; 
  // For MONTHLY: The days of the month (1-31)
  ruleMonthlyDays?: number[]; 
  // The date (YYYY-MM-DD) when the recurrence ends.
  ruleEndDate: string; 
}

// A single, authoritative interface for an event.
export interface Event {
  eventId: string;
  eventTitle: string;
  eventDescription: string;
  
  // For one-time events, this can be multiple distinct time ranges.
  // For recurring events, only the first range is used to define the duration of one occurrence.
  eventTimeRanges: TimeRange[];
  
  eventRecurrenceRule?: RecurrenceRule;
  eventReminder?: string;
}

// The main state for storing all events, indexed by their unique ID.
export interface EventsStore {
  [eventId: string]: Event;
}

// Data Transfer Object for creating or updating an event.
export interface EventPayload {
  eventId?: string;
  eventTitle: string;
  eventDescription: string;
  eventTimeRanges: TimeRange[];
  eventRecurrenceRule?: RecurrenceRule | null;
}

export enum NotificationMethod {
    NONE = 'NONE',
    WECOM = 'WECOM',
}

export interface Settings {
    notificationMethod: NotificationMethod;
    notificationRobotUrl: string;
}
