require('dotenv').config();
const https = require('https');

// Manually create a JWT token for testing
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: '9b52f342-47b4-4f30-b343-fb9109c80ec3' },
  process.env.JWT_SECRET || 'your-secret-key'
);

console.log('Testing chat endpoint...\n');
console.log('Using token:', token.substring(0, 20) + '...\n');

const options = {
  hostname: 'unfrigid-scott-bifurcately.ngrok-free.dev',
  port: 443,
  path: '/api/chat/chats',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'ngrok-skip-browser-warning': 'true'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
    try {
      const json = JSON.parse(data);
      console.log('\nParsed:', JSON.stringify(json, null, 2));
      console.log('\nNumber of chats:', json.chats?.length || 0);
      if (json.chats) {
        console.log('\nChat details:');
        json.chats.forEach((chat, i) => {
          console.log(`\n${i + 1}. ${chat.community_name}`);
          console.log(`   ID: ${chat.community_id}`);
          console.log(`   Parent ID: ${chat.parent_community_id || 'null (this is a PARENT community)'}`);
          console.log(`   Members: ${chat.member_count}`);
        });
      }
    } catch (e) {
      console.log('Could not parse JSON:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();
