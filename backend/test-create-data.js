require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createTestData() {
  try {
    console.log('Creating test data...\n');

    // 0. Get the test user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', '+447866406791')
      .single();

    if (userError || !user) {
      console.error('❌ User not found. Please authenticate first.');
      return;
    }

    console.log('✓ Using user ID:', user.id);

    // 1. Create a test community
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .insert({
        name: 'Test Padel Club',
        location: 'London, UK',
        description: 'A test padel community for development',
        manager_id: user.id,
      })
      .select()
      .single();

    if (communityError) {
      console.error('❌ Failed to create community:', communityError.message);
      return;
    }

    console.log('✓ Community created:', community.id);
    console.log('  Name:', community.name);
    console.log('  Location:', community.location);

    // 2. Create a test session (tomorrow at 6pm)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);

    const { data: session, error: sessionError} = await supabase
      .from('sessions')
      .insert({
        community_id: community.id,
        title: 'Evening Open Play',
        description: 'Join us for an evening of padel!',
        datetime: tomorrow.toISOString(),
        location: community.location,
        price: 25.00,
        max_players: 4,
        booked_count: 0,
        status: 'active',
      })
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Failed to create session:', sessionError.message);
      return;
    }

    console.log('\n✓ Session created:', session.id);
    console.log('  Title:', session.title);
    console.log('  Date/Time:', new Date(session.datetime).toLocaleString());
    console.log('  Price: $' + session.price);
    console.log('  Max Players:', session.max_players);

    console.log('\n✅ Test data created successfully!');
    console.log('\nUse these IDs for testing:');
    console.log('Community ID:', community.id);
    console.log('Session ID:', session.id);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestData();
