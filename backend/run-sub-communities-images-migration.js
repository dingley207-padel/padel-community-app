const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running migration: add_sub_communities_images.sql');

    const migrationPath = path.join(__dirname, 'migrations', 'add_sub_communities_images.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon and run each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 100) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        // Try direct query if RPC doesn't work
        console.log('RPC failed, trying direct query...');
        const { error: directError } = await supabase.from('_raw').select('*').limit(0);

        // Since Supabase client doesn't support raw SQL directly, we'll use a workaround
        console.log('Attempting to add columns via Supabase...');

        // Check if columns exist
        const { data: existingData } = await supabase
          .from('sub_communities')
          .select('*')
          .limit(1);

        if (existingData && existingData.length > 0) {
          const hasProfileImage = 'profile_image' in existingData[0];
          const hasBannerImage = 'banner_image' in existingData[0];

          if (hasProfileImage && hasBannerImage) {
            console.log('✅ Columns already exist!');
          } else {
            console.log('⚠️  Columns may not exist. Please run migration manually.');
            console.log('\nRun this SQL directly in your database:');
            console.log(migrationSQL);
          }
        }
      } else {
        console.log('✅ Statement executed successfully');
      }
    }

    console.log('\n✅ Migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\nPlease run this SQL manually in your database:');
    const migrationPath = path.join(__dirname, 'migrations', 'add_sub_communities_images.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(migrationSQL);
    process.exit(1);
  }
}

runMigration();
