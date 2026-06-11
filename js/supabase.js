// ─────────────────────────────────────────────────────────
//  SUPABASE CONFIG
//  Replace these two values with your own from supabase.com
//  Project Settings → API → Project URL & anon public key
// ─────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://dacpuhfkuprqqaqoxwll.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhY3B1aGZrdXBycXFhcW94d2xsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTAwNDc3NiwiZXhwIjoyMDk2NTgwNzc2fQ.w_4jCyw78VJ2KYXyAEP0VH5M1CEqhvYvOQdVEkipS10

whsec_PbP9VhjhGXUKHRYkaxqWLylv6rvK8Dje';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'nestx-auth',
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Helpers
function fmt(n) {
  return '$' + Number(n).toLocaleString('en-NZ');
}

function swapLabel(pref) {
  const map = { up: 'Upsizing', down: 'Downsizing', lateral: 'Lateral swap', any: 'Open swap' };
  return map[pref] || pref;
}

function swapTagClass(pref) {
  const map = { up: 'tag-up', down: 'tag-down', lateral: 'tag-lateral', any: 'tag-any' };
  return map[pref] || 'tag-swap';
}

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function buildCardHTML(listing) {
  const coverPhoto = listing.photos && listing.photos.length > 0
    ? `<img src="${listing.photos[0]}" alt="Photo of ${listing.address}" loading="lazy">`
    : `<span>${listing.emoji || '🏡'}</span>`;

  return `
    <a href="pages/listing.html?id=${listing.id}" class="listing-card">
      <div class="card-img">${coverPhoto}</div>
      <div class="card-body">
        <div class="card-price">${fmt(listing.price)}</div>
        <div class="card-address">${listing.address}</div>
        <div class="card-meta">
          <span>🛏 ${listing.beds} bed</span>
          <span>🚿 ${listing.baths} bath</span>
          <span>${listing.property_type}</span>
        </div>
        <div class="card-tags">
          <span class="tag tag-swap">Swap ready</span>
          <span class="tag ${swapTagClass(listing.swap_pref)}">${swapLabel(listing.swap_pref)}</span>
        </div>
      </div>
    </a>
  `;
}

function toggleMenu() {
  document.querySelector('.nav-links').classList.toggle('open');
}
