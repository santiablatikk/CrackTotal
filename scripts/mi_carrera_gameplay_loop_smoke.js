/**
 * Gameplay loop smoke: season → recap → events → market → next (FASE 12).
 * Run: node scripts/mi_carrera_gameplay_loop_smoke.js
 */
'use strict';

const { loadMiCarreraUI } = require('./_load_mi_carrera_ui');

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else console.log('OK:', msg);
}

function collectText(node) {
  const out = [];
  function walk(n) {
    if (!n) return;
    if (n.textContent) out.push(String(n.textContent));
    (n.children || []).forEach(walk);
  }
  walk(node);
  return out.join(' ');
}

const { MC } = loadMiCarreraUI();
assert(MC.UI.SCENES.indexOf('HISTORY') !== -1, 'HISTORY scene registered');
assert(typeof MC.UI.buildEventQueue === 'function', 'event queue builder');

const career = MC.Engine.createCareer({
  name: 'Loop',
  country: 'UY',
  age: 17,
  position: 'ST',
  profile: 'finisher',
  seed: 3210
});
const first = MC.Engine.generateFirstClubs(career)[0];
MC.Engine.chooseFirstClub(career, first.clubId, first);

const turned = MC.Engine.playSeason(career);
assert(!!turned.season, 'season produced');
assert(!!turned.market, 'market produced');
assert((turned.market.options || []).some((o) => o.type === 'stay'), 'market has stay');

const session = {
  career,
  pending: { season: turned.season, market: turned.market, retirement: turned.retirement },
  eventQueue: MC.UI.buildEventQueue(career, turned.season)
};

assert(!!MC.UI.Screens.PRESEASON({ career }), 'PRESEASON renders');
const recap = MC.UI.Screens.RECAP(session);
assert(!!recap, 'RECAP renders');
const market = MC.UI.Screens.MARKET(session);
assert(!!market, 'MARKET renders');
assert(/TEMPORADA|PJ|ESTÁS|TE MANTENÉS|CRECIENDO|EXPLOTANDO|CAYENDO|ESTANCADO|VOLVIENDO|OVR/i.test(collectText(recap)), 'recap shows progression');
assert(/QUEDARME|VOLVER/.test(collectText(market)), 'market decision present');

MC.Engine.applyDecision(career, turned.market.options.find((o) => o.type === 'stay'));
assert(career.currentClubId === first.clubId, 'stay keeps club');

console.log('\nGameplay loop smoke', failed ? 'FAILED' : 'passed.');
process.exit(failed ? 1 : 0);
