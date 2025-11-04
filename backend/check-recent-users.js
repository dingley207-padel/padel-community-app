require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkRecentUsers() {
  console.log('🔍 Checking recent users...\\n');

  // Get users created in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: users, error } = await supabase
    .from('users')
    .select('email, name, phone, created_at, otp_verified')
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching users:', error.message);
    return;
  }

  if (!users || users.length === 0) {
    console.log('✅ No users created in the last hour');
    return;
  }

  console.log(`Found ${users.length} user(s) created in the last hour:\\n`);

  users.forEach((user, i) => {
    console.log(`${i + 1}. ${user.name} (${user.email})`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   Created: ${user.created_at}`);
    console.log(`   Verified: ${user.otp_verified}`);
    console.log('');
  });
}

checkRecentUsers();
