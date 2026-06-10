// ─────────────────────────────────────────────────────────
//  LISTER REGISTRATION
//  Handles multi-step form, RV fee calculation, Stripe payment
// ─────────────────────────────────────────────────────────

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TgiMJB46FzEUxbhqo1JzrsUSP7F5M5Yq1DFILvKtmRhk5kKreKhAcPCe7HlzkNC1yyKxExYOGqUcELCRTz0ZCro007xyo8Xmw';
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
const elements = stripe.elements();

let cardElement = null;
let currentFeeNZD = 0;
let currentStep = 1;

// ── STRIPE CARD ELEMENT ──
function mountCardElement() {
  if (cardElement) return;
  cardElement = elements.create('card', {
    style: {
      base: {
        fontSize: '15px',
        color: '#1a1a18',
        fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        '::placeholder': { color: '#767672' }
      }
    }
  });
  cardElement.mount('#cardElement');
  cardElement.on('change', e => {
    const errEl = document.getElementById('cardError');
    if (e.error) { errEl.textContent = e.error.message; errEl.style.display = 'block'; }
    else { errEl.style.display = 'none'; }
  });
}

// ── FEE CALCULATOR ──
function calculateFee() {
  const rv = parseInt(document.getElementById('propRV').value) || 0;
  const calcBox = document.getElementById('feeCalculator');

  if (!rv) { calcBox.style.display = 'none'; currentFeeNZD = 0; return; }

  const pct = rv * 0.002;
  const fee = Math.max(pct, 500);
  currentFeeNZD = fee;

  document.getElementById('calcRV').textContent = '$' + rv.toLocaleString('en-NZ');
  document.getElementById('calcPercent').textContent = '$' + pct.toLocaleString('en-NZ', {minimumFractionDigits:2, maximumFractionDigits:2});
  document.getElementById('calcTotal').textContent = '$' + fee.toLocaleString('en-NZ', {minimumFractionDigits:2, maximumFractionDigits:2});
  document.getElementById('minimumNote').style.display = pct < 500 ? 'flex' : 'none';
  calcBox.style.display = 'block';
}

// ── STEP NAVIGATION ──
function goToStep(step) {
  document.querySelectorAll('.reg-step-content').forEach(el => el.style.display = 'none');
  document.getElementById('step' + step).style.display = 'block';
  document.querySelectorAll('.reg-step').forEach((el, i) => {
    el.classList.toggle('active', i < step);
    el.classList.toggle('completed', i < step - 1);
  });
  currentStep = step;
  window.scrollTo(0, 0);

  if (step === 3) {
    mountCardElement();
    document.getElementById('paymentFeeDisplay').textContent = '$' + currentFeeNZD.toLocaleString('en-NZ', {minimumFractionDigits:2, maximumFractionDigits:2});
    document.getElementById('paymentTotalDisplay').textContent = '$' + currentFeeNZD.toLocaleString('en-NZ', {minimumFractionDigits:2, maximumFractionDigits:2});
  }
}

// ── STEP 1 VALIDATION ──
async function proceedToStep2() {
  const errEl = document.getElementById('step1Error');
  errEl.style.display = 'none';

  const firstName = document.getElementById('firstName').value.trim();
  const lastName  = document.getElementById('lastName').value.trim();
  const email     = document.getElementById('regEmail').value.trim();
  const password  = document.getElementById('regPassword').value;
  const idFile    = document.getElementById('idFile').files[0];

  if (!firstName || !lastName || !email || !password) {
    errEl.textContent = 'Please fill in all required fields.';
    errEl.style.display = 'block'; return;
  }
  if (password.length < 8) {
    errEl.textContent = 'Password must be at least 8 characters.';
    errEl.style.display = 'block'; return;
  }
  if (!idFile) {
    errEl.textContent = 'Please upload a photo ID.';
    errEl.style.display = 'block'; return;
  }

  goToStep(2);
}

// ── STEP 2 VALIDATION ──
function proceedToStep3() {
  const errEl = document.getElementById('step2Error');
  errEl.style.display = 'none';

  const address  = document.getElementById('propAddress').value.trim();
  const rv       = parseInt(document.getElementById('propRV').value);
  const price    = parseInt(document.getElementById('propPrice').value);
  const beds     = parseInt(document.getElementById('propBeds').value);
  const baths    = parseInt(document.getElementById('propBaths').value);
  const propType = document.getElementById('propType').value;
  const desc     = document.getElementById('propDesc').value.trim();
  const swapPref = document.querySelector('input[name="swapPref"]:checked')?.value;

  if (!address || !rv || !price || !beds || !baths || !propType || !desc) {
    errEl.textContent = 'Please fill in all required fields.';
    errEl.style.display = 'block'; return;
  }
  if (!swapPref) {
    errEl.textContent = 'Please select a swap preference.';
    errEl.style.display = 'block'; return;
  }
  if (!currentFeeNZD) {
    errEl.textContent = 'Please enter your property RV to calculate your fee.';
    errEl.style.display = 'block'; return;
  }

  goToStep(3);
}

// ── PROCESS PAYMENT ──
async function processPayment() {
  const errEl   = document.getElementById('step3Error');
  const payBtn  = document.getElementById('payBtn');
  errEl.style.display = 'none';

  if (!document.getElementById('agreeTerms').checked) {
    errEl.textContent = 'Please agree to the terms of use.';
    errEl.style.display = 'block'; return;
  }
  if (!document.getElementById('agreeNoRefund').checked) {
    errEl.textContent = 'Please confirm you understand the refund policy.';
    errEl.style.display = 'block'; return;
  }

  payBtn.disabled = true;
  payBtn.textContent = 'Processing…';

  try {
    // 1. Create Supabase user account
    const { data: authData, error: authError } = await db.auth.signUp({
      email: document.getElementById('regEmail').value.trim(),
      password: document.getElementById('regPassword').value,
      options: {
        data: {
          first_name: document.getElementById('firstName').value.trim(),
          last_name: document.getElementById('lastName').value.trim(),
          last_initial: document.getElementById('lastName').value.trim().charAt(0).toUpperCase(),
          phone: document.getElementById('regPhone').value.trim(),
          user_type: 'lister'
        }
      }
    });

    if (authError) throw new Error(authError.message);
    const userId = authData.user.id;

    // 2. Create Stripe PaymentIntent via our backend
    // NOTE: Replace this URL with your actual backend endpoint
    const intentRes = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(currentFeeNZD * 100), // Stripe uses cents
        currency: 'nzd',
        userId,
        email: document.getElementById('regEmail').value.trim()
      })
    });

    const { clientSecret, error: intentError } = await intentRes.json();
    if (intentError) throw new Error(intentError);

    // 3. Confirm card payment
    const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: `${document.getElementById('firstName').value.trim()} ${document.getElementById('lastName').value.trim()}`,
          email: document.getElementById('regEmail').value.trim()
        }
      }
    });

    if (stripeError) throw new Error(stripeError.message);

    // 4. Save listing to Supabase (pending verification)
    const { data: listing, error: listingError } = await db.from('listings').insert({
      user_id:       userId,
      address:       document.getElementById('propAddress').value.trim(),
      price:         parseInt(document.getElementById('propPrice').value),
      rv:            parseInt(document.getElementById('propRV').value),
      property_type: document.getElementById('propType').value,
      beds:          parseInt(document.getElementById('propBeds').value),
      baths:         parseInt(document.getElementById('propBaths').value),
      garages:       parseInt(document.getElementById('propGarages').value) || 0,
      land_size:     parseInt(document.getElementById('propLand').value) || null,
      description:   document.getElementById('propDesc').value.trim(),
      swap_pref:     document.querySelector('input[name="swapPref"]:checked').value,
      swap_location: document.getElementById('propSwapLocation').value.trim() || null,
      contact_name:  document.getElementById('firstName').value.trim(),
      contact_email: document.getElementById('regEmail').value.trim(),
      contact_phone: document.getElementById('regPhone').value.trim() || null,
      photos:        [],
      active:        false, // pending verification
      status:        'pending_verification',
      registration_fee: currentFeeNZD,
      subscription_start: new Date().toISOString(),
      plan: 'swap_only'
    }).select().single();

    if (listingError) throw new Error(listingError.message);

    // 5. Upload ID documents
    const idFile = document.getElementById('idFile').files[0];
    if (idFile) {
      await db.storage.from('verifications').upload(
        `${userId}/id_${Date.now()}.${idFile.name.split('.').pop()}`, idFile
      );
    }
    const policeFile = document.getElementById('policeFile').files[0];
    if (policeFile) {
      await db.storage.from('verifications').upload(
        `${userId}/police_${Date.now()}.${policeFile.name.split('.').pop()}`, policeFile
      );
    }

    // 6. Save verification request
    await db.from('verifications').insert({
      user_id: userId,
      listing_id: listing.id,
      id_type: document.getElementById('idType').value,
      has_police_check: document.getElementById('policeCheck').checked,
      status: 'pending'
    });

    // 7. Show success
    goToStep(4);

  } catch (err) {
    console.error(err);
    errEl.textContent = err.message || 'Payment failed. Please try again.';
    errEl.style.display = 'block';
    payBtn.disabled = false;
    payBtn.textContent = 'Pay and register →';
  }
}

// ── HELPERS ──
function handleIdPreview(event, previewId, promptId) {
  const file = event.target.files[0];
  if (!file) return;
  document.getElementById(promptId).style.display = 'none';
  document.getElementById(previewId).style.display = 'block';
  const nameEl = document.getElementById(previewId.replace('Preview','FileName'));
  if (nameEl) nameEl.textContent = file.name;
}

function togglePoliceUpload() {
  const show = document.getElementById('policeCheck').checked;
  document.getElementById('policeUploadSection').style.display = show ? 'block' : 'none';
}
