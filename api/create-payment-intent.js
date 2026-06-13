// api/create-payment-intent.js
// Vercel serverless function
// Called when a lister submits payment on registration step 3
// Creates a Stripe PaymentIntent for the registration fee

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers for your Vercel domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { amount, currency, userId, email } = req.body;

    // Validate inputs
    if (!amount || amount < 100) { // minimum $1 NZD in cents (discount codes can reduce fee)
      return res.status(400).json({ error: 'Invalid amount.' });
    }
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: { userId: userId || '', platform: 'nestx' }
      });
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,                    // Amount in cents (NZD)
      currency: currency || 'nzd',
      customer: customer.id,
      metadata: {
        userId: userId || '',
        type: 'lister_registration',
        platform: 'nestx'
      },
      description: 'Nest X — Lister registration fee',
      receipt_email: email,
      // After 3 months, set up recurring $40/month subscription
      // This is handled separately via create-lister-subscription
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
      paymentIntentId: paymentIntent.id
    });

  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
