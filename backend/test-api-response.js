require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testAPIResponse() {
  try {
    console.log('🔍 Testing what the API would return for a super admin...\n');

    // Get a super admin user ID (you mentioned being super admin)
    const { data: superAdmins, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id, users!inner(email), roles!inner(name)')
      .eq('roles.name', 'super_admin')
      .limit(1);

    if (roleError || !superAdmins || superAdmins.length === 0) {
      console.log('❌ Could not find super admin user');
      return;
    }

    const userId = superAdmins[0].user_id;
    const userEmail = superAdmins[0].users.email;
    console.log(`Found super admin: ${userEmail} (ID: ${userId})\n`);

    // Now execute the exact same query that the backend uses
    console.log('📡 Executing the getManagedCommunities query...\n');

    const { data, error } = await supabase
      .from('communities')
      .select('id, name, description, location, profile_image')
      .is('parent_community_id', null)
      .order('name');

    if (error) {
      console.log('❌ Error:', error);
      return;
    }

    console.log(`✅ Query returned ${data.length} communities:\n`);
    data.forEach(community => {
      console.log(`  - "${community.name}"`);
      console.log(`    ID: ${community.id}`);
      console.log(`    Location: ${community.location || 'N/A'}`);
      console.log(`    Description: ${community.description || 'N/A'}\n`);
    });

    console.log('\n📊 Summary:');
    console.log(`Expected: 1 community (Love The Padel)`);
    console.log(`Actual: ${data.length} ${data.length === 1 ? 'community' : 'communities'}`);
    console.log(`Status: ${data.length === 1 ? '✅ CORRECT' : '❌ INCORRECT'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAPIResponse();
