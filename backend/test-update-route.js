const http = require('http');

// Test if the PUT route responds (even with 401 Unauthorized is fine - means route exists)
const testUrl = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/communities/test-id-123/sub-communities/test-sub-456',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Testing PUT (update) route...');
console.log('URL:', `http://${testUrl.hostname}:${testUrl.port}${testUrl.path}`);
console.log();

const req = http.request(testUrl, (res) => {
  console.log('✅ Route exists! Status:', res.statusCode);
  console.log('Status message:', res.statusMessage);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Response:', parsed);

      if (res.statusCode === 404) {
        console.log('\n❌ 404 Not Found - The route is NOT registered');
        console.log('💡 Backend needs restart');
      } else if (res.statusCode === 401) {
        console.log('\n✅ 401 Unauthorized - Route EXISTS and is working!');
        console.log('💡 This is expected - the route requires authentication.');
      } else {
        console.log('\n✅ Route is responding');
      }
    } catch (e) {
      console.log('Response (raw):', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
});

req.end();
