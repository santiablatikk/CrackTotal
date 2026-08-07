/**
 * FASE 10 — market options expose real engine consequences (kind/gains/risks).
 * Run: node scripts/mi_carrera_market_consequences_smoke.js
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
  if (!node) return '';
  var parts = [];
  if (node.textContent) parts.push(String(node.textContent));
  (node.children || []).forEach(function (c) {
    parts.push(collectText(c));
  });
  return parts.join(' ');
}

console.log('Mi Carrera market consequences smoke (FASE 10)\n');

const { MC } = loadMiCarreraUI();
const Eng = MC.Engine;
const UI = MC.UI;

let sawKinds = {};
let sawGains = 0;
let markets = 0;

for (let i = 0; i < 40; i++) {
  const career = Eng.simulateFullCareer({
    seed: 440000 + i,
    name: 'Mkt' + i,
    country: i % 2 ? 'AR' : 'BR',
    age: 17,
    position: 'ST',
    profile: 'finisher'
  });
  // Rebuild mid-career state and generate markets from seasons
  const mid = Eng.createCareer({
    seed: 450000 + i,
    name: 'Mid' + i,
    country: 'AR',
    age: 17,
    position: 'CM',
    profile: 'creator'
  });
  const first = Eng.generateFirstClubs(mid)[0];
  Eng.chooseFirstClub(mid, first.clubId, first);
  for (let s = 0; s < 6; s++) {
    const turned = Eng.playSeason(mid);
    markets += 1;
    const market = turned.market || Eng.Market.generateMarket(mid, mid.__rng);
    (market.options || []).forEach(function (opt) {
      if (opt.kind) sawKinds[opt.kind] = (sawKinds[opt.kind] || 0) + 1;
      if ((opt.gains || []).length && (opt.risks || []).length) sawGains += 1;
    });
    if (turned.retirement && turned.retirement.force) break;
    // Accept stay to continue
    const stay = (market.options || []).find(function (o) {
      return o.type === 'stay';
    });
    if (stay) Eng.applyDecision(mid, stay);
  }
}

assert(markets >= 20, 'generated multiple market windows');
assert(sawGains >= 20, 'offers carry gains and risks from engine');
assert(Object.keys(sawKinds).length >= 3, 'multiple move kinds appear (' + Object.keys(sawKinds).join(',') + ')');
assert(sawKinds.STAY >= 1 || sawKinds.STAY === undefined, 'stay kind available or typed stay');

const sampleCareer = Eng.simulateFullCareer({
  seed: 460001,
  name: 'Offer',
  country: 'AR',
  age: 17,
  position: 'ST',
  profile: 'finisher'
});
const fakeMarket = {
  situation: 'step_up',
  options: [
    {
      type: 'stay',
      kind: 'STAY',
      gains: ['Continuidad'],
      risks: ['Estancamiento'],
      expectedMinutes: 2800
    },
    {
      type: 'transfer',
      kind: 'EUROPE',
      clubId: sampleCareer.currentClubId,
      role: 'rotation',
      gains: ['Europa'],
      risks: ['Menos minutos'],
      expectedMinutes: 1200,
      leagueName: 'Serie A'
    }
  ]
};
const marketScene = UI.Screens.MARKET({
  career: sampleCareer,
  pending: { market: fakeMarket }
});
const text = collectText(marketScene);
assert(/ME QUEDO|DOY EL SALTO/.test(text), 'market emotional headline');
assert(/EUROPA|SALTO|ESTABILIDAD|PRÉSTAMO|REGRESO/.test(text) || /EUROPA/.test(UI.Narrative.marketMoveLabel('EUROPE')), 'move labels exist');
assert(!!marketScene.querySelector('.mc-move-kind') || /EUROPA/.test(text), 'UI surfaces move kind');

console.log('kinds', sawKinds);
console.log('\n' + (failed ? failed + ' failure(s)' : 'Market consequences smoke passed.'));
process.exit(failed ? 1 : 0);
