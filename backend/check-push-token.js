const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkPushToken() {
  console.log('Checking push tokens in database...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get all users with their push tokens
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, push_token')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error querying users:', error.message);
      return;
    }

    console.log(`Found ${users.length} users in database:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'No name'} (${user.email})`);
      console.log(`   User ID: ${user.id}`);

      if (user.push_token) {
        // Check if it's a valid Expo push token
        const isValidExpoToken = user.push_token.startsWith('ExponentPushToken[') ||
                                  user.push_token.startsWith('ExpoPushToken[');

        if (isValidExpoToken) {
          console.log(`   ✅ Valid Expo Push Token: ${user.push_token.substring(0, 30)}...`);
        } else {
          console.log(`   ⚠️  Push token exists but may not be valid Expo format: ${user.push_token.substring(0, 30)}...`);
        }
      } else {
        console.log(`   ❌ No push token registered`);
      }
      console.log('');
    });

    // Summary
    const usersWithTokens = users.filter(u => u.push_token);
    const usersWithValidTokens = users.filter(u =>
      u.push_token && (u.push_token.startsWith('ExponentPushToken[') || u.push_token.startsWith('ExpoPushToken['))
    );

    console.log('Summary:');
    console.log(`  Total users: ${users.length}`);
    console.log(`  Users with push tokens: ${usersWithTokens.length}`);
    console.log(`  Users with valid Expo tokens: ${usersWithValidTokens.length}`);

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

checkPushToken();
