const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { email, userId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const customers = await stripe.customers.list({ email, limit: 1 });
    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: { userId: userId || '', type: 'conveyancer', platform: 'nestx' }
      });
    }

    const priceId = process.env.STRIPE_CONV_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({ error: 'Subscription price not configured.' });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        userId: userId || '',
        type: 'conveyancer_setup',
        platform: 'nestx'
      }
    });

    return res.status(200).json({
      clientSecret: setupIntent.client_secret,
      customerId: customer.id,
      setupIntentId: setupIntent.id
    });

  } catch (err) {
    console.error('Stripe conveyancer setup error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
