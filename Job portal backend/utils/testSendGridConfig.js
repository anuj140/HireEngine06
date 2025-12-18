require('dotenv').config();
const sgMail = require('@sendgrid/mail');

console.log('🔍 Testing SendGrid Configuration...\n');

// Check if API key exists
if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY is missing in environment variables');
  process.exit(1);
}

console.log('✅ SENDGRID_API_KEY is present');
console.log('📋 API Key (first 10 chars):', process.env.SENDGRID_API_KEY.substring(0, 10) + '...');

// Check if FROM email exists
if (!process.env.EMAIL_FROM) {
  console.error('❌ EMAIL_FROM is missing in environment variables');
  process.exit(1);
}

console.log('✅ EMAIL_FROM is present:', process.env.EMAIL_FROM);

// Set API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function testSendGrid() {
  try {
    console.log('\n🚀 Testing SendGrid API connection...');
    
    const msg = {
      to: 'yilap65161@arugy.com', // Use a test email
      from: process.env.EMAIL_FROM,
      subject: 'SendGrid Configuration Test',
      text: 'This is a test email to verify your SendGrid configuration is working correctly.',
      html: '<strong>This is a test email to verify your SendGrid configuration is working correctly.</strong>',
    };

    const response = await sgMail.send(msg);
    console.log('✅ SendGrid test email sent successfully!');
    console.log('📨 Response status:', response[0].statusCode);
    
  } catch (error) {
    console.error('\n❌ SendGrid test failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.response) {
      console.error('Response body:', JSON.stringify(error.response.body, null, 2));
    }
    
    // Provide specific troubleshooting steps based on the error
    if (error.code === 401) {
      console.log('\n🔧 Troubleshooting steps for 401 Unauthorized:');
      console.log('1. Verify your SENDGRID_API_KEY is correct');
      console.log('2. Check if the API key has proper permissions');
      console.log('3. Ensure your SendGrid account is active and verified');
      console.log('4. Make sure the FROM email is verified in your SendGrid account');
    }
  }
}

testSendGrid();