// api/cancel-subscription.js
// Cancels a Stripe subscription when listing is sold or removed

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID required' });
    }

    // Cancel at end of current billing period
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    return res.status(200).json({
      success: true,
      cancelAt: new Date(subscription.cancel_at * 1000).toISOString()
    });

  } catch (err) {
    console.error('Cancellation error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
