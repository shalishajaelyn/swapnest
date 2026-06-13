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
let selectedPhotos = [];
let originalDescription = '';

// ── PHOTO UPLOAD ──
function handlePhotoSelect(event) {
  const files = Array.from(event.target.files);
  const MAX_PHOTOS = 10;
  const MAX_SIZE = 5 * 1024 * 1024;

  files.forEach(file => {
    if (selectedPhotos.length >= MAX_PHOTOS) {
      showToast(`Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }
    if (file.size > MAX_SIZE) {
      showToast(`${file.name} is over 5MB — skipped`);
      return;
    }
    selectedPhotos.push(file);
  });

  renderPhotoPreviews();
  event.target.value = '';
}

function renderPhotoPreviews() {
  const prompt = document.getElementById('photoUploadPrompt');
  const grid = document.getElementById('photoPreviewGrid');
  const count = document.getElementById('photoCount');

  if (selectedPhotos.length === 0) {
    prompt.style.display = 'block';
    grid.style.display = 'none';
    if (count) count.style.display = 'none';
    return;
  }

  prompt.style.display = 'none';
  grid.style.display = 'grid';
  if (count) {
    count.style.display = 'block';
    count.textContent = `${selectedPhotos.length} of 10 photos selected. First photo is the cover image.`;
  }

  grid.innerHTML = selectedPhotos.map((file, i) => {
    const url = URL.createObjectURL(file);
    return `
      <div style="position:relative;aspect-ratio:1;border-radius:8px;overflow:hidden;">
        <img src="${url}" alt="Photo ${i+1}" style="width:100%;height:100%;object-fit:cover;">
        <button type="button" onclick="removePhoto(${i})" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:white;border:none;border-radius:50%;width:22px;height:22px;font-size:12px;cursor:pointer;">✕</button>
        ${i === 0 ? '<div style="position:absolute;bottom:4px;left:4px;background:#0F6E56;color:white;font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px;">Cover</div>' : ''}
      </div>
    `;
  }).join('');
}

function removePhoto(index) {
  selectedPhotos.splice(index, 1);
  renderPhotoPreviews();
}

// ── AI DESCRIPTION ENHANCER ──
async function enhanceDescription() {
  const desc = document.getElementById('propDesc').value.trim();
  const tone = document.querySelector('input[name="aiTone"]:checked')?.value || 'professional';
  const btn = document.getElementById('aiEnhanceBtn');
  const output = document.getElementById('aiOutput');
  const outputText = document.getElementById('aiOutputText');
  const loadingText = document.getElementById('aiLoadingText');

  if (!desc || desc.length < 20) {
    showToast('Please write at least a basic description first');
    return;
  }

  originalDescription = desc;
  btn.disabled = true;
  btn.textContent = '✨ Enhancing…';
  output.style.display = 'block';
  outputText.style.display = 'none';
  loadingText.style.display = 'block';

  const toneInstructions = {
    professional: 'formal, factual and straightforward. Use clear, precise language.',
    warm: 'warm, friendly and lifestyle-focused. Emphasise comfort, community and liveability.',
    bold: 'bold, exciting and energetic. Use dynamic language that sells the dream.',
    minimal: 'clean, concise and minimal. Short sentences, no fluff, just the key facts.',
    premium: 'premium, aspirational and luxurious. Elevated language that conveys exclusivity and quality.',
    family: 'family-friendly, highlighting space, school zones, safety, community and outdoor living.',
    investment: 'investment-focused, emphasising rental yield potential, capital growth, location value and market opportunity.'
  };

  const prompt = `You are a NZ property copywriter. Rewrite the following property description in a ${toneInstructions[tone]} tone. Keep all factual details accurate. Write in 2-4 paragraphs. Do not add information that wasn't in the original. Output only the rewritten description, nothing else.\n\nOriginal description:\n${desc}`;

  try {
    const response = await fetch('/api/enhance-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: desc, tone })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    const enhanced = data.enhanced || '';
    if (!enhanced) throw new Error('No response');

    loadingText.style.display = 'none';
    outputText.style.display = 'block';
    outputText.textContent = enhanced;

  } catch (err) {
    loadingText.style.display = 'none';
    outputText.style.display = 'block';
    outputText.textContent = 'AI enhancement failed — please try again.';
    outputText.style.color = '#dc2626';
  }

  btn.disabled = false;
  btn.textContent = '✨ Enhance description';
}

function acceptAIDescription() {
  const enhanced = document.getElementById('aiOutputText').textContent;
  if (enhanced) {
    document.getElementById('propDesc').value = enhanced;
    document.getElementById('aiOutput').style.display = 'none';
    showToast('✅ AI description applied!');
  }
}

function discardAIDescription() {
  document.getElementById('aiOutput').style.display = 'none';
  showToast('Original description kept');
}

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

  const pct = rv * 0.001;
  const fee = Math.max(pct, 500);
  currentFeeNZD = fee;

  document.getElementById('calcRV').textContent = '$' + rv.toLocaleString('en-NZ');
  document.getElementById('calcPercent').textContent = '$' + pct.toLocaleString('en-NZ', {minimumFractionDigits:2, maximumFractionDigits:2});
  document.getElementById('calcTotal').textContent = '$' + fee.toLocaleString('en-NZ', {minimumFractionDigits:2, maximumFractionDigits:2});
  document.getElementById('minimumNote').style.display = pct < 500 ? 'flex' : 'none';
  calcBox.style.display = 'block';
}

// ── PREMIUM UPGRADE ──
function togglePremiumOptions() {
  const checked = document.getElementById('addPremium').checked;
  document.getElementById('premiumOptions').style.display = checked ? 'block' : 'none';
  updatePaymentTotal();
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
    const hasPremium = document.getElementById('addPremium')?.checked;
    const premiumLine = document.getElementById('premiumFeeLine');
    if (premiumLine) premiumLine.style.display = hasPremium ? 'flex' : 'none';
    const baseFee = currentFeeNZD;
    const totalFee = baseFee + (hasPremium ? 199 : 0);
    const fmt2 = (n) => '$' + n.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('paymentFeeDisplay').textContent = fmt2(baseFee);
    document.getElementById('paymentTotalDisplay').textContent = fmt2(totalFee);
    currentFeeNZD = totalFee;
  }
}

// ── DISCOUNT CODES ──
const DISCOUNT_CODES = {
  'EARLYBIRD': { type: 'percent', value: 20,  label: '20% early bird discount applied!' },
  'LAUNCH50':  { type: 'percent', value: 50,  label: '50% launch discount applied!' },
  'FRIEND':    { type: 'fixed',   value: 100, label: '$100 friend referral discount applied!' },
  'PRELAUNCH': { type: 'percent', value: 100, label: '100% prelaunch discount applied!' }
};

let appliedDiscount = null;

function applyDiscount() {
  const code = document.getElementById('discountCode').value.trim().toUpperCase();
  const msgEl = document.getElementById('discountMsg');
  const discount = DISCOUNT_CODES[code];

  if (!code) {
    msgEl.textContent = 'Please enter a discount code.';
    msgEl.style.color = '#dc2626';
    msgEl.style.display = 'block';
    return;
  }

  if (!discount) {
    msgEl.textContent = 'Invalid discount code.';
    msgEl.style.color = '#dc2626';
    msgEl.style.display = 'block';
    appliedDiscount = null;
    updatePaymentTotal();
    return;
  }

  appliedDiscount = { ...discount, code };
  msgEl.textContent = '✅ ' + discount.label;
  msgEl.style.color = '#0F6E56';
  msgEl.style.display = 'block';
  updatePaymentTotal();
}

function updatePaymentTotal() {
  if (!currentFeeNZD) return;
  let finalFee = currentFeeNZD;

  if (appliedDiscount) {
    if (appliedDiscount.type === 'percent') {
      finalFee = currentFeeNZD * (1 - appliedDiscount.value / 100);
    } else {
      finalFee = Math.max(0, currentFeeNZD - appliedDiscount.value);
    }
  }

  // Minimum $1 to avoid Stripe errors
  finalFee = Math.max(1, finalFee);

  const fmt = (n) => '$' + n.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById('paymentTotalDisplay').textContent = fmt(finalFee);

  // Update the actual charge amount
  currentFeeNZD = finalFee;
}

// ── STEP 1 VALIDATION ──
async function proceedToStep2() {
  const errEl = document.getElementById('step1Error');
  errEl.style.display = 'none';

  const username  = document.getElementById('username').value.trim();
  const firstName = document.getElementById('firstName').value.trim();
  const lastName  = document.getElementById('lastName').value.trim();
  const email     = document.getElementById('regEmail').value.trim();
  const password  = document.getElementById('regPassword').value;
  const idFile    = document.getElementById('idFile').files[0];

  if (!username) {
    errEl.textContent = 'Please choose a username.';
    errEl.style.display = 'block'; return;
  }
  if (username.length < 3) {
    errEl.textContent = 'Username must be at least 3 characters.';
    errEl.style.display = 'block'; return;
  }
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
    // 1. Get or create Supabase user account
    let userId;
    const { data: { session: existingSession } } = await db.auth.getSession();

    if (existingSession) {
      // Already signed in — use existing account
      userId = existingSession.user.id;
    } else {
      // New user — create account
      const { data: authData, error: authError } = await db.auth.signUp({
        email: document.getElementById('regEmail').value.trim(),
        password: document.getElementById('regPassword').value,
        options: {
          data: {
            username:     document.getElementById('username').value.trim(),
            first_name:   document.getElementById('firstName').value.trim(),
            last_name:    document.getElementById('lastName').value.trim(),
            last_initial: document.getElementById('lastName').value.trim().charAt(0).toUpperCase(),
            phone:        document.getElementById('regPhone').value.trim(),
            user_type:    'lister'
          }
        }
      });
      if (authError) throw new Error(authError.message);
      userId = authData.user.id;
    }

    // Get email for Stripe
    const userEmail = existingSession?.user?.email || document.getElementById('regEmail').value.trim();

    // 2. Create Stripe PaymentIntent
    const intentRes = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(currentFeeNZD * 100),
        currency: 'nzd',
        userId,
        email: userEmail
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
          email: userEmail
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
      username:      document.getElementById('username').value.trim(),
      plan:          document.getElementById('addPremium')?.checked ? 'premium' : 'standard',
      show_email:    document.getElementById('addPremium')?.checked && document.getElementById('showEmail')?.checked,
      show_phone:    document.getElementById('addPremium')?.checked && document.getElementById('showPhone')?.checked,
      photos:        [],
      active:        false, // pending verification
      status:        'pending_verification',
      registration_fee: currentFeeNZD,
      subscription_start: new Date().toISOString(),
      plan: 'swap_only'
    }).select().single();

    if (listingError) throw new Error(listingError.message);

    // 5. Upload property photos
    if (selectedPhotos.length > 0) {
      const photoUrls = [];
      for (let i = 0; i < selectedPhotos.length; i++) {
        const file = selectedPhotos[i];
        const ext = file.name.split('.').pop();
        const path = `${userId}/${listing.id}/${i}.${ext}`;
        const { error: uploadError } = await db.storage
          .from('listing-photos')
          .upload(path, file, { upsert: true });
        if (!uploadError) {
          const { data: { publicUrl } } = db.storage
            .from('listing-photos')
            .getPublicUrl(path);
          photoUrls.push(publicUrl);
        }
      }
      if (photoUrls.length > 0) {
        await db.from('listings').update({ photos: photoUrls }).eq('id', listing.id);
      }
    }

    // 6. Upload ID documents
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

    // 7. Send admin notification email
    try {
      await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new_listing',
          data: {
            address:       document.getElementById('propAddress').value.trim(),
            price:         parseInt(document.getElementById('propPrice').value),
            rv:            parseInt(document.getElementById('propRV').value),
            property_type: document.getElementById('propType').value,
            beds:          parseInt(document.getElementById('propBeds').value),
            baths:         parseInt(document.getElementById('propBaths').value),
            swap_pref:     document.querySelector('input[name="swapPref"]:checked').value,
            contact_name:  document.getElementById('firstName').value.trim(),
            contact_email: document.getElementById('regEmail').value.trim()
          }
        })
      });
    } catch (emailErr) {
      // Don't fail registration if email fails
      console.warn('Admin notification failed:', emailErr);
    }

    // 8. Show success
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

// ── AUTH GATE ──
async function initListingAuth() {
  const { data: { session } } = await db.auth.getSession();

  const gate = document.getElementById('authGate');
  const form = document.getElementById('listingForm');

  if (!session) {
    gate.style.display = 'block';
    form.style.display = 'none';
  } else {
    gate.style.display = 'none';
    form.style.display = 'block';

    // If already signed in, skip Step 1 — go straight to property details
    const meta = session.user.user_metadata;
    if (meta?.first_name) {
      // Pre-fill Step 1 fields silently
      if (document.getElementById('username')) document.getElementById('username').value = meta.username || '';
      if (document.getElementById('firstName')) document.getElementById('firstName').value = meta.first_name || '';
      if (document.getElementById('lastName')) document.getElementById('lastName').value = meta.last_name || '';
      if (document.getElementById('regEmail')) document.getElementById('regEmail').value = session.user.email || '';
      if (document.getElementById('regPhone')) document.getElementById('regPhone').value = meta.phone || '';
      // Skip to Step 2
      goToStep(2);
    }
  }

  // Listen for sign in
  db.auth.onAuthStateChange((_event, session) => {
    if (session) {
      gate.style.display = 'none';
      form.style.display = 'block';
    } else {
      gate.style.display = 'block';
      form.style.display = 'none';
    }
  });
}

initListingAuth();
