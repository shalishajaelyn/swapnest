// ─────────────────────────────────────────────────────────
//  DASHBOARD — user's listings + offers
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

  const username = session.user.user_metadata?.username || session.user.user_metadata?.first_name || 'there';

  // Load listings
  const { data: listings, error: lErr } = await db
    .from('listings').select('*')
    .eq('user_id', session.user.id).eq('active', true)
    .order('created_at', { ascending: false });

  if (lErr) { container.innerHTML = '<div class="empty-state"><p>Could not load your listings.</p></div>'; return; }

  // Load offers RECEIVED
  const listingIds = (listings || []).map(l => l.id);
  let offersReceived = [];
  if (listingIds.length > 0) {
    const { data } = await db.from('offers')
      .select('*, listings(address, price, username, contact_name, contact_email, contact_phone)')
      .in('listing_id', listingIds).order('created_at', { ascending: false });
    offersReceived = data || [];
  }

  // Load offers SENT
  const { data: offersSent } = await db.from('offers')
    .select('*, listings(address, price, username, contact_name, contact_email, contact_phone)')
    .eq('offerer_id', session.user.id).order('created_at', { ascending: false });

  const sentOffers = offersSent || [];

  // Separate by type
  const swapOffersReceived     = offersReceived.filter(o => o.offer_type !== 'purchase');
  const purchaseOffersReceived = offersReceived.filter(o => o.offer_type === 'purchase');
  const swapOffersSent         = sentOffers.filter(o => o.offer_type !== 'purchase');
  const purchaseOffersSent     = sentOffers.filter(o => o.offer_type === 'purchase');

  // Open to chat: offers SENT where seller accepted + offers RECEIVED where you accepted
  const openToChatSent     = sentOffers.filter(o => o.status === 'open_to_chat');
  const openToChatReceived = offersReceived.filter(o => o.status === 'open_to_chat');
  const openToChat         = [...openToChatReceived, ...openToChatSent];

  const pendingSwap     = swapOffersReceived.filter(o => o.status === 'pending').length;
  const pendingPurchase = purchaseOffersReceived.filter(o => o.status === 'pending').length;

  // Pre-render open to chat HTML (was async, must be done before template literal)
  const openToChatHtml = renderOpenToChat(openToChat, session.user.id);

  container.innerHTML = `

    <!-- WELCOME HEADER -->
    <div style="background:linear-gradient(135deg,#0F6E56 0%,#085041 100%);border-radius:16px;padding:1.75rem 2rem;margin-bottom:2rem;color:white;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
        <div>
          <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:4px;">Welcome back, ${username} 👋</h2>
          <p style="font-size:14px;opacity:0.8;margin:0;">Here's what's happening with your listings</p>
        </div>
        <a href="register-lister.html" class="btn" style="background:white;color:#0F6E56;font-weight:600;border:none;">+ List another home</a>
      </div>
    </div>

    <!-- STATS GRID -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:2rem;">
      ${statCard('🏡', 'My listings', listings.length, '')}
      ${statCard('📥', 'Offers received', offersReceived.length, (pendingSwap + pendingPurchase) > 0 ? `${pendingSwap + pendingPurchase} pending` : '')}
      ${statCard('📤', 'Offers sent', sentOffers.length, '')}
      ${statCard('💬', 'Open to chat', openToChat.length, openToChat.length > 0 ? 'Action needed' : '', openToChat.length > 0 ? '#0F6E56' : '')}
    </div>

    <!-- TABS -->
    <div style="display:flex;gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden;width:fit-content;margin-bottom:1.5rem;flex-wrap:wrap;">
      ${tabBtn('tab-listings', 'My listings', true)}
      ${tabBtn('tab-offers-in', `Offers received ${(pendingSwap + pendingPurchase) > 0 ? `<span style="background:#dc2626;color:white;font-size:10px;padding:1px 5px;border-radius:10px;margin-left:4px;">${pendingSwap + pendingPurchase}</span>` : ''}`)}
      ${tabBtn('tab-offers-sent', 'Offers sent')}
      ${tabBtn('tab-open', `💬 Open to chat ${openToChat.length > 0 ? `<span style="background:#0F6E56;color:white;font-size:10px;padding:1px 5px;border-radius:10px;margin-left:4px;">${openToChat.length}</span>` : ''}`)}
    </div>

    <div id="tab-listings" class="dash-tab active">${renderMyListings(listings)}</div>
    <div id="tab-offers-in" class="dash-tab" style="display:none">${renderOffers([...swapOffersReceived, ...purchaseOffersReceived].sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)), listings)}</div>
    <div id="tab-offers-sent" class="dash-tab" style="display:none">${renderSentOffers(sentOffers)}</div>
    <div id="tab-open" class="dash-tab" style="display:none">${openToChatHtml}</div>
  `;
}

function statCard(icon, label, value, sub, valueColor = '') {
  return `
    <div style="background:white;border:1px solid var(--border);border-radius:12px;padding:1rem 1.25rem;">
      <div style="font-size:22px;margin-bottom:6px;">${icon}</div>
      <div style="font-size:24px;font-weight:700;color:${valueColor || 'var(--text)'};letter-spacing:-0.03em;">${value}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${label}</div>
      ${sub ? `<div style="font-size:11px;color:${valueColor || '#dc2626'};margin-top:2px;font-weight:500;">${sub}</div>` : ''}
    </div>
  `;
}

function tabBtn(id, label, active = false) {
  return `<button onclick="showDashTab('${id}')" id="tbtn-${id}"
    style="padding:8px 16px;font-size:13px;font-weight:500;border:none;background:${active ? '#0F6E56' : 'transparent'};color:${active ? 'white' : 'var(--text-mid)'};cursor:pointer;font-family:inherit;white-space:nowrap;">
    ${label}
  </button>`;
}

function showDashTab(id) {
  document.querySelectorAll('.dash-tab').forEach(t => t.style.display = 'none');
  document.querySelectorAll('[id^="tbtn-"]').forEach(b => {
    b.style.background = 'transparent';
    b.style.color = 'var(--text-mid)';
  });
  const tab = document.getElementById(id);
  if (tab) tab.style.display = 'block';
  const btn = document.getElementById('tbtn-' + id);
  if (btn) { btn.style.background = '#0F6E56'; btn.style.color = 'white'; }
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
          ${l.plan !== 'premium' ? `<button class="btn btn-warning" onclick="upgradeToPremium('${l.id}')">👑 Upgrade to Premium</button>` : '<span class="tag tag-premium" style="padding:8px 12px;">👑 Premium</span>'}
          <button class="btn btn-primary" onclick="markAsSold('${l.id}', '${l.address}', '${l.stripe_subscription_id || ''}')">🎉 Mark as sold</button>
          <button class="btn btn-danger" onclick="removeListing('${l.id}', '${l.stripe_subscription_id || ''}')">Remove</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderOffers(offers, listings) {
  
  if (!offers || offers.length === 0) {
    return `<div class="empty-state"><p>No offers received yet.</p></div>`;
  }

  return offers.map(o => {
    const listing = listings.find(l => l.id === o.listing_id);
    const isPurchase = o.offer_type === 'purchase';
    const badgeClass = { pending: 'badge-pending', open_to_chat: 'badge-accepted', declined: 'badge-declined' }[o.status] || 'badge-pending';
    const badgeLabel = { pending: 'Pending', open_to_chat: 'Open to chat', declined: 'Declined' }[o.status] || 'Pending';

    const offerDetail = isPurchase
      ? `Purchase offer of <strong>${fmt(o.offer_value)}</strong>`
      : `Swap offer · ${fmt(o.offer_value)} estimated · ${o.cash_diff > 0 ? `They pay you ${fmt(o.cash_diff)}` : o.cash_diff < 0 ? `You pay them ${fmt(Math.abs(o.cash_diff))}` : 'Equal value'}`;

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
            <div class="offer-address">${isPurchase ? '💰 Purchase offer' : `🔄 ${o.offer_address}`}</div>
            <div class="offer-detail">${offerDetail}${listing ? ` · For: ${listing.address}` : ''}</div>
            <div class="offer-detail" style="font-size:12px;color:var(--text-muted);">Received ${new Date(o.created_at).toLocaleDateString('en-NZ')}</div>
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
    return `<div class="empty-state"><p>You haven't sent any offers yet.</p><a href="../browse.html" class="btn btn-outline">Browse homes</a></div>`;
  }

  return offers.map(o => {
    const listing = o.listings;
    const isPurchase = o.offer_type === 'purchase';
    const badgeClass = { pending: 'badge-pending', open_to_chat: 'badge-accepted', declined: 'badge-declined' }[o.status] || 'badge-pending';
    const badgeLabel = { pending: 'Pending', open_to_chat: 'Open to chat', declined: 'Not interested' }[o.status] || 'Pending';

    const offerDetail = isPurchase
      ? `Purchase offer of ${fmt(o.offer_value)}`
      : `Swap offer · ${fmt(o.offer_value)} estimated · ${o.cash_diff > 0 ? `You pay ${fmt(o.cash_diff)}` : o.cash_diff < 0 ? `They pay ${fmt(Math.abs(o.cash_diff))}` : 'Equal value'}`;

    return `
      <div class="offer-row">
        <div class="offer-row-header">
          <div>
            <div class="offer-address">${isPurchase ? '💰' : '🔄'} ${isPurchase ? 'Purchase offer' : o.offer_address}</div>
            <div class="offer-detail">On: ${listing?.address || 'Listing removed'} · ${offerDetail}</div>
            <div class="offer-detail" style="font-size:12px;color:var(--text-muted);">Sent ${new Date(o.created_at).toLocaleDateString('en-NZ')}</div>
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

function renderOpenToChat(offers, userId) {
  if (!offers || offers.length === 0) {
    return `<div class="empty-state"><p>No open to chat conversations yet. When a seller accepts your offer, they'll appear here.</p></div>`;
  }

  return `
    <div style="background:var(--green-light);border:1px solid var(--green-mid);border-radius:var(--radius-lg);padding:1.25rem 1.5rem;margin-bottom:1rem;">
      <p style="font-size:14px;color:var(--green-dark);margin:0;">
        💬 <strong>You're open to chat!</strong> Contact details have been shared. Reach out directly to discuss further. Remember — this is not a binding commitment. Engage a conveyancer when ready to proceed formally.
      </p>
    </div>
    ${offers.map(o => {
      const isSeller = o.listing_owner === userId;
      const listing = o.listings;
      const contactName  = isSeller ? (o.offerer_first_name || '—') : (listing?.contact_name || '—');
      const contactEmail = isSeller ? o.offerer_email : listing?.contact_email;
      const contactPhone = isSeller ? o.offerer_phone : listing?.contact_phone;
      const role         = isSeller ? 'Buyer' : 'Seller';
      const offerLabel   = o.offer_type === 'purchase' ? '💰 Purchase offer' : `🔄 Swap — ${o.offer_address || ''}`;

      return `
        <div class="offer-row">
          <div class="offer-row-header">
            <div>
              <div class="offer-address">${offerLabel}</div>
              <div class="offer-detail">Property: ${isSeller ? 'your listing' : (listing?.address || '—')}</div>
            </div>
            <span class="offer-badge badge-accepted">Open to chat</span>
          </div>
          <div class="offer-contact-revealed" style="margin-top:8px;">
            <div style="font-size:12px;font-weight:600;color:var(--green-dark);margin-bottom:6px;">✅ ${role} contact details</div>
            <div class="offer-detail">First name: <strong>${contactName}</strong></div>
            <div class="offer-detail">Email: <strong><a href="mailto:${contactEmail}" style="color:var(--green)">${contactEmail || '—'}</a></strong></div>
            ${contactPhone ? `<div class="offer-detail">Phone: <strong><a href="tel:${contactPhone}" style="color:var(--green)">${contactPhone}</a></strong></div>` : ''}
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

async function upgradeToPremium(listingId) {
  const { data: { session } } = await db.auth.getSession();
  if (!session) { showToast('Please sign in first'); return; }

  // Redirect to upgrade page with listing ID
  window.location.href = `premium-upgrade.html?listing=${listingId}`;
}

// ── FEEDBACK MODAL ──
let pendingSaleId = null;
let pendingSaleAddress = null;
let pendingSaleSubscriptionId = null;
let pendingSaleSession = null;

async function markAsSold(id, address, subscriptionId) {
  if (!confirm(`Mark "${address}" as sold?\n\nThis will:\n• Remove your listing from public view\n• End your NestX access\n\nThis cannot be undone.`)) return;

  const { data: { session } } = await db.auth.getSession();

  // Store for after feedback
  pendingSaleId = id;
  pendingSaleAddress = address;
  pendingSaleSubscriptionId = subscriptionId;
  pendingSaleSession = session;

  // Show feedback modal
  showFeedbackModal(address);
}

function showFeedbackModal(address) {
  // Remove existing modal if any
  document.getElementById('feedbackModal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'feedbackModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center;padding:1rem;';
  modal.innerHTML = `
    <div style="background:white;border-radius:16px;padding:2rem;max-width:480px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
      <div style="text-align:center;margin-bottom:1.5rem;">
        <div style="font-size:40px;margin-bottom:0.5rem;">🎉</div>
        <h2 style="font-size:1.3rem;font-weight:700;margin-bottom:0.5rem;">Congratulations on your sale!</h2>
        <p style="font-size:14px;color:#767672;">Before you go — we'd love to hear about your experience with NestX. It only takes a moment.</p>
      </div>

      <div style="margin-bottom:1.25rem;">
        <p style="font-size:13px;font-weight:600;margin-bottom:10px;color:#1a1a18;">How would you rate NestX?</p>
        <div style="display:flex;gap:8px;justify-content:center;" id="starRating">
          ${[1,2,3,4,5].map(n => `
            <button onclick="setRating(${n})" id="star${n}"
              style="font-size:32px;background:none;border:none;cursor:pointer;opacity:0.3;transition:opacity 0.15s;padding:4px;">⭐</button>
          `).join('')}
        </div>
        <p id="ratingLabel" style="text-align:center;font-size:13px;color:#0F6E56;margin-top:6px;min-height:18px;"></p>
      </div>

      <div style="margin-bottom:1.5rem;">
        <label style="font-size:13px;font-weight:600;color:#1a1a18;display:block;margin-bottom:6px;">Tell us about your experience (optional)</label>
        <textarea id="feedbackText" rows="4" placeholder="Did NestX help you find your buyer or swap partner? What worked well? What could be better?"
          style="width:100%;padding:10px 14px;font-size:14px;border:1px solid #d4d3cf;border-radius:8px;font-family:inherit;resize:vertical;box-sizing:border-box;"></textarea>
      </div>

      <div style="display:flex;gap:10px;">
        <button onclick="skipFeedback()" style="flex:1;padding:10px;font-size:14px;border:1px solid #d4d3cf;border-radius:8px;background:transparent;cursor:pointer;font-family:inherit;">Skip</button>
        <button onclick="submitFeedback()" style="flex:2;padding:10px;font-size:14px;font-weight:600;border:none;border-radius:8px;background:#0F6E56;color:white;cursor:pointer;font-family:inherit;">Submit feedback</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

let selectedRating = 0;
const ratingLabels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very good', 5: 'Excellent!' };

function setRating(n) {
  selectedRating = n;
  [1,2,3,4,5].forEach(i => {
    document.getElementById(`star${i}`).style.opacity = i <= n ? '1' : '0.3';
  });
  document.getElementById('ratingLabel').textContent = ratingLabels[n] || '';
}

async function submitFeedback() {
  const rating = selectedRating;
  const text = document.getElementById('feedbackText').value.trim();

  // Send feedback email to admin
  if (rating > 0 || text) {
    try {
      await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user_feedback',
          data: {
            rating,
            text,
            address: pendingSaleAddress,
            email: pendingSaleSession?.user?.email || '—'
          }
        })
      });
    } catch (e) { console.warn('Feedback email failed:', e); }
  }

  document.getElementById('feedbackModal')?.remove();
  await completeSale();
}

async function skipFeedback() {
  document.getElementById('feedbackModal')?.remove();
  await completeSale();
}

async function completeSale() {
  const { error } = await db.from('listings').update({
    active: false,
    status: 'sold',
    sold_at: new Date().toISOString()
  }).eq('id', pendingSaleId);

  if (error) { showToast('Something went wrong — please try again'); return; }

  if (pendingSaleSubscriptionId) {
    try {
      await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: pendingSaleSubscriptionId })
      });
    } catch (e) { console.warn('Subscription cancellation failed:', e); }
  }

  try {
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'listing_sold',
        data: {
          address: pendingSaleAddress,
          contact_email: pendingSaleSession?.user?.email,
          contact_name: pendingSaleSession?.user?.user_metadata?.first_name || 'there'
        }
      })
    });
  } catch (e) { console.warn('Email failed:', e); }

  document.getElementById('dashboardContent').innerHTML = `
    <div style="text-align:center;padding:4rem 2rem;max-width:560px;margin:0 auto;">
      <div style="font-size:56px;margin-bottom:1rem">🎉</div>
      <h2 style="font-size:1.75rem;font-weight:700;margin-bottom:0.75rem;letter-spacing:-0.03em">Congratulations!</h2>
      <p style="font-size:16px;color:#4a4a47;line-height:1.7;margin-bottom:1.5rem">
        Your property at <strong>${pendingSaleAddress}</strong> has been marked as sold.
        Your listing has been removed and your access has ended.
      </p>
      <div style="background:#E1F5EE;border-radius:12px;padding:1.25rem 1.5rem;margin-bottom:2rem;">
        <p style="font-size:15px;color:#085041;font-weight:500;margin:0;">
          💰 Zero commission means every dollar of your profit stays with you. Well done!
        </p>
      </div>
      <p style="font-size:14px;color:#767672;margin-bottom:1.5rem;">You have been signed out. If you list another property in future, we'd love to have you back.</p>
      <a href="../index.html" class="btn btn-outline">Back to NestX</a>
    </div>
  `;

  setTimeout(async () => { await db.auth.signOut(); }, 2000);
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
