const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteAlexAndChris() {
  try {
    console.log('🔍 Finding Alex and Chris user IDs...');

    // Get Alex and Chris user IDs
    const { data: usersToDelete, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, phone')
      .or('name.ilike.%alex%,name.ilike.%chris%,email.ilike.%alex%,email.ilike.%chris%');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    if (usersToDelete.length === 0) {
      console.log('\n⚠️  No users named Alex or Chris found!');
      return;
    }

    console.log('\n📋 Users to DELETE:');
    usersToDelete.forEach(user => {
      console.log(`  - ${user.name} (${user.email || user.phone}) [ID: ${user.id}]`);
    });

    const deleteUserIds = usersToDelete.map(u => u.id);

    console.log('\n🗑️  Deleting all data for Alex and Chris...\n');

    // Delete in correct order due to foreign key constraints

    // 1. Delete their session bookings
    const { error: bookingsError } = await supabase
      .from('bookings')
      .delete()
      .in('user_id', deleteUserIds);

    if (bookingsError) console.log('  ⚠️  Bookings:', bookingsError.message);
    else console.log('  ✅ Bookings deleted');

    // 2. Delete sessions created by them
    const { error: sessionsError } = await supabase
      .from('sessions')
      .delete()
      .in('created_by', deleteUserIds);

    if (sessionsError) console.log('  ⚠️  Sessions:', sessionsError.message);
    else console.log('  ✅ Sessions deleted');

    // 3. Delete their community memberships
    const { error: membersError } = await supabase
      .from('community_members')
      .delete()
      .in('user_id', deleteUserIds);

    if (membersError) console.log('  ⚠️  Community members:', membersError.message);
    else console.log('  ✅ Community members deleted');

    // 4. Delete announcements created by them
    const { error: announcementsError } = await supabase
      .from('announcements')
      .delete()
      .in('created_by', deleteUserIds);

    if (announcementsError) console.log('  ⚠️  Announcements:', announcementsError.message);
    else console.log('  ✅ Announcements deleted');

    // 5. Delete communities created by them
    const { error: communitiesError } = await supabase
      .from('communities')
      .delete()
      .in('manager_id', deleteUserIds);

    if (communitiesError) console.log('  ⚠️  Communities:', communitiesError.message);
    else console.log('  ✅ Communities deleted');

    // 6. Delete user roles
    const { error: rolesError } = await supabase
      .from('user_roles')
      .delete()
      .in('user_id', deleteUserIds);

    if (rolesError) console.log('  ⚠️  User roles:', rolesError.message);
    else console.log('  ✅ User roles deleted');

    // 7. Finally, delete the users
    const { error: usersDeleteError } = await supabase
      .from('users')
      .delete()
      .in('id', deleteUserIds);

    if (usersDeleteError) console.log('  ⚠️  Users:', usersDeleteError.message);
    else console.log('  ✅ Users deleted');

    console.log('\n✨ Alex and Chris deleted successfully!');
    console.log('\n🎉 They can now test registration flow from scratch');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

deleteAlexAndChris();
