const twilio = require('twilio');
require('dotenv').config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function checkMessageLogs() {
  try {
    console.log('Fetching recent message logs from Twilio...\n');

    const messages = await client.messages.list({ limit: 5 });

    messages.forEach((message) => {
      console.log('---');
      console.log('SID:', message.sid);
      console.log('From:', message.from);
      console.log('To:', message.to);
      console.log('Status:', message.status);
      console.log('Error Code:', message.errorCode || 'None');
      console.log('Error Message:', message.errorMessage || 'None');
      console.log('Date:', message.dateCreated);
      console.log('Body:', message.body.substring(0, 100));
    });
  } catch (error) {
    console.error('Error fetching logs:', error.message);
  }
}

checkMessageLogs();
