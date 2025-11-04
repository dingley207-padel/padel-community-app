require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function deleteTestUsers() {
  console.log('🗑️  Deleting Chris and Alex...\n');

  const testEmails = [
    'christopher.academies@gmail.com',
    'alex@lovethepadel.com'
  ];

  const testPhones = [
    '+971554821822',
    '+971589664411'
  ];

  // Delete users by email or phone
  const { data: usersToDelete, error: fetchError } = await supabase
    .from('users')
    .select('id, email, phone, name')
    .or(`email.in.(${testEmails.join(',')}),phone.in.(${testPhones.join(',')})`);

  if (fetchError) {
    console.error('❌ Error fetching users:', fetchError.message);
    return;
  }

  if (!usersToDelete || usersToDelete.length === 0) {
    console.log('✅ No matching users found in database');
    return;
  }

  console.log(`Found ${usersToDelete.length} user(s) to delete:`);
  usersToDelete.forEach((user, i) => {
    console.log(`  ${i + 1}. ${user.name} (${user.email}, ${user.phone})`);
  });
  console.log('');

  // Delete the users
  const userIds = usersToDelete.map(u => u.id);
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .in('id', userIds);

  if (deleteError) {
    console.error('❌ Error deleting users:', deleteError.message);
  } else {
    console.log('✅ Users deleted successfully');
  }

  // Verify deletion
  const { data: remainingUsers } = await supabase
    .from('users')
    .select('email')
    .or(`email.in.(${testEmails.join(',')}),phone.in.(${testPhones.join(',')})`);

  console.log(`\nRemaining matching users: ${remainingUsers?.length || 0}`);
  console.log('\n✅ Deletion complete');
}

deleteTestUsers();
