require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkCommunitiesState() {
  try {
    console.log('🔍 Checking current state of communities in database...\n');

    // Get all communities
    const { data: allCommunities, error: allError } = await supabase
      .from('communities')
      .select('id, name, parent_community_id, created_at')
      .order('created_at', { ascending: true });

    if (allError) {
      throw allError;
    }

    console.log(`Total communities in database: ${allCommunities.length}\n`);

    // Separate parent and sub-communities
    const parentCommunities = allCommunities.filter(c => !c.parent_community_id);
    const subCommunities = allCommunities.filter(c => c.parent_community_id);

    console.log('=== PARENT COMMUNITIES ===');
    console.log(`Count: ${parentCommunities.length}\n`);
    parentCommunities.forEach(c => {
      console.log(`  - "${c.name}"`);
      console.log(`    ID: ${c.id}`);
      console.log(`    Created: ${c.created_at}\n`);
    });

    console.log('\n=== SUB-COMMUNITIES ===');
    console.log(`Count: ${subCommunities.length}\n`);
    subCommunities.forEach(c => {
      const parent = allCommunities.find(p => p.id === c.parent_community_id);
      console.log(`  - "${c.name}"`);
      console.log(`    ID: ${c.id}`);
      console.log(`    Parent: "${parent ? parent.name : 'UNKNOWN'}"`);
      console.log(`    Parent ID: ${c.parent_community_id}`);
      console.log(`    Created: ${c.created_at}\n`);
    });

    // Now test the actual query that the backend uses for super admins
    console.log('\n=== TESTING BACKEND QUERY (Super Admin) ===');
    const { data: backendResult, error: backendError } = await supabase
      .from('communities')
      .select('id, name, description, location, profile_image, parent_community_id')
      .is('parent_community_id', null)
      .order('name');

    if (backendError) {
      console.log('❌ Backend query error:', backendError);
    } else {
      console.log(`Backend query returned ${backendResult.length} communities:\n`);
      backendResult.forEach(c => {
        console.log(`  - "${c.name}"`);
        console.log(`    ID: ${c.id}`);
        console.log(`    parent_community_id: ${c.parent_community_id}\n`);
      });
    }

    // Check if there are any communities with parent_community_id that is NOT null
    const shouldBeFiltered = allCommunities.filter(c => c.parent_community_id !== null);
    if (shouldBeFiltered.length > 0) {
      console.log(`\n⚠️  Found ${shouldBeFiltered.length} communities that should be filtered out:`);
      shouldBeFiltered.forEach(c => {
        console.log(`  - "${c.name}" (parent_community_id: ${c.parent_community_id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCommunitiesState();
