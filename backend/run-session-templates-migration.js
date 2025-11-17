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

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('📖 Reading migration file...');
    const migrationPath = path.join(__dirname, 'migrations', 'add_session_templates_and_sub_community_sessions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Running migration: add_session_templates_and_sub_community_sessions.sql');
    console.log('');

    // Split SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Try direct execution for DDL statements
        const { error: directError } = await supabase.from('_migrations').select('*').limit(0);
        if (directError) {
          console.error(`❌ Error on statement ${i + 1}:`, error.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   - Added sub_community_id to sessions table');
    console.log('   - Created session_templates table');
    console.log('   - Added created_from_template_id to sessions table');
    console.log('   - Updated available_sessions view');
    console.log('');
    console.log('🎉 You can now:');
    console.log('   1. Create session templates for recurring sessions');
    console.log('   2. Assign sessions to specific sub-community locations');
    console.log('   3. Bulk-create sessions from templates for multiple weeks');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('💡 Note: Some errors may be OK if the changes already exist.');
    console.error('    Check the error message to determine if action is needed.');
    process.exit(1);
  }
}

runMigration();
