const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMembershipStructure() {
  try {
    console.log('🔍 Checking membership structure...\n');

    // Get all memberships with community details
    const { data: memberships, error } = await supabase
      .from('community_members')
      .select('*, communities(id, name, parent_community_id)')
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching memberships:', error);
      return;
    }

    console.log('📊 Total memberships found:', memberships.length, '\n');

    if (memberships && memberships.length > 0) {
      memberships.forEach((m, index) => {
        console.log(`${index + 1}. Community: ${m.communities.name}`);
        console.log(`   Community ID: ${m.community_id}`);
        console.log(`   Sub-Community ID field: ${m.sub_community_id || 'NULL'}`);
        console.log(`   Is Sub-Community: ${m.communities.parent_community_id ? 'YES' : 'NO'}`);
        console.log(`   Parent Community ID: ${m.communities.parent_community_id || 'N/A'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

checkMembershipStructure();
