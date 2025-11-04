require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function deletePendingRegistrations() {
  console.log('🔍 Finding pending registrations...\n');

  // Count pending registrations
  const { count: pendingCount } = await supabase
    .from('pending_registrations')
    .select('*', { count: 'exact', head: true });

  console.log(`Pending registrations to delete: ${pendingCount || 0}\n`);

  if (pendingCount === 0) {
    console.log('✅ No pending registrations to delete');
    return;
  }

  // Get all pending registrations to show what we're deleting
  const { data: pendingRegs } = await supabase
    .from('pending_registrations')
    .select('email, phone, name, created_at');

  if (pendingRegs && pendingRegs.length > 0) {
    console.log('Found pending registrations:');
    pendingRegs.forEach((reg, i) => {
      console.log(`  ${i + 1}. ${reg.name} (${reg.email}, ${reg.phone})`);
      console.log(`     Created: ${reg.created_at}`);
    });
    console.log('');
  }

  // Delete all pending registrations
  console.log('Deleting pending registrations...');
  const { error: deleteError } = await supabase
    .from('pending_registrations')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.error('❌ Error deleting pending registrations:', deleteError.message);
  } else {
    console.log('✅ All pending registrations deleted successfully');
  }

  // Verify deletion
  const { count: remainingCount } = await supabase
    .from('pending_registrations')
    .select('*', { count: 'exact', head: true });

  console.log(`\nRemaining pending registrations: ${remainingCount || 0}`);
  console.log('\n✅ Deletion complete');
}

deletePendingRegistrations();
