const axios = require('axios');

const API_URL = 'https://padel-community-app-production.up.railway.app/api';

// Use a test token - you'll need to replace this with a valid token
// or we can test without auth for the available sessions endpoint
async function checkAPIResponse() {
  try {
    console.log('Fetching available sessions from API...\n');

    const response = await axios.get(`${API_URL}/sessions/available`, {
      timeout: 10000,
    });

    const sessions = response.data.sessions || [];
    console.log(`API returned ${sessions.length} sessions\n`);

    sessions.slice(0, 3).forEach(session => {
      console.log(`Session: ${session.title}`);
      console.log(`  max_players: ${session.max_players}`);
      console.log(`  booked_count: ${session.booked_count}`);
      console.log(`  available_spots: ${session.available_spots}`);
      console.log(`  Has available_spots field: ${session.hasOwnProperty('available_spots')}`);
      console.log(`  Calculated: max_players - booked_count = ${session.max_players - session.booked_count}`);
      console.log();
    });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkAPIResponse();
