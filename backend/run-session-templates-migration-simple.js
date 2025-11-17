const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigrationStep(sql, description) {
  console.log(`  → ${description}...`);
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      // Many Supabase instances don't have exec_sql RPC, we'll need to use direct queries
      // For ALTER TABLE and CREATE TABLE, we can use the Supabase client directly
      console.log(`    Note: exec_sql not available, statement needs to be run in Supabase SQL Editor`);
      return { success: false, needsManual: true };
    }
    console.log(`    ✅ Done`);
    return { success: true };
  } catch (error) {
    console.log(`    ⚠️  ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function checkIfMigrationNeeded() {
  // Check if sub_community_id column exists in sessions table
  const { data: sessionColumns, error } = await supabase
    .from('sessions')
    .select('sub_community_id')
    .limit(0);

  // Check if session_templates table exists
  const { data: templateData, error: templateError } = await supabase
    .from('session_templates')
    .select('id')
    .limit(0);

  return {
    needsSessionUpdate: error?.code === 'PGRST116' || error?.code === '42703', // Column doesn't exist
    needsTemplateTable: templateError?.code === 'PGRST116' || templateError?.code === '42P01', // Table doesn't exist
  };
}

async function runMigration() {
  try {
    console.log('🔍 Checking migration status...');
    const status = await checkIfMigrationNeeded();

    if (!status.needsSessionUpdate && !status.needsTemplateTable) {
      console.log('✅ Migration appears to be already applied!');
      console.log('   - sub_community_id column exists in sessions table');
      console.log('   - session_templates table exists');
      return;
    }

    console.log('📖 Reading migration file...');
    const migrationPath = path.join(__dirname, 'migrations', 'add_session_templates_and_sub_community_sessions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('');
    console.log('📋 MANUAL MIGRATION REQUIRED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Due to Supabase limitations, please run this migration manually:');
    console.log('');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the SQL below:');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(migrationSQL);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('4. Click "Run" to execute the migration');
    console.log('');
    console.log('📍 Supabase Dashboard: https://supabase.com/dashboard/project/' + supabaseUrl.match(/https:\/\/([^.]+)/)[1]);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runMigration();
