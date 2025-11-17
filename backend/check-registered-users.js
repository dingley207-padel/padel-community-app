const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkUsers() {
  try {
    console.log('Checking registered users...\n');

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No registered users found in the database');
      return;
    }

    console.log(`✅ Found ${users.length} registered user(s):\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'No name'}`);
      console.log(`   Email: ${user.email || 'No email'}`);
      console.log(`   Phone: ${user.phone || 'No phone'}`);
      console.log(`   Phone Verified: ${user.phone_verified ? '✅ Yes' : '❌ No'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUsers();
