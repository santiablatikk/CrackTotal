/**
 * FASE 9 — final visual / AAA polish smoke.
 * Run: node scripts/mi_carrera_final_visual_smoke.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { loadMiCarreraUI, ROOT } = require('./_load_mi_carrera_ui');

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else console.log('OK:', msg);
}

console.log('Mi Carrera final visual smoke (FASE 9)\n');

const cssPath = path.join(ROOT, 'assets/css/mi-carrera.css');
const css = fs.readFileSync(cssPath, 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'mi-carrera.html'), 'utf8');
const screensSrc = fs.readFileSync(path.join(ROOT, 'assets/js/games/mi-carrera/ui/screens.js'), 'utf8');
const cardSrc = fs.readFileSync(path.join(ROOT, 'assets/js/games/mi-carrera/ui/career-card.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

assert(css.indexOf('FASE 9') !== -1 || css.indexOf('mc-cta--gold') !== -1, 'FASE 9 polish CSS present');
assert(css.indexOf('.mc-atmosphere') !== -1, 'atmosphere layer');
assert(css.indexOf('.mc-vignette') !== -1, 'vignette layer');
assert(css.indexOf('prefers-reduced-motion') !== -1, 'reduced motion');
assert(css.indexOf('mc-rail--nations') !== -1, 'CREATE nation tiles');
assert(css.indexOf('mc-trophy-hero::before') !== -1, 'trophy spotlight');
assert(css.indexOf('mc-poster-in') !== -1, 'career card poster motion');
assert(!/copero/i.test(css + screensSrc + cardSrc + html), 'no forbidden external refs');
assert(!/cdn\.|googleapis\.com\/ajax|unpkg\.com|jsdelivr/i.test(screensSrc + cardSrc), 'no hotlinked script deps in UI');

const deps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
assert(Object.keys(deps).length >= 0, 'package.json readable');

const { MC, document } = loadMiCarreraUI();
const UI = MC.UI;
const expected = [
  'INTRO',
  'CREATE',
  'FIRST_CLUB',
  'DEBUT',
  'PRESEASON',
  'SEASON',
  'RECAP',
  'TROPHY',
  'AWARD',
  'MOMENT',
  'AGE_UP',
  'MARKET',
  'COMPARE',
  'TRANSFER',
  'RETIREMENT',
  'LEGACY',
  'CAREER_CARD'
];
expected.forEach(function (name) {
  assert(typeof UI.Screens[name] === 'function', 'scene ' + name + ' exists');
});

assert(typeof UI.Narrative.momentKicker === 'function', 'momentKicker present');
assert(UI.Narrative.momentKicker('comeback') === 'COMEBACK', 'moment kicker is scene, not alert');
assert(UI.Narrative.momentKicker('first_goal') === 'PRIMER GOL', 'first goal kicker');

function collectText(node) {
  if (!node) return '';
  var parts = [];
  if (node.textContent) parts.push(String(node.textContent));
  (node.children || []).forEach(function (child) {
    parts.push(collectText(child));
  });
  return parts.join(' ');
}

const career = MC.Engine.simulateFullCareer({
  seed: 900109,
  name: 'FaseNueve',
  country: 'AR',
  age: 17,
  position: 'ST',
  profile: 'finisher'
});

const intro = UI.Screens.INTRO({ draft: {} });
assert((intro.className || '').indexOf('mc-scene--intro') !== -1, 'intro builds');

const create = UI.Screens.CREATE({ draft: { country: 'AR' }, createStep: 'country' });
assert(!!create.querySelector('.mc-rail--nations'), 'CREATE countries use nation rail');

const first = UI.Screens.FIRST_CLUB({
  firstClubs: [
    { path: 'minutes', clubId: career.currentClubId, role: 'starter', gains: ['Minutos'], risks: ['Prestigio'] },
    { path: 'balance', clubId: career.currentClubId, role: 'rotation', gains: ['Desarrollo'], risks: ['Techo'] },
    { path: 'prestige', clubId: career.currentClubId, role: 'bench', gains: ['Prestigio'], risks: ['Paciencia'] }
  ]
});
assert(!!first.querySelector('.mc-path__crest'), 'FIRST_CLUB crest wrapper');
assert(!!first.querySelector('.mc-path__promise'), 'FIRST_CLUB philosophy promise');
const firstText = collectText(first);
assert(/JUGÁS|CRECÉS|TE VEN/.test(firstText), 'FIRST_CLUB philosophies present');

const market = UI.Screens.MARKET({
  career: career,
  pending: {
    market: {
      situation: 'BREAKOUT',
      options: [
        { type: 'stay', gains: ['Continuidad'], expectedMinutes: 2400 },
        {
          type: 'transfer',
          clubId: career.currentClubId,
          role: 'starter',
          gains: ['Salto'],
          risks: ['Adaptación'],
          leagueName: 'Test'
        }
      ]
    }
  }
});
assert(/ME QUEDO|DOY EL SALTO/.test(collectText(market)), 'MARKET emotional decision headline');

const trophy = UI.Screens.TROPHY({
  career: career,
  eventQueue: [
    {
      kind: 'TROPHY',
      competitionId: 'uefa_cl',
      seasonYear: 2030,
      age: 24,
      clubId: career.currentClubId,
      first: true
    }
  ]
});
assert(!!trophy.querySelector('.mc-trophy'), 'trophy uses trophy component');
assert(!!trophy.querySelector('.mc-cta--gold'), 'trophy gold CTA');
assert(!/uefa_cl/i.test((trophy.querySelector('.mc-trophy-comp') || {}).textContent || ''), 'trophy title not raw id');

const award = UI.Screens.AWARD({
  career: career,
  eventQueue: [{ kind: 'AWARD', awardId: 'ballon_dor', seasonYear: 2031 }]
});
assert(!!award.querySelector('.mc-award'), 'award uses award component');
assert(!!award.querySelector('.mc-cta--gold'), 'award gold CTA');

const moment = UI.Screens.MOMENT({
  career: career,
  eventQueue: [{ kind: 'MOMENT', type: 'comeback', age: 26, seasonYear: 2032 }]
});
assert(/COMEBACK/.test(collectText(moment)), 'moment scene kicker');
assert(!/\[INFO\]|\[WARNING\]|\[EVENT\]/i.test(collectText(moment)), 'no alert labels');

const cardMount = document.createElement('div');
UI.CareerCard.render(career, cardMount);
const cardText = collectText(cardMount);
assert(!!cardMount.querySelector('[data-career-card]'), 'career card mounts');
assert(!/fingerprint|sha256|hash|uuid|seed:/i.test(cardText), 'career card has no technical fingerprint');
assert(!/\b[0-9a-f]{16,}\b/i.test(cardText), 'career card has no long hex ids');

const badge = UI.Components.Badge(career.currentClubId, 'xl');
assert(badge.getAttribute('data-badge') || badge.getAttribute('data-status'), 'crest uses badge provider');

const trophyComp = UI.Components.Trophy('uefa_cl', 'xl');
assert(trophyComp.getAttribute('data-trophy') === 'real' || trophyComp.getAttribute('data-status'), 'trophy provider wired');

const awardComp = UI.Components.Award('ballon_dor', 'xl');
assert(awardComp.getAttribute('data-award') || awardComp.getAttribute('data-status'), 'award provider wired');

assert(/mi-carrera\.css\?v=/.test(html), 'CSS cache bust present');
assert(/screens\.js\?v=/.test(html), 'screens cache bust present');

const broken = [
  'assets/images/mi-carrera/trophies/uefa_cl.svg',
  'assets/css/mi-carrera.css',
  'assets/js/games/mi-carrera/ui/screens.js'
];
broken.forEach(function (rel) {
  assert(fs.existsSync(path.join(ROOT, rel)), 'asset exists: ' + rel);
});

console.log('\n' + (failed ? failed + ' failure(s)' : 'All checks passed.'));
process.exit(failed ? 1 : 0);
