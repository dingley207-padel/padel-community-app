const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findOldCommunity() {
  try {
    console.log('🔍 Looking for community 5f1c0225-abde-4f48-860c-419f6cd40eaa...\n');

    const { data: community, error } = await supabase
      .from('communities')
      .select('*')
      .eq('id', '5f1c0225-abde-4f48-860c-419f6cd40eaa')
      .single();

    if (error) {
      console.log('❌ Community not found in database:', error.message);
      console.log('\n✅ This confirms the frontend is using cached data!');
      return;
    }

    if (community) {
      console.log('⚠️  Community still exists in database:');
      console.log(`   Name: ${community.name}`);
      console.log(`   Location: ${community.location}`);
      console.log(`   Manager: ${community.manager_id}`);
    }

  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

findOldCommunity();
