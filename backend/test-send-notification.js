require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Expo } = require('expo-server-sdk');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize Expo SDK
const expo = new Expo();

async function sendTestNotification() {
  try {
    console.log('Fetching all users with push tokens...\n');

    // Get all users with push tokens
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, push_token')
      .not('push_token', 'is', null);

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('No users with push tokens found');
      return;
    }

    console.log(`Found ${users.length} user(s) with push tokens:\n`);

    for (const user of users) {
      console.log(`📱 User: ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Token: ${user.push_token.substring(0, 50)}...`);

      // Validate token
      if (!Expo.isExpoPushToken(user.push_token)) {
        console.log(`   ❌ INVALID EXPO TOKEN FORMAT\n`);
        continue;
      }

      console.log(`   ✅ Valid Expo push token`);

      // Try to send a test notification
      console.log(`   🚀 Sending test notification...`);

      const message = {
        to: user.push_token,
        sound: 'default',
        title: '🎾 Test Notification',
        body: 'This is a test push notification from your Padel app!',
        data: { test: true },
      };

      try {
        const ticketChunk = await expo.sendPushNotificationsAsync([message]);
        console.log(`   📨 Notification ticket:`, JSON.stringify(ticketChunk, null, 2));

        // Check if there were any errors
        for (const ticket of ticketChunk) {
          if (ticket.status === 'error') {
            console.log(`   ❌ Error sending notification:`, ticket.message);
            if (ticket.details) {
              console.log(`   Details:`, ticket.details);
            }
          } else {
            console.log(`   ✅ Notification sent successfully!`);
            console.log(`   Receipt ID: ${ticket.id}`);
          }
        }
      } catch (sendError) {
        console.error(`   ❌ Error sending notification:`, sendError);
      }

      console.log('');
    }

    console.log('\n✨ Test complete!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

sendTestNotification();
