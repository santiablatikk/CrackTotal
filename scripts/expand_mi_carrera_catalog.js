/**
 * Expand Mi Carrera clubs/leagues toward 1000+ without shrinking or rewriting existing IDs.
 * Run: node scripts/expand_mi_carrera_catalog.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const EXP = require('./mi_carrera_expansion_rosters');
const EXP_B = require('./mi_carrera_expansion_rosters_b');
const EXP_C = require('./mi_carrera_expansion_rosters_c');

const DATA = path.join(__dirname, '..', 'assets', 'data', 'mi-carrera');

function read(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8'));
}
function write(name, data) {
  fs.writeFileSync(path.join(DATA, name), JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function slug(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function clubId(cc, name) {
  return String(cc).toLowerCase() + '_' + slug(name);
}

function parseRow(row) {
  const parts = String(row).split('|');
  return {
    name: parts[0],
    shortName: parts[1] || parts[0],
    tier: Number(parts[2]) || 2,
    prestige: Number(parts[3]) || 50,
    primaryColor: parts[4] || '#1f2937',
    secondaryColor: parts[5] || '#9ca3af',
    city: parts[6] || parts[0],
    tags: parts[7] ? parts[7].split(',').filter(Boolean) : []
  };
}

const leagues = read('leagues.json');
const clubs = read('clubs.json');
const countries = read('countries.json');

const existingClubIds = new Set(clubs.clubs.map((c) => c.id));
const existingNames = new Map();
clubs.clubs.forEach(function (c) {
  existingNames.set(slug(c.name), c.id);
  existingNames.set(slug(c.shortName), c.id);
});
const existingLeagueIds = new Set(leagues.leagues.map((l) => l.id));

let leaguesAdded = 0;
(EXP.leagues || []).forEach(function (l) {
  if (!existingLeagueIds.has(l.id)) {
    leagues.leagues.push(l);
    existingLeagueIds.add(l.id);
    leaguesAdded += 1;
  }
});

const leagueById = Object.create(null);
leagues.leagues.forEach(function (l) {
  leagueById[l.id] = l;
});

function addClub(leagueId, row) {
  const def = typeof row === 'string' ? parseRow(row) : row;
  const league = leagueById[leagueId];
  if (!league) {
    console.warn('skip unknown league', leagueId, def.name);
    return false;
  }
  const id = clubId(league.countryCode, def.name);
  if (existingClubIds.has(id)) return false;
  // Avoid near-duplicate names colliding with existing catalog entities
  const nameKey = slug(def.name);
  if (existingNames.has(nameKey) && existingNames.get(nameKey) !== id) {
    // allow if only shortName collision for different full name
  }
  if (existingNames.has(nameKey)) return false;

  const prestige = def.prestige;
  clubs.clubs.push({
    id: id,
    name: def.name,
    shortName: def.shortName,
    countryCode: league.countryCode,
    continent: league.continent,
    leagueId: leagueId,
    league: league.name,
    tier: def.tier,
    prestige: prestige,
    financialLevel: Math.max(28, prestige - 6),
    youthLevel: Math.max(26, prestige - 10),
    squadStrength: prestige,
    internationalReputation: Math.max(22, prestige - 12),
    primaryColor: def.primaryColor,
    secondaryColor: def.secondaryColor,
    city: def.city,
    tags: def.tags
  });
  existingClubIds.add(id);
  existingNames.set(nameKey, id);
  existingNames.set(slug(def.shortName), id);
  return true;
}

let clubsAdded = 0;
function ingest(pack) {
  Object.keys(pack).forEach(function (key) {
    if (key === 'leagues') return;
    const rows = pack[key];
    if (!Array.isArray(rows)) return;
    rows.forEach(function (row) {
      if (addClub(key, row)) clubsAdded += 1;
    });
  });
}
ingest(EXP);
ingest(EXP_B);
ingest(EXP_C);

leagues.count = leagues.leagues.length;
clubs.count = clubs.clubs.length;

write('leagues.json', leagues);
write('clubs.json', clubs);

// Normalization aliases: map common name variants → canonical club id (never invent new entities)
const aliases = {
  version: 1,
  generatedAt: new Date().toISOString().slice(0, 10),
  note: 'Maps alternate display names to existing club IDs. Does not create new clubs.',
  aliases: {}
};
clubs.clubs.forEach(function (c) {
  const keys = [c.name, c.shortName, c.name.replace(/^Club Atlético /i, ''), c.name.replace(/^FC /i, ''), c.name.replace(/ FC$/i, ''), c.name.replace(/ CF$/i, '')];
  keys.forEach(function (k) {
    const key = slug(k);
    if (key && !aliases.aliases[key]) aliases.aliases[key] = c.id;
  });
});
write('club-aliases.json', aliases);

const byCont = {};
clubs.clubs.forEach(function (c) {
  byCont[c.continent] = (byCont[c.continent] || 0) + 1;
});

console.log(
  JSON.stringify(
    {
      leaguesTotal: leagues.count,
      leaguesAdded: leaguesAdded,
      clubsTotal: clubs.count,
      clubsAdded: clubsAdded,
      byContinent: byCont,
      countries: countries.count || (countries.countries && countries.countries.length)
    },
    null,
    2
  )
);
