import fetch from 'node-fetch';

async function testActualAPI() {
  const apiUrl = 'https://unfrigid-scott-bifurcately.ngrok-free.dev/api';
  const userId = 'ed8bef2d-d6aa-44fa-9aef-67b86def17a5';

  console.log('\n=== Testing actual backend API ===');
  console.log(`API URL: ${apiUrl}`);
  console.log(`User ID: ${userId}\n`);

  // Test health endpoint (no auth needed)
  try {
    const healthResponse = await fetch(`${apiUrl}/health`);
    console.log(`✓ Backend is reachable`);
    console.log(`  Status: ${healthResponse.status}`);
  } catch (error) {
    console.error('✗ Backend not reachable:', error);
    return;
  }

  // Now check what Supabase URL the backend is using
  console.log('\n=== Checking backend database connection ===');
  console.log('Backend .env SUPABASE_URL:', process.env.SUPABASE_URL);
}

testActualAPI().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
