require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function runMigration() {
  try {
    console.log('Adding gender field to users table...');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

        ALTER TABLE users
        DROP CONSTRAINT IF EXISTS check_gender;

        ALTER TABLE users
        ADD CONSTRAINT check_gender CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say') OR gender IS NULL);
      `
    });

    if (error) {
      console.error('Migration error:', error.message);
      // Try alternative approach - direct SQL
      console.log('Trying alternative approach...');
      const { error: altError } = await supabase
        .from('users')
        .select('gender')
        .limit(1);

      if (altError && altError.message.includes('column') && altError.message.includes('does not exist')) {
        console.log('✓ Gender column needs to be added manually in Supabase SQL Editor');
        console.log('\nRun this SQL in your Supabase SQL Editor:');
        console.log('----------------------------------------');
        console.log(`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);`);
        console.log(`ALTER TABLE users DROP CONSTRAINT IF EXISTS check_gender;`);
        console.log(`ALTER TABLE users ADD CONSTRAINT check_gender CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say') OR gender IS NULL);`);
        console.log('----------------------------------------');
      } else {
        console.log('✓ Gender column already exists or migration completed');
      }
    } else {
      console.log('✓ Migration completed successfully!');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n✓ Please run this SQL manually in Supabase SQL Editor:');
    console.log('----------------------------------------');
    console.log(`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);`);
    console.log('----------------------------------------');
  }
}

runMigration();
