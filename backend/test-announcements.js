const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testAnnouncementsTable() {
  console.log('Testing announcements table access via Supabase client...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Attempting to query announcements table...');
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .limit(5);

    if (error) {
      console.error('\n❌ Error querying announcements table:');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);

      if (error.message && error.message.includes('schema cache')) {
        console.log('\n💡 This is a PostgREST schema cache issue.');
        console.log('   Solutions:');
        console.log('   1. Go to Supabase Dashboard > Settings > API');
        console.log('   2. Click "Restart API" to force schema reload');
        console.log('   3. Or wait 5-10 minutes for automatic refresh');
      }
    } else {
      console.log('\n✅ Successfully queried announcements table!');
      console.log(`   Found ${data.length} announcements`);
      if (data.length > 0) {
        console.log('   Sample:', JSON.stringify(data[0], null, 2));
      }
    }
  } catch (err) {
    console.error('\n❌ Unexpected error:', err.message);
  }
}

testAnnouncementsTable();
