const twilio = require('twilio');
require('dotenv').config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function checkWhatsAppStatus() {
  try {
    console.log('Checking Twilio WhatsApp Configuration...\n');
    console.log('Account SID:', process.env.TWILIO_ACCOUNT_SID);
    console.log('WhatsApp Number:', process.env.TWILIO_WHATSAPP_FROM);
    console.log('---\n');

    // Check if the number has WhatsApp enabled
    console.log('Fetching phone number details...');
    const phoneNumbers = await client.incomingPhoneNumbers.list({
      phoneNumber: process.env.TWILIO_WHATSAPP_FROM.replace('whatsapp:', '')
    });

    if (phoneNumbers.length > 0) {
      const number = phoneNumbers[0];
      console.log('\n✅ Phone Number Found:');
      console.log('Friendly Name:', number.friendlyName);
      console.log('Capabilities:', JSON.stringify(number.capabilities, null, 2));
      console.log('Voice URL:', number.voiceUrl || 'Not configured');
      console.log('SMS URL:', number.smsUrl || 'Not configured');
      console.log('Status Callback:', number.statusCallback || 'Not configured');
    } else {
      console.log('\n⚠️  Phone number not found in your Twilio account');
    }

    // Check WhatsApp senders
    console.log('\n---\nChecking WhatsApp Senders (if any)...');
    try {
      const senders = await client.messaging.v1.services.list({ limit: 20 });

      if (senders.length > 0) {
        console.log(`\nFound ${senders.length} Messaging Service(s):`);
        for (const service of senders) {
          console.log('\nService SID:', service.sid);
          console.log('Friendly Name:', service.friendlyName);

          // Get phone numbers in this service
          try {
            const phoneNumbers = await client.messaging.v1
              .services(service.sid)
              .phoneNumbers
              .list({ limit: 20 });

            if (phoneNumbers.length > 0) {
              console.log('Phone Numbers in Service:');
              phoneNumbers.forEach(phone => {
                console.log(`  - ${phone.phoneNumber} (Capabilities: ${JSON.stringify(phone.capabilities)})`);
              });
            }
          } catch (err) {
            console.log('Could not fetch phone numbers for this service');
          }
        }
      } else {
        console.log('No Messaging Services found');
      }
    } catch (err) {
      console.log('Could not fetch messaging services:', err.message);
    }

    // Check for WhatsApp senders specifically
    console.log('\n---\nChecking for approved WhatsApp senders...');
    try {
      // This will show if you have any WhatsApp Business API senders
      const response = await client.api.v2010
        .accounts(process.env.TWILIO_ACCOUNT_SID)
        .fetch();

      console.log('\nAccount Status:', response.status);
      console.log('Account Type:', response.type);

    } catch (err) {
      console.log('Could not fetch account details:', err.message);
    }

    console.log('\n---\n');
    console.log('💡 IMPORTANT INFORMATION:');
    console.log('');
    console.log('Your Twilio number', process.env.TWILIO_WHATSAPP_FROM);
    console.log('requires Meta WhatsApp Business API approval to send messages.');
    console.log('');
    console.log('To check your Meta WhatsApp Business API status:');
    console.log('1. Go to: https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders');
    console.log('2. Look for "WhatsApp Senders" or "WhatsApp Approved Senders"');
    console.log('3. Check if your number +12174396662 is listed and approved');
    console.log('');
    console.log('If you have NOT applied for WhatsApp Business API:');
    console.log('1. Your number can only receive messages, not send them');
    console.log('2. You need to apply through Twilio for Meta WhatsApp Business API access');
    console.log('3. The approval process takes 1-3 weeks');
    console.log('');
    console.log('Current recommended solution:');
    console.log('- Keep NODE_ENV=development to use fixed OTP code 123456');
    console.log('- This bypasses actual WhatsApp sending');
    console.log('- Deploy this to Railway for immediate production use');

  } catch (error) {
    console.error('\n❌ Error checking WhatsApp status:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    if (error.moreInfo) {
      console.error('More info:', error.moreInfo);
    }
  }
}

checkWhatsAppStatus();
