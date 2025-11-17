const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubCommunityMembers() {
  try {
    console.log('🔍 Checking sub-community member counts...\n');

    // Get parent community
    const { data: parentComm } = await supabase
      .from('communities')
      .select('*')
      .is('parent_community_id', null)
      .single();

    if (!parentComm) {
      console.log('❌ No parent community found');
      return;
    }

    console.log(`Parent Community: ${parentComm.name} (${parentComm.id})\n`);

    // Get sub-communities
    const { data: subComms, error } = await supabase
      .from('communities')
      .select('*')
      .eq('parent_community_id', parentComm.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Error fetching sub-communities:', error);
      return;
    }

    console.log(`📊 Found ${subComms?.length || 0} sub-communities\n`);

    // For each sub-community, count members
    for (const subComm of subComms) {
      const { count } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', subComm.id);

      console.log(`📍 ${subComm.name}`);
      console.log(`   ID: ${subComm.id}`);
      console.log(`   Member Count: ${count || 0}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

checkSubCommunityMembers();
