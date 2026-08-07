/**
 * FASE 6 narrative/UI smoke: trophy hierarchy, market copy, career card poster fields, beats.
 * Run: node scripts/mi_carrera_narrative_smoke.js
 */
'use strict';

const { loadMiCarreraUI } = require('./_load_mi_carrera_ui');

const { MC, document } = loadMiCarreraUI();
const E = MC.Engine;
const UI = MC.UI;
const N = UI.Narrative;

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else console.log('OK:', msg);
}

function textOf(node) {
  if (!node) return '';
  let t = node.textContent || '';
  (node.children || []).forEach(function (c) {
    t += ' ' + textOf(c);
  });
  return t;
}

function findClass(node, cls) {
  if (!node) return null;
  if ((node.className || '').split(/\s+/).indexOf(cls) !== -1) return node;
  for (let i = 0; i < (node.children || []).length; i++) {
    const hit = findClass(node.children[i], cls);
    if (hit) return hit;
  }
  return null;
}

console.log('Mi Carrera narrative smoke (FASE 6)\n');

assert(!!N.trophyTitle('uefa_cl'), 'trophy title for CL');
assert(!!N.trophyTitle('conmebol_libertadores'), 'trophy title for Libertadores');
assert(N.trophyTitle('uefa_cl') !== N.competitionDisplayName('uefa_cl'), 'title ≠ full competition dump');

const needed = [
  'WONDERKID',
  'LATE_BLOOMER',
  'ONE_CLUB_MAN',
  'CLUB_ICON',
  'JOURNEYMAN',
  'MERCENARY',
  'CONTINENTAL_BRIDGE',
  'NATIONAL_HERO',
  'WORLD_CHAMPION',
  'INJURY_COMEBACK',
  'GIANT_FAILURE',
  'GIANT_SUCCESS',
  'LONG_CAREER',
  'SHORT_CAREER',
  'DOMESTIC_LEGEND',
  'EUROPEAN_CAREER',
  'SOUTH_AMERICAN_CAREER',
  'HOMECOMING'
];
needed.forEach(function (code) {
  assert(!!N.ARCHETYPE_LABEL[code], 'archetype label ' + code);
  assert(!!N.ARCHETYPE_LINE[code], 'archetype line ' + code);
});

assert(!!N.momentLine('first_goal'), 'beat: first_goal');
assert(!!N.momentLine('comeback'), 'beat: comeback');
assert(!!N.momentLine('libertadores'), 'beat: libertadores');
assert(!!N.seasonBeatLine('debut'), 'seasonBeatLine available');

const career = E.simulateFullCareer({
  seed: 630042,
  name: 'Narrativa',
  country: 'BR',
  age: 17,
  position: 'ST',
  profile: 'finisher'
});

const season = career.seasons[Math.min(3, career.seasons.length - 1)] || career.seasons[0];
const queue = UI.buildEventQueue(career, season);
assert(Array.isArray(queue), 'event queue builds');

const mount = document.createElement('div');
const card = UI.CareerCard.render(career, mount);
assert(!!card, 'career card renders');
assert(!!findClass(card, 'mc-card__name'), 'card has name');
assert(!!findClass(card, 'mc-card__arch'), 'card has archetype');
assert(!!findClass(card, 'mc-card__peak'), 'card has peak');
const cardText = textOf(card);
assert(!cardText.includes(career.legacy.fingerprint), 'no technical fingerprint on card');
assert(/PEAK/i.test(cardText), 'peak presented');
assert(!/fingerprint/i.test(cardText), 'fingerprint word absent');

const session = {
  career: career,
  eventQueue: [
    {
      kind: 'TROPHY',
      competitionId: 'conmebol_libertadores',
      seasonYear: 2031,
      age: 24,
      clubId: career.currentClubId,
      first: true
    }
  ],
  pending: {
    market: {
      situation: 'decision',
      options: [
        {
          type: 'stay',
          clubId: career.currentClubId,
          gains: ['Continuidad'],
          risks: ['Estancamiento'],
          role: 'starter',
          expectedMinutes: 2800
        },
        {
          type: 'transfer',
          kind: 'STEP_UP',
          clubId: career.currentClubId,
          fromClubId: career.currentClubId,
          leagueName: 'Brasileirão',
          gains: ['Nuevo proyecto'],
          risks: ['Adaptación'],
          role: 'regular',
          expectedMinutes: 2100
        }
      ]
    }
  }
};

const trophyScene = UI.Screens.TROPHY(session);
assert(!!findClass(trophyScene, 'mc-trophy-hero'), 'trophy hero present');
assert(
  !!findClass(trophyScene, 'mc-trophy-club') || !!findClass(trophyScene, 'mc-badge'),
  'club context on trophy'
);

const marketScene = UI.Screens.MARKET(session);
const marketText = textOf(marketScene);
assert(/QUEDARME/.test(marketText), 'market stay column');
assert(/CAMBIAR/.test(marketText), 'market change column');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nNarrative smoke passed.');
