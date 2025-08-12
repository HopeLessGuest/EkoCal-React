
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Settings, NotificationMethod } from '../lib/types';
import { ClipboardIcon } from './Icons';

interface SettingsViewProps {
    settings: Settings;
    onSave: (newSettings: Settings) => void;
}

const isValidUrl = (urlString: string): boolean => {
    if (!urlString.trim()) {
        return false; // Disallow empty URL when method requires it
    }
    try {
        // WeCom webhooks might not be standard URLs, so a simple check is better.
        return urlString.startsWith('http://') || urlString.startsWith('https://');
    } catch (e) {
        return false;
    }
};

const maskUrl = (url: string) => {
    if (url.length < 40) return url;
    // Show first 25, last 10 characters
    return `${url.substring(0, 25)}...${url.substring(url.length - 10)}`;
};


export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
    const { t, language, setLanguage } = useLanguage();
    const [method, setMethod] = useState<NotificationMethod>(NotificationMethod.NONE);
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isUrlInputFocused, setIsUrlInputFocused] = useState(false);

    useEffect(() => {
        if (settings) {
            setMethod(settings.notificationMethod || NotificationMethod.NONE);
            setUrl(settings.notificationRobotUrl || '');
        }
    }, [settings]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsUrlInputFocused(false); // Unfocus on save to show mask

        if (method === NotificationMethod.WECOM && !isValidUrl(url)) {
            setError(t('errorInvalidUrl'));
            return;
        }
        
        onSave({ 
            notificationMethod: method,
            notificationRobotUrl: method === NotificationMethod.WECOM ? url.trim() : ''
        });
    };
    
    const handleLanguageChange = (lang: 'zh-CN' | 'en-US') => {
        setLanguage(lang);
    };

    const displayUrl = isUrlInputFocused || !url ? url : maskUrl(url);

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
                    
                    <div className="mb-4">
                        <label htmlFor="notification-method" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('notificationMethod')}</label>
                        <select
                            id="notification-method"
                            value={method}
                            onChange={(e) => setMethod(e.target.value as NotificationMethod)}
                            className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-200"
                        >
                            <option value={NotificationMethod.NONE}>{t('notificationMethodNone')}</option>
                            <option value={NotificationMethod.WECOM}>{t('notificationMethodWeCom')}</option>
                        </select>
                    </div>
                    
                    {method === NotificationMethod.WECOM && (
                        <div>
                            <label htmlFor="notification-robot-url" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('notificationRobotUrl')}</label>
                            <div className="relative flex items-center">
                                <input
                                    id="notification-robot-url"
                                    type="text"
                                    value={displayUrl}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onFocus={() => setIsUrlInputFocused(true)}
                                    onBlur={() => setIsUrlInputFocused(false)}
                                    placeholder={t('notificationRobotUrlPlaceholder')}
                                    className={`w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:outline-none text-slate-800 dark:text-slate-200 font-mono text-xs pr-10 ${error ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                                    aria-invalid={!!error}
                                    aria-describedby="url-error"
                                />
                                {url && (
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 flex-shrink-0 p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                        onClick={() => navigator.clipboard.writeText(url)}
                                        title={t('copy')}
                                    >
                                        <ClipboardIcon className="w-5 h-5" />
                                        <span className="sr-only">{t('copy')}</span>
                                    </button>
                                )}
                            </div>
                            {error && <p id="url-error" className="text-xs text-red-500 mt-1">{error}</p>}
                        </div>
                    )}
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
