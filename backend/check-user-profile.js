require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkUserProfile() {
  try {
    console.log('Checking user profile for +447866406791...\n');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', '+447866406791')
      .single();

    if (error) {
      console.error('Error:', error.message);
      return;
    }

    if (data) {
      console.log('✅ User found!');
      console.log('─'.repeat(60));
      console.log('ID:', data.id);
      console.log('Name:', data.name || '(not set)');
      console.log('Email:', data.email || '(not set)');
      console.log('Phone:', data.phone);
      console.log('Location:', data.location || '(not set)');
      console.log('Grade (skill_level):', data.skill_level || '(not set)');
      console.log('Gender:', data.gender || '(not set)');
      console.log('Profile Image:', data.profile_image || '(not set)');
      console.log('Created:', data.created_at);
      console.log('─'.repeat(60));
    } else {
      console.log('❌ User not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUserProfile();
