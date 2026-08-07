/**
 * HUD live totals smoke (FASE 12).
 * Run: node scripts/mi_carrera_hud_smoke.js
 */
'use strict';

const { loadMiCarrera } = require('./_load_mi_carrera_engine');

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else console.log('OK:', msg);
}

const NS = loadMiCarrera();
const Eng = NS.Engine;

const career = Eng.createCareer({
  name: 'HudTest',
  country: 'AR',
  age: 17,
  position: 'ST',
  profile: 'finisher',
  seasonYear: 2026,
  seed: 12001
});
const first = Eng.generateFirstClubs(career)[0];
Eng.chooseFirstClub(career, first.clubId, first);

let pj = 0;
let g = 0;
let a = 0;
for (let i = 0; i < 3; i++) {
  const turned = Eng.playSeason(career);
  pj += turned.season.matches || 0;
  g += turned.season.goals || 0;
  a += turned.season.assists || 0;
  Eng.applyDecision(career, turned.market.options.find((o) => o.type === 'stay') || turned.market.options[0]);
}

const totals = Eng.History.liveTotals(career);
assert(!!totals, 'liveTotals present');
assert(totals.appearances === pj, 'PJ accumulated (' + totals.appearances + '==' + pj + ')');
assert(totals.goals === g, 'goals accumulated');
assert(totals.assists === a, 'assists accumulated');
assert(totals.clubs >= 1, 'clubs >= 1');
assert(totals.titles >= 0, 'titles non-negative');
assert(totals.overall === career.player.overall, 'overall mirrors player');
assert(totals.age === career.player.age, 'age mirrors player');
assert(totals.clubId === career.currentClubId, 'club actual');

console.log('\nHUD smoke', failed ? 'FAILED' : 'passed.');
process.exit(failed ? 1 : 0);
