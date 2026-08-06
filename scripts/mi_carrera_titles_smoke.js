/**
 * Titles rarity sanity.
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

console.log('Mi Carrera titles smoke\n');

let withTitles = 0;
let withCL = 0;
let untitled = 0;
const N = 100;
for (let i = 0; i < N; i++) {
  const c = E.simulateFullCareer({
    seed: 5000 + i * 19,
    name: 'Title',
    country: i % 3 === 0 ? 'AR' : i % 3 === 1 ? 'ES' : 'BR',
    age: 17,
    position: 'ST',
    profile: 'finisher'
  });
  if (c.titles.length) withTitles += 1;
  else untitled += 1;
  if (c.titles.some((t) => t.competitionId === 'uefa_cl')) withCL += 1;
}

assert(untitled > 5, 'some careers untitled (' + untitled + ')');
assert(withTitles > 10, 'some careers win titles (' + withTitles + ')');
assert(withCL < N * 0.35, 'Champions not inflated (' + withCL + '/' + N + ')');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nTitles smoke passed.');
