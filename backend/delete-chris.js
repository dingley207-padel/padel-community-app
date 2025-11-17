const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function deleteChris() {
  try {
    console.log('Deleting Chris Longy from database...\n');

    // Delete Chris Longy
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', 'christopher.academies@gmail.com');

    if (deleteError) {
      console.error('❌ Error deleting Chris:', deleteError);
      return;
    }

    console.log('✅ Chris Longy deleted successfully\n');

    // Verify deletion
    console.log('Verifying remaining users...');
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('name, email, phone, otp_verified')
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
      console.log(`   OTP Verified: ${user.otp_verified ? '✅ Yes' : '❌ No'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

deleteChris();
