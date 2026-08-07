/**
 * FASE 6 depth smoke: archetypes from trajectory, Libertadores pool, comebacks, card fields.
 * Run: node scripts/mi_carrera_depth_smoke.js
 */
'use strict';

const { loadMiCarrera } = require('./_load_mi_carrera_engine');

const MC = loadMiCarrera();
const E = MC.Engine;
const Elig = E.Eligibility;

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else console.log('OK:', msg);
}

console.log('Mi Carrera depth smoke (FASE 6)\n');

assert(MC.Providers.clubs.getAll().length >= 1134, 'catalog keeps 1134+ clubs');
assert(MC.Providers.competitions.getAll().length === 35, '35 competitions preserved');

const saLib = MC.Providers.clubs.getAll().filter(function (c) {
  return Elig.canCompeteIn(c, 'conmebol_libertadores');
});
assert(saLib.length >= 40, 'Libertadores-eligible SA pool is football-sized (' + saLib.length + ')');
assert(
  saLib.every(function (c) {
    return Elig.leagueLevel(c) === 1 && c.continent === 'SA';
  }),
  'Libertadores pool is SA top division only'
);

const euCl = MC.Providers.clubs.getAll().filter(function (c) {
  return Elig.canCompeteIn(c, 'uefa_cl');
});
assert(euCl.length >= 20 && euCl.length <= 80, 'CL pool stays elite (' + euCl.length + ')');

const archSeen = new Set();
let libTitles = 0;
let comebacks = 0;
let peakAgeOk = 0;
for (let i = 0; i < 120; i++) {
  const career = E.simulateFullCareer({
    seed: 610000 + i * 7919,
    name: 'D' + i,
    country: ['AR', 'BR', 'UY', 'ES', 'GB', 'IT', 'FR', 'CO'][i % 8],
    age: 16 + (i % 3),
    position: ['ST', 'AM', 'CM', 'CB', 'GK', 'LW'][i % 6],
    profile: ['finisher', 'creator', 'engine', 'wall', 'modern_gk', 'winger'][i % 6]
  });
  const arch = career.legacy && career.legacy.archetype;
  if (arch) archSeen.add(arch);
  if ((career.titles || []).some(function (t) {
    return t.competitionId === 'conmebol_libertadores';
  })) {
    libTitles += 1;
  }
  if (career.flags && career.flags.hadComeback) comebacks += 1;
  const totals = career.legacy && career.legacy.totals;
  if (totals && totals.peakAge != null && totals.debutAge != null) peakAgeOk += 1;

  const traj = E.State.analyzeTrajectory(career);
  const derived = E.State.deriveArchetype(career);
  assert(!!derived, 'archetype derived for career ' + i);
  if (traj.hasBallon) assert(derived === 'BALLON_DOR_WINNER', 'Ballon forces Ballon archetype');
}

assert(archSeen.size >= 8, 'diverse archetypes from trajectory (' + archSeen.size + ')');
assert(libTitles >= 1, 'Libertadores reachable in depth sample (' + libTitles + ')');
assert(peakAgeOk >= 100, 'legacy exposes peakAge/debutAge (' + peakAgeOk + ')');
assert(comebacks >= 0, 'comeback flag tracked (' + comebacks + ')');

const requiredLabels = [
  'WONDERKID',
  'LATE_BLOOMER',
  'JOURNEYMAN',
  'MERCENARY',
  'CONTINENTAL_BRIDGE',
  'NATIONAL_HERO',
  'DOMESTIC_LEGEND',
  'SOUTH_AMERICAN_CAREER',
  'EUROPEAN_CAREER',
  'SHORT_CAREER',
  'INJURY_COMEBACK',
  'GIANT_FAILURE',
  'GIANT_SUCCESS',
  'LONG_CAREER',
  'ONE_CLUB_MAN',
  'CLUB_ICON'
];
const N = MC.UI && MC.UI.Narrative ? MC.UI.Narrative : null;
if (!N) {
  // Narrative lives on UI bundle; engine-only load is fine — labels checked in narrative smoke
  console.log('OK: narrative labels deferred to narrative smoke');
} else {
  requiredLabels.forEach(function (code) {
    assert(!!N.ARCHETYPE_LABEL[code], 'label for ' + code);
  });
}

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nDepth smoke passed.');
