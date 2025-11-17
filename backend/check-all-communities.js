const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllCommunities() {
  try {
    console.log('🔍 Checking all communities in database...\n');

    // Get all communities
    const { data: communities, error } = await supabase
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching communities:', error);
      return;
    }

    console.log('📊 Total communities found:', communities?.length || 0);
    console.log('\n');

    if (communities && communities.length > 0) {
      communities.forEach((comm, index) => {
        const isSubCommunity = comm.parent_community_id ? '  [SUB-COMMUNITY]' : '[PARENT]';
        console.log(`${index + 1}. ${isSubCommunity} ${comm.name}`);
        console.log(`   ID: ${comm.id}`);
        console.log(`   Location: ${comm.location || 'N/A'}`);
        console.log(`   Manager: ${comm.manager_id}`);
        if (comm.parent_community_id) {
          console.log(`   Parent ID: ${comm.parent_community_id}`);
        }
        console.log(`   Created: ${comm.created_at}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

checkAllCommunities();
