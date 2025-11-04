require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function deleteSessions() {
  console.log('🔍 Finding Love The Padel community...\n');

  // Find Love The Padel community
  const { data: community, error: findError } = await supabase
    .from('communities')
    .select('id, name')
    .ilike('name', '%Love The Padel%')
    .single();

  if (findError || !community) {
    console.error('❌ Error finding community:', findError?.message || 'Community not found');
    return;
  }

  console.log(`Found community: ${community.name} (ID: ${community.id})\n`);

  // Count sessions before deletion
  const { count: sessionCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('community_id', community.id);

  console.log(`Sessions to delete: ${sessionCount || 0}\n`);

  if (sessionCount === 0) {
    console.log('✅ No sessions to delete');
    return;
  }

  // Delete all sessions for this community
  console.log('Deleting sessions...');
  const { error: deleteError } = await supabase
    .from('sessions')
    .delete()
    .eq('community_id', community.id);

  if (deleteError) {
    console.error('❌ Error deleting sessions:', deleteError.message);
  } else {
    console.log('✅ All sessions deleted successfully');
  }

  // Verify deletion
  const { count: remainingCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('community_id', community.id);

  console.log(`\nRemaining sessions: ${remainingCount || 0}`);
  console.log('\n✅ Deletion complete');
}

deleteSessions();
