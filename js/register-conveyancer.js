// ─────────────────────────────────────────────────────────
//  CONVEYANCER REGISTRATION
//  Free first month, then $40/month via Stripe subscription
// ─────────────────────────────────────────────────────────

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TgiMJB46FzEUxbhqo1JzrsUSP7F5M5Yq1DFILvKtmRhk5kKreKhAcPCe7HlzkNC1yyKxExYOGqUcELCRTz0ZCro007xyo8Xmw';
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
const elements = stripe.elements();
let convCardElement = null;

// Mount Stripe card element on page load
window.addEventListener('load', () => {
  convCardElement = elements.create('card', {
    style: {
      base: {
        fontSize: '15px',
        color: '#1a1a18',
        fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        '::placeholder': { color: '#767672' }
      }
    }
  });
  convCardElement.mount('#convCardElement');
  convCardElement.on('change', e => {
    const errEl = document.getElementById('convCardError');
    if (e.error) { errEl.textContent = e.error.message; errEl.style.display = 'block'; }
    else { errEl.style.display = 'none'; }
  });
});

async function submitConveyancerReg() {
  const errEl   = document.getElementById('convRegError');
  const submitBtn = document.getElementById('convSubmitBtn');
  errEl.style.display = 'none';

  // Validate required fields
  const firstName   = document.getElementById('convFirstName').value.trim();
  const lastName    = document.getElementById('convLastName').value.trim();
  const email       = document.getElementById('convEmail').value.trim();
  const password    = document.getElementById('convPassword').value;
  const firm        = document.getElementById('convFirm').value.trim();
  const region      = document.getElementById('convRegion').value;
  const city        = document.getElementById('convCity').value.trim();
  const phone       = document.getElementById('convPhone').value.trim();
  const lawSociety  = document.getElementById('convLawSociety').value.trim();

  if (!firstName || !lastName || !email || !password || !firm || !region || !city || !phone || !lawSociety) {
    errEl.textContent = 'Please fill in all required fields.';
    errEl.style.display = 'block'; return;
  }
  if (password.length < 8) {
    errEl.textContent = 'Password must be at least 8 characters.';
    errEl.style.display = 'block'; return;
  }
  if (!document.getElementById('convAgreeTerms').checked || !document.getElementById('convAgreeDirectory').checked) {
    errEl.textContent = 'Please agree to both sets of terms.';
    errEl.style.display = 'block'; return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Setting up your account…';

  try {
    // 1. Create Supabase account
    const { data: authData, error: authError } = await db.auth.signUp({
      email, password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          user_type: 'conveyancer',
          firm, region, city, phone
        }
      }
    });

    if (authError) throw new Error(authError.message);
    const userId = authData.user.id;

    // 2. Get specialties
    const specialties = Array.from(document.querySelectorAll('.specialty-item input:checked'))
      .map(cb => cb.value);

    // 3. Create Stripe SetupIntent for saving card (free trial)
    // NOTE: Replace with your actual backend endpoint
    const setupRes = await fetch('/api/create-conv-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userId })
    });

    const { clientSecret, subscriptionId, error: setupError } = await setupRes.json();
    if (setupError) throw new Error(setupError);

    // 4. Confirm card setup
    const { error: stripeError } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: {
        card: convCardElement,
        billing_details: { name: `${firstName} ${lastName}`, email }
      }
    });

    if (stripeError) throw new Error(stripeError.message);

    // 5. Save conveyancer to Supabase (pending approval)
    await db.from('conveyancers').insert({
      user_id:        userId,
      first_name:     firstName,
      last_name:      lastName,
      email,
      firm,
      region,
      city,
      phone,
      website:        document.getElementById('convWebsite').value.trim() || null,
      about:          document.getElementById('convAbout').value.trim() || null,
      specialties,
      law_society_num: lawSociety,
      stripe_subscription_id: subscriptionId,
      status:         'pending_approval',
      active:         false
    });

    // 6. Upload photo if provided
    const photo = document.getElementById('convPhoto').files[0];
    if (photo) {
      await db.storage.from('conveyancer-photos').upload(
        `${userId}/profile.${photo.name.split('.').pop()}`, photo
      );
    }

    // 7. Show success
    document.getElementById('convRegForm').style.display = 'none';
    document.getElementById('convSuccess').style.display = 'block';
    window.scrollTo(0, 0);

  } catch (err) {
    console.error(err);
    errEl.textContent = err.message || 'Something went wrong. Please try again.';
    errEl.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Start free month →';
  }
}

function handleIdPreview(event, previewId, promptId) {
  const file = event.target.files[0];
  if (!file) return;
  document.getElementById(promptId).style.display = 'none';
  document.getElementById(previewId).style.display = 'block';
  const nameEl = document.getElementById(previewId.replace('Preview','FileName'));
  if (nameEl) nameEl.textContent = file.name;
}
