const twilio = require('twilio');
require('dotenv').config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function checkTemplates() {
  try {
    console.log('Checking WhatsApp Content Templates...\n');

    // Check for approved content templates
    const templates = await client.content.v1.contents.list({ limit: 50 });

    if (templates.length === 0) {
      console.log('❌ No WhatsApp message templates found\n');
      console.log('You need to create and get approval for message templates to send WhatsApp messages.\n');
      console.log('Steps to create templates:');
      console.log('1. Go to: https://console.twilio.com/us1/develop/sms/content-editor');
      console.log('2. Click "Create new Content Template"');
      console.log('3. Create a template for OTP verification');
      console.log('4. Submit for Meta approval (usually takes 1-24 hours)');
      console.log('\nExample OTP template:');
      console.log('---');
      console.log('Template Name: padel_otp_verification');
      console.log('Language: English');
      console.log('Category: AUTHENTICATION');
      console.log('Body: Your Padel Community verification code is: {{1}}. This code will expire in {{2}} minutes.');
      console.log('Variables: {{1}} = OTP code, {{2}} = expiry minutes');
      console.log('---\n');
      return;
    }

    console.log(`Found ${templates.length} template(s):\n`);

    for (const template of templates) {
      console.log('---');
      console.log('Template SID:', template.sid);
      console.log('Friendly Name:', template.friendlyName);
      console.log('Language:', template.language);
      console.log('Status:', template.approvalRequests?.whatsapp?.status || 'Unknown');
      console.log('Types:', template.types);

      // Try to get detailed info
      try {
        const detail = await client.content.v1.contents(template.sid).fetch();
        if (detail.types?.['twilio/text']) {
          console.log('Body:', detail.types['twilio/text'].body);
        }
      } catch (err) {
        // Skip if can't fetch details
      }
      console.log('');
    }

    console.log('\n✅ Templates found!');
    console.log('Make sure at least one template has status "approved" for WhatsApp');

  } catch (error) {
    console.error('❌ Error checking templates:');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Code:', error.code);
    }
  }
}

checkTemplates();
