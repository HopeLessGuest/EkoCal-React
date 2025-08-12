
import { Event } from './types';

type TFunction = (key: any, replacements?: Record<string, any>) => string;

/**
 * Sends a notification to a WeCom (企业微信) webhook.
 * @param webhookUrl The URL of the WeCom robot webhook.
 * @param event The event for which to send a reminder.
 * @param t The translation function.
 * @param language The current language code.
 * @throws An error if the fetch request fails.
 */
export const sendWeComNotification = async (
    webhookUrl: string,
    event: Event,
    t: TFunction,
    language: 'zh-CN' | 'en-US'
): Promise<void> => {
    if (!event.eventReminder) {
        throw new Error("Event has no reminder to send.");
    }

    const reminderDate = new Date(event.eventReminder);
    const reminderTimeStr = reminderDate.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
    const reminderDateTimeStr = `${reminderDate.toLocaleDateString(language)} ${reminderTimeStr}`;

    const messageContent = [
        `### ${t('reminderNotificationTitle', { title: event.eventTitle })}`,
        `> **${t('reminderNotificationTime')}**: ${reminderDateTimeStr}`,
        `> **${t('reminderNotificationDesc')}**: ${event.eventDescription || '-'}`
    ].join('\n\n');

    const payload = {
        msgtype: 'markdown',
        markdown: { content: messageContent },
    };

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Webhook failed with status ${response.status}: ${errorBody}`);
    }
};
