
import React, { useState, useMemo, useEffect } from 'react';
import { Calendar } from './components/Calendar';
import { EventsView } from './components/EventsView';
import { SettingsView } from './components/SettingsView';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import Notification from './components/Notification';
import { Event, EventsStore, EventPayload, RecurrenceFrequency, Settings, NotificationMethod } from './lib/types';
import { EventModal } from './components/modals/EventModal';
import { SetReminderModal } from './components/modals/SetReminderModal';
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal';
import { CalendarIcon, ListBulletIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, Cog6ToothIcon, MenuIcon } from './components/Icons';
import { sendWeComNotification } from './lib/wecom';

type View = 'calendar' | 'events' | 'settings';

const validateImportedData = (data: any): { valid: boolean; error: { key: string; replacements?: Record<string, any> } | null } => {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { valid: false, error: { key: 'importErrorInvalidFormat' } };
  }

  for (const eventId in data) {
    if (!Object.prototype.hasOwnProperty.call(data, eventId)) continue;
    
    const evt: any = data[eventId];

    if (typeof evt !== 'object' || evt === null) return { valid: false, error: { key: 'importErrorEventNotObject', replacements: { eventId } } };
    if (typeof evt.eventId !== 'string' || evt.eventId !== eventId) return { valid: false, error: { key: 'importErrorIdMismatch', replacements: { eventId, eventPropertyId: evt.eventId } } };
    if (typeof evt.eventTitle !== 'string') return { valid: false, error: { key: 'importErrorMissingTitle', replacements: { eventId } } };
    if (typeof evt.eventDescription !== 'string') return { valid: false, error: { key: 'importErrorMissingDescription', replacements: { eventId } } };
    
    if (!Array.isArray(evt.eventTimeRanges)) {
      return { valid: false, error: { key: 'importErrorTimeRangesNotArray', replacements: { eventId } } };
    }
    
    if (evt.eventRecurrenceRule && evt.eventTimeRanges.length === 0) {
      return { valid: false, error: { key: 'importErrorRecurringNeedsRange', replacements: { eventId } } };
    }

    for (const range of evt.eventTimeRanges) {
      if (typeof range !== 'object' || range === null) return { valid: false, error: { key: 'importErrorTimeRangeNotObject', replacements: { eventId } } };
      if (typeof range.timeRangeId !== 'string') return { valid: false, error: { key: 'importErrorMissingTimeRangeId', replacements: { eventId } } };
      if (typeof range.timeRangeStart !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(range.timeRangeStart)) return { valid: false, error: { key: 'importErrorInvalidTimeRangeStart', replacements: { eventId } } };
      if (typeof range.timeRangeEnd !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(range.timeRangeEnd)) return { valid: false, error: { key: 'importErrorInvalidTimeRangeEnd', replacements: { eventId } } };
    }
    
    if (evt.eventRecurrenceRule !== undefined && evt.eventRecurrenceRule !== null) {
      const rule = evt.eventRecurrenceRule;
      if (typeof rule !== 'object') return { valid: false, error: { key: 'importErrorRecurrenceRuleNotObject', replacements: { eventId } } };
      if (!Object.values(RecurrenceFrequency).includes(rule.ruleFrequency)) return { valid: false, error: { key: 'importErrorInvalidRecurrenceFrequency', replacements: { eventId } } };
      if (typeof rule.ruleEndDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(rule.ruleEndDate)) return { valid: false, error: { key: 'importErrorInvalidRecurrenceEndDate', replacements: { eventId } } };

      if (rule.ruleFrequency === RecurrenceFrequency.WEEKLY) {
        if (!Array.isArray(rule.ruleWeeklyDays) || rule.ruleWeeklyDays.length === 0) {
            return { valid: false, error: { key: 'importErrorWeeklyDaysEmpty', replacements: { eventId } } };
        }
        if (rule.ruleWeeklyDays.some((d: any) => typeof d !== 'number' || d < 0 || d > 6)) {
            return { valid: false, error: { key: 'importErrorWeeklyDaysInvalid', replacements: { eventId } } };
        }
      } else if (rule.ruleFrequency === RecurrenceFrequency.MONTHLY) {
          if (!Array.isArray(rule.ruleMonthlyDays) || rule.ruleMonthlyDays.length === 0) {
              return { valid: false, error: { key: 'importErrorMonthlyDaysEmpty', replacements: { eventId } } };
          }
          if (rule.ruleMonthlyDays.some((d: any) => typeof d !== 'number' || !Number.isInteger(d) || d < 1 || d > 31)) {
              return { valid: false, error: { key: 'importErrorMonthlyDaysInvalid', replacements: { eventId } } };
          }
      }
    }
    
    if (evt.eventReminder !== undefined && evt.eventReminder !== null) {
        if (typeof evt.eventReminder !== 'string') return { valid: false, error: { key: 'importErrorReminderNotString', replacements: { eventId } } };
        if (isNaN(Date.parse(evt.eventReminder))) return { valid: false, error: { key: 'importErrorReminderInvalidDate', replacements: { eventId } } };
    }
  }
  return { valid: true, error: null };
};


const AppContent: React.FC = () => {
  const { t, language } = useLanguage();
  const { showNotification } = useNotification();
  const [view, setView] = useState<View>('calendar');
  const [isNavOpen, setIsNavOpen] = useState(false);

  const [events, setEvents] = useState<EventsStore>(() => {
    try {
      const savedEvents = localStorage.getItem('calendarEvents');
      return savedEvents ? JSON.parse(savedEvents) : {};
    } catch (error) {
      console.error("Failed to load events from localStorage", error);
      return {};
    }
  });

  const [settings, setSettings] = useState<Settings>(() => {
    try {
        const savedSettings = localStorage.getItem('calendarSettings');
        const parsed = savedSettings ? JSON.parse(savedSettings) : {};
        return { 
          notificationMethod: parsed.notificationMethod || NotificationMethod.NONE,
          notificationRobotUrl: parsed.notificationRobotUrl || '' 
        };
    } catch (error) {
        console.error("Failed to load settings from localStorage", error);
        return { notificationMethod: NotificationMethod.NONE, notificationRobotUrl: '' };
    }
  });


  useEffect(() => {
    try {
      localStorage.setItem('calendarEvents', JSON.stringify(events));
    } catch (error) {
      console.error("Failed to save events to localStorage", error);
    }
  }, [events]);

  useEffect(() => {
    try {
        localStorage.setItem('calendarSettings', JSON.stringify(settings));
    } catch (error) {
        console.error("Failed to save settings to localStorage", error);
    }
  }, [settings]);
  
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [confirmingDeleteEvent, setConfirmingDeleteEvent] = useState<Event | null>(null);
  const [selectedDateForModal, setSelectedDateForModal] = useState(new Date());

  const handleSaveEvent = (payload: EventPayload) => {
    const eventId = payload.eventId || Date.now().toString();
    const existingEvent = events[payload.eventId || ''];
    const newEventData: Event = {
      eventId: eventId,
      eventTitle: payload.eventTitle,
      eventDescription: payload.eventDescription,
      eventTimeRanges: payload.eventTimeRanges,
      eventRecurrenceRule: payload.eventRecurrenceRule || undefined,
      eventReminder: existingEvent?.eventReminder,
    };
    setEvents(prevEvents => ({ ...prevEvents, [eventId]: newEventData }));
    setIsEventModalOpen(false);
    showNotification(modalMode === 'add' ? t('notificationEventAdded') : t('notificationEventUpdated'), 'success');
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prevEvents => {
      const newEventsState = { ...prevEvents };
      delete newEventsState[eventId];
      return newEventsState;
    });
  };

  const handleRequestDelete = (event: Event) => {
    setIsEventModalOpen(false);
    setConfirmingDeleteEvent(event);
  };

  const handleConfirmDelete = () => {
    if (confirmingDeleteEvent) {
      handleDeleteEvent(confirmingDeleteEvent.eventId);
      setConfirmingDeleteEvent(null);
      showNotification(t('notificationEventDeleted'), 'success');
    }
  };

  const handleSetReminder = (dateTime: string) => {
    if (!activeEvent) return;
    setEvents(prevEvents => {
      const updatedEvent = { ...prevEvents[activeEvent.eventId], eventReminder: dateTime };
      return { ...prevEvents, [activeEvent.eventId]: updatedEvent };
    });
    setIsReminderModalOpen(false);
    setActiveEvent(null);
    showNotification(t('notificationReminderSet'), 'success');
  };
  
  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    showNotification(t('notificationSettingsSaved'), 'success');
  };

  const openAddModal = (date: Date) => {
    setSelectedDateForModal(date);
    setModalMode('add');
    setActiveEvent(null);
    setIsEventModalOpen(true);
  };

  const openEditModal = (event: Event) => {
    setModalMode('edit');
    setActiveEvent(event);
    setIsEventModalOpen(true);
  };

  const openReminderModal = (event: Event) => {
    setActiveEvent(event);
    setIsReminderModalOpen(true);
  };
  
  const handleNavClick = (action: () => void) => {
    action();
    setIsNavOpen(false);
  };

  const recentEvents = useMemo(() => {
    const sortedEvents = Object.values(events)
      .filter(event => !isNaN(parseInt(event.eventId, 10)))
      .sort((a, b) => parseInt(b.eventId, 10) - parseInt(a.eventId, 10));
    const uniqueTitles = new Set<string>();
    const uniqueRecentEvents: Event[] = [];
    for (const event of sortedEvents) {
      if (event.eventTitle.trim() && !uniqueTitles.has(event.eventTitle)) {
        uniqueTitles.add(event.eventTitle);
        uniqueRecentEvents.push(event);
      }
      if (uniqueRecentEvents.length >= 5) break;
    }
    return uniqueRecentEvents;
  }, [events]);
  
  const handleExportEvents = () => {
    if (Object.keys(events).length === 0) {
        showNotification(t('notificationExportNoEvents'), 'info');
        return;
    }
    const dataStr = JSON.stringify(events, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendar-events-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification(t('notificationExportSuccess'), 'success');
  };

  const handleImportEvents = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onerror = () => {
      console.error("FileReader error");
      showNotification(t('importError'), 'error');
      if (e.target) e.target.value = '';
    };

    reader.onload = (event) => {
        try {
            const text = event.target?.result;
            if (typeof text !== 'string') {
                throw new Error(t('importErrorFileContent'));
            }
            const importedData = JSON.parse(text);
            
            const validationResult = validateImportedData(importedData);
            if (!validationResult.valid) {
              const { key, replacements } = validationResult.error!;
              const errorMessage = t(key as any, replacements);
              throw new Error(errorMessage);
            }

            let added = 0;
            let updated = 0;
            const newEventsState = { ...events };

            for (const eventId in importedData) {
                if (Object.prototype.hasOwnProperty.call(importedData, eventId)) {
                    if (newEventsState[eventId]) {
                        updated++;
                    } else {
                        added++;
                    }
                    newEventsState[eventId] = importedData[eventId] as Event;
                }
            }
            
            setEvents(newEventsState);
            showNotification(t('importReport', { added, updated }), 'success');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('importErrorUnknown');
            console.error("Failed to import events:", errorMessage);
            showNotification(`${t('notificationImportFailed')}:\n${errorMessage}`, 'error');
        } finally {
            if (e.target) e.target.value = '';
        }
    };
    reader.readAsText(file);
};

  useEffect(() => {
    const checkReminders = async () => {
      let currentSettings: Settings;
      try {
        currentSettings = JSON.parse(localStorage.getItem('calendarSettings') || '{}');
      } catch {
        currentSettings = { notificationMethod: NotificationMethod.NONE, notificationRobotUrl: '' };
      }

      if (currentSettings.notificationMethod !== NotificationMethod.WECOM || !currentSettings.notificationRobotUrl) {
        return;
      }

      const allEvents: EventsStore = JSON.parse(localStorage.getItem('calendarEvents') || '{}');
      let sentReminders: Record<string, string> = {};
      try {
        sentReminders = JSON.parse(localStorage.getItem('sentReminders') || '{}');
      } catch {
        sentReminders = {};
      }

      const now = new Date();
      let newSentReminders = { ...sentReminders };
      let sentInThisCycle = false;

      for (const eventId in allEvents) {
        const event = allEvents[eventId];
        if (event.eventReminder) {
          const reminderTime = new Date(event.eventReminder);
          if (reminderTime <= now && sentReminders[event.eventId] !== event.eventReminder) {
            try {
              await sendWeComNotification(currentSettings.notificationRobotUrl, event, t, language);

              newSentReminders[event.eventId] = event.eventReminder;
              sentInThisCycle = true;
              showNotification(t('notificationSent') + `: ${event.eventTitle}`, 'success');

            } catch (err) {
              console.error(`Failed to send reminder for event ${event.eventId}:`, err);
              showNotification(`${t('notificationSendFailed')}: ${event.eventTitle}`, 'error');
            }
          }
        }
      }

      if (sentInThisCycle) {
        localStorage.setItem('sentReminders', JSON.stringify(newSentReminders));
      }
    };

    const intervalId = setInterval(checkReminders, 60000);
    checkReminders(); 

    return () => clearInterval(intervalId);
  }, [t, showNotification, language]);


  const viewButtonClasses = (buttonView: View) => `flex items-center space-x-3 w-full p-3 rounded-lg text-sm font-semibold transition-colors ${
    view === buttonView
      ? 'bg-blue-500 text-white shadow'
      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
  }`;
  
  const actionButtonClasses = `flex items-center space-x-3 w-full p-3 rounded-lg text-sm font-semibold transition-colors text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer`;


  return (
    <div className="flex w-full min-h-screen font-sans bg-slate-100 dark:bg-slate-900">
       {/* Backdrop for mobile nav */}
       {isNavOpen && <div onClick={() => setIsNavOpen(false)} className="fixed inset-0 bg-black/50 z-20 md:hidden" />}

       <input 
        type="file" 
        id="import-file-input" 
        className="hidden" 
        accept=".json" 
        onChange={handleImportEvents}
      />
      <nav className={`fixed inset-y-0 left-0 z-30 p-4 pt-8 h-screen bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-48 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <ul className="space-y-2 flex-grow">
          <li>
            <button onClick={() => handleNavClick(() => setView('calendar'))} className={viewButtonClasses('calendar')} aria-current={view === 'calendar'}>
              <CalendarIcon className="w-5 h-5" />
              <span>{t('viewCalendar')}</span>
            </button>
          </li>
          <li>
            <button onClick={() => handleNavClick(() => setView('events'))} className={viewButtonClasses('events')} aria-current={view === 'events'}>
              <ListBulletIcon className="w-5 h-5" />
              <span>{t('viewEvents')}</span>
            </button>
          </li>
          <li>
            <button onClick={() => handleNavClick(() => setView('settings'))} className={viewButtonClasses('settings')} aria-current={view === 'settings'}>
              <Cog6ToothIcon className="w-5 h-5" />
              <span>{t('viewSettings')}</span>
            </button>
          </li>
        </ul>
        <ul className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <li>
                <label htmlFor="import-file-input" className={actionButtonClasses} onClick={() => setIsNavOpen(false)}>
                    <ArrowUpTrayIcon className="w-5 h-5" />
                    <span>{t('importEvents')}</span>
                </label>
            </li>
            <li>
                <button onClick={() => handleNavClick(handleExportEvents)} className={actionButtonClasses}>
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    <span>{t('exportEvents')}</span>
                </button>
            </li>
        </ul>
      </nav>

      <main className="flex-1 flex flex-col">
        {/* Mobile-only header */}
        <div className="md:hidden px-4 py-2 flex items-center border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
            <button 
                onClick={() => setIsNavOpen(true)}
                className="p-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                aria-label={t('menu')}
            >
                <MenuIcon className="w-6 h-6" />
            </button>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
            <div className="w-full max-w-md mx-auto">
              {view === 'calendar' ? (
                <Calendar
                  events={events}
                  onOpenAddModal={openAddModal}
                  onOpenEditModal={openEditModal}
                  onOpenReminderModal={openReminderModal}
                />
              ) : view === 'events' ? (
                <EventsView
                  events={events}
                  onOpenEditModal={openEditModal}
                  onOpenReminderModal={openReminderModal}
                  onOpenAddModal={() => openAddModal(new Date())}
                />
              ) : (
                <SettingsView
                  settings={settings}
                  onSave={handleSaveSettings}
                />
              )}
            </div>
        </div>
      </main>

      <Notification />

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        onRequestDelete={(eventId) => {
            const eventToDelete = events[eventId];
            if (eventToDelete) handleRequestDelete(eventToDelete);
        }}
        mode={modalMode}
        eventData={activeEvent || undefined}
        selectedDate={selectedDateForModal}
        recentEvents={recentEvents}
      />
      <SetReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => { setIsReminderModalOpen(false); setActiveEvent(null); }}
        onSetReminder={handleSetReminder}
        event={activeEvent}
        selectedDate={selectedDateForModal}
      />
      <ConfirmDeleteModal
        isOpen={!!confirmingDeleteEvent}
        onClose={() => setConfirmingDeleteEvent(null)}
        onConfirm={handleConfirmDelete}
        eventName={confirmingDeleteEvent?.eventTitle || ''}
      />
    </div>
  );
};


function App() {
  return (
    <LanguageProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </LanguageProvider>
  );
}

export default App;
