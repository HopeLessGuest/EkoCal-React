import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from './Icons';

const Notification: React.FC = () => {
  const { notification, hideNotification } = useNotification();

  if (!notification) {
    return null;
  }

  const { message, type, isClosing } = notification;

  const typeStyles = {
    success: 'bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-200 border-green-300 dark:border-green-700',
    error: 'bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-200 border-red-300 dark:border-red-700',
    info: 'bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-200 border-blue-300 dark:border-blue-700',
  };

  const Icon = {
    success: <CheckCircleIcon className="w-6 h-6" />,
    error: <XCircleIcon className="w-6 h-6" />,
    info: <InformationCircleIcon className="w-6 h-6" />,
  }[type];

  const animationClass = isClosing ? 'animate-slide-out-to-right' : 'animate-slide-in-from-right';

  // --- Message Parsing Logic ---
  let title: React.ReactNode = message;
  let body: React.ReactNode | null = null;
  const newlineIndex = message.indexOf('\n');

  if (newlineIndex !== -1) {
      const parts = message.split('\n');
      title = parts[0];
      body = parts.slice(1).join('\n');
  }

  const hasBody = body !== null && String(body).trim() !== '';
  const containerClasses = hasBody ? 'flex items-start' : 'flex items-center';

  return (
    <div 
      className="fixed bottom-6 right-6 z-[100] w-full max-w-xs"
      role="alert"
      aria-live="assertive"
    >
      <div 
        className={`${containerClasses} p-4 rounded-xl shadow-lg border ${animationClass} ${typeStyles[type]}`}
      >
        <div className="flex-shrink-0">{Icon}</div>
        <div className="flex-1 ml-3">
            <p className={`text-sm ${hasBody ? 'font-bold' : 'font-semibold'}`}>{title}</p>
            {hasBody && <p className="text-sm mt-0.5 whitespace-pre-wrap">{body}</p>}
        </div>
        <button onClick={hideNotification} aria-label="Dismiss" className="ml-3 -mr-1 -mt-1 p-1 rounded-full self-start hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            <XCircleIcon className="w-5 h-5 opacity-70" />
        </button>
      </div>
    </div>
  );
};

export default Notification;
