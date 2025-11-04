const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Your auth token - you'll need to get this from logging in
let authToken = '';

// Test user credentials
const TEST_USER = {
  identifier: 'ross@bloktopia.com', // Use 'identifier' instead of 'email'
  password: 'your-password-here', // Replace with your actual password
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
};

// Test functions
async function testLogin() {
  console.log('\n📧 Testing Login...');
  const result = await makeRequest('post', '/auth/login', TEST_USER);

  if (result.success) {
    authToken = result.data.token;
    console.log('✅ Login successful!');
    console.log(`   User: ${result.data.user.name} (${result.data.user.email})`);
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    return true;
  } else {
    console.log('❌ Login failed:', result.error);
    return false;
  }
}

async function testGetMyRoles() {
  console.log('\n👑 Testing Get My Roles...');
  const result = await makeRequest('get', '/roles/my-roles');

  if (result.success) {
    console.log('✅ Retrieved roles successfully!');
    console.log('   Roles:', JSON.stringify(result.data.roles, null, 2));
    console.log(`   Is Super Admin: ${result.data.is_super_admin}`);
    return result.data;
  } else {
    console.log('❌ Failed to get roles:', result.error);
    return null;
  }
}

async function testGetAllRoles() {
  console.log('\n📋 Testing Get All Roles (Super Admin only)...');
  const result = await makeRequest('get', '/roles/all');

  if (result.success) {
    console.log('✅ Retrieved all roles successfully!');
    result.data.roles.forEach(role => {
      console.log(`   - ${role.name}: ${role.description}`);
    });
    return result.data.roles;
  } else {
    console.log('❌ Failed to get all roles:', result.error);
    return null;
  }
}

async function testAssignCommunityManager(userEmail, communityId) {
  console.log(`\n🎯 Testing Assign Community Manager Role...`);
  console.log(`   User: ${userEmail}`);
  console.log(`   Community ID: ${communityId}`);

  const result = await makeRequest('post', '/roles/assign', {
    user_email: userEmail,
    role_name: 'community_manager',
    community_id: communityId,
  });

  if (result.success) {
    console.log('✅ Community manager role assigned successfully!');
    console.log('   Assignment:', JSON.stringify(result.data, null, 2));
    return true;
  } else {
    console.log('❌ Failed to assign role:', result.error);
    return false;
  }
}

async function testGetCommunities() {
  console.log('\n🏘️  Testing Get Communities...');
  const result = await makeRequest('get', '/communities');

  if (result.success) {
    console.log('✅ Retrieved communities successfully!');
    if (result.data.communities && result.data.communities.length > 0) {
      result.data.communities.forEach(community => {
        console.log(`   - ${community.name} (ID: ${community.id})`);
      });
      return result.data.communities;
    } else {
      console.log('   No communities found.');
      return [];
    }
  } else {
    console.log('❌ Failed to get communities:', result.error);
    return null;
  }
}

async function testGetManagedCommunities() {
  console.log('\n🏘️  Testing Get Managed Communities...');
  const result = await makeRequest('get', '/roles/managed-communities');

  if (result.success) {
    console.log('✅ Retrieved managed communities successfully!');
    if (result.data.communities && result.data.communities.length > 0) {
      result.data.communities.forEach(community => {
        console.log(`   - ${community.name} (ID: ${community.id})`);
      });
    } else {
      console.log('   No managed communities found.');
    }
    return result.data.communities;
  } else {
    console.log('❌ Failed to get managed communities:', result.error);
    return null;
  }
}

// Main test runner
async function runTests() {
  console.log('═══════════════════════════════════════════');
  console.log('  Padel Community - Role System API Tests');
  console.log('═══════════════════════════════════════════');

  // Step 1: Login
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without login. Please check credentials.');
    return;
  }

  // Step 2: Get current user's roles
  const myRoles = await testGetMyRoles();

  // Step 3: Get all roles (super admin only)
  await testGetAllRoles();

  // Step 4: Get all communities
  const communities = await testGetCommunities();

  // Step 5: Get managed communities
  await testGetManagedCommunities();

  // Step 6: Assign community manager role (example)
  if (communities && communities.length > 0 && myRoles?.is_super_admin) {
    console.log('\n📝 Example: Assign community manager role');
    console.log('   To assign a user as community manager, run:');
    console.log(`   node test-roles-api.js assign <user-email> <community-id>`);
    console.log('\n   Example:');
    console.log(`   node test-roles-api.js assign user@example.com ${communities[0].id}`);
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('  ✅ Tests completed!');
  console.log('═══════════════════════════════════════════\n');
}

// Command line argument handling
const args = process.argv.slice(2);
if (args[0] === 'assign' && args[1] && args[2]) {
  // Run specific assignment test
  testLogin().then(success => {
    if (success) {
      testAssignCommunityManager(args[1], args[2]);
    }
  });
} else {
  // Run all tests
  runTests();
}
