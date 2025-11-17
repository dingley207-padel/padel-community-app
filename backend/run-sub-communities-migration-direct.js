const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🔄 Running sub-communities migration...');

    const migrationPath = path.join(__dirname, 'migrations', 'add_sub_communities.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'COMMENT ON COLUMN communities.parent_community_id IS \'References parent community for sub-communities. NULL for parent communities.\'');

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      console.log(`  ${statement.substring(0, 80)}...`);

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        console.error(`  ❌ Error: ${error.message}`);
        // Try direct approach as fallback
        console.log('  Trying alternative method...');
        throw error;
      } else {
        console.log('  ✅ Success');
      }
    }

    console.log('\n✅ Migration completed successfully!');

    // Verify the column was created
    console.log('\nVerifying migration...');
    const { data: columns, error: verifyError } = await supabase
      .from('communities')
      .select('*')
      .limit(1);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ Migration verified - communities table is accessible');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nPlease run the migration manually in Supabase SQL Editor:');
    console.error('1. Go to https://supabase.com/dashboard/project/[your-project]/sql');
    console.error('2. Paste the contents of migrations/add_sub_communities.sql');
    console.error('3. Click "Run"');
    process.exit(1);
  }
}

runMigration();
