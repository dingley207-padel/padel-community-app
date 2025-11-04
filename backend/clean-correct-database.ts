import { supabase } from './src/config/database';

async function cleanCorrectDatabase() {
  console.log('=== Cleaning file:// URIs from CORRECT database ===');
  console.log('Database URL:', process.env.SUPABASE_URL);
  console.log('');

  // First, check if user ed8bef2d-d6aa-44fa-9aef-67b86def17a5 exists
  const userId = 'ed8bef2d-d6aa-44fa-9aef-67b86def17a5';
  console.log(`Checking for user ${userId}...`);

  const { data: user, error: userCheckError } = await supabase
    .from('users')
    .select('id, name, profile_image')
    .eq('id', userId)
    .maybeSingle();

  if (userCheckError) {
    console.error('Error checking user:', userCheckError);
  } else if (user) {
    console.log(`✓ Found user: ${user.name}`);
    if (user.profile_image) {
      console.log(`  Current profile_image: ${user.profile_image.substring(0, 80)}`);
      console.log(`  Is file URI: ${user.profile_image.startsWith('file://') ? 'YES' : 'NO'}`);
    } else {
      console.log(`  Current profile_image: null`);
    }
  } else {
    console.log('✗ User not found in this database');
    console.log('This means we are connected to the WRONG database!');
    return;
  }

  console.log('\n=== Cleaning all file:// URIs ===\n');

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
    users?.forEach(u => console.log(`  - ${u.name} (${u.id})`));
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

cleanCorrectDatabase().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
