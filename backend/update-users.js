const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function updateUsers() {
  try {
    console.log('Updating users...\n');

    // Delete Alex Simmons
    console.log('1. Deleting Alex Simmons (alex@lovethepadel.com)...');
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', 'alex@lovethepadel.com');

    if (deleteError) {
      console.error('❌ Error deleting Alex:', deleteError);
    } else {
      console.log('✅ Alex Simmons deleted successfully\n');
    }

    // Mark Ross as phone verified
    console.log('2. Marking Ross (ross@bloktopia.com) as phone verified...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ phone_verified: true })
      .eq('email', 'ross@bloktopia.com');

    if (updateError) {
      console.error('❌ Error updating Ross:', updateError);
    } else {
      console.log('✅ Ross marked as phone verified\n');
    }

    // Verify the changes
    console.log('3. Verifying changes...');
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('name, email, phone, phone_verified')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
      return;
    }

    console.log(`\n✅ Current users in database: ${users.length}\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Phone: ${user.phone}`);
      console.log(`   Phone Verified: ${user.phone_verified ? '✅ Yes' : '❌ No'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateUsers();
