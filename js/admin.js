// ─────────────────────────────────────────────────────────
//  ADMIN PANEL
//  Handles listings approval, conveyancer approval,
//  user management and dashboard stats
// ─────────────────────────────────────────────────────────

let currentRejectId = null;
let currentRejectType = null;

// ── ADMIN ACCESS CHECK ──
async function initAdmin() {
  const { data: { session } } = await db.auth.getSession();

  if (!session) {
    window.location.href = '../index.html';
    return;
  }

  // Check if user is admin
  const { data: adminData, error } = await db
    .from('admins')
    .select('user_id')
    .eq('user_id', session.user.id)
    .single();

  if (error || !adminData) {
    document.getElementById('adminContent').innerHTML = `
      <div class="admin-empty" style="margin-top:3rem">
        <p style="font-size:1.2rem;font-weight:600;margin-bottom:0.5rem">🚫 Access denied</p>
        <p>You don't have permission to access the admin panel.</p>
        <a href="../index.html" class="btn btn-outline" style="margin-top:1rem">Go to homepage</a>
      </div>`;
    return;
  }

  loadAdminPanel();
}

// ── LOAD ADMIN PANEL ──
async function loadAdminPanel() {
  // Load all data in parallel
  const [listings, conveyancers, users, waitlist] = await Promise.all([
    db.from('listings').select('*').order('created_at', { ascending: false }),
    db.from('conveyancers').select('*').order('created_at', { ascending: false }),
    db.auth.admin ? db.auth.admin.listUsers() : { data: { users: [] } },
    db.from('waitlist').select('*').order('created_at', { ascending: false })
  ]);

  const allListings = listings.data || [];
  const allConveyancers = conveyancers.data || [];
  const waitlistEntries = waitlist.data || [];

  const pendingListings = allListings.filter(l => l.status === 'pending_verification');
  const pendingConveyancers = allConveyancers.filter(c => c.status === 'pending_approval');
  const activeListings = allListings.filter(l => l.active === true);

  // Calculate revenue
  const totalRevenue = allListings
    .filter(l => l.registration_fee)
    .reduce((sum, l) => sum + (l.registration_fee || 0), 0);

  document.getElementById('adminContent').innerHTML = `
    <div class="admin-header">
      <h1>Admin Panel</h1>
      <span class="status-badge status-active">● Live</span>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total listings</div>
        <div class="stat-value">${allListings.length}</div>
        <div class="stat-sub">${activeListings.length} active</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pending approval</div>
        <div class="stat-value" style="color:${pendingListings.length > 0 ? '#dc2626' : 'var(--text)'}">${pendingListings.length}</div>
        <div class="stat-sub">listings to review</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Conveyancers</div>
        <div class="stat-value">${allConveyancers.length}</div>
        <div class="stat-sub">${pendingConveyancers.length} pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Waitlist</div>
        <div class="stat-value">${waitlistEntries.length}</div>
        <div class="stat-sub">signups</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Revenue (test)</div>
        <div class="stat-value">$${totalRevenue.toLocaleString('en-NZ')}</div>
        <div class="stat-sub">registration fees</div>
      </div>
    </div>

    <div class="admin-tabs">
      <button class="admin-tab active" onclick="showAdminTab('listings')">
        Listings ${pendingListings.length > 0 ? `<span class="admin-badge">${pendingListings.length}</span>` : ''}
      </button>
      <button class="admin-tab" onclick="showAdminTab('conveyancers')">
        Conveyancers ${pendingConveyancers.length > 0 ? `<span class="admin-badge">${pendingConveyancers.length}</span>` : ''}
      </button>
      <button class="admin-tab" onclick="showAdminTab('waitlist')">
        Waitlist <span class="admin-badge">${waitlistEntries.length}</span>
      </button>
    </div>

    <div class="admin-section active" id="admin-listings">
      ${renderListingsSection(allListings)}
    </div>

    <div class="admin-section" id="admin-conveyancers">
      ${renderConveyancersSection(allConveyancers)}
    </div>

    <div class="admin-section" id="admin-waitlist">
      ${renderWaitlistSection(waitlistEntries)}
    </div>
  `;
}

// ── RENDER LISTINGS ──
function renderListingsSection(listings) {
  const pending = listings.filter(l => l.status === 'pending_verification');
  const active = listings.filter(l => l.active === true);
  const rejected = listings.filter(l => l.status === 'rejected');

  return `
    <h2 style="font-size:1.1rem;font-weight:600;margin-bottom:1rem">
      Pending verification <span style="color:var(--text-muted);font-weight:400">(${pending.length})</span>
    </h2>
    ${pending.length === 0
      ? '<div class="admin-empty"><p>✅ No listings pending verification</p></div>'
      : pending.map(l => renderListingCard(l, true)).join('')
    }

    <h2 style="font-size:1.1rem;font-weight:600;margin:2rem 0 1rem">
      Active listings <span style="color:var(--text-muted);font-weight:400">(${active.length})</span>
    </h2>
    ${active.length === 0
      ? '<div class="admin-empty"><p>No active listings yet</p></div>'
      : active.map(l => renderListingCard(l, false)).join('')
    }
  `;
}

function renderListingCard(l, isPending) {
  const photo = l.photos && l.photos.length > 0
    ? `<img src="${l.photos[0]}" alt="${l.address}">`
    : `<span>🏡</span>`;

  const councilUrl = getCouncilUrl(l.address);

  return `
    <div class="admin-card">
      <div class="admin-card-header">
        <div style="display:flex;gap:12px;align-items:flex-start;flex:1">
          <div class="property-photo">${photo}</div>
          <div style="flex:1">
            <div class="admin-card-title">${l.address}</div>
            <div class="admin-card-sub">${fmt(l.price)} · ${l.beds} bed · ${l.baths} bath · ${l.property_type}</div>
            <div style="margin-top:6px">
              <span class="status-badge ${l.active ? 'status-active' : l.status === 'rejected' ? 'status-rejected' : 'status-pending'}">
                ${l.active ? 'Active' : l.status === 'rejected' ? 'Rejected' : 'Pending verification'}
              </span>
              <span style="font-size:12px;color:var(--text-muted);margin-left:8px">
                Registered ${new Date(l.created_at).toLocaleDateString('en-NZ')}
              </span>
            </div>
          </div>
        </div>
        ${isPending ? `
          <div class="admin-card-actions">
            <button class="btn btn-primary" onclick="approveListing('${l.id}')">✅ Approve</button>
            <button class="btn btn-danger" onclick="openRejectModal('${l.id}', 'listing')">❌ Reject</button>
          </div>` : `
          <div class="admin-card-actions">
            <button class="btn btn-danger" onclick="deactivateListing('${l.id}')">Remove</button>
          </div>`
        }
      </div>
      <div class="admin-card-body">
        ${isPending ? `
          <div class="rv-check">
            🔍 <strong>Verify RV:</strong> This property claims an RV of <strong>${l.rv ? fmt(l.rv) : 'not provided'}</strong>.
            Check against council records:
            <a href="${councilUrl}" target="_blank">Search council records →</a>
          </div>` : ''
        }
        <div class="detail-grid">
          <div class="detail-item"><span>Contact name</span>${l.contact_name}</div>
          <div class="detail-item"><span>Contact email</span>${l.contact_email}</div>
          <div class="detail-item"><span>RV</span>${l.rv ? fmt(l.rv) : '—'}</div>
          <div class="detail-item"><span>Registration fee paid</span>${l.registration_fee ? fmt(l.registration_fee) : '—'}</div>
          <div class="detail-item"><span>Swap preference</span>${swapLabel(l.swap_pref)}</div>
          <div class="detail-item"><span>Plan</span>${l.plan === 'swap_or_sell' ? 'Swap or Sell' : 'Swap only'}</div>
          ${l.swap_location ? `<div class="detail-item" style="grid-column:1/-1"><span>Preferred swap location</span>${l.swap_location}</div>` : ''}
        </div>
        ${l.description ? `<div style="margin-top:10px;font-size:13px;color:var(--text-mid);border-top:1px solid var(--border);padding-top:10px">${l.description}</div>` : ''}
      </div>
    </div>
  `;
}

// ── RENDER CONVEYANCERS ──
function renderConveyancersSection(conveyancers) {
  const pending = conveyancers.filter(c => c.status === 'pending_approval');
  const active = conveyancers.filter(c => c.active === true);

  return `
    <h2 style="font-size:1.1rem;font-weight:600;margin-bottom:1rem">
      Pending approval <span style="color:var(--text-muted);font-weight:400">(${pending.length})</span>
    </h2>
    ${pending.length === 0
      ? '<div class="admin-empty"><p>✅ No conveyancers pending approval</p></div>'
      : pending.map(c => renderConveyancerCard(c, true)).join('')
    }

    <h2 style="font-size:1.1rem;font-weight:600;margin:2rem 0 1rem">
      Active conveyancers <span style="color:var(--text-muted);font-weight:400">(${active.length})</span>
    </h2>
    ${active.length === 0
      ? '<div class="admin-empty"><p>No active conveyancers yet</p></div>'
      : active.map(c => renderConveyancerCard(c, false)).join('')
    }
  `;
}

function renderConveyancerCard(c, isPending) {
  const nzlsUrl = `https://www.lawsociety.org.nz/find-a-lawyer/?search=${encodeURIComponent(c.first_name + ' ' + c.last_name)}`;

  return `
    <div class="admin-card">
      <div class="admin-card-header">
        <div style="flex:1">
          <div class="admin-card-title">${c.first_name} ${c.last_name} — ${c.firm}</div>
          <div class="admin-card-sub">📍 ${c.city}, ${c.region} · 📞 ${c.phone}</div>
          <div style="margin-top:6px">
            <span class="status-badge ${c.active ? 'status-active' : c.status === 'pending_approval' ? 'status-pending' : 'status-rejected'}">
              ${c.active ? 'Active' : c.status === 'pending_approval' ? 'Pending approval' : 'Rejected'}
            </span>
          </div>
        </div>
        ${isPending ? `
          <div class="admin-card-actions">
            <button class="btn btn-primary" onclick="approveConveyancer('${c.id}')">✅ Approve</button>
            <button class="btn btn-danger" onclick="openRejectModal('${c.id}', 'conveyancer')">❌ Reject</button>
          </div>` : `
          <div class="admin-card-actions">
            <button class="btn btn-danger" onclick="deactivateConveyancer('${c.id}')">Remove</button>
          </div>`
        }
      </div>
      <div class="admin-card-body">
        ${isPending ? `
          <div class="rv-check">
            🔍 <strong>Verify NZLS membership:</strong> Number <strong>${c.law_society_num}</strong>
            <a href="${nzlsUrl}" target="_blank">Search NZ Law Society →</a>
          </div>` : ''
        }
        <div class="detail-grid">
          <div class="detail-item"><span>Email</span>${c.email}</div>
          <div class="detail-item"><span>Website</span>${c.website ? `<a href="${c.website}" target="_blank">${c.website}</a>` : '—'}</div>
          <div class="detail-item"><span>NZLS number</span>${c.law_society_num}</div>
          <div class="detail-item"><span>Applied</span>${new Date(c.created_at).toLocaleDateString('en-NZ')}</div>
          ${c.specialties && c.specialties.length > 0 ? `
            <div class="detail-item" style="grid-column:1/-1">
              <span>Specialties</span>${c.specialties.join(', ')}
            </div>` : ''
          }
        </div>
        ${c.about ? `<div style="margin-top:10px;font-size:13px;color:var(--text-mid);border-top:1px solid var(--border);padding-top:10px">${c.about}</div>` : ''}
      </div>
    </div>
  `;
}

// ── RENDER WAITLIST ──
function renderWaitlistSection(entries) {
  if (entries.length === 0) {
    return '<div class="admin-empty"><p>No waitlist signups yet</p></div>';
  }

  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <h2 style="font-size:1.1rem;font-weight:600">${entries.length} waitlist signup${entries.length !== 1 ? 's' : ''}</h2>
      <button class="btn btn-outline" onclick="exportWaitlist()">Export CSV</button>
    </div>
    <div class="admin-card">
      <div style="padding:1rem 1.5rem">
        ${entries.map(e => `
          <div class="user-row">
            <div class="user-avatar">${e.email.charAt(0).toUpperCase()}</div>
            <div class="user-info">
              <div class="user-name">${e.email}</div>
              <div class="user-date">Joined ${new Date(e.created_at).toLocaleDateString('en-NZ')}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ── ACTIONS ──
async function approveListing(id) {
  const { error } = await db
    .from('listings')
    .update({ active: true, status: 'active' })
    .eq('id', id);

  if (error) { showToast('Error approving listing'); return; }
  showToast('✅ Listing approved and now live!');
  loadAdminPanel();
}

async function approveConveyancer(id) {
  const { error } = await db
    .from('conveyancers')
    .update({ active: true, status: 'active' })
    .eq('id', id);

  if (error) { showToast('Error approving conveyancer'); return; }
  showToast('✅ Conveyancer approved and now listed!');
  loadAdminPanel();
}

async function deactivateListing(id) {
  if (!confirm('Remove this listing from the site?')) return;
  await db.from('listings').update({ active: false, status: 'removed' }).eq('id', id);
  showToast('Listing removed');
  loadAdminPanel();
}

async function deactivateConveyancer(id) {
  if (!confirm('Remove this conveyancer from the directory?')) return;
  await db.from('conveyancers').update({ active: false, status: 'removed' }).eq('id', id);
  showToast('Conveyancer removed');
  loadAdminPanel();
}

function openRejectModal(id, type) {
  currentRejectId = id;
  currentRejectType = type;
  document.getElementById('rejectionReason').value = '';
  document.getElementById('rejectionModal').classList.add('open');
}

function closeRejectionModal() {
  document.getElementById('rejectionModal').classList.remove('open');
  currentRejectId = null;
  currentRejectType = null;
}

async function confirmReject() {
  const reason = document.getElementById('rejectionReason').value.trim();
  if (!reason) { showToast('Please provide a reason'); return; }

  if (currentRejectType === 'listing') {
    await db.from('listings').update({ status: 'rejected', active: false, rejection_reason: reason }).eq('id', currentRejectId);
  } else {
    await db.from('conveyancers').update({ status: 'rejected', active: false, rejection_reason: reason }).eq('id', currentRejectId);
  }

  closeRejectionModal();
  showToast('Rejected and applicant notified');
  loadAdminPanel();
}

function exportWaitlist() {
  db.from('waitlist').select('*').order('created_at').then(({ data }) => {
    if (!data) return;
    const csv = 'Email,Date joined\n' + data.map(e =>
      `${e.email},${new Date(e.created_at).toLocaleDateString('en-NZ')}`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nestx-waitlist.csv';
    a.click();
  });
}

// ── HELPERS ──
function showAdminTab(tab) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('admin-' + tab).classList.add('active');
  event.target.classList.add('active');
}

function getCouncilUrl(address) {
  const lower = address.toLowerCase();
  if (lower.includes('wellington') || lower.includes('lower hutt') || lower.includes('upper hutt') || lower.includes('porirua')) {
    return 'https://www.gw.govt.nz/your-region/maps-and-data/property-search/';
  } else if (lower.includes('auckland')) {
    return 'https://www.aucklandcouncil.govt.nz/property-rates-valuations/Pages/find-property-valuation.aspx';
  } else if (lower.includes('christchurch') || lower.includes('canterbury')) {
    return 'https://www.ccc.govt.nz/rates-and-property/property-search/';
  } else if (lower.includes('hamilton') || lower.includes('waikato')) {
    return 'https://www.hamilton.govt.nz/our-services/rates/Pages/property-search.aspx';
  } else if (lower.includes('tauranga')) {
    return 'https://www.tauranga.govt.nz/living/rates-and-property/property-information';
  } else if (lower.includes('dunedin')) {
    return 'https://www.dunedin.govt.nz/services/rates/property-search';
  } else {
    return 'https://www.linz.govt.nz/products-services/property/property-title-information';
  }
}

function swapLabel(pref) {
  const map = { up: 'Upsizing', down: 'Downsizing', lateral: 'Lateral swap', any: 'Open swap' };
  return map[pref] || pref;
}

// Reject modal background click
document.getElementById('rejectionModal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('rejectionModal')) closeRejectionModal();
});

// Init
initAdmin();
