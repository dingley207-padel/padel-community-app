import { supabase } from './src/config/database';

async function cleanFileUris() {
  console.log('=== Cleaning file:// URIs from database ===\n');

  // Clean users table
  const { data: users, error: userError } = await supabase
    .from('users')
    .update({ profile_image: null })
    .like('profile_image', 'file://%')
    .select('id, name');

  if (userError) {
    console.error('Error cleaning users:', userError);
  } else {
    console.log(`✓ Cleaned ${users?.length || 0} users with file:// URIs`);
    users?.forEach(user => console.log(`  - ${user.name} (${user.id})`));
  }

  // Clean communities table
  const { data: communities, error: commError } = await supabase
    .from('communities')
    .update({ profile_image: null })
    .like('profile_image', 'file://%')
    .select('id, name');

  if (commError) {
    console.error('Error cleaning communities:', commError);
  } else {
    console.log(`\n✓ Cleaned ${communities?.length || 0} communities with file:// URIs`);
    communities?.forEach(comm => console.log(`  - ${comm.name} (${comm.id})`));
  }

  // Clean banner images too
  const { data: banners, error: bannerError } = await supabase
    .from('communities')
    .update({ banner_image: null })
    .like('banner_image', 'file://%')
    .select('id, name');

  if (bannerError) {
    console.error('Error cleaning banner images:', bannerError);
  } else {
    console.log(`\n✓ Cleaned ${banners?.length || 0} community banner images with file:// URIs`);
    banners?.forEach(comm => console.log(`  - ${comm.name} (${comm.id})`));
  }

  console.log('\n=== Cleanup complete! ===');
}

cleanFileUris().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
