/**
 * Scan local Mi Carrera image folders and refresh manifests.
 *
 * Clubs:
 *   assets/images/mi-carrera/clubs/{id}.(png|svg|webp)           → status real
 *   assets/images/mi-carrera/clubs/generated/{id}.svg            → status generated
 * Competitions / trophies / awards:
 *   assets/images/mi-carrera/{folder}/{id}.(png|svg|...)         → status real
 *
 * Never invents official trademark artwork. generated ≠ real.
 *
 * Run: node scripts/sync_mi_carrera_assets.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'assets', 'data', 'mi-carrera');
const IMG = path.join(ROOT, 'assets', 'images', 'mi-carrera');
const EXTS = ['.png', '.svg', '.webp', '.jpg', '.jpeg'];

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(DATA, rel), 'utf8'));
}

function writeJson(rel, data) {
  fs.writeFileSync(path.join(DATA, rel), JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function findInDir(dir, id, webFolder) {
  for (let i = 0; i < EXTS.length; i++) {
    const file = id + EXTS[i];
    const full = path.join(dir, file);
    if (fs.existsSync(full)) {
      return {
        src: path.join('assets', 'images', 'mi-carrera', webFolder, file).replace(/\\/g, '/'),
        ext: EXTS[i]
      };
    }
  }
  return null;
}

function syncBadges() {
  const clubs = readJson('clubs.json');
  const prev = readJson('manifests/club-badges.json');
  const badges = {};
  let real = 0;
  let generated = 0;
  let missing = 0;
  const realDir = path.join(IMG, 'clubs');
  const genDir = path.join(IMG, 'clubs', 'generated');

  (clubs.clubs || []).forEach(function (club) {
    const official = findInDir(realDir, club.id, 'clubs');
    if (official) {
      badges[club.id] = {
        status: 'real',
        src: official.src,
        license: 'local',
        source: 'local'
      };
      real += 1;
      return;
    }
    const gen = findInDir(genDir, club.id, 'clubs/generated');
    if (gen) {
      badges[club.id] = {
        status: 'generated',
        src: gen.src,
        license: 'local-generated',
        source: 'local-generated',
        honest: true
      };
      generated += 1;
      return;
    }
    const old = (prev.badges && prev.badges[club.id]) || {};
    badges[club.id] = {
      status: 'missing',
      src: null,
      license: null,
      source: null,
      fallback: Object.assign(
        {
          type: 'color_tile',
          primaryColor: club.primaryColor || '#1f2937',
          secondaryColor: club.secondaryColor || '#9ca3af',
          label: club.shortName || club.name,
          honest: true
        },
        old.fallback || {},
        { honest: true }
      )
    };
    missing += 1;
  });

  writeJson('manifests/club-badges.json', {
    version: 2,
    generatedAt: new Date().toISOString().slice(0, 10),
    counts: { real: real, generated: generated, missing: missing, total: real + generated + missing },
    badges: badges
  });
  return { real: real, generated: generated, missing: missing };
}

function syncKeyed(listKey, folder, manifestRel, idField) {
  const payload = readJson(listKey);
  const prev = readJson(manifestRel);
  const items = {};
  let real = 0;
  let missing = 0;
  const dir = path.join(IMG, folder);
  const list = payload[idField] || payload.items || [];
  list.forEach(function (entry) {
    const id = entry.id;
    const found = findInDir(dir, id, folder);
    if (found) {
      items[id] = {
        status: 'real',
        src: found.src,
        license: 'local-original'
      };
      real += 1;
    } else {
      const old = (prev.items && prev.items[id]) || {};
      items[id] = {
        status: 'missing',
        src: null,
        fallback: Object.assign(
          {
            type: folder === 'trophies' ? 'trophy_silhouette' : folder === 'awards' ? 'award_mark' : 'competition_wordmark',
            label: entry.shortName || entry.name || id,
            honest: true
          },
          old.fallback || {},
          { honest: true }
        )
      };
      missing += 1;
    }
  });
  writeJson(manifestRel, {
    version: 2,
    generatedAt: new Date().toISOString().slice(0, 10),
    counts: { real: real, missing: missing, total: real + missing },
    items: items
  });
  return { real: real, missing: missing };
}

const badges = syncBadges();
const logos = syncKeyed('competitions.json', 'competitions', 'manifests/competition-logos.json', 'competitions');
const trophies = syncKeyed('competitions.json', 'trophies', 'manifests/trophy-images.json', 'competitions');
const awards = syncKeyed('awards.json', 'awards', 'manifests/award-images.json', 'awards');

console.log('Mi Carrera asset sync');
console.log('  clubs:        real', badges.real, '/ generated', badges.generated, '/ missing', badges.missing);
console.log('  competitions: real', logos.real, '/ missing', logos.missing);
console.log('  trophies:     real', trophies.real, '/ missing', trophies.missing);
console.log('  awards:       real', awards.real, '/ missing', awards.missing);
