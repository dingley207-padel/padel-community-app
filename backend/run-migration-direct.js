require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  console.log('Creating pending_registrations table...');
  
  // Try to query the table to see if it exists
  const { data, error } = await supabase
    .from('pending_registrations')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('Table does not exist. Error:', error.message);
    console.log('\n📋 Please run the SQL migration manually in Supabase Dashboard:');
    console.log('   Go to: https://supabase.com/dashboard -> SQL Editor');
    console.log('   Run the SQL from: database/migrations/001_pending_registrations.sql\n');
  } else {
    console.log('✅ Table already exists!');
  }
}

createTable();
