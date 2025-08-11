
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ChevronLeftIcon, ChevronRightIcon } from '../Icons';

// Reusable Date Picker Popup Component
export const DatePickerPopup: React.FC<{
  onSelectDate: (date: Date) => void;
  onClose: () => void;
  initialDate: Date;
}> = ({ onSelectDate, onClose, initialDate }) => {
  const { t, language } = useLanguage();
  const [displayDate, setDisplayDate] = useState(initialDate);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handlePrevMonth = () => setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
  const handleNextMonth = () => setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));
  const handleDayClick = (day: number) => {
    onSelectDate(new Date(displayDate.getFullYear(), displayDate.getMonth(), day));
  };

  const calendarData = useMemo(() => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ key: `pad-${i}`, day: null });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ key: `day-${i}`, day: i });
    }
    return days;
  }, [displayDate]);

  const weekDays = useMemo(() => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map(day => t(day as any).charAt(0)), [t]);

  return (
    <div ref={popupRef} className="absolute top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-3 z-50 border border-slate-200 dark:border-slate-700 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={handlePrevMonth} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><ChevronLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" /></button>
        <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">
          {displayDate.toLocaleDateString(language, { year: 'numeric', month: 'long' })}
        </div>
        <button type="button" onClick={handleNextMonth} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><ChevronRightIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" /></button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
        {weekDays.map(d => <div key={d} className="h-8 flex items-center justify-center">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {calendarData.map(({ key, day }) => (
          <div key={key} className="h-8 flex items-center justify-center">
            {day && (
              <button
                type="button"
                onClick={() => handleDayClick(day)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                  initialDate.getFullYear() === displayDate.getFullYear() &&
                  initialDate.getMonth() === displayDate.getMonth() &&
                  initialDate.getDate() === day
                  ? 'bg-blue-500 text-white font-bold shadow'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
