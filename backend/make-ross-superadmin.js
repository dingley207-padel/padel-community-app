const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeRossSuperAdmin() {
  try {
    console.log('🔍 Finding Ross user...\n');

    // Find Ross user
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('id, name, email, phone')
      .or('name.ilike.%ross%,email.ilike.%ross%,phone.ilike.%ross%');

    if (findError) {
      console.error('❌ Error finding user:', findError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No user found with "ross" in name, email, or phone');
      console.log('Please create a Ross user first through the app registration.');
      return;
    }

    if (users.length > 1) {
      console.log('⚠️  Multiple users found:');
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email || user.phone})`);
      });
      console.log('\nUsing the first user...');
    }

    const ross = users[0];
    console.log(`✅ Found Ross: ${ross.name} (${ross.email || ross.phone})`);
    console.log(`   User ID: ${ross.id}\n`);

    console.log('🔧 Getting available roles from database...\n');

    // Get all roles from the roles table
    const { data: rolesData, error: rolesError} = await supabase
      .from('roles')
      .select('id, name');

    if (rolesError) {
      console.error('❌ Error fetching roles:', rolesError);
      return;
    }

    if (!rolesData || rolesData.length === 0) {
      console.log('❌ No roles found in database');
      return;
    }

    console.log('Available roles:');
    rolesData.forEach(role => {
      console.log(`   - ${role.name} (${role.id})`);
    });

    console.log('\n🔧 Adding all roles to Ross...\n');

    // Delete existing roles first
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', ross.id);

    if (deleteError) {
      console.log('⚠️  Warning: Could not delete existing roles:', deleteError.message);
    }

    // Add all roles - user_roles uses role_id (FK to roles table)
    const rolesToInsert = rolesData.map(role => ({
      user_id: ross.id,
      role_id: role.id,
      community_id: null, // Global roles (not community-specific)
      assigned_by: ross.id,
    }));

    const { error: insertError } = await supabase
      .from('user_roles')
      .insert(rolesToInsert);

    if (insertError) {
      console.error('❌ Error adding roles:', insertError);
      return;
    }

    console.log('✅ Successfully added all roles:');
    rolesData.forEach(role => {
      console.log(`   - ${role.name}`);
    });

    // Verify the roles were added
    console.log('\n🔍 Verifying roles...');
    const { data: verifyRoles, error: verifyError } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles:role_id (
          name
        )
      `)
      .eq('user_id', ross.id);

    if (verifyError) {
      console.log('⚠️  Could not verify roles:', verifyError.message);
    } else {
      console.log('✅ Confirmed roles in database:');
      verifyRoles.forEach(r => console.log(`   - ${r.roles.name}`));
    }

    console.log('\n🎉 Ross is now a Super Admin with all roles!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

makeRossSuperAdmin();
