
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface Settings {
    notificationRobotUrl: string;
}

interface SettingsViewProps {
    settings: Settings;
    onSave: (newSettings: Settings) => void;
}

const isValidUrl = (urlString: string): boolean => {
    if (!urlString.trim()) {
        return true; // Allow empty URL
    }
    try {
        new URL(urlString);
        return true;
    } catch (e) {
        return false;
    }
};


export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
    const { t, language, setLanguage } = useLanguage();
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (settings) {
            setUrl(settings.notificationRobotUrl || '');
        }
    }, [settings]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isValidUrl(url)) {
            setError(t('errorInvalidUrl'));
            return;
        }
        
        onSave({ notificationRobotUrl: url.trim() });
    };
    
    const handleLanguageChange = (lang: 'zh-CN' | 'en-US') => {
        setLanguage(lang);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 transition-all duration-300 w-full">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">{t('viewSettings')}</h2>
            
            <form onSubmit={handleSave} className="space-y-6">
                
                <fieldset>
                    <legend className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">{t('languageSettingTitle')}</legend>
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
                        <button type="button" onClick={() => handleLanguageChange('zh-CN')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${language === 'zh-CN' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow' : 'text-slate-500 dark:text-slate-300'}`}>{t('langChinese')}</button>
                        <button type="button" onClick={() => handleLanguageChange('en-US')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${language === 'en-US' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow' : 'text-slate-500 dark:text-slate-300'}`}>{t('langEnglish')}</button>
                    </div>
                </fieldset>

                <fieldset>
                    <legend className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">{t('settingsTitle')}</legend>
                    <div>
                        <label htmlFor="notification-robot-url" className="sr-only">{t('notificationRobotUrl')}</label>
                        <input
                            id="notification-robot-url"
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder={t('notificationRobotUrlPlaceholder')}
                            className={`w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:outline-none text-slate-800 dark:text-slate-200 ${error ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                            aria-invalid={!!error}
                            aria-describedby="url-error"
                        />
                        {settings.notificationRobotUrl && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 truncate">
                               {t('currentUrl')}: {settings.notificationRobotUrl}
                            </p>
                        )}
                        {error && <p id="url-error" className="text-xs text-red-500 mt-1">{error}</p>}
                    </div>
                </fieldset>

                <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        type="submit"
                        className="p-2 px-5 rounded-full text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-blue-500"
                    >
                        {t('saveSettings')}
                    </button>
                </div>
            </form>
        </div>
    );
};
