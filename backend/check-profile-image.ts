import { supabase } from './src/config/database';

async function checkProfileImage() {
  const userId = 'ed8bef2d-d6aa-44fa-9aef-67b86def17a5';

  console.log(`\n=== Checking profile image for user ${userId} ===\n`);

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, profile_image')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error:', error);
  } else if (user) {
    console.log('User:', user.name);
    console.log('Profile Image:');
    if (user.profile_image) {
      console.log(`  Full value: ${user.profile_image}`);
      console.log(`  Length: ${user.profile_image.length}`);
      console.log(`  Starts with: ${user.profile_image.substring(0, 100)}`);
      console.log(`  Is base64 data URL: ${user.profile_image.startsWith('data:image/')}`);
      console.log(`  Is file URI: ${user.profile_image.startsWith('file://')}`);
      console.log(`  Is HTTP URL: ${user.profile_image.startsWith('http')}`);
    } else {
      console.log('  NULL');
    }
  } else {
    console.log('User not found');
  }
}

checkProfileImage().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
