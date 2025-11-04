require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Running pending_registrations migration...\n');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'database/migrations/001_pending_registrations.sql'),
      'utf8'
    );

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 100) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Try direct execution if rpc fails
        const { error: directError } = await supabase.from('_sql').select('*').limit(0);
        console.log('⚠️  RPC method not available, trying alternative...');

        // Log the SQL for manual execution
        console.log('\n📋 Please run this SQL manually in your Supabase SQL Editor:');
        console.log('\n' + migrationSQL);
        console.log('\n');
        break;
      }
    }

    console.log('\n✅ Migration script prepared!');
    console.log('\n📋 Copy the SQL from database/migrations/001_pending_registrations.sql');
    console.log('   and run it in your Supabase SQL Editor:\n');
    console.log('   https://supabase.com/dashboard/project/YOUR_PROJECT/sql\n');

  } catch (error) {
    console.error('❌ Migration error:', error.message);

    console.log('\n📋 Please run the following SQL manually in Supabase SQL Editor:');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'database/migrations/001_pending_registrations.sql'),
      'utf8'
    );
    console.log('\n' + migrationSQL + '\n');
  }
}

runMigration();
