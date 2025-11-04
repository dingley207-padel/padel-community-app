const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanAllUserData() {
  try {
    console.log('🧹 Starting to clean all user data...\n');

    // Step 1: Delete all OTPs
    console.log('Deleting OTPs...');
    const { error: otpError } = await supabase
      .from('otp')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (otpError) {
      console.error('⚠️  Error deleting OTPs:', otpError.message);
    } else {
      console.log('✅ OTPs deleted');
    }

    // Step 2: Delete all payments
    console.log('Deleting payments...');
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (paymentsError) {
      console.error('⚠️  Error deleting payments:', paymentsError.message);
    } else {
      console.log('✅ Payments deleted');
    }

    // Step 3: Delete all bookings
    console.log('Deleting bookings...');
    const { error: bookingsError } = await supabase
      .from('bookings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (bookingsError) {
      console.error('⚠️  Error deleting bookings:', bookingsError.message);
    } else {
      console.log('✅ Bookings deleted');
    }

    // Step 4: Delete all sessions
    console.log('Deleting sessions...');
    const { error: sessionsError } = await supabase
      .from('sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (sessionsError) {
      console.error('⚠️  Error deleting sessions:', sessionsError.message);
    } else {
      console.log('✅ Sessions deleted');
    }

    // Step 5: Delete all community members
    console.log('Deleting community members...');
    const { error: membersError } = await supabase
      .from('community_members')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (membersError) {
      console.error('⚠️  Error deleting community members:', membersError.message);
    } else {
      console.log('✅ Community members deleted');
    }

    // Step 6: Delete all communities
    console.log('Deleting communities...');
    const { error: communitiesError } = await supabase
      .from('communities')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (communitiesError) {
      console.error('⚠️  Error deleting communities:', communitiesError.message);
    } else {
      console.log('✅ Communities deleted');
    }

    // Step 7: Delete all users
    console.log('Deleting users...');
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (usersError) {
      console.error('⚠️  Error deleting users:', usersError.message);
    } else {
      console.log('✅ Users deleted');
    }

    console.log('\n✨ All user data has been cleaned!');
    console.log('You can now register with any email/phone number.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Confirm before running
console.log('⚠️  WARNING: This will DELETE ALL user data from the database!');
console.log('This includes:');
console.log('  - All users');
console.log('  - All communities');
console.log('  - All sessions');
console.log('  - All bookings');
console.log('  - All payments');
console.log('  - All OTPs');
console.log('\nPress Ctrl+C to cancel, or wait 3 seconds to continue...\n');

setTimeout(cleanAllUserData, 3000);
