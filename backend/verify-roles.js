/**
 * Verify Role Assignment
 * Run: node verify-roles.js <email> <password>
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

const email = process.argv[2] || 'ross@bloktopia.com';
const password = process.argv[3];

if (!password) {
  console.log('Usage: node verify-roles.js <email> <password>');
  console.log('Example: node verify-roles.js ross@bloktopia.com mypassword');
  process.exit(1);
}

async function verify() {
  try {
    console.log('\n🔐 Logging in as:', email);

    // Login
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      identifier: email,
      password
    });

    const token = loginRes.data.token;
    console.log('✅ Login successful!\n');

    // Get roles
    const rolesRes = await axios.get(`${API_BASE}/roles/my-roles`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('👑 YOUR ROLES:');
    console.log('═══════════════════════════════════════════');

    if (rolesRes.data.roles.length === 0) {
      console.log('   No roles assigned yet.');
    } else {
      rolesRes.data.roles.forEach(role => {
        if (role.community_name) {
          console.log(`   ✅ ${role.role_name} - ${role.community_name}`);
          console.log(`      Community ID: ${role.community_id}`);
        } else {
          console.log(`   ✅ ${role.role_name} (Platform-wide)`);
        }
      });
    }

    console.log('\n📊 PERMISSIONS:');
    console.log('═══════════════════════════════════════════');
    console.log(`   Super Admin: ${rolesRes.data.is_super_admin ? '✅ Yes' : '❌ No'}`);

    // Get managed communities
    const managedRes = await axios.get(`${API_BASE}/roles/managed-communities`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const managedCommunities = managedRes.data.communities || [];
    console.log(`   Managed Communities: ${managedCommunities.length}`);

    if (managedCommunities.length > 0) {
      console.log('\n🏘️  COMMUNITIES YOU MANAGE:');
      console.log('═══════════════════════════════════════════');
      managedCommunities.forEach((community, index) => {
        console.log(`   ${index + 1}. ${community.name}`);
        console.log(`      ID: ${community.id}`);
        console.log(`      Location: ${community.location || 'Not set'}`);
      });
    }

    console.log('\n✅ Verification complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

verify();
