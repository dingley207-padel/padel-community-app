const twilio = require('twilio');
require('dotenv').config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function createOTPTemplate() {
  try {
    console.log('Creating WhatsApp OTP Template...\n');

    // Create the OTP verification template
    const template = await client.content.v1.contents.create({
      friendlyName: 'padel_otp_verification_v2',
      language: 'en',
      variables: {
        1: 'OTP_CODE',
        2: 'EXPIRY_MINUTES'
      },
      types: {
        'twilio/text': {
          body: 'Your Padel Community verification code is {{1}}. This code expires in {{2}} minutes. Do not share this code with anyone.'
        }
      }
    });

    console.log('✅ Template created successfully!');
    console.log('Template SID:', template.sid);
    console.log('Friendly Name:', template.friendlyName);
    console.log('');
    console.log('IMPORTANT: Save this Template SID for your code:');
    console.log(`TWILIO_CONTENT_SID=${template.sid}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Go to: https://console.twilio.com/us1/develop/sms/content-editor');
    console.log('2. Find the template "padel_otp_verification_v2"');
    console.log('3. Submit it for WhatsApp approval');
    console.log('4. Wait for approval (usually 1-24 hours for AUTHENTICATION category)');

  } catch (error) {
    console.error('❌ Error creating template:');
    console.error('Error:', error.message);
  }
}

createOTPTemplate();
