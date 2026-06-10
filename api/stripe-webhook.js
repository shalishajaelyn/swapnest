const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  const data = event.data.object;

  switch (event.type) {
    case 'payment_intent.succeeded':
      if (data.metadata?.type === 'lister_registration') {
        await supabase
          .from('listings')
          .update({ payment_status: 'paid' })
          .eq('user_id', data.metadata.userId)
          .eq('status', 'pending_verification');
      }
      if (data.metadata?.type === 'swap_or_sell_upgrade') {
        await supabase
          .from('listings')
          .update({ plan: 'swap_or_sell' })
          .eq('id', data.metadata.listingId)
          .eq('user_id', data.metadata.userId);
      }
      break;

    case 'invoice.payment_succeeded':
      await supabase.from('listings')
        .update({ subscription_active: true })
        .eq('stripe_subscription_id', data.subscription);
      await supabase.from('conveyancers')
        .update({ active: true })
        .eq('stripe_subscription_id', data.subscription);
      break;

    case 'invoice.payment_failed':
      await supabase.from('listings')
        .update({ subscription_active: false, status: 'payment_failed' })
        .eq('stripe_subscription_id', data.subscription);
      await supabase.from('conveyancers')
        .update({ active: false, status: 'payment_failed' })
        .eq('stripe_subscription_id', data.subscription);
      break;

    case 'customer.subscription.deleted':
      await supabase.from('listings')
        .update({ subscription_active: false, active: false, status: 'cancelled' })
        .eq('stripe_subscription_id', data.id);
      await supabase.from('conveyancers')
        .update({ active: false, status: 'cancelled' })
        .eq('stripe_subscription_id', data.id);
      break;

    default:
      console.log(`Unhandled event: ${event.type}`);
  }

  return res.status(200).json({ received: true });
};
