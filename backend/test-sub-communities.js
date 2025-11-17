const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:3000/api';

async function testSubCommunities() {
  console.log('\n=== Testing Sub-Communities API ===\n');

  try {
    // Test 1: Get all communities
    console.log('1. Getting all communities...');
    const { data: communitiesData } = await axios.get(`${API_URL}/communities`);
    console.log(`   Found ${communitiesData.communities.length} communities`);

    if (communitiesData.communities.length === 0) {
      console.log('   ⚠️  No communities found. You need to create some communities first.');
      return;
    }

    const testCommunity = communitiesData.communities[0];
    console.log(`   ✅ Using test community: "${testCommunity.name}" (ID: ${testCommunity.id})`);

    // Test 2: Get sub-communities of the first community
    console.log(`\n2. Getting sub-communities of "${testCommunity.name}"...`);
    const { data: subCommunitiesData } = await axios.get(
      `${API_URL}/communities/${testCommunity.id}/sub-communities`
    );
    console.log(`   ✅ Found ${subCommunitiesData.sub_communities.length} sub-communities`);

    if (subCommunitiesData.sub_communities.length > 0) {
      subCommunitiesData.sub_communities.forEach((sub, index) => {
        console.log(`      ${index + 1}. ${sub.name} (${sub.member_count} members)`);
      });
    }

    console.log('\n=== All Tests Passed! ===\n');
    console.log('API Endpoints verified:');
    console.log('  ✅ GET /api/communities');
    console.log('  ✅ GET /api/communities/:id/sub-communities');
    console.log('\nNote: To test CREATE and JOIN endpoints, you need authentication.');
    console.log('These require a valid JWT token from a logged-in user.');

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   ${error.message}`);
    }
  }
}

testSubCommunities();
