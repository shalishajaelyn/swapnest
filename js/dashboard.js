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

  // Load offers RECEIVED on user's listings
  const listingIds = (listings || []).map(l => l.id);
  let offersReceived = [];
  if (listingIds.length > 0) {
    const { data: offerData } = await db
      .from('offers')
      .select('*')
      .in('listing_id', listingIds)
      .order('created_at', { ascending: false });
    offersReceived = offerData || [];
  }

  // Load offers SENT by this user
  const { data: offersSent } = await db
    .from('offers')
    .select('*, listings(address, price, username, contact_name, contact_email, contact_phone)')
    .eq('offerer_id', session.user.id)
    .order('created_at', { ascending: false });

  const sentOffers = offersSent || [];
  const openToChat = sentOffers.filter(o => o.status === 'open_to_chat');
  const pendingOffers = offersReceived.filter(o => o.status === 'pending').length;

  container.innerHTML = `
    <div class="dashboard-stats">
      <div class="stat-card">
        <div class="stat-label">Active listings</div>
        <div class="stat-value">${listings.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Offers received</div>
        <div class="stat-value">${offersReceived.length}</div>
        <div class="stat-sub">${pendingOffers} pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Offers sent</div>
        <div class="stat-value">${sentOffers.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Open to chat</div>
        <div class="stat-value" style="color:${openToChat.length > 0 ? 'var(--green)' : 'var(--text)'}">${openToChat.length}</div>
      </div>
    </div>

    <div class="dashboard-section">
      <div class="dashboard-section-header">
        <h2>Your listings</h2>
        <a href="register-lister.html" class="btn btn-primary">+ List a home</a>
      </div>
      ${renderMyListings(listings)}
    </div>

    <div class="dashboard-section">
      <div class="dashboard-section-header">
        <h2>Swap offers received</h2>
      </div>
      ${renderOffers(offersReceived, listings)}
    </div>

    <div class="dashboard-section">
      <div class="dashboard-section-header">
        <h2>Swap offers sent</h2>
      </div>
      ${renderSentOffers(sentOffers)}
    </div>

    ${openToChat.length > 0 ? `
    <div class="dashboard-section">
      <div class="dashboard-section-header">
        <h2>💬 Open to chat</h2>
      </div>
      ${renderOpenToChat(openToChat)}
    </div>` : ''}
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
          <button class="btn btn-primary" onclick="markAsSold('${l.id}', '${l.address}', '${l.stripe_subscription_id || ''}')">🎉 Mark as sold</button>
          <button class="btn btn-danger" onclick="removeListing('${l.id}', '${l.stripe_subscription_id || ''}')">Remove</button>
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

    const badgeClass = {
      pending: 'badge-pending',
      open_to_chat: 'badge-accepted',
      declined: 'badge-declined'
    }[o.status] || 'badge-pending';

    const badgeLabel = {
      pending: 'Pending',
      open_to_chat: 'Open to chat',
      declined: 'Declined'
    }[o.status] || 'Pending';

    // Only show contact details when open to chat
    const contactInfo = o.status === 'open_to_chat'
      ? `<div class="offer-contact-revealed">
          <div style="font-size:12px;font-weight:600;color:var(--green-dark);margin-bottom:6px;">✅ Contact details shared</div>
          <div class="offer-detail">First name: <strong>${o.offerer_first_name || '—'}</strong></div>
          <div class="offer-detail">Email: <strong>${o.offerer_email}</strong></div>
          ${o.offerer_phone ? `<div class="offer-detail">Phone: <strong>${o.offerer_phone}</strong></div>` : ''}
        </div>`
      : `<div class="offer-detail" style="color:var(--text-muted);font-size:12px;">Contact details shared when you're open to chat</div>`;

    const actionBtns = o.status === 'pending' ? `
      <div class="offer-actions">
        <button class="btn btn-primary" onclick="respondToOffer('${o.id}', 'open_to_chat', '${o.offerer_email}', '${o.offerer_first_name || ''}')">💬 Open to chat</button>
        <button class="btn btn-outline" onclick="respondToOffer('${o.id}', 'declined', null, null)">Not interested</button>
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
          </div>
          <span class="offer-badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <div class="offer-msg">"${o.message}"</div>
        ${contactInfo}
        ${actionBtns}
      </div>
    `;
  }).join('');
}

function renderSentOffers(offers) {
  if (!offers || offers.length === 0) {
    return `<div class="empty-state"><p>You haven't sent any swap offers yet.</p><a href="../browse.html" class="btn btn-outline">Browse homes</a></div>`;
  }

  return offers.map(o => {
    const listing = o.listings;
    const diff = o.cash_diff;
    const diffStr = diff > 0
      ? `You pay ${fmt(diff)}`
      : diff < 0
      ? `They pay ${fmt(Math.abs(diff))}`
      : 'Equal value swap';

    const badgeClass = { pending: 'badge-pending', open_to_chat: 'badge-accepted', declined: 'badge-declined' }[o.status] || 'badge-pending';
    const badgeLabel = { pending: 'Pending', open_to_chat: 'Open to chat', declined: 'Not interested' }[o.status] || 'Pending';

    return `
      <div class="offer-row">
        <div class="offer-row-header">
          <div>
            <div class="offer-address">Your offer: ${o.offer_address}</div>
            <div class="offer-detail">On: ${listing?.address || 'Listing removed'} · ${diffStr}</div>
            <div class="offer-detail">Sent ${new Date(o.created_at).toLocaleDateString('en-NZ')}</div>
          </div>
          <span class="offer-badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <div class="offer-msg">"${o.message}"</div>
        ${o.status === 'open_to_chat' ? `
          <div class="offer-contact-revealed">
            <div style="font-size:12px;font-weight:600;color:var(--green-dark);margin-bottom:6px;">✅ Seller contact details</div>
            <div class="offer-detail">First name: <strong>${listing?.contact_name || '—'}</strong></div>
            <div class="offer-detail">Email: <strong><a href="mailto:${listing?.contact_email}" style="color:var(--green)">${listing?.contact_email || '—'}</a></strong></div>
            ${listing?.contact_phone ? `<div class="offer-detail">Phone: <strong>${listing.contact_phone}</strong></div>` : ''}
          </div>` : ''}
      </div>
    `;
  }).join('');
}

function renderOpenToChat(offers) {
  if (!offers || offers.length === 0) {
    return `<div class="empty-state"><p>No open to chat conversations yet.</p></div>`;
  }

  return `
    <div style="background:var(--green-light);border:1px solid var(--green-mid);border-radius:var(--radius-lg);padding:1.25rem 1.5rem;margin-bottom:1rem;">
      <p style="font-size:14px;color:var(--green-dark);margin:0;">
        💬 <strong>You're open to chat!</strong> Contact details have been shared. Reach out directly to discuss the swap. Remember — this is not a binding commitment. Engage a conveyancer when ready to proceed formally.
      </p>
    </div>
    ${offers.map(o => {
      const listing = o.listings;
      return `
        <div class="offer-row">
          <div class="offer-row-header">
            <div>
              <div class="offer-address">Your offer: ${o.offer_address}</div>
              <div class="offer-detail">For: ${listing?.address || '—'}</div>
            </div>
            <span class="offer-badge badge-accepted">Open to chat</span>
          </div>
          <div class="offer-contact-revealed" style="margin-top:8px;">
            <div style="font-size:12px;font-weight:600;color:var(--green-dark);margin-bottom:6px;">✅ Seller contact details</div>
            <div class="offer-detail">First name: <strong>${listing?.contact_name || '—'}</strong></div>
            <div class="offer-detail">Email: <strong><a href="mailto:${listing?.contact_email}" style="color:var(--green)">${listing?.contact_email || '—'}</a></strong></div>
            ${listing?.contact_phone ? `<div class="offer-detail">Phone: <strong><a href="tel:${listing.contact_phone}" style="color:var(--green)">${listing.contact_phone}</a></strong></div>` : ''}
          </div>
          <div style="margin-top:10px;font-size:13px;color:var(--text-muted)">
            <a href="conveyancers.html" style="color:var(--green);">Find a conveyancer →</a> when you're ready to proceed formally.
          </div>
        </div>
      `;
    }).join('')}
  `;
}

async function respondToOffer(offerId, status, offererEmail, offererFirstName) {
  const { error } = await db
    .from('offers')
    .update({ status })
    .eq('id', offerId);

  if (error) {
    showToast('Could not update — please try again');
    return;
  }

  if (status === 'open_to_chat') {
    // Get the full offer and listing details to send notification
    try {
      const { data: offer } = await db.from('offers').select('*, listings(address, contact_name, contact_email, contact_phone)').eq('id', offerId).single();
      if (offer) {
        // Notify offerer that seller is open to chat
        await fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'open_to_chat',
            data: {
              // To offerer
              offerer_email: offer.offerer_email,
              offerer_first_name: offer.offerer_first_name || 'there',
              offer_address: offer.offer_address,
              listing_address: offer.listings?.address,
              // Seller contact details (now revealed)
              seller_first_name: offer.listings?.contact_name,
              seller_email: offer.listings?.contact_email,
              seller_phone: offer.listings?.contact_phone,
              // Offerer contact details (now revealed to seller)
              offerer_phone: offer.offerer_phone
            }
          })
        });
      }
    } catch (e) { console.warn('Notification failed:', e); }

    showToast('💬 You\'re open to chat! Contact details have been shared with both parties.');
  } else {
    showToast('Offer declined');
  }

  setTimeout(() => loadDashboard(), 600);
}

async function markAsSold(id, address, subscriptionId) {
  if (!confirm(`Mark "${address}" as sold?\n\nThis will:\n• Remove your listing from public view\n• Cancel your subscription\n• End your NestX access\n\nThis cannot be undone.`)) return;

  const { data: { session } } = await db.auth.getSession();

  // Update listing status
  const { error } = await db.from('listings').update({
    active: false,
    status: 'sold',
    sold_at: new Date().toISOString()
  }).eq('id', id);

  if (error) { showToast('Something went wrong — please try again'); return; }

  // Cancel Stripe subscription via API
  if (subscriptionId) {
    try {
      await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId })
      });
    } catch (e) { console.warn('Subscription cancellation failed:', e); }
  }

  // Send congratulations email
  try {
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'listing_sold',
        data: {
          address,
          contact_email: session.user.email,
          contact_name: session.user.user_metadata?.first_name || 'there'
        }
      })
    });
  } catch (e) { console.warn('Email failed:', e); }

  // Show congratulations
  document.getElementById('dashboardContent').innerHTML = `
    <div style="text-align:center;padding:4rem 2rem;max-width:560px;margin:0 auto;">
      <div style="font-size:56px;margin-bottom:1rem">🎉</div>
      <h2 style="font-size:1.75rem;font-weight:700;margin-bottom:0.75rem;letter-spacing:-0.03em">Congratulations!</h2>
      <p style="font-size:16px;color:var(--text-mid);line-height:1.7;margin-bottom:1.5rem">
        Your property at <strong>${address}</strong> has been marked as sold.
        Your listing has been removed and your subscription cancelled.
      </p>
      <div style="background:var(--green-light);border-radius:var(--radius-lg);padding:1.25rem 1.5rem;margin-bottom:2rem;">
        <p style="font-size:15px;color:var(--green-dark);font-weight:500;margin:0;">
          💰 Zero commission means every dollar of your profit stays with you. Well done!
        </p>
      </div>
      <a href="../browse.html" class="btn btn-outline">Back to browse</a>
    </div>
  `;
}

async function removeListing(id, subscriptionId) {
  if (!confirm('Remove this listing?\n\nThis will:\n• Remove your listing from public view\n• Cancel your subscription\n• End your NestX access\n\nThis cannot be undone.')) return;

  const { error } = await db.from('listings').update({
    active: false,
    status: 'removed'
  }).eq('id', id);

  if (error) { showToast('Something went wrong — please try again'); return; }

  // Cancel Stripe subscription via API
  if (subscriptionId) {
    try {
      await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId })
      });
    } catch (e) { console.warn('Subscription cancellation failed:', e); }
  }

  showToast('Listing removed');
  loadDashboard();
}

loadDashboard();
