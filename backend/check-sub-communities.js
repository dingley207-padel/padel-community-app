const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubCommunities() {
  try {
    console.log('🔍 Checking sub-communities in database...\n');

    // Get the parent community
    const { data: parentCommunity } = await supabase
      .from('communities')
      .select('*')
      .eq('name', 'Love The Padel')
      .is('parent_community_id', null)
      .single();

    if (!parentCommunity) {
      console.log('❌ Parent community not found');
      return;
    }

    console.log('✅ Found parent community:', parentCommunity.id, '-', parentCommunity.name);

    // Get sub-communities
    const { data: subCommunities, error } = await supabase
      .from('communities')
      .select('*')
      .eq('parent_community_id', parentCommunity.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Error fetching sub-communities:', error);
      return;
    }

    console.log('\n📊 Sub-communities found:', subCommunities?.length || 0);

    if (subCommunities && subCommunities.length > 0) {
      subCommunities.forEach((sub, index) => {
        console.log(`\n${index + 1}. ${sub.name}`);
        console.log(`   ID: ${sub.id}`);
        console.log(`   Location: ${sub.location || 'N/A'}`);
        console.log(`   Parent: ${sub.parent_community_id}`);
      });
    } else {
      console.log('⚠️  No sub-communities found!');
    }

  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

checkSubCommunities();
