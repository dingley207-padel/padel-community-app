require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkPushTokens() {
  console.log('📱 Checking push token status...\n');

  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email, push_token');

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`Total users: ${users.length}`);

  const withTokens = users.filter(u => u.push_token);
  const withoutTokens = users.filter(u => !u.push_token);

  console.log(`Users WITH push tokens: ${withTokens.length}`);
  console.log(`Users WITHOUT push tokens: ${withoutTokens.length}`);

  console.log('\n✅ Users with tokens:');
  withTokens.forEach(u => {
    const tokenPreview = u.push_token.substring(0, 40) + '...';
    console.log(`  - ${u.name} (${u.email}): ${tokenPreview}`);
  });

  console.log('\n❌ Users without tokens:');
  withoutTokens.forEach(u => {
    console.log(`  - ${u.name} (${u.email})`);
  });

  console.log('\n📊 Summary:');
  console.log(`  ${withTokens.length}/${users.length} users can receive push notifications`);

  if (withoutTokens.length > 0) {
    console.log('\n⚠️  Users without push tokens will NOT receive notifications!');
    console.log('   They need to log out and log back in to register their device.');
  }
}

checkPushTokens();
