const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log('🔧 Fixing booking constraint to allow rebooking after cancellation...\n');

    // Step 1: Drop the old constraint
    console.log('Step 1: Dropping old unique constraint...');
    const dropConstraint = `
      ALTER TABLE bookings
      DROP CONSTRAINT IF EXISTS bookings_user_id_session_id_key;
    `;

    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql_query: dropConstraint
    });

    if (dropError) {
      // Try direct query if RPC doesn't work
      console.log('Trying alternative method...');
      const { error: altError } = await supabase
        .from('bookings')
        .select('id')
        .limit(1);

      if (!altError) {
        console.log('⚠️  Cannot drop constraint via API. Please run this SQL manually in Supabase dashboard:');
        console.log('\n' + dropConstraint + '\n');
      }
    } else {
      console.log('✓ Old constraint dropped\n');
    }

    // Step 2: Create partial unique index
    console.log('Step 2: Creating partial unique index for active bookings only...');
    const createIndex = `
      CREATE UNIQUE INDEX IF NOT EXISTS bookings_user_session_active_unique
      ON bookings(user_id, session_id)
      WHERE cancelled_at IS NULL;
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql_query: createIndex
    });

    if (indexError) {
      console.log('⚠️  Cannot create index via API. Please run this SQL manually in Supabase dashboard:');
      console.log('\n' + createIndex + '\n');
    } else {
      console.log('✓ Partial unique index created\n');
    }

    console.log('✅ Migration instructions provided!');
    console.log('\nIf you see warnings above, please:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Open the SQL Editor');
    console.log('3. Run the SQL commands shown above');
    console.log('\nThis will allow users to rebook sessions after cancelling.');

  } catch (error) {
    console.error('❌ Migration error:', error);
    console.log('\n📝 Manual SQL to run in Supabase dashboard:');
    console.log(`
-- Drop old constraint
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_user_id_session_id_key;

-- Create partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS bookings_user_session_active_unique
ON bookings(user_id, session_id)
WHERE cancelled_at IS NULL;
    `);
  }
}

runMigration();
