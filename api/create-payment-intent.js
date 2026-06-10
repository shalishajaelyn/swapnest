const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { amount, currency, userId, email } = req.body;

    if (!amount || amount < 50000) {
      return res.status(400).json({ error: 'Invalid amount. Minimum registration fee is $500 NZD.' });
    }
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
        metadata: { userId: userId || '', platform: 'nestx' }
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || 'nzd',
      customer: customer.id,
      metadata: {
        userId: userId || '',
        type: 'lister_registration',
        platform: 'nestx'
      },
      description: 'Nest X — Lister registration fee',
      receipt_email: email,
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
