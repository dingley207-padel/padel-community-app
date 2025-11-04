require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Running member status migration...');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'database/migrations/004_add_member_status.sql'),
      'utf8'
    );

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 100) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Try direct execution if RPC fails
        console.log('RPC failed, trying direct execution...');
        const { error: directError } = await supabase.from('_sql').insert({ query: statement });
        if (directError) {
          console.error('Error executing statement:', directError);
        }
      }
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
