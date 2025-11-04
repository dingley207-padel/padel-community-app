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
    console.log('Checking if password_hash column exists...\n');

    // Try to query the password_hash column
    const { data, error } = await supabase
      .from('users')
      .select('password_hash')
      .limit(1);

    if (error) {
      if (error.message.includes('column "password_hash" does not exist')) {
        console.log('❌ Column password_hash does NOT exist yet.\n');
        console.log('📝 Please run this SQL in your Supabase SQL Editor:\n');
        console.log('------------------------------------------------------------');
        console.log('ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);');
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

    console.log('✅ Column password_hash already exists!');
    console.log('✅ Database is ready for the new registration flow.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkMigration();
