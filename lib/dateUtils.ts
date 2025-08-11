
// Timezone-safe date formatting (for internal use)
export const formatDateToYMD = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// New date helper functions
export const formatDateForDisplay = (date: Date, lang: 'zh-CN' | 'en-US'): string => {
  const d = date.getDate().toString();
  const m = (date.getMonth() + 1).toString();
  const y = date.getFullYear().toString();
  if (lang === 'zh-CN') {
    return `${y}年${m}月${d}日`;
  }
  return `${m}/${d}/${y}`; // US format
};

export const formatDateForInput = (date: Date): string => {
    const y = date.getFullYear().toString();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}/${m}/${d}`;
};

export const parseInputDate = (dateStr: string): Date | null => {
  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) return null;

  const parts = dateStr.split('/');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
      return null;
  }
  return date;
};

export const formatReminderForDisplay = (
  isoString: string,
  t: (key: any, replacements?: Record<string, string | number>) => string,
  language: 'zh-CN' | 'en-US'
): string => {
    const date = new Date(isoString);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear();
    
    const timePart = date.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) {
        return t('reminderFormatToday', { time: timePart });
    } else {
        const datePart = formatDateForDisplay(date, language);
        return t('reminderFormatOtherDay', { date: datePart, time: timePart });
    }
};
