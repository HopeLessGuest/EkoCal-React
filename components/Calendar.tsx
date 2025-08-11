
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, AlarmIcon, EllipsisHorizontalIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { Event, EventsStore } from '../lib/types';
import { formatDateToYMD, formatDateForDisplay, formatReminderForDisplay } from '../lib/dateUtils';
import { generateOccurrences } from '../lib/recurrence';

export const Calendar: React.FC<{
  events: EventsStore;
  onOpenAddModal: (date: Date) => void;
  onOpenEditModal: (event: Event) => void;
  onOpenReminderModal: (event: Event) => void;
}> = ({ events, onOpenAddModal, onOpenEditModal, onOpenReminderModal }) => {
  const { language, t, weekdaysShort } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const lastSelectedDateStr = useRef<string>('');

  const handlePrevMonth = () => {
    setSelectedDate(null);
    setTimeout(() => {
      setCurrentDate(prevDate => {
        const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1);
        setSelectedDate(newDate);
        return newDate;
      });
    }, 50);
  };

  const handleNextMonth = () => {
    setSelectedDate(null);
    setTimeout(() => {
      setCurrentDate(prevDate => {
        const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1);
        setSelectedDate(newDate);
        return newDate;
      });
    }, 50);
  };

  const handleGoToToday = () => {
    const today = new Date();
    const isDifferentMonth = today.getFullYear() !== currentDate.getFullYear() || today.getMonth() !== currentDate.getMonth();

    if (isDifferentMonth) {
      setSelectedDate(null);
      setTimeout(() => {
        setCurrentDate(today);
        setSelectedDate(today);
      }, 50);
    } else {
      setSelectedDate(today);
    }
  }

  const handleDateClick = (day: number) => {
    const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newSelectedDate);
  };

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDateOfCurrentMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstDateOfCurrentMonth.getDay(); // 0 for Sunday

    const gridStartDate = new Date(firstDateOfCurrentMonth);
    gridStartDate.setDate(gridStartDate.getDate() - firstDayOfWeek);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    const tempDate = new Date(gridStartDate);

    for (let i = 0; i < 42; i++) { // 6 rows * 7 days = 42 cells
      days.push({
        key: `day-cell-${formatDateToYMD(tempDate)}`,
        date: new Date(tempDate),
        day: tempDate.getDate(),
        isCurrentMonth: tempDate.getMonth() === month,
        isToday: tempDate.getTime() === today.getTime(),
      });
      tempDate.setDate(tempDate.getDate() + 1);
    }

    return days;
  }, [currentDate]);

  const visibleOccurrences = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    
    const gridStart = new Date(firstDayOfMonth);
    gridStart.setDate(gridStart.getDate() - firstDayOfMonth.getDay());

    const gridEnd = new Date(gridStart);
    gridEnd.setDate(gridEnd.getDate() + 41); // 42 days in the grid

    return Object.values(events).flatMap(event => 
      generateOccurrences(event, gridStart, gridEnd).map(occurrence => ({
          ...occurrence, // { start: Date, end: Date }
          event,         // The full Event object
      }))
    );
  }, [events, currentDate]);
  
  const eventDates = useMemo(() => {
    const datesWithEvents = new Set<string>();
    visibleOccurrences.forEach(({ start, end }) => {
        let loopDate = new Date(start);
        // Ensure loop doesn't go on forever
        let safety = 0;
        while (loopDate <= end && safety < 366) {
            datesWithEvents.add(formatDateToYMD(loopDate));
            loopDate.setDate(loopDate.getDate() + 1);
            safety++;
        }
    });
    return datesWithEvents;
  }, [visibleOccurrences]);

  const dayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const selectedYMD = formatDateToYMD(selectedDate);

    const eventIdsOnDay = new Set<string>();
    
    visibleOccurrences
        .filter(({ start, end }) => {
            const startYMD = formatDateToYMD(start);
            const endYMD = formatDateToYMD(end);
            return selectedYMD >= startYMD && selectedYMD <= endYMD;
        })
        .forEach(({ event }) => eventIdsOnDay.add(event.eventId));

    return Array.from(eventIdsOnDay)
        .map(id => events[id])
        .filter(Boolean) // Make sure event exists
        .sort((a, b) => a.eventTitle.localeCompare(b.eventTitle));
  }, [visibleOccurrences, selectedDate, events]);
  
  if (selectedDate) {
    lastSelectedDateStr.current = `${t('eventsFor')} ${formatDateForDisplay(selectedDate, language)}`;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{currentDate.toLocaleDateString(language, { year: 'numeric', month: 'long' })}</h2>
        <div className="flex items-center space-x-1">
          <button onClick={handleGoToToday} className="p-2 px-4 rounded-full text-sm font-semibold text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all">{t('today')}</button>
          <button onClick={handlePrevMonth} aria-label={t('prevMonth')} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"><ChevronLeftIcon className="w-5 h-5" /></button>
          <button onClick={handleNextMonth} aria-label={t('nextMonth')} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"><ChevronRightIcon className="w-5 h-5" /></button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-y-2 text-center">
        {weekdaysShort.map(day => (<div key={day} className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{day}</div>))}
      </div>
      
      <div className="grid grid-cols-7 grid-rows-6 gap-2 mt-4">
        {calendarData.map(({ key, date, day, isCurrentMonth, isToday }) => {
          const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
          const hasEvent = eventDates.has(formatDateToYMD(date));

          return (
            <div
              key={key}
              onClick={() => isCurrentMonth && handleDateClick(day)}
              className={`relative flex items-center justify-center h-10 w-10 rounded-full text-sm transition-all duration-200 ${
                  !isCurrentMonth
                      ? 'text-slate-300 dark:text-slate-600'
                      : `cursor-pointer ${
                          isToday
                              ? 'bg-blue-500 text-white font-bold shadow-md hover:bg-blue-600'
                              : isSelected
                              ? 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`
              }`}
            >
              {day}
              {isCurrentMonth && hasEvent && (
                  <span className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${
                      isToday ? 'bg-white' : isSelected ? 'bg-slate-800 dark:bg-slate-100' : 'bg-blue-500'
                  }`}></span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-lg text-slate-800 dark:text-white">{lastSelectedDateStr.current}</h3>
          <button onClick={() => onOpenAddModal(selectedDate || new Date())} aria-label={t('addEvent')} className="p-2 rounded-full text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-blue-500 transition-all"><PlusIcon className="w-5 h-5" /></button>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg min-h-[120px] max-h-60 overflow-y-auto">
          {dayEvents.length > 0 ? (
            <ul className="space-y-3">
              {dayEvents.map((event) => (
                <li key={event.eventId} className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-4 flex-1">{event.eventTitle}</p>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button onClick={() => onOpenReminderModal(event)} aria-label={t('setReminderAria')} className="p-1.5 rounded-full text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-blue-500"><AlarmIcon className="w-5 h-5" /></button>
                      <button onClick={() => onOpenEditModal(event)} aria-label={t('detailsAria')} className="p-1.5 rounded-full text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-blue-500"><EllipsisHorizontalIcon className="w-5 h-5" /></button>
                    </div>
                  </div>
                  {event.eventDescription && (<p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-3">{event.eventDescription}</p>)}
                  {event.eventReminder && (<div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700"><AlarmIcon className="w-4 h-4 mr-1.5" /><span>{formatReminderForDisplay(event.eventReminder, t, language)}</span></div>)}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-600 dark:text-slate-300"><p>{t('noEvents')}</p></div>
          )}
        </div>
      </div>
    </div>
  );
};
