const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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
    console.log('🔌 Connecting to Supabase...');
    console.log(`   URL: ${supabaseUrl}`);

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'create_chat_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📄 Running chat migration via Supabase SQL...');
    console.log('   This will create:');
    console.log('   - conversations table');
    console.log('   - messages table');
    console.log('   - indexes and triggers\n');

    // Execute the migration using Supabase RPC
    // Note: Supabase doesn't have a direct SQL execution method, so we'll use rpc
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql RPC doesn't exist, we need to run it manually via Supabase dashboard
      console.log('ℹ️  Direct SQL execution not available via API.');
      console.log('\n📋 Please run the migration manually:');
      console.log('   1. Go to https://supabase.com/dashboard');
      console.log('   2. Select your project');
      console.log('   3. Go to SQL Editor');
      console.log(`   4. Copy and paste the contents of:\n      ${migrationPath}`);
      console.log('   5. Click "Run"\n');

      // Try alternative: create tables directly using the SDK
      console.log('🔄 Attempting to verify if tables already exist...\n');

      const { data: convCheck } = await supabase
        .from('conversations')
        .select('id')
        .limit(1);

      const { data: msgCheck } = await supabase
        .from('messages')
        .select('id')
        .limit(1);

      if (convCheck !== null || msgCheck !== null) {
        console.log('✅ Tables appear to already exist!');
        console.log('   - conversations table: exists');
        console.log('   - messages table: exists');
        return;
      }

      console.log('⚠️  Tables do not exist yet. Please run the migration via Supabase dashboard.');
      process.exit(1);
    }

    console.log('✅ Chat migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);

    console.log('\n📋 Manual migration instructions:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Copy and paste the SQL from:');
    console.log('      backend/migrations/create_chat_tables.sql');
    console.log('   5. Click "Run"');

    process.exit(1);
  }
}

runMigration();
