
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define available languages
type Language = 'zh-CN' | 'en-US';

// All translation strings
const translations = {
  // Views
  viewCalendar: { 'zh-CN': '日历', 'en-US': 'Calendar' },
  viewEvents: { 'zh-CN': '事件', 'en-US': 'Events' },
  viewSettings: { 'zh-CN': '设置', 'en-US': 'Settings' },
  // Calendar Header
  menu: { 'zh-CN': '菜单', 'en-US': 'Menu' },
  today: { 'zh-CN': '今天', 'en-US': 'Today' },
  prevMonth: { 'zh-CN': '上个月', 'en-US': 'Previous Month' },
  nextMonth: { 'zh-CN': '下个月', 'en-US': 'Next Month' },
  // Languages
  langChinese: { 'zh-CN': '中文', 'en-US': 'Chinese' },
  langEnglish: { 'zh-CN': 'English', 'en-US': 'English' },
  // Weekdays (short)
  sun: { 'zh-CN': '日', 'en-US': 'Sun' },
  mon: { 'zh-CN': '一', 'en-US': 'Mon' },
  tue: { 'zh-CN': '二', 'en-US': 'Tue' },
  wed: { 'zh-CN': '三', 'en-US': 'Wed' },
  thu: { 'zh-CN': '四', 'en-US': 'Thu' },
  fri: { 'zh-CN': '五', 'en-US': 'Fri' },
  sat: { 'zh-CN': '六', 'en-US': 'Sat' },
  // Events Section
  eventsFor: { 'zh-CN': '事件于', 'en-US': 'Events for' },
  allEvents: { 'zh-CN': '所有事件', 'en-US': 'All Events' },
  addEvent: { 'zh-CN': '添加事件', 'en-US': 'Add Event' },
  noEvents: { 'zh-CN': '当前日期没有安排事件。', 'en-US': 'No events scheduled for this date.' },
  noEventsCreated: { 'zh-CN': '您还没有创建任何事件。', 'en-US': 'You haven\'t created any events yet.' },
  addOnePrompt: { 'zh-CN': '点击按钮添加一个新事件。', 'en-US': 'Click the button to add a new one.'},
  // Event Actions
  setReminderAria: { 'zh-CN': '设置提醒', 'en-US': 'Set reminder' },
  detailsAria: { 'zh-CN': '查看详情', 'en-US': 'View Details' },
  reminderFormatToday: { 'zh-CN': '今天 {time}', 'en-US': 'Today at {time}' },
  reminderFormatOtherDay: { 'zh-CN': '{date} {time}', 'en-US': '{date} at {time}' },
  // Event Modal
  modalTitle: { 'zh-CN': '添加事件', 'en-US': 'Add Event' },
  editEventTitle: { 'zh-CN': '编辑事件', 'en-US': 'Edit Event' },
  startDate: { 'zh-CN': '开始日期', 'en-US': 'Start Date' },
  endDate: { 'zh-CN': '结束日期', 'en-US': 'End Date' },
  dateRange: { 'zh-CN': '时间段', 'en-US': 'Date Range' },
  addDateRange: { 'zh-CN': '添加时间段', 'en-US': 'Add Date Range' },
  title: { 'zh-CN': '标题', 'en-US': 'Title' },
  description: { 'zh-CN': '描述', 'en-US': 'Description' },
  cancel: { 'zh-CN': '取消', 'en-US': 'Cancel' },
  saveChanges: { 'zh-CN': '保存更改', 'en-US': 'Save Changes' },
  delete: { 'zh-CN': '删除', 'en-US': 'Delete' },
  // Recurrence
  scheduleType: { 'zh-CN': '日程类型', 'en-US': 'Schedule Type' },
  oneTime: { 'zh-CN': '一次性', 'en-US': 'One-time' },
  recurring: { 'zh-CN': '周期性', 'en-US': 'Recurring' },
  recurrence: { 'zh-CN': '重复规则', 'en-US': 'Recurrence' },
  repeats: { 'zh-CN': '重复', 'en-US': 'Repeats' },
  weekly: { 'zh-CN': '每周', 'en-US': 'Weekly' },
  monthly: { 'zh-CN': '每月', 'en-US': 'Monthly' },
  repeatOn: { 'zh-CN': '于', 'en-US': 'on' },
  monthlyRepeatOn: { 'zh-CN': '在每月的 {days} 号', 'en-US': 'on day(s) {days} of the month' },
  dayOfMonth: { 'zh-CN': '号', 'en-US': 'day of month' },
  ends: { 'zh-CN': '结束于', 'en-US': 'Ends on' },
  monthlyDaysPlaceholder: { 'zh-CN': '例: 1, 15, 30', 'en-US': 'e.g. 1, 15, 30' },
  // Delete Confirmation Modal
  deleteConfirmTitle: { 'zh-CN': '确认删除', 'en-US': 'Confirm Deletion' },
  deleteConfirmMessage: { 'zh-CN': '您确定要删除事件 “{eventName}” 吗？此操作无法撤销。', 'en-US': 'Are you sure you want to delete the event "{eventName}"? This action cannot be undone.' },
  deleteConfirmAction: { 'zh-CN': '确认删除', 'en-US': 'Confirm Delete' },
  // Reminder Modal
  setReminderTitle: { 'zh-CN': '设置提醒', 'en-US': 'Set Reminder' },
  reminderFor: { 'zh-CN': '提醒事件', 'en-US': 'Reminder for' },
  date: { 'zh-CN': '日期', 'en-US': 'Date' },
  time: { 'zh-CN': '时间', 'en-US': 'Time' },
  setReminder: { 'zh-CN': '设置提醒', 'en-US': 'Set Reminder' },
  // Settings
  settingsTitle: { 'zh-CN': '通知设置', 'en-US': 'Notification Settings' },
  languageSettingTitle: { 'zh-CN': '语言设置', 'en-US': 'Language Settings' },
  notificationMethod: { 'zh-CN': '通知方式', 'en-US': 'Notification Method' },
  notificationMethodNone: { 'zh-CN': '无', 'en-US': 'None' },
  notificationMethodWeCom: { 'zh-CN': '企业微信机器人', 'en-US': 'WeCom Robot' },
  notificationRobotUrl: { 'zh-CN': '通知机器人 URL', 'en-US': 'Notification Robot URL' },
  notificationRobotUrlPlaceholder: { 'zh-CN': '输入您的Webhook URL...', 'en-US': 'Enter your Webhook URL...' },
  currentUrl: { 'zh-CN': '当前链接', 'en-US': 'Current URL' },
  saveSettings: { 'zh-CN': '保存', 'en-US': 'Save' },
  copy: { 'zh-CN': '复制', 'en-US': 'Copy' },
  // Import / Export
  exportEvents: { 'zh-CN': '导出事件', 'en-US': 'Export Events' },
  importEvents: { 'zh-CN': '导入事件', 'en-US': 'Import Events' },
  importReport: { 'zh-CN': '导入完成！\n新增: {added} 个\n重复: {updated} 个', 'en-US': 'Import complete!\nNew: {added}\nUpdated: {updated}' },
  importError: { 'zh-CN': '无法识别或导入。请联系技术人员。', 'en-US': 'Unable to recognize or import. Please contact technical personnel.' },
  // Notifications
  notificationSettingsSaved: { 'zh-CN': '设置已保存', 'en-US': 'Settings saved' },
  notificationEventAdded: { 'zh-CN': '事件已添加', 'en-US': 'Event added' },
  notificationEventUpdated: { 'zh-CN': '事件已更新', 'en-US': 'Event updated' },
  notificationEventDeleted: { 'zh-CN': '事件已删除', 'en-US': 'Event deleted' },
  notificationReminderSet: { 'zh-CN': '提醒已设置', 'en-US': 'Reminder set' },
  notificationSent: { 'zh-CN': '提醒已发送', 'en-US': 'Reminder sent' },
  notificationSendFailed: { 'zh-CN': '提醒发送失败', 'en-US': 'Failed to send reminder' },
  notificationExportSuccess: { 'zh-CN': '事件导出成功', 'en-US': 'Events exported successfully' },
  notificationExportNoEvents: { 'zh-CN': '没有可导出的事件', 'en-US': 'No events to export' },
  notificationImportFailed: { 'zh-CN': '导入失败', 'en-US': 'Import failed' },
  // Webhook specific
  reminderNotificationTitle: { 'zh-CN': '事件提醒: {title}', 'en-US': 'Event Reminder: {title}' },
  reminderNotificationTime: { 'zh-CN': '时间', 'en-US': 'Time' },
  reminderNotificationDesc: { 'zh-CN': '描述', 'en-US': 'Description' },
  // Errors
  errorTitleRequired: { 'zh-CN': '标题不能为空。', 'en-US': 'Title cannot be empty.' },
  errorDateRangeOrder: { 'zh-CN': '时间段的结束日期不能早于开始日期', 'en-US': 'A date range\'s end date cannot be earlier than its start date.' },
  errorDateRangeMissing: { 'zh-CN': '请至少添加一个时间段。', 'en-US': 'Please add at least one date range.' },
  errorInvalidDate: { 'zh-CN': '日期格式无效。请使用 YYYY/MM/DD 格式。', 'en-US': 'Invalid date format. Please use YYYY/MM/DD.' },
  errorInvalidTime: { 'zh-CN': '时间格式无效。请使用 HH:mm 格式。', 'en-US': 'Invalid time format. Please use HH:mm.' },
  errorRecurrenceEnd: { 'zh-CN': '重复事件必须有结束日期。', 'en-US': 'Recurring events must have an end date.' },
  errorInvalidMonthDay: { 'zh-CN': '日期必须是1到31之间的数字。', 'en-US': 'Day of month must be a number between 1 and 31.' },
  errorWeeklyDay: {'zh-CN': '每周重复事件必须选择至少一天。', 'en-US': 'Weekly recurring events must select at least one day.'},
  errorMonthlyDayMissing: { 'zh-CN': '每月重复事件必须选择至少一天。', 'en-US': 'Monthly recurring events must select at least one day.' },
  errorInvalidUrl: { 'zh-CN': '请输入有效的 URL 链接。', 'en-US': 'Please enter a valid URL.' },
  // Import/Export Validation Errors
  importErrorFileContent: { 'zh-CN': '文件内容不是文本。', 'en-US': 'File content is not text.'},
  importErrorUnknown: { 'zh-CN': '发生未知错误。', 'en-US': 'An unknown error occurred.'},
  importErrorInvalidFormat: { 'zh-CN': '格式无效：文件必须包含一个将事件ID映射到事件数据的JSON对象。', 'en-US': 'Invalid format: The file must contain a single JSON object mapping event IDs to event data.' },
  importErrorEventNotObject: { 'zh-CN': 'ID为 "{eventId}" 的事件数据不是一个对象。', 'en-US': 'Event data for ID "{eventId}" is not an object.' },
  importErrorIdMismatch: { 'zh-CN': '事件 "{eventId}" 与 eventId 属性 "{eventPropertyId}" 不匹配。', 'en-US': 'Mismatch between key "{eventId}" and eventId property "{eventPropertyId}".' },
  importErrorMissingTitle: { 'zh-CN': 'ID为 "{eventId}" 的事件标题缺失或不是字符串。', 'en-US': 'Event title for "{eventId}" is missing or not a string.' },
  importErrorMissingDescription: { 'zh-CN': 'ID为 "{eventId}" 的事件描述缺失或不是字符串。', 'en-US': 'Event description for "{eventId}" is missing or not a string.' },
  importErrorTimeRangesNotArray: { 'zh-CN': 'ID为 "{eventId}" 的事件的 eventTimeRanges 必须是一个数组。', 'en-US': 'eventTimeRanges for event "{eventId}" must be an array.' },
  importErrorRecurringNeedsRange: { 'zh-CN': '周期性事件 "{eventId}" 必须至少有一个时间范围来定义其日程。', 'en-US': 'Recurring event "{eventId}" must have at least one time range to define its schedule.' },
  importErrorTimeRangeNotObject: { 'zh-CN': '事件 "{eventId}" 中的时间范围不是一个对象。', 'en-US': 'Time range in event "{eventId}" is not an object.' },
  importErrorMissingTimeRangeId: { 'zh-CN': '事件 "{eventId}" 中的 timeRangeId 缺失或不是字符串。', 'en-US': 'timeRangeId in event "{eventId}" is missing or not a string.' },
  importErrorInvalidTimeRangeStart: { 'zh-CN': '事件 "{eventId}" 中的 timeRangeStart 格式无效。应为 YYYY-MM-DD。', 'en-US': 'timeRangeStart in event "{eventId}" has an invalid format. Expected YYYY-MM-DD.' },
  importErrorInvalidTimeRangeEnd: { 'zh-CN': '事件 "{eventId}" 中的 timeRangeEnd 格式无效。应为 YYYY-MM-DD。', 'en-US': 'timeRangeEnd in event "{eventId}" has an invalid format. Expected YYYY-MM-DD.' },
  importErrorRecurrenceRuleNotObject: { 'zh-CN': '如果存在，事件 "{eventId}" 的 eventRecurrenceRule 必须是一个对象。', 'en-US': 'eventRecurrenceRule for event "{eventId}" must be an object if it exists.' },
  importErrorInvalidRecurrenceFrequency: { 'zh-CN': '事件 "{eventId}" 的 ruleFrequency 无效。', 'en-US': 'Invalid ruleFrequency for event "{eventId}".' },
  importErrorInvalidRecurrenceEndDate: { 'zh-CN': '事件 "{eventId}" 的 ruleEndDate 无效或缺失。', 'en-US': 'Invalid or missing ruleEndDate for event "{eventId}".' },
  importErrorWeeklyDaysEmpty: { 'zh-CN': '每周重复事件 "{eventId}" 的 ruleWeeklyDays 必须是一个非空数组。', 'en-US': 'ruleWeeklyDays for weekly event "{eventId}" must be a non-empty array.' },
  importErrorWeeklyDaysInvalid: { 'zh-CN': '每周重复事件 "{eventId}" 的 ruleWeeklyDays 必须只包含0到6之间的数字。', 'en-US': 'ruleWeeklyDays for weekly event "{eventId}" must contain only numbers between 0 and 6.' },
  importErrorMonthlyDaysEmpty: { 'zh-CN': '每月重复事件 "{eventId}" 的 ruleMonthlyDays 必须是一个非空数组。', 'en-US': 'ruleMonthlyDays for monthly event "{eventId}" must be a non-empty array.' },
  importErrorMonthlyDaysInvalid: { 'zh-CN': '每月重复事件 "{eventId}" 的 ruleMonthlyDays 必须只包含1到31之间的整数。', 'en-US': 'ruleMonthlyDays for monthly event "{eventId}" must contain only integers between 1 and 31.' },
  importErrorReminderNotString: { 'zh-CN': '事件 "{eventId}" 的 eventReminder 必须是一个字符串。', 'en-US': 'eventReminder for event "{eventId}" must be a string.' },
  importErrorReminderInvalidDate: { 'zh-CN': '事件 "{eventId}" 的 eventReminder 不是一个有效的日期字符串。', 'en-US': 'eventReminder for event "{eventId}" is not a valid date string.' },
};

// Define the context shape
interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof typeof translations, replacements?: Record<string, string | number>) => string;
  weekdaysShort: string[];
}

// Create the context with a default value
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Create the provider component
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh-CN'); // Default to Chinese

  const t = (key: keyof typeof translations, replacements?: Record<string, string | number>): string => {
    let translation = translations[key]?.[language] || key;

    if (replacements) {
      Object.entries(replacements).forEach(([rKey, value]) => {
        translation = translation.replace(new RegExp(`\\{${rKey}\\}`, 'g'), String(value));
      });
    }

    return translation;
  };
  
  const weekdaysShort = [
      t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')
  ];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, weekdaysShort }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Create a custom hook for easy context consumption
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
