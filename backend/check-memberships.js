const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMemberships() {
  try {
    console.log('🔍 Checking community memberships...\n');

    // Get all memberships
    const { data: memberships, error } = await supabase
      .from('community_members')
      .select('*, users(name, email), communities(name, parent_community_id)')
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching memberships:', error);
      return;
    }

    console.log(`📊 Total memberships found: ${memberships?.length || 0}\n`);

    if (memberships && memberships.length > 0) {
      memberships.forEach((m, index) => {
        const isSubCommunity = m.communities.parent_community_id ? '[SUB]' : '[PARENT]';
        console.log(`${index + 1}. ${isSubCommunity} ${m.communities.name}`);
        console.log(`   User: ${m.users.name} (${m.users.email})`);
        console.log(`   Joined: ${m.joined_at}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No memberships found!');
    }

  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

checkMemberships();
