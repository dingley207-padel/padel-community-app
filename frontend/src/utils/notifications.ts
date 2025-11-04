import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and get the native device token
 * @returns The native device token or null if registration failed
 */
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  try {
    console.log('[Notifications] Starting push notification registration');

    // Check if running on physical device
    if (!Device.isDevice) {
      console.log('[Notifications] Must use physical device for Push Notifications');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    console.log('[Notifications] Existing permission status:', existingStatus);

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('[Notifications] New permission status:', finalStatus);
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return null;
    }

    // Get the native device token (APNs token for iOS)
    const devicePushToken = await Notifications.getDevicePushTokenAsync();

    // For iOS, the token is a Buffer that needs to be converted to hex string
    let tokenString: string;
    if (Platform.OS === 'ios') {
      // Convert the iOS device token (Buffer/Data) to hex string
      const tokenData = devicePushToken.data;
      if (typeof tokenData === 'string') {
        tokenString = tokenData;
      } else {
        // Convert Buffer to hex string
        tokenString = Array.from(new Uint8Array(tokenData as any))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      }
    } else {
      tokenString = devicePushToken.data as string;
    }

    console.log('[Notifications] Native device token:', tokenString);

    // iOS specific configuration
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return tokenString;
  } catch (error) {
    console.error('[Notifications] Error registering for push notifications:', error);
    return null;
  }
};

/**
 * Schedule a local notification (for testing)
 */
export const scheduleTestNotification = async () => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification 📬",
        body: 'This is a test notification from your Padel app!',
        data: { test: true },
      },
      trigger: {
        seconds: 2,
      },
    });
    console.log('[Notifications] Test notification scheduled');
  } catch (error) {
    console.error('[Notifications] Error scheduling notification:', error);
  }
};

/**
 * Add a notification received listener
 */
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void
) => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Add a notification response listener (when user taps notification)
 */
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};
