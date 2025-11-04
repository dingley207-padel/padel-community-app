const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://byhbzihfzdukiuazpcpt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aGJ6aWhmemR1a2l1YXpwY3B0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODM0MjExOSwiZXhwIjoyMDUzOTE4MTE5fQ.gFYv5Bl8X1c3I1TxDH3QV2hNx4R6T6xxzlU9KqOm8Qg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImages() {
  console.log('=== Checking Community Images ===\n');

  const { data: communities, error: commError } = await supabase
    .from('communities')
    .select('id, name, profile_image')
    .not('profile_image', 'is', null)
    .limit(5);

  if (commError) {
    console.error('Error fetching communities:', commError);
  } else {
    communities.forEach(comm => {
      const preview = comm.profile_image ? comm.profile_image.substring(0, 60) : 'null';
      console.log(`Community: ${comm.name}`);
      console.log(`  ID: ${comm.id}`);
      console.log(`  Image starts with: ${preview}`);
      console.log(`  Is base64: ${comm.profile_image?.startsWith('data:image/') ? 'YES' : 'NO'}`);
      console.log(`  Is file URI: ${comm.profile_image?.startsWith('file://') ? 'YES' : 'NO'}`);
      console.log('');
    });
  }

  console.log('\n=== Checking User Images ===\n');

  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, name, profile_image')
    .not('profile_image', 'is', null)
    .limit(5);

  if (userError) {
    console.error('Error fetching users:', userError);
  } else {
    users.forEach(user => {
      const preview = user.profile_image ? user.profile_image.substring(0, 60) : 'null';
      console.log(`User: ${user.name}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Image starts with: ${preview}`);
      console.log(`  Is base64: ${user.profile_image?.startsWith('data:image/') ? 'YES' : 'NO'}`);
      console.log(`  Is file URI: ${user.profile_image?.startsWith('file://') ? 'YES' : 'NO'}`);
      console.log('');
    });
  }
}

checkImages().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
