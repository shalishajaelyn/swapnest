// ─────────────────────────────────────────────────────────
//  LISTING DETAIL — loads single listing + swap offer form
// ─────────────────────────────────────────────────────────

let currentListing = null;

async function loadListing() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const container = document.getElementById('listingDetail');

  if (!id) {
    container.innerHTML = '<div class="empty-state"><p>Listing not found.</p><a href="../browse.html" class="btn btn-outline">Browse homes</a></div>';
    return;
  }

  const { data, error } = await db
    .from('listings')
    .select('*')
    .eq('id', id)
    .eq('active', true)
    .single();

  if (error || !data) {
    container.innerHTML = '<div class="empty-state"><p>This listing is no longer available.</p><a href="../browse.html" class="btn btn-outline">Browse homes</a></div>';
    return;
  }

  currentListing = data;
  document.title = `${data.address} — NestX`;
  renderListing(data);
}

async function renderListing(l) {
  const container = document.getElementById('listingDetail');

  // Check if current user is the owner
  const { data: { session } } = await db.auth.getSession();
  const isOwner = session && session.user.id === l.user_id;
  const isPremium = l.plan === 'premium' || l.plan === 'swap_or_sell';

  const photos = l.photos && l.photos.length > 0 ? l.photos : null;
  const coverPhoto = photos
    ? `<img src="${photos[0]}" alt="Photo of ${l.address}" onclick="openLightbox('${photos[0]}')" style="cursor:zoom-in;">`
    : `<span style="font-size:72px">🏡</span>`;

  const thumbs = photos && photos.length > 1
    ? photos.map((url, i) => `
        <div class="gallery-thumb ${i === 0 ? 'active' : ''}" onclick="switchPhoto('${url}', this)">
          <img src="${url}" alt="Photo ${i + 1}" loading="lazy">
        </div>`).join('')
    : '';

  const swapNotes = l.swap_notes
    ? `<p style="margin-top:8px;font-size:14px;color:var(--green)">${l.swap_notes}</p>`
    : '';

  const swapLocation = l.swap_location
    ? `<p style="font-size:13px;color:var(--text-muted);margin-top:4px">Preferred location: ${l.swap_location}</p>`
    : '';

  const garagesHtml = l.garages > 0
    ? `<span>🚗 ${l.garages} garage${l.garages > 1 ? 's' : ''}</span>`
    : '';

  const landHtml = l.land_size
    ? `<span>📐 ${l.land_size.toLocaleString()}m²</span>`
    : '';

  // Premium badge
  const premiumBadge = isPremium
    ? `<span class="tag tag-premium">👑 Premium</span>`
    : '';

  // Public contact details (only for premium listings where lister opted in)
  const publicContactHtml = isPremium && (l.show_email || l.show_phone)
    ? `<div class="listing-public-contact">
        <div style="font-size:13px;font-weight:600;color:var(--green-dark);margin-bottom:8px;">📬 Contact seller directly</div>
        ${l.show_email && l.contact_email ? `<div style="font-size:14px;margin-bottom:4px;">✉️ <a href="mailto:${l.contact_email}" style="color:var(--green)">${l.contact_email}</a></div>` : ''}
        ${l.show_phone && l.contact_phone ? `<div style="font-size:14px;">📞 <a href="tel:${l.contact_phone}" style="color:var(--green)">${l.contact_phone}</a></div>` : ''}
        <p style="font-size:12px;color:var(--text-muted);margin-top:8px;">Contact the seller directly — no account needed.</p>
      </div>`
    : '';

  // Offer buttons
  const offerButtons = isOwner
    ? '' // owner can't offer on their own listing
    : isPremium
    ? `<button class="btn btn-primary btn-full" onclick="openOfferModal('swap')" id="makeSwapOfferBtn">🔄 Make a swap offer</button>
       <button class="btn btn-outline btn-full" onclick="openOfferModal('purchase')" id="makePurchaseOfferBtn" style="margin-top:8px;">💰 Make a purchase offer</button>`
    : `<button class="btn btn-primary btn-full" onclick="openOfferModal('swap')" id="makeOfferBtn">🔄 Make a swap offer</button>`;

  // Sidebar contact info
  const sidebarContact = isPremium && (l.show_email || l.show_phone)
    ? '' // shown in main content instead
    : `<div class="sidebar-contact">
        <div class="contact-name">${l.username || l.contact_name}</div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:6px">Contact details shared only when both parties are open to chat</p>
      </div>`;

  container.innerHTML = `
    <div class="listing-main">
      <div class="breadcrumb">
        <a href="../browse.html">Browse homes</a> → ${l.address}
      </div>

      <div class="listing-gallery">
        <div class="gallery-main" id="galleryMain">${coverPhoto}</div>
        ${thumbs ? `<div class="gallery-thumbs">${thumbs}</div>` : ''}
      </div>

      <h1 class="listing-title">${fmt(l.price)}</h1>
      <div class="listing-address">${l.address}</div>

      <div class="listing-meta-row">
        <span>🛏 ${l.beds} bedroom${l.beds > 1 ? 's' : ''}</span>
        <span>🚿 ${l.baths} bathroom${l.baths > 1 ? 's' : ''}</span>
        ${garagesHtml}
        <span>${l.property_type}</span>
        ${landHtml}
      </div>

      <div class="listing-desc">${l.description}</div>

      <div class="listing-swap-box">
        <h3>Swap preference: ${swapLabel(l.swap_pref)}</h3>
        <p>${swapExplainer(l.swap_pref)}</p>
        ${swapNotes}
        ${swapLocation}
      </div>

      ${publicContactHtml}
    </div>

    <aside class="listing-sidebar">
      <div class="sidebar-card">
        <div class="sidebar-price">${fmt(l.price)}</div>
        <div class="sidebar-address">${l.address}</div>
        <div class="sidebar-tags">
          <span class="tag tag-swap">Swap ready</span>
          <span class="tag ${swapTagClass(l.swap_pref)}">${swapLabel(l.swap_pref)}</span>
          ${premiumBadge}
        </div>
        ${offerButtons}
        ${sidebarContact}
      </div>

      ${isOwner ? `
      <div class="sidebar-card" id="ownerControls">
        <p style="font-size:13px;font-weight:600;margin-bottom:10px">Your listing</p>
        ${!isPremium ? `<a href="dashboard.html" class="btn btn-outline btn-full" style="margin-bottom:8px;">👑 Upgrade to Premium</a>` : ''}
        <button class="btn btn-danger btn-full" onclick="deactivateListing()">Remove listing</button>
      </div>` : ''}
    </aside>
  `;

  // Check if current user owns this listing
  checkOwnership(l.user_id);
}

async function checkOwnership(ownerId) {
  const { data: { session } } = await db.auth.getSession();
  if (session && session.user.id === ownerId) {
    const ctrl = document.getElementById('ownerControls');
    const offerBtn = document.getElementById('makeOfferBtn');
    if (ctrl) ctrl.style.display = 'block';
    if (offerBtn) {
      offerBtn.textContent = 'This is your listing';
      offerBtn.disabled = true;
    }
  }
}

function switchPhoto(url, thumbEl) {
  const main = document.getElementById('galleryMain');
  if (main) main.innerHTML = `<img src="${url}" alt="Property photo" onclick="openLightbox('${url}')" style="cursor:zoom-in;">`;
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  if (thumbEl) thumbEl.classList.add('active');
}

function openLightbox(url) {
  // Remove existing lightbox
  document.getElementById('photoLightbox')?.remove();

  const lb = document.createElement('div');
  lb.id = 'photoLightbox';
  lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:500;display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:1rem;';
  lb.innerHTML = `
    <img src="${url}" alt="Property photo" style="max-width:100%;max-height:100vh;object-fit:contain;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
    <button onclick="document.getElementById('photoLightbox').remove()" style="position:fixed;top:16px;right:16px;background:rgba(255,255,255,0.15);border:none;color:white;font-size:24px;width:44px;height:44px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
  `;
  lb.addEventListener('click', (e) => {
    if (e.target === lb) lb.remove();
  });
  // Close on Escape
  document.addEventListener('keydown', function escClose(e) {
    if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', escClose); }
  });
  document.body.appendChild(lb);
}

function swapExplainer(pref) {
  const map = {
    up: 'This seller wants a bigger or more valuable home. They will pay you the difference in value.',
    down: 'This seller wants a smaller or cheaper home. You would pay them the difference in value.',
    lateral: 'This seller wants a roughly equal-value swap. A small top-up either way is fine.',
    any: 'This seller is open to any swap — make an offer and discuss the difference.',
  };
  return map[pref] || '';
}

async function deactivateListing() {
  if (!confirm('Remove this listing? It will no longer appear in searches.')) return;
  const { error } = await db
    .from('listings')
    .update({ active: false })
    .eq('id', currentListing.id);
  if (!error) {
    showToast('Listing removed');
    setTimeout(() => window.location.href = 'dashboard.html', 1000);
  }
}

// ── OFFER MODAL ──
let currentOfferType = 'swap';

async function openOfferModal(type = 'swap') {
  currentOfferType = type;

  // Check if user already has an active offer on this listing
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    const { data: existingOffers } = await db.from('offers')
      .select('id, status, offer_type')
      .eq('listing_id', currentListing.id)
      .eq('offerer_id', session.user.id)
      .in('status', ['pending', 'open_to_chat']);

    if (existingOffers && existingOffers.length > 0) {
      const existing = existingOffers[0];
      const statusLabel = existing.status === 'open_to_chat' ? 'open to chat' : 'pending';
      showToast(`You already have a ${statusLabel} ${existing.offer_type || 'swap'} offer on this listing.`);
      return;
    }
  }
  const modal = document.getElementById('offerModal');
  const info = document.getElementById('offerTargetInfo');
  const swapFields = document.getElementById('swapOnlyFields');
  const modalTitle = document.querySelector('#offerModal h2');

  if (type === 'purchase') {
    if (modalTitle) modalTitle.textContent = '💰 Make a purchase offer';
    if (info) info.textContent = `Purchase offer for: ${currentListing.address} (listed at ${fmt(currentListing.price)})`;
    if (swapFields) swapFields.style.display = 'none';
    const purchaseFields = document.getElementById('purchaseOnlyFields');
    if (purchaseFields) purchaseFields.style.display = 'block';
  } else {
    if (modalTitle) modalTitle.textContent = '🔄 Make a swap offer';
    if (info) info.textContent = `Swap offer for: ${currentListing.address} (listed at ${fmt(currentListing.price)})`;
    if (swapFields) swapFields.style.display = 'block';
    const purchaseFields = document.getElementById('purchaseOnlyFields');
    if (purchaseFields) purchaseFields.style.display = 'none';
  }

  // Auto-fill sender details from their account (reuse session from above)
  if (session) {
    const meta = session.user.user_metadata;
    const emailEl = document.getElementById('o_email');
    const phoneEl = document.getElementById('o_phone');
    if (emailEl) {
      emailEl.value = session.user.email || '';
      emailEl.readOnly = true;
      emailEl.style.background = 'var(--surface)';
      emailEl.title = 'Your registered email address';
    }
    if (phoneEl && meta?.phone) {
      phoneEl.value = meta.phone;
      phoneEl.readOnly = true;
      phoneEl.style.background = 'var(--surface)';
    }
  }

  modal.style.display = 'flex';
  document.getElementById('o_diff').value = '';
  document.getElementById('diffExplainer').textContent = '';
}

function closeOfferModal() {
  document.getElementById('offerModal').style.display = 'none';
}

function calcOfferDiff() {
  if (!currentListing) return;
  const myVal = parseInt(document.getElementById('o_value').value) || 0;
  const diff = currentListing.price - myVal;
  const el = document.getElementById('diffExplainer');
  document.getElementById('o_diff').value = diff;

  if (!myVal) { el.textContent = ''; return; }
  if (diff > 0) el.textContent = `→ You would pay ${fmt(diff)} to the seller to make up the difference`;
  else if (diff < 0) el.textContent = `→ The seller would pay you ${fmt(Math.abs(diff))} to make up the difference`;
  else el.textContent = '→ Equal value swap — no cash changes hands';
}

async function submitOffer() {
  const isPurchase = currentOfferType === 'purchase';
  const address = isPurchase ? 'Purchase offer' : document.getElementById('o_address').value.trim();
  const value   = isPurchase
    ? parseInt(document.getElementById('o_purchase_price').value)
    : parseInt(document.getElementById('o_value').value);
  const msg     = document.getElementById('o_msg').value.trim();
  const email   = document.getElementById('o_email').value.trim();
  const phone   = document.getElementById('o_phone').value.trim();

  if ((!isPurchase && !document.getElementById('o_address').value.trim()) || !value || !msg || !email) {
    showToast('Please fill in all required fields');
    return;
  }

  const { data: { session } } = await db.auth.getSession();
  const offererFirstName = session?.user?.user_metadata?.first_name || null;
  const offererUsername  = session?.user?.user_metadata?.username || null;

  const offer = {
    listing_id:         currentListing.id,
    listing_owner:      currentListing.user_id,
    offerer_id:         session?.user?.id || null,
    offerer_email:      email,
    offerer_phone:      phone || null,
    offerer_first_name: offererFirstName,
    offerer_username:   offererUsername,
    offer_address:      address,
    offer_value:        value,
    cash_diff:          isPurchase ? 0 : currentListing.price - value,
    message:            msg,
    offer_type:         currentOfferType,
    status:             'pending',
  };

  const { error } = await db.from('offers').insert(offer);

  if (error) {
    showToast('Could not send offer — please try again');
    return;
  }

  closeOfferModal();
  showToast(isPurchase ? '💰 Purchase offer sent!' : '🔄 Swap offer sent! The seller will be in touch.');
}

// Close modal on background click
document.getElementById('offerModal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('offerModal')) closeOfferModal();
});

loadListing();
