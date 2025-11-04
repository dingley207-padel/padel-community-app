import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { InAppNotificationData } from '../components/InAppNotification';

interface InAppNotificationContextType {
  notification: InAppNotificationData | null;
  showNotification: (notification: Omit<InAppNotificationData, 'id' | 'timestamp'>) => void;
  dismissNotification: () => void;
  handleNotificationPress: () => void;
  setNavigationHandler: (handler: (data: any) => void) => void;
}

const InAppNotificationContext = createContext<InAppNotificationContextType | undefined>(
  undefined
);

export const useInAppNotification = () => {
  const context = useContext(InAppNotificationContext);
  if (!context) {
    throw new Error(
      'useInAppNotification must be used within an InAppNotificationProvider'
    );
  }
  return context;
};

interface InAppNotificationProviderProps {
  children: ReactNode;
}

export const InAppNotificationProvider: React.FC<InAppNotificationProviderProps> = ({
  children,
}) => {
  const [notification, setNotification] = useState<InAppNotificationData | null>(null);
  const [navigationHandler, setNavigationHandler] = useState<((data: any) => void) | null>(
    null
  );

  const showNotification = useCallback(
    (notificationData: Omit<InAppNotificationData, 'id' | 'timestamp'>) => {
      const newNotification: InAppNotificationData = {
        ...notificationData,
        id: `notification-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      };

      console.log('[InAppNotification] Showing notification:', newNotification);
      setNotification(newNotification);
    },
    []
  );

  const dismissNotification = useCallback(() => {
    console.log('[InAppNotification] Dismissing notification');
    setNotification(null);
  }, []);

  const handleNotificationPress = useCallback(() => {
    if (notification && navigationHandler) {
      console.log('[InAppNotification] Notification pressed, navigating with data:', notification.data);
      navigationHandler(notification.data);
    }
    dismissNotification();
  }, [notification, navigationHandler, dismissNotification]);

  const setNavigationHandlerCallback = useCallback((handler: (data: any) => void) => {
    console.log('[InAppNotification] Setting navigation handler');
    setNavigationHandler(() => handler);
  }, []);

  const value: InAppNotificationContextType = {
    notification,
    showNotification,
    dismissNotification,
    handleNotificationPress,
    setNavigationHandler: setNavigationHandlerCallback,
  };

  return (
    <InAppNotificationContext.Provider value={value}>
      {children}
    </InAppNotificationContext.Provider>
  );
};
