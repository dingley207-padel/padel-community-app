const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearDatabase() {
  try {
    console.log('🔍 Finding Alex and Chris user IDs...');

    // Get Alex and Chris user IDs
    const { data: usersToKeep, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, phone')
      .or('name.ilike.%alex%,name.ilike.%chris%,email.ilike.%alex%,email.ilike.%chris%');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    console.log('\n📋 Users to KEEP:');
    usersToKeep.forEach(user => {
      console.log(`  - ${user.name} (${user.email || user.phone}) [ID: ${user.id}]`);
    });

    const keepUserIds = usersToKeep.map(u => u.id);

    if (keepUserIds.length === 0) {
      console.log('\n⚠️  No users named Alex or Chris found!');
      return;
    }

    console.log('\n🗑️  Deleting data from other users...\n');

    // Delete in correct order due to foreign key constraints

    // 1. Delete session bookings for other users
    const { error: bookingsError } = await supabase
      .from('session_bookings')
      .delete()
      .not('user_id', 'in', `(${keepUserIds.join(',')})`);

    if (bookingsError) console.log('  ⚠️  Session bookings:', bookingsError.message);
    else console.log('  ✅ Session bookings deleted');

    // 2. Delete sessions created by other users
    const { error: sessionsError } = await supabase
      .from('sessions')
      .delete()
      .not('created_by', 'in', `(${keepUserIds.join(',')})`);

    if (sessionsError) console.log('  ⚠️  Sessions:', sessionsError.message);
    else console.log('  ✅ Sessions deleted');

    // 3. Delete community members for other users
    const { error: membersError } = await supabase
      .from('community_members')
      .delete()
      .not('user_id', 'in', `(${keepUserIds.join(',')})`);

    if (membersError) console.log('  ⚠️  Community members:', membersError.message);
    else console.log('  ✅ Community members deleted');

    // 4. Delete community managers for other users
    const { error: managersError } = await supabase
      .from('community_managers')
      .delete()
      .not('user_id', 'in', `(${keepUserIds.join(',')})`);

    if (managersError) console.log('  ⚠️  Community managers:', managersError.message);
    else console.log('  ✅ Community managers deleted');

    // 5. Delete announcements
    const { error: announcementsError } = await supabase
      .from('announcements')
      .delete()
      .not('created_by', 'in', `(${keepUserIds.join(',')})`);

    if (announcementsError) console.log('  ⚠️  Announcements:', announcementsError.message);
    else console.log('  ✅ Announcements deleted');

    // 6. Delete communities created by other users
    const { error: communitiesError } = await supabase
      .from('communities')
      .delete()
      .not('created_by', 'in', `(${keepUserIds.join(',')})`);

    if (communitiesError) console.log('  ⚠️  Communities:', communitiesError.message);
    else console.log('  ✅ Communities deleted');

    // 7. Delete friend requests
    const { error: friendRequestsError } = await supabase
      .from('friend_requests')
      .delete()
      .not('sender_id', 'in', `(${keepUserIds.join(',')})`)
      .not('receiver_id', 'in', `(${keepUserIds.join(',')})`);

    if (friendRequestsError) console.log('  ⚠️  Friend requests:', friendRequestsError.message);
    else console.log('  ✅ Friend requests deleted');

    // 8. Delete friendships
    const { error: friendshipsError } = await supabase
      .from('friendships')
      .delete()
      .not('user_id', 'in', `(${keepUserIds.join(',')})`)
      .not('friend_id', 'in', `(${keepUserIds.join(',')})`);

    if (friendshipsError) console.log('  ⚠️  Friendships:', friendshipsError.message);
    else console.log('  ✅ Friendships deleted');

    // 9. Delete user roles for other users
    const { error: rolesError } = await supabase
      .from('user_roles')
      .delete()
      .not('user_id', 'in', `(${keepUserIds.join(',')})`);

    if (rolesError) console.log('  ⚠️  User roles:', rolesError.message);
    else console.log('  ✅ User roles deleted');

    // 10. Finally, delete other users
    const { error: usersDeleteError } = await supabase
      .from('users')
      .delete()
      .not('id', 'in', `(${keepUserIds.join(',')})`);

    if (usersDeleteError) console.log('  ⚠️  Users:', usersDeleteError.message);
    else console.log('  ✅ Users deleted');

    console.log('\n✨ Database cleared successfully!');
    console.log(`\n👥 Kept users: ${usersToKeep.map(u => u.name).join(', ')}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

clearDatabase();
