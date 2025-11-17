const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkLatestOTP() {
  const { data, error } = await supabase
    .from('otp')
    .select('*')
    .eq('user_identifier', '+971503725877')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Latest OTP for +971503725877:');
    console.log('Code:', data[0].code);
    console.log('Medium:', data[0].medium);
    console.log('Created:', data[0].created_at);
    console.log('Expires:', data[0].expires_at);
    console.log('Verified:', data[0].verified);
  } else {
    console.log('No OTP found for +971503725877');
  }
}

checkLatestOTP();
