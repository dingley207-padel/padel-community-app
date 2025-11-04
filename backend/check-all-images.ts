import { supabase } from './src/config/database';

async function checkAllImages() {
  console.log('=== Checking ALL users (no filter) ===\n');

  const { data: allUsers, error: allUsersError } = await supabase
    .from('users')
    .select('id, name, profile_image')
    .limit(10);

  if (allUsersError) {
    console.error('Error fetching users:', allUsersError);
  } else if (allUsers) {
    console.log(`Found ${allUsers.length} users total\n`);
    allUsers.forEach(user => {
      console.log(`User: ${user.name} (${user.id})`);
      if (user.profile_image) {
        const preview = user.profile_image.substring(0, 80);
        console.log(`  Image: ${preview}...`);
        console.log(`  Type: ${user.profile_image.startsWith('data:image/') ? 'base64' : user.profile_image.startsWith('file://') ? 'FILE URI' : 'other'}`);
      } else {
        console.log(`  Image: null`);
      }
      console.log('');
    });
  }

  console.log('\n=== Checking ALL communities (no filter) ===\n');

  const { data: allComms, error: allCommsError } = await supabase
    .from('communities')
    .select('id, name, profile_image, banner_image')
    .limit(10);

  if (allCommsError) {
    console.error('Error fetching communities:', allCommsError);
  } else if (allComms) {
    console.log(`Found ${allComms.length} communities total\n`);
    allComms.forEach(comm => {
      console.log(`Community: ${comm.name} (${comm.id})`);
      if (comm.profile_image) {
        const preview = comm.profile_image.substring(0, 80);
        console.log(`  Profile: ${preview}...`);
        console.log(`  Type: ${comm.profile_image.startsWith('data:image/') ? 'base64' : comm.profile_image.startsWith('file://') ? 'FILE URI' : 'other'}`);
      } else {
        console.log(`  Profile: null`);
      }
      if (comm.banner_image) {
        const preview = comm.banner_image.substring(0, 80);
        console.log(`  Banner: ${preview}...`);
        console.log(`  Type: ${comm.banner_image.startsWith('data:image/') ? 'base64' : comm.banner_image.startsWith('file://') ? 'FILE URI' : 'other'}`);
      } else {
        console.log(`  Banner: null`);
      }
      console.log('');
    });
  }
}

checkAllImages().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
