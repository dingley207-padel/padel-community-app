const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function addTestSessions() {
  try {
    console.log('Adding test sessions...\n');

    // First, check if we have a community, or create one
    const { data: communities, error: commError } = await supabase
      .from('communities')
      .select('*')
      .limit(1);

    let communityId;

    if (!communities || communities.length === 0) {
      console.log('No community found. Creating "Love The Padel" community...');

      // Get the first user to be the manager
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (!users || users.length === 0) {
        console.error('No users found. Please create a user first.');
        return;
      }

      const { data: newCommunity, error: createError } = await supabase
        .from('communities')
        .insert({
          name: 'Love The Padel',
          description: 'Weekly social padel sessions',
          manager_id: users[0].id,
          location: 'JGE',
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating community:', createError);
        return;
      }

      communityId = newCommunity.id;
      console.log('✅ Created community:', newCommunity.name);
    } else {
      communityId = communities[0].id;
      console.log('Using existing community:', communities[0].name);
    }

    // Get next Saturday and Sunday
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
    const daysUntilSunday = (7 - dayOfWeek + 7) % 7 || 7;

    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysUntilSaturday);
    saturday.setHours(7, 0, 0, 0);

    const sunday = new Date(now);
    sunday.setDate(now.getDate() + daysUntilSunday);
    sunday.setHours(7, 0, 0, 0);

    // Add Saturday session
    const { data: satSession, error: satError } = await supabase
      .from('sessions')
      .insert({
        community_id: communityId,
        title: 'Love The Padel - Saturday Social',
        description: 'Join us for our weekly Saturday morning social session!',
        datetime: saturday.toISOString(),
        location: 'JGE',
        price: 0,
        max_players: 12,
        booked_count: 0,
        status: 'active',
        visibility: true,
      })
      .select()
      .single();

    if (satError) {
      console.error('Error creating Saturday session:', satError);
    } else {
      console.log('✅ Created Saturday session:', satSession.title);
      console.log('   Time:', saturday.toLocaleString());
    }

    // Add Sunday session
    const { data: sunSession, error: sunError } = await supabase
      .from('sessions')
      .insert({
        community_id: communityId,
        title: 'Love The Padel - Sunday Social',
        description: 'Join us for our weekly Sunday morning social session!',
        datetime: sunday.toISOString(),
        location: 'JGE',
        price: 0,
        max_players: 12,
        booked_count: 0,
        status: 'active',
        visibility: true,
      })
      .select()
      .single();

    if (sunError) {
      console.error('Error creating Sunday session:', sunError);
    } else {
      console.log('✅ Created Sunday session:', sunSession.title);
      console.log('   Time:', sunday.toLocaleString());
    }

    console.log('\n✅ Test sessions added successfully!');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

addTestSessions();
