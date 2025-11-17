const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserRoles() {
  try {
    console.log('🔍 Checking user roles for Ross...\n');

    // Get Ross's user ID
    const { data: rossUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'ross@bloktopia.com')
      .single();

    if (!rossUser) {
      console.log('❌ Ross user not found');
      return;
    }

    console.log('✅ Found Ross:', rossUser.id);

    // Get all roles for Ross
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select('*, roles(name), communities(id, name)')
      .eq('user_id', rossUser.id);

    if (error) {
      console.error('❌ Error fetching user roles:', error);
      return;
    }

    console.log(`\n📊 Total roles found: ${userRoles?.length || 0}\n`);

    if (userRoles && userRoles.length > 0) {
      userRoles.forEach((ur, index) => {
        console.log(`${index + 1}. Role: ${ur.roles?.name || 'N/A'}`);
        console.log(`   Role ID: ${ur.role_id}`);
        console.log(`   Community ID: ${ur.community_id || 'NULL'}`);
        if (ur.communities) {
          console.log(`   Community Name: ${ur.communities.name}`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

checkUserRoles();
