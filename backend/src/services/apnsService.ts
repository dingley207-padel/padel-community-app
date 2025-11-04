import apn from 'apn';
import path from 'path';

/**
 * APNs Service for sending push notifications directly to Apple
 * No dependency on Expo's push notification service
 */

let apnProvider: apn.Provider | null = null;

/**
 * Initialize the APNs provider with your credentials
 */
function getAPNsProvider(): apn.Provider {
  if (apnProvider) {
    return apnProvider;
  }

  // You'll need to:
  // 1. Download your APNs .p8 key file from Apple Developer Portal
  // 2. Place it in backend/config/apns-key.p8
  // 3. Add these environment variables to your .env file:
  //    - APNS_KEY_ID (10-character key ID)
  //    - APNS_TEAM_ID (10-character team ID)
  //    - APNS_BUNDLE_ID (your app's bundle identifier)

  const keyPath = path.join(__dirname, '../../config/apns-key.p8');

  const options: apn.ProviderOptions = {
    token: {
      key: keyPath,
      keyId: process.env.APNS_KEY_ID || '',
      teamId: process.env.APNS_TEAM_ID || '',
    },
    production: process.env.NODE_ENV === 'production', // Use production APNs or sandbox
  };

  apnProvider = new apn.Provider(options);

  console.log(`[APNs] Provider initialized for ${process.env.NODE_ENV === 'production' ? 'production' : 'development'}`);

  return apnProvider;
}

/**
 * Send a push notification to a single device token
 */
export async function sendAPNsNotification(
  deviceToken: string,
  title: string,
  body: string,
  data?: any
): Promise<boolean> {
  try {
    const provider = getAPNsProvider();

    // Create the notification
    const notification = new apn.Notification();
    notification.alert = {
      title,
      body,
    };
    notification.sound = 'default';
    notification.badge = 1;
    notification.topic = process.env.APNS_BUNDLE_ID || 'com.rossdingley.padelone';

    // Add custom data
    if (data) {
      notification.payload = data;
    }

    // Send the notification
    const result = await provider.send(notification, deviceToken);

    // Check for failures
    if (result.failed && result.failed.length > 0) {
      console.error(`[APNs] Failed to send notification to ${deviceToken}:`, result.failed[0].response);
      return false;
    }

    console.log(`[APNs] Successfully sent notification to ${deviceToken}`);
    return true;
  } catch (error) {
    console.error(`[APNs] Error sending notification:`, error);
    return false;
  }
}

/**
 * Send push notifications to multiple device tokens
 */
export async function sendAPNsNotificationToMultiple(
  deviceTokens: string[],
  title: string,
  body: string,
  data?: any
): Promise<{ sent: number; failed: number }> {
  try {
    const provider = getAPNsProvider();

    // Create the notification
    const notification = new apn.Notification();
    notification.alert = {
      title,
      body,
    };
    notification.sound = 'default';
    notification.badge = 1;
    notification.topic = process.env.APNS_BUNDLE_ID || 'com.rossdingley.padelone';

    // Add custom data
    if (data) {
      notification.payload = data;
    }

    // Send to all devices
    const result = await provider.send(notification, deviceTokens);

    const sent = result.sent ? result.sent.length : 0;
    const failed = result.failed ? result.failed.length : 0;

    console.log(`[APNs] Sent ${sent} notifications, ${failed} failed`);

    return { sent, failed };
  } catch (error) {
    console.error('[APNs] Error sending notifications to multiple devices:', error);
    return { sent: 0, failed: deviceTokens.length };
  }
}

/**
 * Shutdown the APNs provider gracefully
 */
export function shutdownAPNsProvider() {
  if (apnProvider) {
    apnProvider.shutdown();
    apnProvider = null;
    console.log('[APNs] Provider shutdown');
  }
}
