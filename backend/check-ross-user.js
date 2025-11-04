const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRossUser() {
  try {
    console.log('🔍 Searching for Ross in the database...\n');

    // Search for any user with "ross" in name, email, or phone
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, phone, created_at')
      .or('name.ilike.%ross%,email.ilike.%ross%,phone.ilike.%ross%');

    if (error) {
      console.error('❌ Error querying database:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found with "ross" in name, email, or phone\n');
      console.log('📋 This means Ross was likely deleted by the previous cleanup script.');
      return;
    }

    console.log(`✅ Found ${users.length} user(s) matching "ross":\n`);
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email || 'N/A'}`);
      console.log(`  Phone: ${user.phone || 'N/A'}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRossUser();
