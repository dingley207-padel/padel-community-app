import { supabase } from '../config/database';
import { sendAPNsNotification, sendAPNsNotificationToMultiple } from './apnsService';

/**
 * Send a push notification to a specific user
 */
export const sendNotificationToUser = async (
  userId: string,
  title: string,
  body: string,
  data?: any
): Promise<boolean> => {
  try {
    // Get user's push token from database
    const { data: user, error } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (error || !user?.push_token) {
      console.log(`No push token found for user ${userId}`);
      return false;
    }

    // Send the notification via APNs
    return await sendAPNsNotification(user.push_token, title, body, data);
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error);
    return false;
  }
};

/**
 * Send a push notification to multiple users
 */
export const sendNotificationToMultipleUsers = async (
  userIds: string[],
  title: string,
  body: string,
  data?: any
): Promise<{ sent: number; failed: number }> => {
  try {
    // Get all users' push tokens
    const { data: users, error } = await supabase
      .from('users')
      .select('id, push_token')
      .in('id', userIds);

    if (error || !users || users.length === 0) {
      console.log('No users found with push tokens');
      return { sent: 0, failed: userIds.length };
    }

    // Filter users with push tokens
    const deviceTokens = users
      .filter(user => user.push_token)
      .map(user => user.push_token);

    if (deviceTokens.length === 0) {
      console.log('No valid push tokens found');
      return { sent: 0, failed: userIds.length };
    }

    // Send notifications via APNs
    return await sendAPNsNotificationToMultiple(deviceTokens, title, body, data);
  } catch (error) {
    console.error('Error sending notifications to multiple users:', error);
    return { sent: 0, failed: userIds.length };
  }
};

/**
 * Send a test notification to a user
 */
export const sendTestNotification = async (userId: string): Promise<boolean> => {
  return sendNotificationToUser(
    userId,
    'Test Notification',
    'This is a test notification from your Padel app!',
    { test: true }
  );
};

/**
 * Notify community members about a spot opening from cancellation
 */
export const notifySpotAvailable = async (
  sessionId: string,
  sessionTitle: string,
  communityId: string,
  isPending: boolean = false
): Promise<{ sent: number; failed: number }> => {
  try {
    // Get all community members (excluding the one who cancelled)
    const { data: members, error } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', communityId);

    if (error || !members || members.length === 0) {
      console.log(`No community members found for community ${communityId}`);
      return { sent: 0, failed: 0 };
    }

    const userIds = members.map(m => m.user_id);

    // Create notification message
    const title = '🎾 Last Minute Spot!';
    const body = `A last minute spot has opened up in "${sessionTitle}". Book now before it's gone!`;

    const data = {
      type: 'spot_available',
      sessionId,
      isPending,
    };

    // Send push notifications to all community members
    return await sendNotificationToMultipleUsers(userIds, title, body, data);
  } catch (error) {
    console.error('Error notifying about spot availability:', error);
    return { sent: 0, failed: 0 };
  }
};

/**
 * Notify user that their conditional cancellation was successful
 */
export const notifyRefundProcessed = async (
  userId: string,
  sessionTitle: string,
  refundAmount: number
): Promise<boolean> => {
  return sendNotificationToUser(
    userId,
    '💰 Refund Processed',
    `Your spot in "${sessionTitle}" was filled! Refund of AED ${refundAmount} has been processed.`,
    { type: 'refund_processed' }
  );
};

/**
 * Notify community members about a new session being created
 */
export const notifyNewSession = async (
  sessionId: string,
  sessionTitle: string,
  sessionDatetime: string,
  communityId: string,
  communityName: string
): Promise<{ sent: number; failed: number }> => {
  try {
    // Get all community members
    const { data: members, error } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', communityId);

    if (error || !members || members.length === 0) {
      console.log(`No community members found for community ${communityId}`);
      return { sent: 0, failed: 0 };
    }

    const userIds = members.map(m => m.user_id);

    // Format the session date/time nicely
    const sessionDate = new Date(sessionDatetime);
    const dateStr = sessionDate.toLocaleDateString('en-AE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = sessionDate.toLocaleTimeString('en-AE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Create notification message
    const title = '🆕 New Session Available!';
    const body = `"${sessionTitle}" has been added to ${communityName} on ${dateStr} at ${timeStr}. Book your spot now!`;

    const data = {
      type: 'new_session',
      sessionId,
      communityId,
    };

    // Send push notifications to all community members
    return await sendNotificationToMultipleUsers(userIds, title, body, data);
  } catch (error) {
    console.error('Error notifying about new session:', error);
    return { sent: 0, failed: 0 };
  }
};
