require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkPendingRegistrations() {
  console.log('🔍 Checking pending registrations...\\n');

  // Get all pending registrations
  const { data: pendingRegs, error } = await supabase
    .from('pending_registrations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching pending registrations:', error.message);
    return;
  }

  if (!pendingRegs || pendingRegs.length === 0) {
    console.log('✅ No pending registrations found');
    return;
  }

  console.log(`Found ${pendingRegs.length} pending registration(s):\\n`);

  pendingRegs.forEach((reg, i) => {
    console.log(`${i + 1}. Email: ${reg.email}`);
    console.log(`   Name: ${reg.name}`);
    console.log(`   Phone: ${reg.phone}`);
    console.log(`   Created: ${reg.created_at}`);
    console.log(`   Expires: ${reg.expires_at}`);
    console.log('');
  });
}

checkPendingRegistrations();
