require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function listAllCommunities() {
  try {
    console.log('Fetching all communities from database...\n');

    // Get all communities
    const { data: communities, error: fetchError } = await supabase
      .from('communities')
      .select('id, name, parent_community_id, created_at')
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${communities.length} total communities:\n`);

    // Group by parent/sub
    const parentCommunities = communities.filter(c => !c.parent_community_id);
    const subCommunities = communities.filter(c => c.parent_community_id);

    console.log('=== PARENT COMMUNITIES ===\n');
    parentCommunities.forEach(c => {
      console.log(`  Name: "${c.name}"`);
      console.log(`  ID: ${c.id}`);
      console.log(`  Created: ${c.created_at}`);
      console.log('');
    });

    if (subCommunities.length > 0) {
      console.log('\n=== SUB-COMMUNITIES ===\n');
      subCommunities.forEach(c => {
        const parent = communities.find(p => p.id === c.parent_community_id);
        console.log(`  Name: "${c.name}"`);
        console.log(`  ID: ${c.id}`);
        console.log(`  Parent: "${parent ? parent.name : 'UNKNOWN'}"`);
        console.log(`  Created: ${c.created_at}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listAllCommunities();
