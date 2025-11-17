const twilio = require('twilio');
require('dotenv').config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function testWhatsAppSend() {
  try {
    console.log('Testing WhatsApp send with Twilio...');
    console.log('From:', process.env.TWILIO_WHATSAPP_FROM);
    console.log('To: whatsapp:+971503725877');

    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: 'whatsapp:+971503725877',
      body: 'Test message from Padel App - Your verification code is: 123456'
    });

    console.log('✅ Message sent successfully!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('More info:', error.moreInfo);
  }
}

testWhatsAppSend();
