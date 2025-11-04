require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const apn = require('apn');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testAPNsNotification() {
  try {
    console.log('=== Testing Direct APNs Push Notifications ===\n');

    // Check environment variables
    console.log('APNs Configuration:');
    console.log('  Key ID:', process.env.APNS_KEY_ID);
    console.log('  Team ID:', process.env.APNS_TEAM_ID);
    console.log('  Bundle ID:', process.env.APNS_BUNDLE_ID);
    console.log('  Environment:', process.env.NODE_ENV === 'production' ? 'Production' : 'Development');
    console.log('');

    // Check if .p8 file exists
    const keyPath = path.join(__dirname, 'config/apns-key.p8');
    const fs = require('fs');
    if (!fs.existsSync(keyPath)) {
      console.error('❌ APNs key file not found at:', keyPath);
      return;
    }
    console.log('✓ APNs key file found\n');

    // Get all users with push tokens
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, push_token')
      .not('push_token', 'is', null);

    if (error || !users || users.length === 0) {
      console.log('No users with push tokens found');
      return;
    }

    console.log(`Found ${users.length} user(s) with push tokens:\n`);

    // Initialize APNs provider
    const options = {
      token: {
        key: keyPath,
        keyId: process.env.APNS_KEY_ID,
        teamId: process.env.APNS_TEAM_ID,
      },
      production: process.env.NODE_ENV === 'production',
    };

    const provider = new apn.Provider(options);
    console.log('✓ APNs provider initialized\n');

    // Send test notification to each user
    for (const user of users) {
      console.log(`📱 Testing notification for: ${user.name} (${user.email})`);
      console.log(`   Token: ${user.push_token.substring(0, 40)}...`);

      // Create notification
      const notification = new apn.Notification();
      notification.alert = {
        title: '🎾 Test Notification',
        body: 'This is a test push notification via direct APNs!',
      };
      notification.sound = 'default';
      notification.badge = 1;
      notification.topic = process.env.APNS_BUNDLE_ID;
      notification.payload = { test: true };

      try {
        const result = await provider.send(notification, user.push_token);

        console.log('   Result:');
        console.log('     Sent:', result.sent ? result.sent.length : 0);
        console.log('     Failed:', result.failed ? result.failed.length : 0);

        if (result.failed && result.failed.length > 0) {
          console.log('   ❌ Failed to send:');
          result.failed.forEach(failure => {
            console.log('     Device:', failure.device);
            console.log('     Status:', failure.status);
            console.log('     Response:', JSON.stringify(failure.response, null, 2));
          });
        } else {
          console.log('   ✅ Notification sent successfully!');
        }
      } catch (sendError) {
        console.error('   ❌ Error sending notification:', sendError.message);
      }

      console.log('');
    }

    // Shutdown provider
    provider.shutdown();
    console.log('✨ Test complete!\n');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testAPNsNotification();
