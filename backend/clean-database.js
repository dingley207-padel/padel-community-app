const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDatabase() {
  try {
    console.log('🧹 Starting database cleanup...\n');

    // Get Ross's user ID
    const { data: rossUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'ross@bloktopia.com')
      .single();

    if (userError || !rossUser) {
      console.error('❌ Could not find user ross@bloktopia.com');
      process.exit(1);
    }

    const rossUserId = rossUser.id;
    console.log('✅ Found Ross user:', rossUserId);

    // 1. Delete all bookings
    console.log('\n📦 Deleting all bookings...');
    const { error: bookingsError } = await supabase
      .from('bookings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (bookingsError) {
      console.error('❌ Error deleting bookings:', bookingsError);
    } else {
      console.log('✅ Deleted all bookings');
    }

    // 2. Delete all sessions
    console.log('\n📅 Deleting all sessions...');
    const { error: sessionsError } = await supabase
      .from('sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (sessionsError) {
      console.error('❌ Error deleting sessions:', sessionsError);
    } else {
      console.log('✅ Deleted all sessions');
    }

    // 3. Delete all session templates
    console.log('\n📋 Deleting all session templates...');
    const { error: templatesError } = await supabase
      .from('session_templates')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (templatesError) {
      console.error('❌ Error deleting session templates:', templatesError);
    } else {
      console.log('✅ Deleted all session templates');
    }

    // 4. Delete all community members
    console.log('\n👥 Deleting all community members...');
    const { error: membersError } = await supabase
      .from('community_members')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (membersError) {
      console.error('❌ Error deleting community members:', membersError);
    } else {
      console.log('✅ Deleted all community members');
    }

    // 5. Delete all sub-communities
    console.log('\n📁 Deleting all sub-communities...');
    const { error: subCommunitiesError } = await supabase
      .from('sub_communities')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (subCommunitiesError) {
      console.error('❌ Error deleting sub-communities:', subCommunitiesError);
    } else {
      console.log('✅ Deleted all sub-communities');
    }

    // 6. Delete all communities
    console.log('\n🏘️  Deleting all communities...');
    const { error: communitiesError } = await supabase
      .from('communities')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (communitiesError) {
      console.error('❌ Error deleting communities:', communitiesError);
    } else {
      console.log('✅ Deleted all communities');
    }

    // 7. Delete all announcements
    console.log('\n📢 Deleting all announcements...');
    const { error: announcementsError } = await supabase
      .from('announcements')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (announcementsError) {
      console.error('❌ Error deleting announcements:', announcementsError);
    } else {
      console.log('✅ Deleted all announcements');
    }

    // 8. Delete all payments
    console.log('\n💳 Deleting all payments...');
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (paymentsError) {
      console.error('❌ Error deleting payments:', paymentsError);
    } else {
      console.log('✅ Deleted all payments');
    }

    // 9. Delete all user roles except Ross's
    console.log('\n🔐 Deleting all user roles except Ross...');
    const { error: rolesError } = await supabase
      .from('user_roles')
      .delete()
      .neq('user_id', rossUserId);

    if (rolesError) {
      console.error('❌ Error deleting user roles:', rolesError);
    } else {
      console.log('✅ Deleted all user roles except Ross');
    }

    // 10. Delete all users except Ross
    console.log('\n👤 Deleting all users except Ross...');
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .neq('id', rossUserId);

    if (usersError) {
      console.error('❌ Error deleting users:', usersError);
    } else {
      console.log('✅ Deleted all users except Ross');
    }

    console.log('\n✅ Database cleanup complete!');
    console.log('\n📊 Remaining data:');
    console.log('   - User: ross@bloktopia.com');
    console.log('   - Everything else: DELETED');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanDatabase();
