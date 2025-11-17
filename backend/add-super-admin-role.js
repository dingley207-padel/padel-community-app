const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSuperAdminRole() {
  try {
    console.log('🔐 Adding super_admin role to ross@bloktopia.com...\n');

    // Get Ross's user ID
    const { data: rossUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'ross@bloktopia.com')
      .single();

    if (userError || !rossUser) {
      console.error('❌ Could not find user ross@bloktopia.com');
      process.exit(1);
    }

    const rossUserId = rossUser.id;
    console.log('✅ Found Ross user:', rossUserId);

    const superAdminRoleId = 'd4e6bfb5-713e-4976-a3ee-ad64df3ef7b1';

    // Check if super_admin role already exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', rossUserId)
      .eq('role_id', superAdminRoleId)
      .single();

    if (existingRole) {
      console.log('✅ super_admin role already exists');
      return;
    }

    // Add super_admin role
    const { data: newRole, error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: rossUserId,
        role_id: superAdminRoleId,
        community_id: null,
      })
      .select()
      .single();

    if (roleError) {
      console.error('❌ Error adding super_admin role:', roleError);
      process.exit(1);
    }

    console.log('✅ super_admin role added successfully!');
    console.log('\n📊 Ross now has super_admin role');

  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

addSuperAdminRole();
