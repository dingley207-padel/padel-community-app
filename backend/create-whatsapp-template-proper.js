const twilio = require('twilio');
require('dotenv').config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function createWhatsAppTemplate() {
  try {
    console.log('Creating proper WhatsApp OTP Template...\n');

    // First, delete the problematic template
    try {
      await client.content.v1.contents('HX2550f42967c58e12503b87249d4b5d1a').remove();
      console.log('Deleted previous template\n');
    } catch (e) {
      // Ignore if doesn't exist
    }

    // Create a proper WhatsApp template with authentication type
    const template = await client.content.v1.contents.create({
      friendlyName: 'padel_otp_code',
      language: 'en',
      variables: {
        1: 'code'
      },
      types: {
        'twilio/quick-reply': {
          body: 'Your Padel Community verification code is {{1}}. Do not share this code with anyone.',
        }
      }
    });

    console.log('✅ Template created successfully!');
    console.log('Template SID:', template.sid);
    console.log('Friendly Name:', template.friendlyName);
    console.log('');
    console.log('Save this to your .env file:');
    console.log(`TWILIO_CONTENT_SID=${template.sid}`);
    console.log('');
    console.log('Now try submitting for approval again in the Twilio console.');

  } catch (error) {
    console.error('❌ Error:');
    console.error(error.message);
    console.error('\nLet me try a different approach - creating via WhatsApp API directly...');
  }
}

createWhatsAppTemplate();
