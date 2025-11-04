require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function deleteCommunities() {
  console.log('🔍 Finding communities to delete...\n');

  // Find communities
  const { data: communities, error: findError } = await supabase
    .from('communities')
    .select('id, name')
    .or('name.ilike.%DPL%,name.ilike.%Emirates Gas%');

  if (findError) {
    console.error('❌ Error finding communities:', findError.message);
    return;
  }

  if (!communities || communities.length === 0) {
    console.log('ℹ️  No communities found matching DPL or Emirates Gas');
    return;
  }

  console.log('Found communities to delete:');
  communities.forEach(c => console.log(`  - ${c.name} (ID: ${c.id})`));
  console.log('');

  const communityIds = communities.map(c => c.id);

  // Delete sessions for these communities
  console.log('1. Deleting sessions...');
  const { error: sessionsError } = await supabase
    .from('sessions')
    .delete()
    .in('community_id', communityIds);

  if (sessionsError) {
    console.error('❌ Error deleting sessions:', sessionsError.message);
  } else {
    console.log('✅ Sessions deleted');
  }

  // Delete community memberships
  console.log('2. Deleting community memberships...');
  const { error: membershipsError } = await supabase
    .from('community_members')
    .delete()
    .in('community_id', communityIds);

  if (membershipsError) {
    console.error('❌ Error deleting memberships:', membershipsError.message);
  } else {
    console.log('✅ Community memberships deleted');
  }

  // Delete community courts
  console.log('3. Deleting community courts...');
  const { error: courtsError } = await supabase
    .from('courts')
    .delete()
    .in('community_id', communityIds);

  if (courtsError) {
    console.error('❌ Error deleting courts:', courtsError.message);
  } else {
    console.log('✅ Community courts deleted');
  }

  // Delete the communities themselves
  console.log('4. Deleting communities...');
  const { error: communitiesError } = await supabase
    .from('communities')
    .delete()
    .in('id', communityIds);

  if (communitiesError) {
    console.error('❌ Error deleting communities:', communitiesError.message);
  } else {
    console.log('✅ Communities deleted');
  }

  console.log('');

  // Show remaining communities
  const { data: remaining } = await supabase
    .from('communities')
    .select('id, name');

  console.log('Remaining communities:', remaining?.length || 0);
  remaining?.forEach((c, i) => {
    console.log(`  ${i+1}. ${c.name}`);
  });

  console.log('\n✅ Deletion complete');
}

deleteCommunities();
