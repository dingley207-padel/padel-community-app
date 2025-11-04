const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log('🚀 Starting roles system migration...\n');

    // Read the migration SQL file
    const sql = fs.readFileSync('./migrations/create_roles_system.sql', 'utf8');

    // Execute the migration via Supabase RPC
    // Note: Supabase doesn't support direct SQL execution via JS client for DDL,
    // so we'll need to run individual queries

    // 1. Create roles table
    console.log('Creating roles table...');
    const { error: rolesTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS roles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(50) UNIQUE NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    }).catch(() => {
      // If RPC doesn't exist, we'll need to use a different approach
      return { error: 'RPC not available' };
    });

    // Since Supabase client doesn't support direct SQL execution,
    // let's use the REST API approach or manual table creation
    console.log('⚠️  Note: This migration needs to be run directly in Supabase SQL Editor');
    console.log('\n📝 Please follow these steps:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of: ./migrations/create_roles_system.sql');
    console.log('4. Run the SQL script');
    console.log('\nAlternatively, I can create the schema using Supabase API calls...\n');

    // Let's try creating the schema using Supabase API
    console.log('🔨 Creating schema via Supabase API...\n');

    // Check if roles table exists
    const { data: existingRoles, error: checkError } = await supabase
      .from('roles')
      .select('*')
      .limit(1);

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('❌ Roles table does not exist. Please run the SQL migration manually.');
      console.log('\nSQL file location: ./migrations/create_roles_system.sql');
      console.log('\nYou can run it with:');
      console.log('psql $DATABASE_URL -f migrations/create_roles_system.sql');
      return;
    }

    if (!checkError) {
      console.log('✅ Roles table already exists');

      // Verify roles
      const { data: roles } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      console.log('\n📋 Roles in database:');
      roles?.forEach(role => {
        console.log(`  - ${role.name}: ${role.description}`);
      });

      // Check if super admin is assigned
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select(`
          *,
          users!inner(email),
          roles!inner(name)
        `)
        .eq('roles.name', 'super_admin');

      console.log('\n👑 Super Admins:');
      if (userRoles && userRoles.length > 0) {
        userRoles.forEach(ur => {
          console.log(`  - ${ur.users.email}`);
        });
      } else {
        console.log('  - No super admin assigned yet');

        // Try to assign super admin to ross@bloktopia.com
        console.log('\n🔍 Looking for user: ross@bloktopia.com');
        const { data: user } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', 'ross@bloktopia.com')
          .single();

        if (user) {
          console.log('✅ Found user, assigning super admin role...');

          const { data: superAdminRole } = await supabase
            .from('roles')
            .select('id')
            .eq('name', 'super_admin')
            .single();

          if (superAdminRole) {
            const { error: assignError } = await supabase
              .from('user_roles')
              .insert({
                user_id: user.id,
                role_id: superAdminRole.id,
                community_id: null,
                assigned_by: user.id
              });

            if (!assignError) {
              console.log('✅ Super admin role assigned to ross@bloktopia.com');
            } else {
              console.log('⚠️  Error assigning role:', assignError.message);
            }
          }
        } else {
          console.log('⚠️  User ross@bloktopia.com not found. Please create an account first.');
        }
      }
    }

    console.log('\n✅ Migration check completed');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
