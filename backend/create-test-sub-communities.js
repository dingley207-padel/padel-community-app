const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestSubCommunities() {
  try {
    console.log('🔄 Creating test sub-communities...\n');

    // Get all existing communities
    const { data: communities, error: commError } = await supabase
      .from('communities')
      .select('*')
      .is('parent_community_id', null)
      .limit(3);

    if (commError) {
      throw new Error(`Failed to fetch communities: ${commError.message}`);
    }

    if (!communities || communities.length === 0) {
      console.log('❌ No parent communities found. Please create a community first.');
      process.exit(1);
    }

    console.log(`Found ${communities.length} parent communities\n`);

    // Create sub-communities for the first parent community
    const parentCommunity = communities[0];
    console.log(`Creating sub-communities for: ${parentCommunity.name}`);
    console.log(`Manager ID: ${parentCommunity.manager_id}\n`);

    const subCommunities = [
      {
        name: `${parentCommunity.name} - JGE`,
        description: 'Jumeirah Golf Estates location',
        location: 'Jumeirah Golf Estates, Dubai',
        manager_id: parentCommunity.manager_id,
        parent_community_id: parentCommunity.id,
        visibility: true,
      },
      {
        name: `${parentCommunity.name} - Al Furjan`,
        description: 'Al Furjan location',
        location: 'Al Furjan, Dubai',
        manager_id: parentCommunity.manager_id,
        parent_community_id: parentCommunity.id,
        visibility: true,
      },
      {
        name: `${parentCommunity.name} - Marina`,
        description: 'Dubai Marina location',
        location: 'Dubai Marina, Dubai',
        manager_id: parentCommunity.manager_id,
        parent_community_id: parentCommunity.id,
        visibility: true,
      },
    ];

    // Insert sub-communities
    const { data: created, error: insertError } = await supabase
      .from('communities')
      .insert(subCommunities)
      .select();

    if (insertError) {
      throw new Error(`Failed to create sub-communities: ${insertError.message}`);
    }

    console.log(`✅ Created ${created.length} sub-communities:\n`);
    created.forEach((sub, index) => {
      console.log(`${index + 1}. ${sub.name}`);
      console.log(`   Location: ${sub.location}`);
      console.log(`   ID: ${sub.id}\n`);
    });

    console.log('✅ Test sub-communities created successfully!');
    console.log('\n📱 You can now test joining communities in the app!');
    console.log(`\nParent Community: ${parentCommunity.name}`);
    console.log(`When you click "Join", you should see a modal with ${created.length} locations to choose from.`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

createTestSubCommunities();
