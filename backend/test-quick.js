/**
 * Quick API Test Script
 * Run: node test-quick.js
 */

const axios = require('axios');
const readline = require('readline');

const API_BASE = 'http://localhost:3000/api';
let authToken = '';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

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

async function main() {
  console.log('\n═══════════════════════════════════════════');
  console.log('   Quick Role System API Test');
  console.log('═══════════════════════════════════════════\n');

  // Step 1: Login
  const email = await question('Enter your email (ross@bloktopia.com): ') || 'ross@bloktopia.com';
  const password = await question('Enter your password: ');

  console.log('\n🔐 Logging in...');
  const loginResult = await makeRequest('post', '/auth/login', {
    identifier: email,
    password
  });

  if (!loginResult.success) {
    console.log('❌ Login failed:', loginResult.error);
    rl.close();
    return;
  }

  authToken = loginResult.data.token;
  console.log('✅ Login successful!');
  console.log(`   User: ${loginResult.data.user.name}`);

  // Step 2: Get roles
  console.log('\n👑 Fetching your roles...');
  const rolesResult = await makeRequest('get', '/roles/my-roles');

  if (rolesResult.success) {
    console.log('✅ Your roles:');
    rolesResult.data.roles.forEach(role => {
      const community = role.community_name ? ` (${role.community_name})` : '';
      console.log(`   - ${role.role_name}${community}`);
    });
    console.log(`   Is Super Admin: ${rolesResult.data.is_super_admin ? '✅ Yes' : '❌ No'}`);
  }

  // Step 3: Get all roles (if super admin)
  if (rolesResult.data?.is_super_admin) {
    console.log('\n📋 Fetching all system roles...');
    const allRolesResult = await makeRequest('get', '/roles/all');

    if (allRolesResult.success) {
      console.log('✅ System roles:');
      allRolesResult.data.roles.forEach(role => {
        console.log(`   - ${role.name}: ${role.description}`);
      });
    }
  }

  // Step 4: Get communities
  console.log('\n🏘️  Fetching communities...');
  const communitiesResult = await makeRequest('get', '/communities');

  if (communitiesResult.success) {
    const communities = communitiesResult.data.communities || [];
    if (communities.length > 0) {
      console.log('✅ Available communities:');
      communities.forEach((community, index) => {
        console.log(`   ${index + 1}. ${community.name} (ID: ${community.id})`);
      });
    } else {
      console.log('   No communities found.');
    }
  }

  // Step 5: Get managed communities
  console.log('\n🏘️  Fetching your managed communities...');
  const managedResult = await makeRequest('get', '/roles/managed-communities');

  if (managedResult.success) {
    const managed = managedResult.data.communities || [];
    if (managed.length > 0) {
      console.log('✅ You manage:');
      managed.forEach(community => {
        console.log(`   - ${community.name}`);
      });
    } else {
      console.log('   You don\'t manage any communities yet.');
    }
  }

  // Step 6: Offer to assign a role (if super admin)
  if (rolesResult.data?.is_super_admin) {
    console.log('\n═══════════════════════════════════════════');
    console.log('   Super Admin Actions Available');
    console.log('═══════════════════════════════════════════');
    const assignRole = await question('\nWould you like to assign a community manager role? (y/n): ');

    if (assignRole.toLowerCase() === 'y') {
      const userEmail = await question('Enter user email: ');
      const communityId = await question('Enter community ID: ');

      console.log('\n🎯 Assigning community manager role...');
      const assignResult = await makeRequest('post', '/roles/assign', {
        user_email: userEmail,
        role_name: 'community_manager',
        community_id: communityId,
      });

      if (assignResult.success) {
        console.log('✅ Role assigned successfully!');
      } else {
        console.log('❌ Failed to assign role:', assignResult.error);
      }
    }
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('   ✅ Test completed!');
  console.log('═══════════════════════════════════════════\n');

  rl.close();
}

main().catch(error => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
