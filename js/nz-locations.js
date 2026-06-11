// ─────────────────────────────────────────────────────────
//  NZ LOCATIONS — Island → Region → City/District hierarchy
// ─────────────────────────────────────────────────────────

const NZ_LOCATIONS = {
  north: {
    label: 'North Island',
    regions: {
      'Northland': ['Whangarei', 'Kerikeri', 'Kaitaia', 'Dargaville', 'Paihia', 'Russell'],
      'Auckland': ['Auckland City', 'North Shore', 'Waitakere', 'Manukau', 'Papakura', 'Franklin', 'Waiheke Island', 'Rodney', 'Devonport', 'Takapuna', 'Henderson', 'Botany', 'Manurewa', 'Pukekohe'],
      'Waikato': ['Hamilton', 'Cambridge', 'Te Awamutu', 'Huntly', 'Ngaruawahia', 'Raglan', 'Tokoroa', 'Matamata', 'Morrinsville', 'Thames', 'Coromandel Town', 'Whitianga', 'Taupo'],
      'Bay of Plenty': ['Tauranga', 'Mount Maunganui', 'Rotorua', 'Whakatane', 'Opotiki', 'Katikati', 'Te Puke', 'Maketu'],
      'Gisborne': ['Gisborne'],
      "Hawke's Bay": ['Napier', 'Hastings', 'Havelock North', 'Waipawa', 'Waipukurau', 'Wairoa'],
      'Taranaki': ['New Plymouth', 'Stratford', 'Hawera', 'Inglewood', 'Waitara'],
      'Manawatu-Whanganui': ['Palmerston North', 'Whanganui', 'Levin', 'Feilding', 'Marton', 'Bulls', 'Taumarunui', 'Ohakune'],
      'Wellington': ['Wellington City', 'Lower Hutt', 'Upper Hutt', 'Porirua', 'Kapiti Coast', 'Paraparaumu', 'Waikanae', 'Masterton', 'Carterton', 'Greytown', 'Featherston']
    }
  },
  south: {
    label: 'South Island',
    regions: {
      'Tasman': ['Nelson', 'Richmond', 'Motueka', 'Takaka', 'Murchison'],
      'Marlborough': ['Blenheim', 'Picton', 'Havelock', 'Renwick'],
      'West Coast': ['Greymouth', 'Westport', 'Hokitika', 'Franz Josef', 'Reefton'],
      'Canterbury': ['Christchurch', 'Rolleston', 'Rangiora', 'Kaiapoi', 'Lincoln', 'Ashburton', 'Timaru', 'Methven', 'Darfield', 'Lyttelton', 'Akaroa'],
      'Otago': ['Dunedin', 'Queenstown', 'Wanaka', 'Alexandra', 'Cromwell', 'Oamaru', 'Balclutha', 'Milton', 'Mosgiel'],
      'Southland': ['Invercargill', 'Gore', 'Winton', 'Riverton', 'Bluff', 'Te Anau'],
      'Chatham Islands': ['Waitangi']
    }
  }
};

function updateRegions() {
  const island = document.getElementById('filterIsland').value;
  const regionSelect = document.getElementById('filterRegion');
  const citySelect = document.getElementById('filterCity');

  regionSelect.innerHTML = '<option value="">All regions</option>';
  citySelect.innerHTML = '<option value="">All cities</option>';

  if (!island) {
    // Show all regions from both islands
    const allRegions = [
      ...Object.keys(NZ_LOCATIONS.north.regions),
      ...Object.keys(NZ_LOCATIONS.south.regions)
    ].sort();
    allRegions.forEach(r => {
      regionSelect.innerHTML += `<option value="${r}">${r}</option>`;
    });
  } else {
    const regions = Object.keys(NZ_LOCATIONS[island].regions);
    regions.forEach(r => {
      regionSelect.innerHTML += `<option value="${r}">${r}</option>`;
    });
  }

  applyFilters();
}

function updateCities() {
  const island = document.getElementById('filterIsland').value;
  const region = document.getElementById('filterRegion').value;
  const citySelect = document.getElementById('filterCity');

  citySelect.innerHTML = '<option value="">All cities</option>';

  if (!region) {
    applyFilters();
    return;
  }

  // Find cities for this region
  let cities = [];
  if (island && NZ_LOCATIONS[island]?.regions[region]) {
    cities = NZ_LOCATIONS[island].regions[region];
  } else {
    // Search both islands
    for (const isle of ['north', 'south']) {
      if (NZ_LOCATIONS[isle].regions[region]) {
        cities = NZ_LOCATIONS[isle].regions[region];
        break;
      }
    }
  }

  cities.forEach(c => {
    citySelect.innerHTML += `<option value="${c}">${c}</option>`;
  });

  applyFilters();
}

// Populate all regions on page load
document.addEventListener('DOMContentLoaded', () => {
  updateRegions();
});
