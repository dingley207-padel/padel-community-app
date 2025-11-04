const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function runMigration() {
  console.log('Creating announcements table...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
  }

  console.log('📝 Please run this migration manually in Supabase SQL Editor:');
  console.log('\n1. Go to: https://supabase.com/dashboard/project/hzetzzirisixofhyyobe/sql');
  console.log('2. Create a new query');
  console.log('3. Copy and paste the SQL from: migrations/create_announcements_table.sql');
  console.log('4. Click "Run"');
  console.log('\nSQL file location: /Users/ross/Desktop/Padel/backend/migrations/create_announcements_table.sql');
  
  // Test if table exists
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log('\n✅ Announcements table already exists!');
    } else if (error.message.includes('does not exist') || error.code === 'PGRST204') {
      console.log('\n⚠️  Announcements table does not exist - please run the migration manually');
    } else {
      console.log('\n❓ Unable to verify table status:', error.message);
    }
  } catch (err) {
    console.error('Error checking table:', err.message);
  }
}

runMigration();
