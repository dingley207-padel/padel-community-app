const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testOTPFlow() {
  try {
    console.log('Testing OTP Flow...\n');
    console.log('API URL:', API_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('---\n');

    const phoneNumber = '+971503725877';

    // Step 1: Send OTP
    console.log('Step 1: Sending OTP to', phoneNumber);
    const sendResponse = await axios.post(`${API_URL}/api/auth/send-otp`, {
      identifier: phoneNumber,
      medium: 'whatsapp'
    });

    console.log('✅ OTP Send Response:', sendResponse.data);
    console.log('\n---\n');

    // Step 2: Verify OTP
    console.log('Step 2: Verifying OTP with code: 123456');
    const verifyResponse = await axios.post(`${API_URL}/api/auth/verify-otp`, {
      identifier: phoneNumber,
      code: '123456'
    });

    console.log('✅ OTP Verify Response:', verifyResponse.data);
    console.log('\n---\n');
    console.log('✅ OTP FLOW TEST PASSED!');
    console.log('In development mode, OTP is always: 123456');

  } catch (error) {
    console.error('\n❌ OTP Flow Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testOTPFlow();
