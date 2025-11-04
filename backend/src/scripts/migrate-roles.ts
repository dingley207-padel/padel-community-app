import { supabase } from '../config/database';

async function migrateRolesSystem() {
  try {
    console.log('🚀 Starting roles system migration...\n');

    // Step 1: Check if user ross@bloktopia.com exists
    console.log('1️⃣ Checking for super admin user...');
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'ross@bloktopia.com')
      .single();

    if (userError || !existingUser) {
      console.log('⚠️  User ross@bloktopia.com not found.');
      console.log('   Please create an account with this email first, then run this script again.\n');
      return;
    }

    console.log(`✅ Found user: ${existingUser.email} (ID: ${existingUser.id})\n`);

    // Step 2: Check existing tables
    console.log('2️⃣ Checking database schema...');
    console.log('⚠️  This migration requires manual SQL execution in Supabase Dashboard.\n');
    console.log('📝 Please follow these steps:\n');
    console.log('   1. Go to your Supabase Dashboard (https://supabase.com/dashboard)');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor (left sidebar)');
    console.log('   4. Click "New Query"');
    console.log('   5. Copy the SQL from: backend/migrations/create_roles_system.sql');
    console.log('   6. Paste and run the SQL');
    console.log('   7. Run this script again to verify\n');

    // Try to check if tables exist
    const { error: rolesError } = await supabase
      .from('roles')
      .select('id')
      .limit(1);

    if (rolesError) {
      console.log('❌ Roles table does not exist yet.');
      console.log('   Please run the SQL migration first (see steps above).\n');
      return;
    }

    console.log('✅ Roles table exists\n');

    // Step 3: Verify roles
    console.log('3️⃣ Verifying roles...');
    const { data: roles, error: rolesListError } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (rolesListError) {
      console.log('❌ Error fetching roles:', rolesListError.message);
      return;
    }

    console.log('📋 Roles in database:');
    roles?.forEach(role => {
      console.log(`   - ${role.name}: ${role.description}`);
    });
    console.log('');

    // Step 4: Check/assign super admin
    console.log('4️⃣ Checking super admin assignment...');
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select(`
        id,
        user_id,
        role_id,
        users!inner(email),
        roles!inner(name)
      `)
      .eq('users.email', 'ross@bloktopia.com')
      .eq('roles.name', 'super_admin');

    if (userRolesError) {
      console.log('⚠️  Could not check user roles:', userRolesError.message);
    }

    if (userRoles && userRoles.length > 0) {
      console.log('✅ Super admin role already assigned to ross@bloktopia.com\n');
    } else {
      console.log('⚠️  Super admin role not assigned yet.');
      console.log('   Assigning now...');

      const { data: superAdminRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'super_admin')
        .single();

      if (superAdminRole) {
        const { error: assignError } = await supabase
          .from('user_roles')
          .insert({
            user_id: existingUser.id,
            role_id: superAdminRole.id,
            community_id: null,
            assigned_by: existingUser.id
          });

        if (assignError) {
          console.log('❌ Error assigning super admin role:', assignError.message);
        } else {
          console.log('✅ Super admin role assigned to ross@bloktopia.com\n');
        }
      }
    }

    console.log('✅ Migration verification complete!\n');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
migrateRolesSystem()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
