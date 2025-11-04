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
    console.log('Running cancellation policy migration...');

    const migrationPath = path.join(__dirname, 'database/migrations/002_cancellation_policy.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 80)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
          console.error('Error:', error);
          // Continue with other statements
        } else {
          console.log('✓ Success');
        }
      }
    }

    console.log('\nMigration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
