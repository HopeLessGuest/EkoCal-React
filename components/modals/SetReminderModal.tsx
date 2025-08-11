
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Event } from '../../lib/types';
import { formatDateForInput, parseInputDate, formatDateToYMD } from '../../lib/dateUtils';
import { DatePickerPopup } from '../common/DatePickerPopup';
import { TimePicker } from '../TimePicker';

export const SetReminderModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSetReminder: (dateTime: string) => void;
  event: Event | null;
  selectedDate: Date;
}> = ({ isOpen, onClose, onSetReminder, event, selectedDate }) => {
    const { t } = useLanguage();
    const [date, setDate] = useState(formatDateForInput(selectedDate));
    const [time, setTime] = useState('09:00'); // HH:mm format
    const [error, setError] = useState<string|null>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    useEffect(() => {
        if (isOpen && event) {
            setError(null);
            setIsPickerOpen(false);
            if (event.eventReminder) {
                const reminder = new Date(event.eventReminder);
                setDate(formatDateForInput(reminder));
                const hours = reminder.getHours().toString().padStart(2, '0');
                const minutes = reminder.getMinutes().toString().padStart(2, '0');
                setTime(`${hours}:${minutes}`);
            } else {
                // Default to the event's first time range's start date
                if (event.eventTimeRanges && event.eventTimeRanges.length > 0) {
                    setDate(event.eventTimeRanges[0].timeRangeStart.replace(/-/g, '/'));
                } else {
                    setDate(formatDateForInput(selectedDate));
                }
                setTime('09:00');
            }
        }
    }, [isOpen, event, selectedDate]);

    if (!isOpen || !event) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const parsedDate = parseInputDate(date);
        if (!parsedDate) {
            setError(t('errorInvalidDate'));
            return;
        }
        if (!/^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/.test(time)) {
             setError(t('errorInvalidTime'));
             return;
        }
        
        const combinedDateTime = `${formatDateToYMD(parsedDate)}T${time}:00`;
        onSetReminder(combinedDateTime);
        onClose();
    };

    return (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity" 
          onClick={onClose}
          aria-modal="true"
          role="dialog"
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 w-full max-w-sm mx-4" 
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-2">
                    {t('setReminderTitle')}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 truncate">
                   {t('reminderFor')}: "{event.eventTitle}"
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <label htmlFor="reminder-date" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                            {t('date')}
                        </label>
                        <input
                            id="reminder-date"
                            type="text"
                            placeholder="YYYY/MM/DD"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            onFocus={() => setIsPickerOpen(true)}
                            className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"
                        />
                        {isPickerOpen && (
                          <DatePickerPopup
                            initialDate={parseInputDate(date) || selectedDate}
                            onSelectDate={(newDate) => {
                              setDate(formatDateForInput(newDate));
                              setIsPickerOpen(false);
                            }}
                            onClose={() => setIsPickerOpen(false)}
                          />
                        )}
                    </div>
                    <div>
                        <label htmlFor="reminder-time-manual" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                            {t('time')}
                        </label>
                        <input
                            id="reminder-time-manual"
                            type="text"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            placeholder="HH:mm"
                            className="w-full p-2 mb-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200 [font-variant-numeric:tabular-nums]"
                        />
                        <TimePicker value={time} onChange={setTime} />
                    </div>
                    {error && (
                      <div className="text-center text-sm text-red-500" role="alert">
                        {error}
                      </div>
                    )}
                    <div className="mt-6 flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="p-2 px-4 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-slate-500">
                            {t('cancel')}
                        </button>
                        <button type="submit" className="p-2 px-4 rounded-full text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-blue-500">
                            {t('setReminder')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};