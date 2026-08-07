/**
 * Generate local visual assets for Mi Carrera.
 * Club marks: geometric SVGs from club colors (status: generated — never official crests).
 * Trophies/awards: original local SVG illustrations (status: real, license: local-original).
 *
 * Run: node scripts/generate_mi_carrera_visual_assets.js
 * Then: node scripts/sync_mi_carrera_assets.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'assets', 'data', 'mi-carrera');
const IMG = path.join(ROOT, 'assets', 'images', 'mi-carrera');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(DATA, rel), 'utf8'));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function initials(club) {
  const label = String(club.shortName || club.name || '?').trim();
  if (label.length <= 3) return label.toUpperCase();
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return label.slice(0, 3).toUpperCase();
}

function clubSvg(club) {
  const p = club.primaryColor || '#2a3344';
  const s = club.secondaryColor || '#9aa3b5';
  const text = initials(club);
  const fontSize = text.length >= 3 ? 34 : 42;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 140" role="img" aria-label="${esc(club.name)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${esc(p)}"/>
      <stop offset="100%" stop-color="${esc(s)}"/>
    </linearGradient>
  </defs>
  <path d="M64 6 L114 22 L114 74 C114 104 90 124 64 134 C38 124 14 104 14 74 L14 22 Z" fill="url(#g)" stroke="rgba(255,255,255,0.35)" stroke-width="3"/>
  <path d="M64 18 L102 30 L102 72 C102 94 84 110 64 118 C44 110 26 94 26 72 L26 30 Z" fill="rgba(0,0,0,0.18)"/>
  <text x="64" y="78" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="${fontSize}" fill="#fff" stroke="rgba(0,0,0,0.35)" stroke-width="1.5">${esc(text)}</text>
</svg>
`;
}

function trophySvg(comp) {
  const id = (comp && comp.id) || '';
  const rarity = (comp && comp.rarity) || 'normal';
  const label = esc((comp && (comp.shortName || comp.name)) || 'Copa');
  let gold = rarity === 'legendary' || rarity === 'mythic' ? '#f0c85a' : rarity === 'major' ? '#d8b45a' : '#c4a36a';
  let accent = rarity === 'legendary' ? '#d8ff3e' : gold;
  let body;

  if (id === 'fifa_world_cup') {
    body = `<ellipse cx="100" cy="70" rx="34" ry="40" fill="${gold}" stroke="#fff" stroke-width="3"/>
      <path d="M78 48 Q100 30 122 48" fill="none" stroke="#8a6a20" stroke-width="3"/>
      <rect x="92" y="108" width="16" height="24" fill="${gold}"/>
      <rect x="74" y="130" width="52" height="12" rx="2" fill="${accent}"/>
      <circle cx="100" cy="58" r="8" fill="#fff" opacity="0.35"/>`;
  } else if (id === 'uefa_cl') {
    body = `<path d="M70 36 H130 V68 C130 98 116 114 100 122 C84 114 70 98 70 68 Z" fill="${gold}" stroke="#fff" stroke-width="3"/>
      <circle cx="100" cy="72" r="18" fill="none" stroke="#fff" stroke-width="3"/>
      <path d="M100 54 L100 90 M82 72 L118 72" stroke="#fff" stroke-width="2"/>
      <rect x="92" y="120" width="16" height="20" fill="${gold}"/>
      <rect x="78" y="138" width="44" height="10" rx="2" fill="${accent}"/>`;
  } else if (id === 'conmebol_libertadores') {
    body = `<path d="M68 40 H132 V66 C132 100 114 118 100 128 C86 118 68 100 68 66 Z" fill="${gold}" stroke="#fff" stroke-width="3"/>
      <path d="M86 58 H114 V78 C114 90 108 96 100 100 C92 96 86 90 86 78 Z" fill="#8a6a20" opacity="0.35"/>
      <rect x="92" y="124" width="16" height="18" fill="${gold}"/>
      <rect x="76" y="140" width="48" height="10" rx="2" fill="#d8ff3e"/>`;
  } else if (id === 'uefa_euro' || id === 'conmebol_copa_america') {
    body = `<path d="M72 42 H128 V70 C128 96 116 112 100 120 C84 112 72 96 72 70 Z" fill="${gold}" stroke="#fff" stroke-width="3"/>
      <path d="M60 50 H72 V74 C64 74 58 66 58 58 Z" fill="${gold}"/>
      <path d="M128 50 H140 C146 58 146 74 128 74 Z" fill="${gold}"/>
      <rect x="92" y="118" width="16" height="22" fill="${gold}"/>
      <rect x="78" y="138" width="44" height="10" rx="2" fill="${accent}"/>`;
  } else if (id.indexOf('uefa_el') === 0 || id === 'conmebol_sudamericana' || id === 'uefa_uecl') {
    body = `<path d="M74 44 H126 V72 C126 94 114 108 100 116 C86 108 74 94 74 72 Z" fill="${gold}" stroke="#fff" stroke-width="3"/>
      <rect x="93" y="114" width="14" height="20" fill="${gold}"/>
      <rect x="80" y="132" width="40" height="10" rx="2" fill="${accent}"/>`;
  } else {
    body = `<path d="M70 40 H130 V70 C130 96 118 112 100 120 C82 112 70 96 70 70 Z" fill="${gold}" stroke="#fff" stroke-width="3"/>
      <path d="M62 48 H70 V72 C62 72 56 64 56 56 Z" fill="${gold}"/>
      <path d="M130 48 H138 C144 56 144 72 130 72 Z" fill="${gold}"/>
      <rect x="92" y="118" width="16" height="22" fill="${gold}"/>
      <rect x="78" y="138" width="44" height="10" rx="2" fill="${accent}"/>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 180" role="img" aria-label="${label}">
  <rect width="200" height="180" fill="none"/>
  ${body}
</svg>
`;
}

function awardSvg(award) {
  const id = award.id;
  const isBallon = id === 'ballon_dor';
  const fill = isBallon ? '#d8ff3e' : id.indexOf('boot') !== -1 ? '#f0c85a' : '#e8d48a';
  const label = esc(award.shortName || award.name || id);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="${label}">
  <defs>
    <radialGradient id="rg" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.55"/>
      <stop offset="55%" stop-color="${fill}"/>
      <stop offset="100%" stop-color="#5a4a18"/>
    </radialGradient>
  </defs>
  <circle cx="80" cy="72" r="48" fill="url(#rg)" stroke="#fff" stroke-width="3"/>
  <circle cx="80" cy="72" r="34" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="2"/>
  ${
    isBallon
      ? `<path d="M55 60 Q80 40 105 60 M55 84 Q80 104 105 84" fill="none" stroke="#1a1a1a" stroke-width="3"/>`
      : `<path d="M80 48 L88 68 L110 70 L94 86 L98 108 L80 96 L62 108 L66 86 L50 70 L72 68 Z" fill="#1a1a1a" opacity="0.35"/>`
  }
  <text x="80" y="148" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#c8ceda">${label.toUpperCase().slice(0, 16)}</text>
</svg>
`;
}

function competitionMarkSvg(comp) {
  const label = esc(comp.shortName || comp.name || comp.id);
  const rarity = comp.rarity || 'normal';
  const stroke = rarity === 'legendary' ? '#f0c85a' : '#d8ff3e';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" role="img" aria-label="${label}">
  <rect x="8" y="12" width="184" height="56" rx="4" fill="rgba(255,255,255,0.06)" stroke="${stroke}" stroke-width="2"/>
  <text x="100" y="48" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="18" fill="#f3f0e7">${label.toUpperCase().slice(0, 18)}</text>
</svg>
`;
}

ensureDir(path.join(IMG, 'clubs', 'generated'));
ensureDir(path.join(IMG, 'trophies'));
ensureDir(path.join(IMG, 'awards'));
ensureDir(path.join(IMG, 'competitions'));

const clubs = readJson('clubs.json').clubs || [];
let clubN = 0;
clubs.forEach(function (club) {
  const file = path.join(IMG, 'clubs', 'generated', club.id + '.svg');
  fs.writeFileSync(file, clubSvg(club), 'utf8');
  clubN += 1;
});

const competitions = readJson('competitions.json').competitions || [];
let trophyN = 0;
let logoN = 0;
competitions.forEach(function (comp) {
  fs.writeFileSync(path.join(IMG, 'trophies', comp.id + '.svg'), trophySvg(comp), 'utf8');
  trophyN += 1;
  fs.writeFileSync(path.join(IMG, 'competitions', comp.id + '.svg'), competitionMarkSvg(comp), 'utf8');
  logoN += 1;
});

const awards = readJson('awards.json').awards || [];
let awardN = 0;
awards.forEach(function (award) {
  fs.writeFileSync(path.join(IMG, 'awards', award.id + '.svg'), awardSvg(award), 'utf8');
  awardN += 1;
});

console.log(
  JSON.stringify(
    {
      clubGenerated: clubN,
      trophiesLocal: trophyN,
      competitionMarks: logoN,
      awardsLocal: awardN
    },
    null,
    2
  )
);
