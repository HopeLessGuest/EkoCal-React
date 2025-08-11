import React, { createContext, useState, useContext, ReactNode, useCallback, useRef } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
  message: string;
  type: NotificationType;
  id: number;
  isClosing?: boolean;
}

interface NotificationContextType {
  notification: NotificationState | null;
  showNotification: (message: string, type: NotificationType) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const autoHideTimerRef = useRef<number | null>(null);
  const closingTimerRef = useRef<number | null>(null);

  const hideNotification = useCallback(() => {
    // Stop the auto-hide timer if it's running
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
    
    setNotification(current => {
      // If there's no notification or it's already closing, do nothing
      if (!current || current.isClosing) {
        return current;
      }

      // Start the closing timer for the animation
      if (closingTimerRef.current) clearTimeout(closingTimerRef.current);
      closingTimerRef.current = window.setTimeout(() => {
        setNotification(null); // Fully remove after animation
        closingTimerRef.current = null;
      }, 300); // Animation duration (300ms)

      // Set isClosing to true to trigger the animation in the component
      return { ...current, isClosing: true };
    });
  }, []);

  const showNotification = useCallback((message: string, type: NotificationType) => {
    // Clear any existing timers to prevent conflicts
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    if (closingTimerRef.current) clearTimeout(closingTimerRef.current);
    
    const newNotification = {
        message,
        type,
        id: Date.now()
    };
    setNotification(newNotification);

    // Set a timer to automatically hide the notification
    autoHideTimerRef.current = window.setTimeout(() => {
      hideNotification();
    }, 4000); // 4 seconds as requested
    
  }, [hideNotification]);

  return (
    <NotificationContext.Provider value={{ notification, showNotification, hideNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};