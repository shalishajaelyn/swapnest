// ─────────────────────────────────────────────────────────
//  BROWSE PAGE — loads all listings with filter + sort
//  Includes NZ location hierarchy filtering
// ─────────────────────────────────────────────────────────

let allListings = [];

async function loadAllListings() {
  const grid = document.getElementById('browseGrid');

  const { data, error } = await db
    .from('listings')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) {
    grid.innerHTML = '<div class="empty-state"><p>Could not load listings. Please try again.</p></div>';
    return;
  }

  allListings = data || [];
  applyFilters();
}

function applyFilters() {
  const search   = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const region   = document.getElementById('filterRegion')?.value || '';
  const city     = document.getElementById('filterCity')?.value || '';
  const swap     = document.getElementById('filterSwap')?.value || '';
  const beds     = document.getElementById('filterBeds')?.value || '';
  const maxPrice = document.getElementById('filterPrice')?.value || '';
  const propType = document.getElementById('filterType')?.value || '';
  const sortBy   = document.getElementById('sortBy')?.value || 'newest';

  let filtered = [...allListings];

  // Text search
  if (search) {
    filtered = filtered.filter(l =>
      l.address.toLowerCase().includes(search) ||
      l.description?.toLowerCase().includes(search)
    );
  }

  // Region filter
  if (region) {
    filtered = filtered.filter(l =>
      l.address.toLowerCase().includes(region.toLowerCase())
    );
  }

  // City filter
  if (city) {
    filtered = filtered.filter(l =>
      l.address.toLowerCase().includes(city.toLowerCase())
    );
  }

  // Swap type
  if (swap) {
    filtered = filtered.filter(l => l.swap_pref === swap || l.swap_pref === 'any');
  }

  // Bedrooms
  if (beds) {
    filtered = filtered.filter(l => beds === '4' ? l.beds >= 4 : l.beds == beds);
  }

  // Max price
  if (maxPrice) {
    filtered = filtered.filter(l => l.price <= parseInt(maxPrice));
  }

  // Property type
  if (propType) {
    filtered = filtered.filter(l => l.property_type === propType);
  }

  // Sort
  if (sortBy === 'price_asc')  filtered.sort((a, b) => a.price - b.price);
  if (sortBy === 'price_desc') filtered.sort((a, b) => b.price - a.price);
  if (sortBy === 'newest')     filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  renderGrid(filtered);
}

function renderGrid(listings) {
  const grid = document.getElementById('browseGrid');
  const count = document.getElementById('resultsCount');

  if (count) count.textContent = `${listings.length} home${listings.length !== 1 ? 's' : ''} found`;

  if (listings.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <p>No listings match your search.</p>
        <button class="btn btn-outline" onclick="clearFilters()">Clear filters</button>
      </div>`;
    return;
  }

  grid.innerHTML = listings.map(l => buildCardHTML(l)).join('');
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterIsland').value = '';
  document.getElementById('filterSwap').value = '';
  document.getElementById('filterBeds').value = '';
  document.getElementById('filterPrice').value = '';
  document.getElementById('filterType').value = '';
  document.getElementById('sortBy').value = 'newest';
  updateRegions(); // resets region and city dropdowns
}

loadAllListings();
