const twilio = require('twilio');
require('dotenv').config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function testWhatsAppOTP() {
  try {
    console.log('Testing WhatsApp OTP with Approved Template...\n');
    console.log('Account SID:', process.env.TWILIO_ACCOUNT_SID);
    console.log('WhatsApp From:', process.env.TWILIO_WHATSAPP_FROM);
    console.log('Content SID:', process.env.TWILIO_CONTENT_SID);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('---\n');

    const testPhone = '+971503725877';
    const testCode = '123456';

    console.log(`Sending OTP to ${testPhone}...`);

    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${testPhone}`,
      contentSid: process.env.TWILIO_CONTENT_SID,
      contentVariables: JSON.stringify({
        1: testCode
      })
    });

    console.log('\n✅ WhatsApp OTP sent successfully!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    console.log('To:', message.to);
    console.log('From:', message.from);
    console.log('\n📱 Check your WhatsApp for the OTP message!');

  } catch (error) {
    console.error('\n❌ Error sending WhatsApp OTP:');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.moreInfo) {
      console.error('More Info:', error.moreInfo);
    }
  }
}

testWhatsAppOTP();
