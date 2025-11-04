require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function addGenderColumn() {
  try {
    console.log('Attempting to add gender column...');

    // Try to query the column - if it fails, it doesn't exist
    const { data, error } = await supabase
      .from('users')
      .select('gender')
      .limit(1);

    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('\n❌ Gender column does not exist in the database.');
        console.log('\n📝 Please run this SQL in your Supabase SQL Editor:');
        console.log('─'.repeat(60));
        console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);');
        console.log('─'.repeat(60));
        console.log('\n🔗 Go to: https://supabase.com → Your Project → SQL Editor');
      } else {
        console.log('Error:', error.message);
      }
    } else {
      console.log('✅ Gender column already exists!');
      console.log('You can now save your profile with gender.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addGenderColumn();
