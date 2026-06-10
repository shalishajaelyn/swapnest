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
  document.title = `${data.address} — SwapNest`;
  renderListing(data);
}

function renderListing(l) {
  const container = document.getElementById('listingDetail');
  const { data: { session } } = db.auth.getSession ? { data: { session: null } } : { data: { session: null } };
  const isOwner = false; // will be updated after auth check

  const photos = l.photos && l.photos.length > 0 ? l.photos : null;
  const coverPhoto = photos
    ? `<img src="${photos[0]}" alt="Photo of ${l.address}">`
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

  const phoneHtml = l.show_phone && l.contact_phone
    ? `<div class="contact-phone">📞 ${l.contact_phone}</div>`
    : '';

  const garagesHtml = l.garages > 0
    ? `<span>🚗 ${l.garages} garage${l.garages > 1 ? 's' : ''}</span>`
    : '';

  const landHtml = l.land_size
    ? `<span>📐 ${l.land_size.toLocaleString()}m²</span>`
    : '';

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
    </div>

    <aside class="listing-sidebar">
      <div class="sidebar-card">
        <div class="sidebar-price">${fmt(l.price)}</div>
        <div class="sidebar-address">${l.address}</div>
        <div class="sidebar-tags">
          <span class="tag tag-swap">Swap ready</span>
          <span class="tag ${swapTagClass(l.swap_pref)}">${swapLabel(l.swap_pref)}</span>
        </div>
        <button class="btn btn-primary btn-full" onclick="openOfferModal()" id="makeOfferBtn">
          Make a swap offer
        </button>
        <div class="sidebar-contact">
          <div class="contact-name">${l.contact_name}</div>
          ${phoneHtml}
          <p style="font-size:12px;color:var(--text-muted);margin-top:6px">Send a swap offer to contact this seller</p>
        </div>
      </div>

      <div class="sidebar-card" id="ownerControls" style="display:none">
        <p style="font-size:13px;font-weight:600;margin-bottom:10px">Your listing</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a href="../post.html?edit=${l.id}" class="btn btn-outline btn-full">Edit listing</a>
          <button class="btn btn-danger btn-full" onclick="deactivateListing()">Remove listing</button>
        </div>
      </div>
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
  if (main) main.innerHTML = `<img src="${url}" alt="Property photo">`;
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  if (thumbEl) thumbEl.classList.add('active');
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

// ── SWAP OFFER MODAL ──
function openOfferModal() {
  const modal = document.getElementById('offerModal');
  const info = document.getElementById('offerTargetInfo');
  if (info) info.textContent = `Offering a swap for: ${currentListing.address} (listed at ${fmt(currentListing.price)})`;
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
  const address = document.getElementById('o_address').value.trim();
  const value   = parseInt(document.getElementById('o_value').value);
  const msg     = document.getElementById('o_msg').value.trim();
  const email   = document.getElementById('o_email').value.trim();
  const phone   = document.getElementById('o_phone').value.trim();

  if (!address || !value || !msg || !email) {
    showToast('Please fill in all required fields');
    return;
  }

  const { data: { session } } = await db.auth.getSession();

  const offer = {
    listing_id:    currentListing.id,
    listing_owner: currentListing.user_id,
    offerer_id:    session?.user?.id || null,
    offerer_email: email,
    offerer_phone: phone || null,
    offer_address: address,
    offer_value:   value,
    cash_diff:     currentListing.price - value,
    message:       msg,
    status:        'pending',
  };

  const { error } = await db.from('offers').insert(offer);

  if (error) {
    showToast('Could not send offer — please try again');
    console.error(error);
    return;
  }

  closeOfferModal();
  showToast('Swap offer sent! The seller will be in touch.');
}

// Close modal on background click
document.getElementById('offerModal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('offerModal')) closeOfferModal();
});

loadListing();
