import React from 'react';
import { InAppNotification } from './InAppNotification';
import { useInAppNotification } from '../contexts/InAppNotificationContext';

const InAppNotificationDisplay: React.FC = () => {
  const { notification, handleNotificationPress, dismissNotification } = useInAppNotification();

  if (!notification) {
    return null;
  }

  return (
    <InAppNotification
      notification={notification}
      onPress={handleNotificationPress}
      onDismiss={dismissNotification}
    />
  );
};

export default InAppNotificationDisplay;
