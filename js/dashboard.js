// ─────────────────────────────────────────────────────────
//  DASHBOARD — user's listings + incoming swap offers
// ─────────────────────────────────────────────────────────

async function loadDashboard() {
  const container = document.getElementById('dashboardContent');

  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    container.innerHTML = `
      <div class="auth-gate">
        <div class="auth-gate-inner">
          <h2>Sign in to view your listings</h2>
          <p>You need to be signed in to manage your listings and offers.</p>
          <button class="btn btn-primary btn-lg" onclick="handleAuth()">Sign in</button>
        </div>
      </div>`;
    return;
  }

  // Load listings
  const { data: listings, error: lErr } = await db
    .from('listings')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (lErr) {
    container.innerHTML = '<div class="empty-state"><p>Could not load your listings.</p></div>';
    return;
  }

  // Load offers on all user's listings
  const listingIds = (listings || []).map(l => l.id);
  let offers = [];
  if (listingIds.length > 0) {
    const { data: offerData } = await db
      .from('offers')
      .select('*')
      .in('listing_id', listingIds)
      .order('created_at', { ascending: false });
    offers = offerData || [];
  }

  // Stats
  const pendingOffers = offers.filter(o => o.status === 'pending').length;

  container.innerHTML = `
    <div class="dashboard-stats">
      <div class="stat-card">
        <div class="stat-label">Active listings</div>
        <div class="stat-value">${listings.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total offers received</div>
        <div class="stat-value">${offers.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pending offers</div>
        <div class="stat-value">${pendingOffers}</div>
      </div>
    </div>

    <div class="dashboard-section">
      <div class="dashboard-section-header">
        <h2>Your listings</h2>
        <a href="../post.html" class="btn btn-primary">+ Add listing</a>
      </div>
      ${renderMyListings(listings)}
    </div>

    <div class="dashboard-section">
      <div class="dashboard-section-header">
        <h2>Swap offers received</h2>
      </div>
      ${renderOffers(offers, listings)}
    </div>
  `;
}

function renderMyListings(listings) {
  if (!listings || listings.length === 0) {
    return `
      <div class="empty-state">
        <p>You haven't listed any homes yet.</p>
        <a href="../post.html" class="btn btn-primary">List your home</a>
      </div>`;
  }

  return listings.map(l => {
    const thumb = l.photos && l.photos.length > 0
      ? `<img src="${l.photos[0]}" alt="${l.address}">`
      : `<span>${l.emoji || '🏡'}</span>`;

    const offerCount = 0; // will be passed in from full data if needed

    return `
      <div class="my-listing-row">
        <div class="my-listing-thumb">${thumb}</div>
        <div class="my-listing-info">
          <div class="my-listing-title">${fmt(l.price)} — ${l.address}</div>
          <div class="my-listing-sub">${l.beds} bed · ${l.baths} bath · ${l.property_type} · ${swapLabel(l.swap_pref)}</div>
        </div>
        <div class="my-listing-actions">
          <a href="listing.html?id=${l.id}" class="btn btn-outline">View</a>
          <button class="btn btn-danger" onclick="removeListing('${l.id}')">Remove</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderOffers(offers, listings) {
  if (!offers || offers.length === 0) {
    return `<div class="empty-state"><p>No swap offers yet. Share your listing to attract interest.</p></div>`;
  }

  return offers.map(o => {
    const listing = listings.find(l => l.id === o.listing_id);
    const diff = o.cash_diff;
    const diffStr = diff > 0
      ? `They pay you ${fmt(diff)}`
      : diff < 0
      ? `You pay them ${fmt(Math.abs(diff))}`
      : 'Equal value swap';

    const badgeClass = { pending: 'badge-pending', accepted: 'badge-accepted', declined: 'badge-declined' }[o.status] || 'badge-pending';
    const badgeLabel = o.status.charAt(0).toUpperCase() + o.status.slice(1);

    const actionBtns = o.status === 'pending' ? `
      <div class="offer-actions">
        <button class="btn btn-primary" onclick="respondToOffer('${o.id}', 'accepted', '${o.offerer_email}')">Accept offer</button>
        <button class="btn btn-outline" onclick="respondToOffer('${o.id}', 'declined', null)">Decline</button>
      </div>` : '';

    return `
      <div class="offer-row" id="offer-${o.id}">
        <div class="offer-row-header">
          <div>
            <div class="offer-address">${o.offer_address}</div>
            <div class="offer-detail">
              Estimated ${fmt(o.offer_value)} · ${diffStr}
              ${listing ? ` · For your listing at ${listing.address}` : ''}
            </div>
            <div class="offer-detail">From: ${o.offerer_email}${o.offerer_phone ? ` · ${o.offerer_phone}` : ''}</div>
          </div>
          <span class="offer-badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <div class="offer-msg">"${o.message}"</div>
        ${actionBtns}
      </div>
    `;
  }).join('');
}

async function respondToOffer(offerId, status, offererEmail) {
  const { error } = await db
    .from('offers')
    .update({ status })
    .eq('id', offerId);

  if (error) {
    showToast('Could not update offer — please try again');
    return;
  }

  if (status === 'accepted') {
    showToast(`Offer accepted! Contact them at ${offererEmail} to proceed.`);
  } else {
    showToast('Offer declined');
  }

  // Reload to reflect updated state
  setTimeout(() => loadDashboard(), 600);
}

async function removeListing(id) {
  if (!confirm('Remove this listing? It will no longer appear in searches.')) return;
  const { error } = await db.from('listings').update({ active: false }).eq('id', id);
  if (!error) {
    showToast('Listing removed');
    loadDashboard();
  }
}

loadDashboard();
