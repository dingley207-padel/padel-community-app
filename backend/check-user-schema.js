const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkSchema() {
  try {
    console.log('Checking users table schema...\n');

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (users && users.length > 0) {
      console.log('Available columns in users table:');
      console.log(Object.keys(users[0]));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSchema();
