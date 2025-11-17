const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Test script to debug sub-community deletion
async function testDeleteSubCommunity() {
  console.log('Testing Sub-Community Deletion...\n');

  try {
    // First, check what routes are available
    console.log('1. Testing route structure...');

    // You'll need to replace these with actual values:
    const TEST_TOKEN = 'YOUR_AUTH_TOKEN_HERE'; // Get from login
    const TEST_COMMUNITY_ID = 'YOUR_COMMUNITY_ID_HERE';
    const TEST_SUBCOMMUNITY_ID = 'YOUR_SUBCOMMUNITY_ID_HERE';

    console.log('Route will be:', `${API_URL}/communities/${TEST_COMMUNITY_ID}/sub-communities/${TEST_SUBCOMMUNITY_ID}`);

    // Test the delete endpoint
    if (TEST_TOKEN !== 'YOUR_AUTH_TOKEN_HERE') {
      const response = await axios.delete(
        `${API_URL}/communities/${TEST_COMMUNITY_ID}/sub-communities/${TEST_SUBCOMMUNITY_ID}`,
        {
          headers: {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Success:', response.data);
    } else {
      console.log('\nTo test this endpoint, you need to:');
      console.log('1. Login as a community manager');
      console.log('2. Get your auth token');
      console.log('3. Get your community ID and a sub-community ID');
      console.log('4. Update this script with those values');
      console.log('\nExpected DELETE endpoint:');
      console.log('  DELETE /api/communities/:communityId/sub-communities/:subCommunityId');
      console.log('  Headers: Authorization: Bearer <token>');
    }

  } catch (error) {
    console.error('Error details:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.error || error.message);
    console.error('Full error:', error.response?.data);
  }
}

testDeleteSubCommunity();
