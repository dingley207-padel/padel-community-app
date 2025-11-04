require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function deleteSummaries() {
  console.log('🔍 Finding summary data...\n');

  // Count user summaries
  const { count: userSummaryCount } = await supabase
    .from('user_summary')
    .select('*', { count: 'exact', head: true });

  // Count community summaries
  const { count: communitySummaryCount } = await supabase
    .from('community_summary')
    .select('*', { count: 'exact', head: true });

  console.log(`User summaries to delete: ${userSummaryCount || 0}`);
  console.log(`Community summaries to delete: ${communitySummaryCount || 0}\n`);

  if ((userSummaryCount || 0) === 0 && (communitySummaryCount || 0) === 0) {
    console.log('✅ No summaries to delete');
    return;
  }

  // Delete user summaries
  if (userSummaryCount > 0) {
    console.log('Deleting user summaries...');
    const { error: userSummaryError } = await supabase
      .from('user_summary')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (userSummaryError) {
      console.error('❌ Error deleting user summaries:', userSummaryError.message);
    } else {
      console.log('✅ User summaries deleted');
    }
  }

  // Delete community summaries
  if (communitySummaryCount > 0) {
    console.log('Deleting community summaries...');
    const { error: communitySummaryError } = await supabase
      .from('community_summary')
      .delete()
      .neq('community_id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (communitySummaryError) {
      console.error('❌ Error deleting community summaries:', communitySummaryError.message);
    } else {
      console.log('✅ Community summaries deleted');
    }
  }

  console.log('');

  // Verify deletion
  const { count: remainingUserSummaries } = await supabase
    .from('user_summary')
    .select('*', { count: 'exact', head: true });

  const { count: remainingCommunitySummaries } = await supabase
    .from('community_summary')
    .select('*', { count: 'exact', head: true });

  console.log(`Remaining user summaries: ${remainingUserSummaries || 0}`);
  console.log(`Remaining community summaries: ${remainingCommunitySummaries || 0}`);
  console.log('\n✅ Deletion complete');
}

deleteSummaries();
