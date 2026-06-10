const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { customerId, userId, paymentMethodId } = req.body;

    if (!customerId || !paymentMethodId) {
      return res.status(400).json({ error: 'Customer ID and payment method required.' });
    }

    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId }
    });

    const trialEnd = Math.floor(Date.now() / 1000) + (91 * 24 * 60 * 60);
    const priceId = process.env.STRIPE_LISTER_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({ error: 'Subscription price not configured.' });
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_end: trialEnd,
      metadata: {
        userId: userId || '',
        type: 'lister_monthly',
        platform: 'nestx'
      }
    });

    return res.status(200).json({
      subscriptionId: subscription.id,
      trialEnd: new Date(trialEnd * 1000).toISOString(),
      status: subscription.status
    });

  } catch (err) {
    console.error('Stripe subscription error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
