const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('Running migration: add_duration_to_sessions.sql');

    // Add duration_minutes column to sessions table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE sessions ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 90'
    });

    if (alterError) {
      console.error('❌ Migration failed:', alterError.message);
      console.log('Trying direct query approach...');

      // Alternative approach: Use the SQL editor directly
      const { error } = await supabase
        .from('sessions')
        .select('duration_minutes')
        .limit(1);

      if (error && error.message.includes('column "duration_minutes" does not exist')) {
        console.log('⚠️  Column does not exist. Please run the migration manually in Supabase SQL Editor:');
        console.log('\n--- Copy and paste this SQL into Supabase SQL Editor ---\n');
        console.log('ALTER TABLE sessions ADD COLUMN duration_minutes INTEGER DEFAULT 90;');
        console.log('\n--- End of SQL ---\n');
      } else {
        console.log('✅ Column appears to already exist or migration was successful');
      }
    } else {
      console.log('✅ Migration completed successfully');
    }

    // Verify the column exists
    const { data, error: selectError } = await supabase
      .from('sessions')
      .select('duration_minutes')
      .limit(1);

    if (!selectError) {
      console.log('✅ Verified: duration_minutes column is accessible');
    } else {
      console.log('❌ Verification failed:', selectError.message);
    }

  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
}

runMigration();
