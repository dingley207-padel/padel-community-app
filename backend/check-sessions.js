require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkSessions() {
  console.log('Checking recent sessions...\n');

  // Get recent sessions from sessions table
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching sessions:', error);
    return;
  }

  console.log('Recent sessions from sessions table:');
  sessions.forEach(session => {
    console.log(`\nSession: ${session.title}`);
    console.log(`  ID: ${session.id}`);
    console.log(`  Max Players: ${session.max_players}`);
    console.log(`  Booked Count: ${session.booked_count}`);
    console.log(`  Status: ${session.status}`);
    console.log(`  Created: ${session.created_at}`);
  });

  // Check bookings for these sessions
  if (sessions.length > 0) {
    console.log('\n\nChecking bookings for these sessions...');
    const sessionIds = sessions.map(s => s.id);

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('session_id, user_id, payment_status, cancelled_at')
      .in('session_id', sessionIds);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return;
    }

    console.log(`\nTotal bookings found: ${bookings.length}`);

    // Group by session
    const bookingsBySession = {};
    bookings.forEach(booking => {
      if (!bookingsBySession[booking.session_id]) {
        bookingsBySession[booking.session_id] = [];
      }
      bookingsBySession[booking.session_id].push(booking);
    });

    sessions.forEach(session => {
      const sessionBookings = bookingsBySession[session.id] || [];
      const activeBookings = sessionBookings.filter(b => !b.cancelled_at);
      const completedBookings = activeBookings.filter(b => b.payment_status === 'completed');

      console.log(`\n${session.title}:`);
      console.log(`  Total bookings in DB: ${sessionBookings.length}`);
      console.log(`  Active bookings: ${activeBookings.length}`);
      console.log(`  Completed payments: ${completedBookings.length}`);
      console.log(`  booked_count field: ${session.booked_count}`);

      if (session.booked_count !== activeBookings.length) {
        console.log(`  ⚠️  MISMATCH! booked_count (${session.booked_count}) != actual active bookings (${activeBookings.length})`);
      }
    });
  }

  // Check available_sessions view
  console.log('\n\nChecking available_sessions view...');
  const { data: availableSessions, error: viewError } = await supabase
    .from('available_sessions')
    .select('*')
    .order('datetime', { ascending: true })
    .limit(5);

  if (viewError) {
    console.error('Error fetching from available_sessions:', viewError);
    return;
  }

  console.log(`\nSessions in available_sessions view: ${availableSessions.length}`);
  availableSessions.forEach(session => {
    console.log(`\n${session.title}:`);
    console.log(`  Max Players: ${session.max_players}`);
    console.log(`  Booked Count: ${session.booked_count}`);
    console.log(`  Available: ${session.max_players - session.booked_count}`);
  });
}

checkSessions().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
