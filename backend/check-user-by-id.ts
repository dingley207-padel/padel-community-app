import { supabase } from './src/config/database';

async function checkUserById() {
  const userId = 'ed8bef2d-d6aa-44fa-9aef-67b86def17a5'; // Ross's user ID from the logs

  console.log(`\n=== Checking user ${userId} ===\n`);

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
  } else if (user) {
    console.log('User found:');
    console.log(JSON.stringify(user, null, 2));
    console.log('\nProfile Image:');
    if (user.profile_image) {
      console.log(`  Length: ${user.profile_image.length}`);
      console.log(`  Starts with: ${user.profile_image.substring(0, 80)}`);
      console.log(`  Is base64: ${user.profile_image.startsWith('data:image/')}`);
      console.log(`  Is file URI: ${user.profile_image.startsWith('file://')}`);
    } else {
      console.log('  NULL');
    }
  } else {
    console.log('User not found');
  }
}

checkUserById().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
