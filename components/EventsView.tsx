
import React, { useMemo } from 'react';
import { Event, EventsStore, RecurrenceFrequency } from '../lib/types';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDateForDisplay, formatReminderForDisplay } from '../lib/dateUtils';
import { AlarmIcon, EllipsisHorizontalIcon, PlusIcon, CalendarIcon } from './Icons';

export const EventsView: React.FC<{
    events: EventsStore;
    onOpenEditModal: (event: Event) => void;
    onOpenReminderModal: (event: Event) => void;
    onOpenAddModal: () => void;
}> = ({ events, onOpenEditModal, onOpenReminderModal, onOpenAddModal }) => {
    const { t, language, weekdaysShort } = useLanguage();

    const sortedEvents = useMemo(() => {
        return Object.values(events).sort((a, b) => {
            const aStartDate = a.eventTimeRanges?.[0]?.timeRangeStart;
            const bStartDate = b.eventTimeRanges?.[0]?.timeRangeStart;

            // Gracefully handle events that might not have a date range
            if (!aStartDate && !bStartDate) return 0;
            if (!aStartDate) return 1; // push a to the end
            if (!bStartDate) return -1; // push b to the end

            // Primary sort: by date, descending (newest first)
            const dateComparison = bStartDate.localeCompare(aStartDate);
            if (dateComparison !== 0) return dateComparison;

            // Secondary sort: by title, ascending, if dates are the same
            return a.eventTitle.localeCompare(b.eventTitle);
        });
    }, [events]);

    const getRecurrenceDescription = (event: Event) => {
        if (!event.eventRecurrenceRule) return null;
        const { ruleFrequency, ruleWeeklyDays, ruleMonthlyDays } = event.eventRecurrenceRule;
        let repeatsOn = '';

        if (ruleFrequency === RecurrenceFrequency.WEEKLY) {
            repeatsOn = ruleWeeklyDays?.map(d => weekdaysShort[d]).join(', ') || '';
            return `${t('repeats')} ${t('weekly')} ${t('repeatOn')} ${repeatsOn}`;
        }
        if (ruleFrequency === RecurrenceFrequency.MONTHLY) {
            const days = ruleMonthlyDays?.join(', ') || '';
            return `${t('repeats')} ${t('monthly')} ${t('monthlyRepeatOn', { days })}`;
        }
        return null;
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 transition-all duration-300 w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('allEvents')}</h2>
                <button onClick={onOpenAddModal} aria-label={t('addEvent')} className="p-2 rounded-full text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-blue-500 transition-all"><PlusIcon className="w-5 h-5" /></button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto -mr-3 pr-3">
                {sortedEvents.length > 0 ? (
                    <ul className="space-y-4">
                        {sortedEvents.map(event => (
                            <li key={event.eventId} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 pr-4">
                                        <p className="font-semibold text-slate-800 dark:text-slate-200">{event.eventTitle}</p>
                                        {event.eventDescription && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 whitespace-pre-wrap line-clamp-4">{event.eventDescription}</p>}
                                    </div>
                                    <div className="flex items-center space-x-1 flex-shrink-0">
                                      <button onClick={() => onOpenReminderModal(event)} aria-label={t('setReminderAria')} className="p-1.5 rounded-full text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900/50 focus:ring-blue-500"><AlarmIcon className="w-5 h-5" /></button>
                                      <button onClick={() => onOpenEditModal(event)} aria-label={t('detailsAria')} className="p-1.5 rounded-full text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900/50 focus:ring-blue-500"><EllipsisHorizontalIcon className="w-5 h-5" /></button>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center">
                                        <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0"/>
                                        <div className="flex flex-col">
                                            {event.eventRecurrenceRule ? (
                                                <>
                                                    <p>{getRecurrenceDescription(event)}</p>
                                                    <p className="text-xs">{t('ends')} {formatDateForDisplay(new Date(event.eventRecurrenceRule.ruleEndDate + 'T00:00:00'), language)}</p>
                                                </>
                                            ) : (
                                                event.eventTimeRanges.map(range => (
                                                    <p key={range.timeRangeId}>
                                                        {formatDateForDisplay(new Date(range.timeRangeStart + 'T00:00:00'), language)}
                                                        {range.timeRangeStart !== range.timeRangeEnd && ` - ${formatDateForDisplay(new Date(range.timeRangeEnd + 'T00:00:00'), language)}`}
                                                    </p>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    {event.eventReminder && (
                                        <div className="flex items-center text-xs pt-1">
                                            <AlarmIcon className="w-4 h-4 mr-2" />
                                            <span>{formatReminderForDisplay(event.eventReminder, t, language)}</span>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center h-60 text-center text-slate-600 dark:text-slate-300 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                        <p className="font-semibold">{t('noEventsCreated')}</p>
                        <p className="text-sm mt-1">{t('addOnePrompt')}</p>
                        <button onClick={onOpenAddModal} className="mt-4 flex items-center space-x-2 p-2 px-4 rounded-full text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-blue-500">
                            <PlusIcon className="w-4 h-4"/>
                            <span>{t('addEvent')}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
