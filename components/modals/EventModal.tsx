import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Event, EventPayload, RecurrenceRule, RecurrenceFrequency, TimeRange } from '../../lib/types';
import { formatDateForInput, parseInputDate, formatDateToYMD } from '../../lib/dateUtils';
import { DatePickerPopup } from '../common/DatePickerPopup';
import { TrashIcon, PlusCircleIcon } from '../Icons';

type ScheduleType = 'one-time' | 'recurring';

export const EventModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: EventPayload) => void;
  onRequestDelete: (eventId: string) => void;
  mode: 'add' | 'edit';
  eventData?: Event;
  selectedDate: Date;
  recentEvents: Event[];
}> = ({ isOpen, onClose, onSave, onRequestDelete, mode, eventData, selectedDate, recentEvents }) => {
  const { t, weekdaysShort } = useLanguage();
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventTimeRanges, setEventTimeRanges] = useState<TimeRange[]>([
      { timeRangeId: Date.now().toString(), timeRangeStart: '', timeRangeEnd: '' }
  ]);
  const [scheduleType, setScheduleType] = useState<ScheduleType>('one-time');
  const [recurrenceProperties, setRecurrenceProperties] = useState<Omit<RecurrenceRule, 'ruleEndDate'>>({
    ruleFrequency: RecurrenceFrequency.WEEKLY,
    ruleWeeklyDays: [],
    ruleMonthlyDays: [],
  });
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [monthlyDaysInput, setMonthlyDaysInput] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [invalidRangeIds, setInvalidRangeIds] = useState<Set<string>>(new Set());
  const [activePicker, setActivePicker] = useState<{ rangeId: string; type: 'start' | 'end' | 'recurrenceEnd' } | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const suggestionsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setInvalidRangeIds(new Set());
      setActivePicker(null);
      setIsSuggestionsOpen(false);
      const initialDateStr = formatDateForInput(selectedDate);

      if (mode === 'edit' && eventData) {
        setEventTitle(eventData.eventTitle);
        setEventDescription(eventData.eventDescription);

        if (eventData.eventRecurrenceRule) {
          setScheduleType('recurring');
          const { ruleEndDate, ...restOfRule } = eventData.eventRecurrenceRule;
          setRecurrenceProperties({
              ...restOfRule,
              ruleWeeklyDays: restOfRule.ruleWeeklyDays || [],
              ruleMonthlyDays: restOfRule.ruleMonthlyDays || [],
          });
          setMonthlyDaysInput(restOfRule.ruleMonthlyDays?.join(', ') || '');
          setRecurrenceEndDate(ruleEndDate.replace(/-/g, '/'));
          setEventTimeRanges(eventData.eventTimeRanges.map(dr => ({ ...dr, timeRangeStart: dr.timeRangeStart.replace(/-/g, '/'), timeRangeEnd: dr.timeRangeEnd.replace(/-/g, '/') })));
        } else {
          setScheduleType('one-time');
          setEventTimeRanges(eventData.eventTimeRanges.map(dr => ({ ...dr, timeRangeStart: dr.timeRangeStart.replace(/-/g, '/'), timeRangeEnd: dr.timeRangeEnd.replace(/-/g, '/') })));
          setRecurrenceProperties({
            ruleFrequency: RecurrenceFrequency.WEEKLY,
            ruleWeeklyDays: [],
            ruleMonthlyDays: [],
          });
          setMonthlyDaysInput('');
          setRecurrenceEndDate('');
        }
      } else { // Add mode
        setEventTitle('');
        setEventDescription('');
        setEventTimeRanges([{ timeRangeId: Date.now().toString(), timeRangeStart: initialDateStr, timeRangeEnd: initialDateStr }]);
        setScheduleType('one-time');
        setRecurrenceProperties({
            ruleFrequency: RecurrenceFrequency.WEEKLY,
            ruleWeeklyDays: [],
            ruleMonthlyDays: [],
        });
        setMonthlyDaysInput('');
        const oneMonthLater = new Date(selectedDate);
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
        setRecurrenceEndDate(formatDateForInput(oneMonthLater));
      }
    }
  }, [isOpen, mode, eventData, selectedDate]);
  
  useEffect(() => {
    if (!isSuggestionsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsContainerRef.current && !suggestionsContainerRef.current.contains(e.target as Node) && titleInputRef.current && !titleInputRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSuggestionsOpen]);
  
  const handleScheduleTypeChange = (newType: ScheduleType) => {
    setScheduleType(newType);

    if (newType === 'recurring') {
        const anchorStartDateStr = eventTimeRanges[0]?.timeRangeStart || formatDateForInput(selectedDate);

        setEventTimeRanges([{
            timeRangeId: eventTimeRanges[0]?.timeRangeId || Date.now().toString(),
            timeRangeStart: anchorStartDateStr,
            timeRangeEnd: anchorStartDateStr
        }]);
        
        const anchorStartDate = parseInputDate(anchorStartDateStr);
        const recurrenceEndDateValue = parseInputDate(recurrenceEndDate);
        
        if (anchorStartDate && (!recurrenceEndDateValue || recurrenceEndDateValue <= anchorStartDate)) {
            const oneMonthLater = new Date(anchorStartDate);
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
            setRecurrenceEndDate(formatDateForInput(oneMonthLater));
        }
    }
  };

  if (!isOpen) return null;

  const handleSuggestionClick = (event: Event) => {
    setEventTitle(event.eventTitle);
    setEventDescription(event.eventDescription);
    setIsSuggestionsOpen(false);
  };
  
  const handleToggleWeekday = (dayIndex: number) => {
    setRecurrenceProperties(prev => {
        const byDay = prev.ruleWeeklyDays || [];
        const newByDay = byDay.includes(dayIndex) 
            ? byDay.filter(d => d !== dayIndex)
            : [...byDay, dayIndex].sort();
        return { ...prev, ruleWeeklyDays: newByDay };
    });
  };

  const handleDateChange = (id: string, field: 'timeRangeStart' | 'timeRangeEnd', value: string) => {
    setEventTimeRanges(prev => prev.map(r => {
        if (r.timeRangeId === id) {
            const newRange = { ...r, [field]: value };
            if (scheduleType === 'recurring' && field === 'timeRangeStart') {
                newRange.timeRangeEnd = value;
                
                const newStartDate = parseInputDate(value);
                const recurrenceEndDateValue = parseInputDate(recurrenceEndDate);
                if (newStartDate && (!recurrenceEndDateValue || recurrenceEndDateValue <= newStartDate)) {
                    const oneMonthLater = new Date(newStartDate);
                    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
                    setRecurrenceEndDate(formatDateForInput(oneMonthLater));
                }
            }
            return newRange;
        }
        return r;
    }));
  };
  
  const handleDateBlur = (id: string, field: 'timeRangeStart' | 'timeRangeEnd', value: string) => {
    const parts = value.split('/');
    if (parts.length === 3) {
      const year = parts[0];
      let month = parts[1];
      let day = parts[2];

      if (year.length === 4) {
        if (month.length === 1) month = '0' + month;
        if (day.length === 1) day = '0' + day;
        const formattedValue = `${year}/${month}/${day}`;
        if (formattedValue !== value) {
          handleDateChange(id, field, formattedValue);
        }
      }
    }
  };

  const handleAddDateRange = () => {
    const lastRange = eventTimeRanges[eventTimeRanges.length - 1] || { timeRangeStart: formatDateForInput(selectedDate), timeRangeEnd: formatDateForInput(selectedDate) };
    setEventTimeRanges(prev => [...prev, { timeRangeId: Date.now().toString(), timeRangeStart: lastRange.timeRangeStart, timeRangeEnd: lastRange.timeRangeEnd }]);
  };

  const handleRemoveDateRange = (id: string) => {
    if (eventTimeRanges.length > 1) {
      setEventTimeRanges(prev => prev.filter(r => r.timeRangeId !== id));
    }
  };

  const handleMonthlyDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9,\s]/g, '');
    setMonthlyDaysInput(value);
  };
  
  const handleMonthlyDaysBlur = () => {
    const parsedDays = monthlyDaysInput.split(',').map(s => s.trim()).filter(Boolean).map(Number);
    const uniqueValidDays = [...new Set(parsedDays.filter(n => !isNaN(n) && Number.isInteger(n) && n >= 1 && n <= 31))].sort((a, b) => a - b);
    setMonthlyDaysInput(uniqueValidDays.join(', '));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInvalidRangeIds(new Set());

    if (!eventTitle.trim()) {
      setError(t('errorTitleRequired'));
      return;
    }
    if(eventTimeRanges.length === 0) {
        setError(t('errorDateRangeMissing'));
        return;
    }

    const parsedRanges = eventTimeRanges.map(r => ({ ...r, start: parseInputDate(r.timeRangeStart), end: parseInputDate(r.timeRangeEnd) }));
    if(parsedRanges.some(r => !r.start || !r.end)) {
        setError(t('errorInvalidDate'));
        return;
    }
    
    const newInvalidIds = new Set<string>();
    let dateOrderError = false;

    parsedRanges.forEach(r => {
      if (r.start! > r.end!) {
        newInvalidIds.add(r.timeRangeId);
        dateOrderError = true;
      }
    });

    if (dateOrderError) {
      setError(t('errorDateRangeOrder'));
      setInvalidRangeIds(newInvalidIds);
      return;
    }
    
    let finalRecurrenceRule: RecurrenceRule | null = null;
    if (scheduleType === 'recurring') {
        const parsedUntilDate = parseInputDate(recurrenceEndDate);

        if (!parsedUntilDate) {
            setError(t('errorRecurrenceEnd'));
            return;
        }

        const firstRangeStart = parsedRanges[0].start;
        if (firstRangeStart && parsedUntilDate < firstRangeStart) {
          setError(t('errorDateRangeOrder'));
          return;
        }
       
        const ruleProps = { ...recurrenceProperties };

        if (ruleProps.ruleFrequency === RecurrenceFrequency.WEEKLY) {
            if (!ruleProps.ruleWeeklyDays || ruleProps.ruleWeeklyDays.length === 0) {
                setError(t('errorWeeklyDay'));
                return;
            }
        } else if (ruleProps.ruleFrequency === RecurrenceFrequency.MONTHLY) {
            const parsedDays = monthlyDaysInput.split(',').map(s => s.trim()).filter(Boolean).map(Number);
            const uniqueValidDays = [...new Set(parsedDays.filter(n => !isNaN(n) && Number.isInteger(n) && n >= 1 && n <= 31))].sort((a, b) => a - b);
            
            if (parsedDays.length > 0 && uniqueValidDays.length !== parsedDays.length) {
                setError(t('errorInvalidMonthDay'));
                return;
            }
            if (uniqueValidDays.length === 0) {
                setError(t('errorMonthlyDayMissing'));
                return;
            }
            ruleProps.ruleMonthlyDays = uniqueValidDays;
        }
        
        finalRecurrenceRule = {
            ...ruleProps,
            ruleEndDate: formatDateToYMD(parsedUntilDate),
        };
    } 

    const finalRanges: TimeRange[] = parsedRanges.map(r => ({ 
        timeRangeId: r.timeRangeId, 
        timeRangeStart: formatDateToYMD(r.start!), 
        timeRangeEnd: formatDateToYMD(r.end!) 
    }));

    onSave({
      eventId: eventData?.eventId,
      eventTitle: eventTitle.trim(),
      eventDescription,
      eventTimeRanges: finalRanges,
      eventRecurrenceRule: finalRecurrenceRule,
    });
    onClose();
  };

  const handleDelete = () => {
    if (eventData) onRequestDelete(eventData.eventId);
  };
  
  const filteredSuggestions = (isSuggestionsOpen && recentEvents) 
    ? recentEvents.filter(event => event.eventTitle.toLowerCase().includes(eventTitle.toLowerCase().trim()))
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-4">
          {mode === 'add' ? t('modalTitle') : t('editEventTitle')}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
             {/* Title */}
             <div className="relative">
              <label htmlFor="event-title" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('title')}</label>
              <input id="event-title" ref={titleInputRef} type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} onFocus={() => setIsSuggestionsOpen(true)} autoComplete="off" className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200" />
              {filteredSuggestions.length > 0 && (
                 <div ref={suggestionsContainerRef} className="absolute top-full mt-1 w-full bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 z-20 max-h-40 overflow-y-auto animate-fade-in-up">
                    <ul className="py-1">{filteredSuggestions.map(event => (<li key={event.eventId}><button type="button" className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 truncate" onClick={() => handleSuggestionClick(event)}>{event.eventTitle}</button></li>))}</ul>
                 </div>
              )}
            </div>

            {/* Schedule Type */}
            <fieldset>
                <legend className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">{t('scheduleType')}</legend>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
                    <button type="button" onClick={() => handleScheduleTypeChange('one-time')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${scheduleType === 'one-time' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow' : 'text-slate-500 dark:text-slate-300'}`}>{t('oneTime')}</button>
                    <button type="button" onClick={() => handleScheduleTypeChange('recurring')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${scheduleType === 'recurring' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow' : 'text-slate-500 dark:text-slate-300'}`}>{t('recurring')}</button>
                </div>
            </fieldset>

            {/* Dates Section */}
            {scheduleType === 'one-time' && (
                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('dateRange')}</label>
                    <div className="space-y-3">
                        {eventTimeRanges.map((range) => (
                            <div key={range.timeRangeId} className={`flex items-center gap-2 p-1 -m-1 rounded-lg transition-all ${invalidRangeIds.has(range.timeRangeId) ? 'bg-red-50 dark:bg-red-900/20 ring-2 ring-red-400' : ''}`}>
                                <div className="relative flex-1">
                                    <label htmlFor={`start-date-${range.timeRangeId}`} className="sr-only">{t('startDate')}</label>
                                    <input id={`start-date-${range.timeRangeId}`} type="text" placeholder="YYYY/MM/DD" value={range.timeRangeStart} onChange={e => handleDateChange(range.timeRangeId, 'timeRangeStart', e.target.value)} onBlur={e => handleDateBlur(range.timeRangeId, 'timeRangeStart', e.target.value)} onFocus={() => setActivePicker({ rangeId: range.timeRangeId, type: 'start' })} className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"/>
                                    {activePicker?.type === 'start' && activePicker.rangeId === range.timeRangeId && <DatePickerPopup initialDate={parseInputDate(range.timeRangeStart) || selectedDate} onSelectDate={d => { handleDateChange(range.timeRangeId, 'timeRangeStart', formatDateForInput(d)); setActivePicker(null); }} onClose={() => setActivePicker(null)} />}
                                </div>
                                <span className="text-slate-500">-</span>
                                <div className="relative flex-1">
                                    <label htmlFor={`end-date-${range.timeRangeId}`} className="sr-only">{t('endDate')}</label>
                                    <input id={`end-date-${range.timeRangeId}`} type="text" placeholder="YYYY/MM/DD" value={range.timeRangeEnd} onChange={e => handleDateChange(range.timeRangeId, 'timeRangeEnd', e.target.value)} onBlur={e => handleDateBlur(range.timeRangeId, 'timeRangeEnd', e.target.value)} onFocus={() => setActivePicker({ rangeId: range.timeRangeId, type: 'end' })} className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"/>
                                    {activePicker?.type === 'end' && activePicker.rangeId === range.timeRangeId && <DatePickerPopup initialDate={parseInputDate(range.timeRangeEnd) || selectedDate} onSelectDate={d => { handleDateChange(range.timeRangeId, 'timeRangeEnd', formatDateForInput(d)); setActivePicker(null); }} onClose={() => setActivePicker(null)} />}
                                </div>
                                <button type="button" onClick={() => handleRemoveDateRange(range.timeRangeId)} aria-label="Remove date range" className="p-2 rounded-full text-slate-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-slate-700 transition-colors" disabled={eventTimeRanges.length <= 1}><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddDateRange} className="flex items-center space-x-2 text-sm font-semibold text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 py-1">
                           <PlusCircleIcon className="w-5 h-5"/>
                           <span>{t('addDateRange')}</span>
                        </button>
                    </div>
                </div>
            )}
            
            {scheduleType === 'recurring' && eventTimeRanges.length > 0 && (
                 <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                        <label htmlFor={`start-date-${eventTimeRanges[0].timeRangeId}`} className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('startDate')}</label>
                        <input id={`start-date-${eventTimeRanges[0].timeRangeId}`} type="text" placeholder="YYYY/MM/DD" value={eventTimeRanges[0].timeRangeStart} onChange={e => handleDateChange(eventTimeRanges[0].timeRangeId, 'timeRangeStart', e.target.value)} onBlur={e => handleDateBlur(eventTimeRanges[0].timeRangeId, 'timeRangeStart', e.target.value)} onFocus={() => setActivePicker({ rangeId: eventTimeRanges[0].timeRangeId, type: 'start' })} className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"/>
                        {activePicker?.type === 'start' && activePicker.rangeId === eventTimeRanges[0].timeRangeId && <DatePickerPopup initialDate={parseInputDate(eventTimeRanges[0].timeRangeStart) || selectedDate} onSelectDate={d => { handleDateChange(eventTimeRanges[0].timeRangeId, 'timeRangeStart', formatDateForInput(d)); setActivePicker(null); }} onClose={() => setActivePicker(null)} />}
                    </div>
                    <div className="relative">
                        <label htmlFor="recurrence-end-date" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('ends')}</label>
                        <input id="recurrence-end-date" type="text" placeholder="YYYY/MM/DD" value={recurrenceEndDate} onChange={e => setRecurrenceEndDate(e.target.value)} onFocus={() => setActivePicker({ rangeId: 'recurrence', type: 'recurrenceEnd' })} className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"/>
                        {activePicker?.type === 'recurrenceEnd' && <DatePickerPopup initialDate={parseInputDate(recurrenceEndDate) || selectedDate} onSelectDate={d => { setRecurrenceEndDate(formatDateForInput(d)); setActivePicker(null); }} onClose={() => setActivePicker(null)} />}
                    </div>
                </div>
            )}


            {/* Recurrence Rule Section */}
            {scheduleType === 'recurring' && (
                <fieldset className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <legend className="sr-only">{t('recurrence')}</legend>
                    <div className="flex items-center gap-3">
                        <label htmlFor="recurrence-freq" className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('repeats')}</label>
                        <select id="recurrence-freq" value={recurrenceProperties.ruleFrequency} onChange={e => setRecurrenceProperties({...recurrenceProperties, ruleFrequency: e.target.value as RecurrenceFrequency})} className="flex-1 p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200">
                            <option value={RecurrenceFrequency.WEEKLY}>{t('weekly')}</option>
                            <option value={RecurrenceFrequency.MONTHLY}>{t('monthly')}</option>
                        </select>
                    </div>

                    {recurrenceProperties.ruleFrequency === RecurrenceFrequency.WEEKLY && (
                         <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">{t('repeatOn')}</label>
                            <div className="grid grid-cols-7 gap-1">
                                {weekdaysShort.map((day, index) => (
                                    <button type="button" key={index} onClick={() => handleToggleWeekday(index)} className={`p-2 h-9 w-9 text-xs font-semibold rounded-full transition-colors flex items-center justify-center ${recurrenceProperties.ruleWeeklyDays?.includes(index) ? 'bg-blue-500 text-white shadow' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                     {recurrenceProperties.ruleFrequency === RecurrenceFrequency.MONTHLY && (
                        <div className="flex items-center gap-3">
                            <label htmlFor="recurrence-month-day" className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('repeatOn')}</label>
                             <input 
                                id="recurrence-month-day" 
                                type="text"
                                placeholder={t('monthlyDaysPlaceholder')}
                                value={monthlyDaysInput}
                                onChange={handleMonthlyDaysChange}
                                onBlur={handleMonthlyDaysBlur}
                                className="w-full p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"
                              />
                        </div>
                    )}
                </fieldset>
            )}
           
            {/* Description */}
            <div>
              <label htmlFor="event-description" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('description')}</label>
              <textarea id="event-description" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} rows={5} className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200" />
            </div>
          </div>

          {error && (<div className="mt-4 text-center text-sm text-red-500" role="alert">{error}</div>)}

          <div className="mt-6 flex justify-between items-center">
            <div>
              {mode === 'edit' && (<button type="button" onClick={handleDelete} className="p-2 px-4 rounded-full text-sm font-semibold text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-red-500 flex items-center space-x-2"><TrashIcon className="w-4 h-4" /><span>{t('delete')}</span></button>)}
            </div>
            <div className="flex space-x-3">
              <button type="button" onClick={onClose} className="p-2 px-4 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-slate-500">{t('cancel')}</button>
              <button type="submit" className="p-2 px-4 rounded-full text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-blue-500">{mode === 'add' ? t('addEvent') : t('saveChanges')}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};