const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkMigration() {
  try {
    console.log('Checking if push_token column exists...\n');

    // Try to query the push_token column
    const { data, error } = await supabase
      .from('users')
      .select('push_token')
      .limit(1);

    if (error) {
      if (error.message.includes('push_token') && error.message.includes('does not exist')) {
        console.log('❌ Column push_token does NOT exist yet.\n');
        console.log('📝 Please run this SQL in your Supabase SQL Editor:\n');
        console.log('------------------------------------------------------------');
        console.log('ALTER TABLE users ADD COLUMN push_token VARCHAR(255);');
        console.log('CREATE INDEX idx_users_push_token ON users(push_token);');
        console.log('------------------------------------------------------------\n');
        console.log('Steps:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Click on "SQL Editor" in the left sidebar');
        console.log('3. Click "New Query"');
        console.log('4. Paste the SQL above');
        console.log('5. Click "Run"\n');
        process.exit(1);
      } else {
        console.error('❌ Unexpected error:', error.message);
        process.exit(1);
      }
    }

    console.log('✅ Column push_token already exists!');
    console.log('✅ Database is ready for push notifications.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkMigration();
