require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function deleteAnnouncements() {
  console.log('🔍 Finding announcements...\n');

  // Count announcements before deletion
  const { count: announcementCount } = await supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true });

  console.log(`Announcements to delete: ${announcementCount || 0}\n`);

  if (announcementCount === 0) {
    console.log('✅ No announcements to delete');
    return;
  }

  // Get all announcements to show what we're deleting
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, community_id');

  if (announcements && announcements.length > 0) {
    console.log('Found announcements:');
    announcements.forEach((a, i) => {
      console.log(`  ${i + 1}. ${a.title}`);
    });
    console.log('');
  }

  // Delete all announcements
  console.log('Deleting announcements...');
  const { error: deleteError } = await supabase
    .from('announcements')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that matches everything)

  if (deleteError) {
    console.error('❌ Error deleting announcements:', deleteError.message);
  } else {
    console.log('✅ All announcements deleted successfully');
  }

  // Verify deletion
  const { count: remainingCount } = await supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true });

  console.log(`\nRemaining announcements: ${remainingCount || 0}`);
  console.log('\n✅ Deletion complete');
}

deleteAnnouncements();
