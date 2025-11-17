const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function updateRoss() {
  try {
    console.log('Marking Ross as OTP verified...\n');

    const { error: updateError } = await supabase
      .from('users')
      .update({ otp_verified: true })
      .eq('email', 'ross@bloktopia.com');

    if (updateError) {
      console.error('❌ Error updating Ross:', updateError);
      return;
    }

    console.log('✅ Ross marked as OTP verified\n');

    // Verify the change
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('name, email, phone, otp_verified')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
      return;
    }

    console.log(`Current users in database: ${users.length}\n`);
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

updateRoss();
