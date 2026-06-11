// ─────────────────────────────────────────────────────────
//  NZ LOCATIONS — Island → Region → City → Suburb hierarchy
// ─────────────────────────────────────────────────────────

const NZ_LOCATIONS = {
  north: {
    label: 'North Island',
    regions: {
      'Northland': {
        cities: ['Whangarei', 'Kerikeri', 'Kaitaia', 'Dargaville', 'Paihia', 'Russell'],
        suburbs: {}
      },
      'Auckland': {
        cities: ['Auckland City', 'North Shore', 'Waitakere', 'Manukau', 'Papakura', 'Rodney', 'Waiheke Island', 'Pukekohe'],
        suburbs: {
          'Auckland City': ['Ponsonby', 'Grey Lynn', 'Parnell', 'Newmarket', 'Remuera', 'Epsom', 'Mt Eden', 'Sandringham', 'Three Kings', 'Onehunga', 'Penrose', 'Glen Innes', 'Meadowbank', 'St Heliers', 'Kohimarama', 'Mission Bay', 'Orakei', 'Pt Chevalier', 'Avondale', 'New Lynn', 'Glen Eden', 'Titirangi', 'CBD / City Centre', 'Freemans Bay', 'Herne Bay', 'St Marys Bay', 'Westmere', 'Mt Albert', 'Lynfield', 'Blockhouse Bay'],
          'North Shore': ['Takapuna', 'Devonport', 'Milford', 'Forrest Hill', 'Birkenhead', 'Northcote', 'Glenfield', 'Albany', 'Torbay', 'Browns Bay', 'Long Bay', 'Mairangi Bay', 'Campbells Bay', 'Castor Bay', 'Rothesay Bay', 'Sunnynook', 'Hillcrest', 'Beach Haven', 'Birkdale', 'Chatswood'],
          'Waitakere': ['Henderson', 'Te Atatu', 'Massey', 'Ranui', 'Swanson', 'Waitakere', 'Hobsonville', 'West Harbour', 'Herald Island'],
          'Manukau': ['Botany', 'Howick', 'Pakuranga', 'Highland Park', 'Dannemora', 'Flat Bush', 'Manurewa', 'Papatoetoe', 'Otahuhu', 'Mangere', 'Otara', 'Clover Park', 'Totara Heights', 'Wiri', 'Weymouth']
        }
      },
      'Waikato': {
        cities: ['Hamilton', 'Cambridge', 'Te Awamutu', 'Huntly', 'Ngaruawahia', 'Raglan', 'Tokoroa', 'Matamata', 'Morrinsville', 'Thames', 'Whitianga', 'Taupo'],
        suburbs: {
          'Hamilton': ['Flagstaff', 'Rototuna', 'Rotokauri', 'Te Rapa', 'Chartwell', 'Forest Lake', 'Fairfield', 'Enderley', 'Melville', 'Nawton', 'Frankton', 'Hamilton East', 'Hamilton Central', 'Hillcrest', 'Claudelands', 'Dinsdale', 'Bader', 'Whitiora', 'Te Kowhai']
        }
      },
      'Bay of Plenty': {
        cities: ['Tauranga', 'Mount Maunganui', 'Rotorua', 'Whakatane', 'Opotiki', 'Katikati', 'Te Puke'],
        suburbs: {
          'Tauranga': ['Papamoa', 'Papamoa Beach', 'Welcome Bay', 'Greerton', 'Pyes Pa', 'Bethlehem', 'Otumoetai', 'Judea', 'Brookfield', 'Gate Pa', 'Tauranga South', 'Hairini', 'Matua'],
          'Mount Maunganui': ['Arataki', 'Omanu', 'Bayfair', 'The Lakes', 'Ohauiti']
        }
      },
      'Gisborne': {
        cities: ['Gisborne'],
        suburbs: {}
      },
      "Hawke's Bay": {
        cities: ['Napier', 'Hastings', 'Havelock North', 'Waipawa', 'Waipukurau', 'Wairoa'],
        suburbs: {
          'Napier': ['Ahuriri', 'Marewa', 'Taradale', 'Greenmeadows', 'Bay View', 'Hospital Hill', 'Onekawa'],
          'Hastings': ['Flaxmere', 'Mahora', 'Camberley', 'Frimley', 'Raureka', 'Parkvale']
        }
      },
      'Taranaki': {
        cities: ['New Plymouth', 'Stratford', 'Hawera', 'Inglewood', 'Waitara'],
        suburbs: {
          'New Plymouth': ['Fitzroy', 'Merrilands', 'Strandon', 'Spotswood', 'Vogeltown', 'Westown', 'Moturoa', 'Inglewood Road', 'Bell Block']
        }
      },
      'Manawatu-Whanganui': {
        cities: ['Palmerston North', 'Whanganui', 'Levin', 'Feilding', 'Marton', 'Bulls', 'Taumarunui', 'Ohakune'],
        suburbs: {
          'Palmerston North': ['Roslyn', 'Hokowhitu', 'Awapuni', 'Takaro', 'Milson', 'Kelvin Grove', 'Terrace End', 'Highbury', 'Cloverlea', 'Aokautere', 'Fitzherbert', 'Ashhurst']
        }
      },
      'Wellington': {
        cities: ['Wellington City', 'Lower Hutt', 'Upper Hutt', 'Porirua', 'Kapiti Coast', 'Paraparaumu', 'Waikanae', 'Masterton', 'Carterton', 'Greytown'],
        suburbs: {
          'Wellington City': ['Te Aro', 'Mt Victoria', 'Newtown', 'Berhampore', 'Island Bay', 'Aro Valley', 'Kelburn', 'Karori', 'Northland', 'Khandallah', 'Johnsonville', 'Ngaio', 'Crofton Downs', 'Wadestown', 'Thorndon', 'Wilton', 'Churton Park', 'Newlands', 'Paparangi', 'Broadmeadows', 'Grenada North', 'Tawa', 'Takapu Valley', 'Hataitai', 'Roseneath', 'Oriental Bay', 'Brooklyn', 'Kingston', 'Mornington', 'Vogeltown', 'Happy Valley', 'Owhiro Bay'],
          'Lower Hutt': ['Petone', 'Eastbourne', 'Wainuiomata', 'Stokes Valley', 'Belmont', 'Tirohanga', 'Avalon', 'Naenae', 'Taita', 'Manor Park', 'Maungaraki', 'Woburn', 'Hutt Central', 'Epuni', 'Waterloo', 'Alicetown'],
          'Upper Hutt': ['Silverstream', 'Heretaunga', 'Trentham', 'Wallaceville', 'Brown Owl', 'Birchville', 'Pinehaven', 'Maoribank'],
          'Porirua': ['Titahi Bay', 'Paremata', 'Plimmerton', 'Whitby', 'Aotea', 'Ranui', 'Cannons Creek', 'Waitangirua', 'Elsdon'],
          'Kapiti Coast': ['Paraparaumu Beach', 'Raumati', 'Paekakariki', 'Waikanae Beach', 'Otaki']
        }
      }
    }
  },
  south: {
    label: 'South Island',
    regions: {
      'Tasman': {
        cities: ['Nelson', 'Richmond', 'Motueka', 'Takaka', 'Murchison'],
        suburbs: {
          'Nelson': ['Stoke', 'Tahunanui', 'Atawhai', 'Enner Glynn', 'Wakefield', 'Brightwater']
        }
      },
      'Marlborough': {
        cities: ['Blenheim', 'Picton', 'Havelock', 'Renwick'],
        suburbs: {}
      },
      'West Coast': {
        cities: ['Greymouth', 'Westport', 'Hokitika', 'Franz Josef', 'Reefton'],
        suburbs: {}
      },
      'Canterbury': {
        cities: ['Christchurch', 'Rolleston', 'Rangiora', 'Kaiapoi', 'Lincoln', 'Ashburton', 'Timaru', 'Methven', 'Darfield', 'Lyttelton', 'Akaroa'],
        suburbs: {
          'Christchurch': ['Addington', 'Avonhead', 'Beckenham', 'Belfast', 'Bishopdale', 'Bryndwr', 'Burnside', 'Cashmere', 'CBD / City Centre', 'Fendalton', 'Halswell', 'Harewood', 'Heathcote', 'Hornby', 'Ilam', 'Islington', 'Linwood', 'Merivale', 'Moorhouse', 'New Brighton', 'Northcote', 'Northwood', 'Opawa', 'Papanui', 'Parklands', 'Phillipstown', 'Prebbleton', 'Riccarton', 'Shirley', 'South Brighton', 'Sockburn', 'Spreydon', 'St Albans', 'St Martins', 'Sumner', 'Sydenham', 'Wainoni', 'Wigram', 'Woolston', 'Yaldhurst']
        }
      },
      'Otago': {
        cities: ['Dunedin', 'Queenstown', 'Wanaka', 'Alexandra', 'Cromwell', 'Oamaru', 'Balclutha', 'Milton', 'Mosgiel'],
        suburbs: {
          'Dunedin': ['Andersons Bay', 'Brockville', 'Burnside', 'Caversham', 'Concord', 'Corstorphine', 'East Taieri', 'Green Island', 'Halfway Bush', 'Helensburgh', 'Kenmure', 'Kew', 'Liberton', 'Maori Hill', 'Mornington', 'Mosgiel', 'Musselburgh', 'North East Valley', 'Norwood', 'Pine Hill', 'Port Chalmers', 'Roslyn', 'South Dunedin', 'St Clair', 'St Kilda', 'Tainui', 'Waldronville'],
          'Queenstown': ['Arthurs Point', 'Fernhill', 'Frankton', 'Goldfield Heights', 'Hanley Farm', 'Jack\'s Point', 'Kelvin Heights', 'Lake Hayes', 'Quail Rise', 'Remarkables Park', 'Sunshine Bay']
        }
      },
      'Southland': {
        cities: ['Invercargill', 'Gore', 'Winton', 'Riverton', 'Bluff', 'Te Anau'],
        suburbs: {
          'Invercargill': ['Appleby', 'Avenal', 'Clifton', 'Georgetown', 'Gladstone', 'Grasmere', 'Hawthorndale', 'Kingswell', 'Myross Bush', 'Newfield', 'North Invercargill', 'Otatara', 'Windsor', 'Waikiwi']
        }
      },
      'Chatham Islands': {
        cities: ['Waitangi'],
        suburbs: {}
      }
    }
  }
};

function updateRegions() {
  const island = document.getElementById('filterIsland').value;
  const regionSelect = document.getElementById('filterRegion');
  const citySelect = document.getElementById('filterCity');
  const suburbSelect = document.getElementById('filterSuburb');

  regionSelect.innerHTML = '<option value="">All regions</option>';
  citySelect.innerHTML = '<option value="">All cities</option>';
  suburbSelect.innerHTML = '<option value="">All suburbs</option>';

  if (!island) {
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
  const suburbSelect = document.getElementById('filterSuburb');

  citySelect.innerHTML = '<option value="">All cities</option>';
  suburbSelect.innerHTML = '<option value="">All suburbs</option>';

  if (!region) { applyFilters(); return; }

  let regionData = null;
  if (island && NZ_LOCATIONS[island]?.regions[region]) {
    regionData = NZ_LOCATIONS[island].regions[region];
  } else {
    for (const isle of ['north', 'south']) {
      if (NZ_LOCATIONS[isle].regions[region]) {
        regionData = NZ_LOCATIONS[isle].regions[region];
        break;
      }
    }
  }

  if (regionData) {
    regionData.cities.forEach(c => {
      citySelect.innerHTML += `<option value="${c}">${c}</option>`;
    });
  }

  applyFilters();
}

function updateSuburbs() {
  const city = document.getElementById('filterCity').value;
  const region = document.getElementById('filterRegion').value;
  const island = document.getElementById('filterIsland').value;
  const suburbSelect = document.getElementById('filterSuburb');

  suburbSelect.innerHTML = '<option value="">All suburbs</option>';

  if (!city) { applyFilters(); return; }

  let suburbs = [];
  // Find suburbs for this city
  const searchIslands = island ? [island] : ['north', 'south'];
  for (const isle of searchIslands) {
    for (const reg of Object.keys(NZ_LOCATIONS[isle].regions)) {
      const regData = NZ_LOCATIONS[isle].regions[reg];
      if (regData.suburbs && regData.suburbs[city]) {
        suburbs = regData.suburbs[city];
        break;
      }
    }
    if (suburbs.length > 0) break;
  }

  if (suburbs.length > 0) {
    suburbs.forEach(s => {
      suburbSelect.innerHTML += `<option value="${s}">${s}</option>`;
    });
  } else {
    suburbSelect.innerHTML = '<option value="">No suburbs listed</option>';
    suburbSelect.disabled = true;
  }

  applyFilters();
}

document.addEventListener('DOMContentLoaded', () => {
  updateRegions();
});
