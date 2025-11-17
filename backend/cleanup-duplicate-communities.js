require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function cleanupDuplicateCommunities() {
  try {
    console.log('Starting cleanup of duplicate communities...\n');

    // Get all communities
    const { data: communities, error: fetchError } = await supabase
      .from('communities')
      .select('id, name, parent_community_id, created_at')
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${communities.length} total communities\n`);

    // Find the CORRECT "Love The Padel" parent community
    const loveThePadelParent = communities.find(
      c => c.name === 'Love The Padel' && !c.parent_community_id
    );

    if (!loveThePadelParent) {
      console.log('❌ Could not find "Love The Padel" parent community');
      return;
    }

    console.log(`✅ Found correct parent community: "${loveThePadelParent.name}" (ID: ${loveThePadelParent.id})\n`);

    // Find all communities to delete:
    // 1. Any parent community that is NOT "Love The Padel"
    // 2. Keep only the oldest set of sub-communities (created at 10:40:06)

    const toDelete = [];

    // Delete incorrect parent communities
    const incorrectParents = communities.filter(c =>
      !c.parent_community_id && c.id !== loveThePadelParent.id
    );
    toDelete.push(...incorrectParents);

    // Find duplicate sub-communities (keep oldest, delete newer ones)
    const subCommunities = communities.filter(c => c.parent_community_id === loveThePadelParent.id);
    const subCommunitiesByName = {};

    subCommunities.forEach(sub => {
      if (!subCommunitiesByName[sub.name]) {
        subCommunitiesByName[sub.name] = [];
      }
      subCommunitiesByName[sub.name].push(sub);
    });

    // For each name, keep the oldest and mark newer ones for deletion
    Object.values(subCommunitiesByName).forEach(subs => {
      if (subs.length > 1) {
        // Sort by created_at and keep the first (oldest)
        subs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        // Mark all but the first for deletion
        toDelete.push(...subs.slice(1));
      }
    });

    if (toDelete.length === 0) {
      console.log('✅ No communities to delete');
      return;
    }

    console.log(`Found ${toDelete.length} communities to delete:\n`);
    toDelete.forEach(c => {
      const type = c.parent_community_id ? 'Sub-community' : 'Parent community';
      console.log(`  - [${type}] "${c.name}" (ID: ${c.id})`);
    });
    console.log('');

    // Delete each community
    for (const community of toDelete) {
      console.log(`Deleting: "${community.name}"...`);

      // First, delete related records
      // Delete community members
      const { error: membersError } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', community.id);

      if (membersError) {
        console.log(`  ⚠️  Error deleting members: ${membersError.message}`);
      } else {
        console.log(`  ✓ Deleted community members`);
      }

      // Delete community managers
      const { error: managersError } = await supabase
        .from('community_managers')
        .delete()
        .eq('community_id', community.id);

      if (managersError) {
        console.log(`  ⚠️  Error deleting managers: ${managersError.message}`);
      } else {
        console.log(`  ✓ Deleted community managers`);
      }

      // Delete sessions
      const { error: sessionsError } = await supabase
        .from('sessions')
        .delete()
        .eq('community_id', community.id);

      if (sessionsError) {
        console.log(`  ⚠️  Error deleting sessions: ${sessionsError.message}`);
      } else {
        console.log(`  ✓ Deleted sessions`);
      }

      // Finally, delete the community itself
      const { error: deleteError } = await supabase
        .from('communities')
        .delete()
        .eq('id', community.id);

      if (deleteError) {
        console.log(`  ❌ Error deleting community: ${deleteError.message}`);
      } else {
        console.log(`  ✅ Successfully deleted "${community.name}"\n`);
      }
    }

    console.log('\n✅ Cleanup complete!');
    console.log(`\nRemaining structure:`);
    console.log(`  Parent: "${loveThePadelParent.name}"`);

    const remainingSubs = Object.keys(subCommunitiesByName);
    if (remainingSubs.length > 0) {
      console.log(`  Sub-communities: ${remainingSubs.join(', ')}`);
    }

    console.log('\nYou can now manage sub-communities from the Community Manager dashboard.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupDuplicateCommunities();
