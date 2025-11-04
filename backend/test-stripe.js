require('dotenv').config();
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testStripe() {
  try {
    console.log('Testing Stripe connection...');
    console.log('Using API Key:', process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...');

    // Test 1: Create a simple payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00 in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        test: 'true',
      },
    });

    console.log('✓ Stripe API connection successful!');
    console.log('✓ Payment Intent created:', paymentIntent.id);
    console.log('  Amount:', paymentIntent.amount / 100, paymentIntent.currency.toUpperCase());
    console.log('  Status:', paymentIntent.status);

    // Test 2: Retrieve account info
    const account = await stripe.balance.retrieve();
    console.log('✓ Account balance retrieved');
    console.log('  Available:', account.available);

    console.log('\n✅ All Stripe tests passed!');

  } catch (error) {
    console.error('❌ Stripe test failed:');
    console.error('Error:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('⚠️  This is likely an API key issue. Please check your STRIPE_SECRET_KEY in .env');
    }
  }
}

testStripe();
