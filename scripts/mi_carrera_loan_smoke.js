/**
 * Loan occurrence and return smoke.
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

const MC = loadMiCarrera();
const E = MC.Engine;

console.log('Mi Carrera loan smoke\n');

let loans = 0;
for (let seed = 1; seed <= 120; seed++) {
  const c = E.simulateFullCareer({
    seed: 1000 + seed * 13,
    name: 'L',
    country: seed % 2 ? 'GB' : 'ES',
    age: 16,
    position: 'AM',
    profile: 'creator'
  });
  loans += c.loans.length;
}

assert(loans > 0, 'loans occur in sample (' + loans + ')');

// Manual loan path
const career = E.createCareer({ seed: 777, name: 'Loan', country: 'GB', age: 17, position: 'ST', profile: 'finisher' });
career.player.overall = 68;
career.player.potential = 86;
const opts = E.generateFirstClubs(career);
// Prefer big club
const big = opts.sort((a, b) => b.prestige - a.prestige)[0];
E.chooseFirstClub(career, big.clubId, big);
career.role = 'youth_prospect';
const turn = E.playSeason(career);
const loanOpt = (turn.market.options || []).find((o) => o.type === 'loan');
if (loanOpt) {
  E.applyDecision(career, loanOpt);
  assert(career.onLoan === true, 'on loan after decision');
  assert(career.loanFromClubId === big.clubId, 'loan from origin club');
  const turn2 = E.playSeason(career);
  const ret = (turn2.market.options || []).find((o) => o.type === 'loan_return');
  assert(!!ret, 'loan return option appears');
  E.applyDecision(career, ret || { type: 'loan_return', clubId: big.clubId });
  assert(career.onLoan === false, 'loan cleared');
} else {
  console.log('OK: no loan this seed (acceptable)');
}

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nLoan smoke passed.');
