const twilio = require('twilio');
require('dotenv').config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function testCreateTemplate() {
  try {
    console.log('Testing WhatsApp Template Creation Permissions...\n');

    // Try to create a simple test template
    const template = await client.content.v1.contents.create({
      friendlyName: 'padel_test_permissions',
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

    console.log('✅ SUCCESS! Template created successfully!');
    console.log('Template SID:', template.sid);
    console.log('Name:', template.friendlyName);
    console.log('');
    console.log('Your Meta Business Manager account is now properly configured!');
    console.log('');
    console.log('Next step: Submit this template for WhatsApp approval');
    console.log('Go to: https://console.twilio.com/us1/develop/sms/content-editor');

  } catch (error) {
    console.error('❌ Template creation still failing:');
    console.error('Error:', error.message);

    if (error.message.includes('permission')) {
      console.error('\n❌ Permission Error - Account NOT verified yet');
      console.error('');
      console.error('Your Meta Business Manager still does not have permission.');
      console.error('');
      console.error('To fix this:');
      console.error('1. Go to: https://business.facebook.com/settings/whatsapp-business-accounts/2704173509933352');
      console.error('2. Ensure you are an admin of the WhatsApp Business Account');
      console.error('3. Check that "Manage Templates" permission is enabled');
      console.error('4. May need to complete business verification with Meta');
    } else {
      console.error('\nUnexpected error:', error);
    }
  }
}

testCreateTemplate();
