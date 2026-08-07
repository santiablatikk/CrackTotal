/**
 * UI shell + scene flow smoke (no browser).
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

console.log('Mi Carrera UI smoke\n');

assert(fs.existsSync(path.join(ROOT, 'mi-carrera.html')), 'mi-carrera.html exists');
assert(fs.existsSync(path.join(ROOT, 'assets/css/mi-carrera.css')), 'mi-carrera.css exists');

const html = fs.readFileSync(path.join(ROOT, 'mi-carrera.html'), 'utf8');
assert(html.indexOf('data-mc-stage') !== -1, 'stage mount present');
assert(!/copero/i.test(html), 'no forbidden external refs in html');

const css = fs.readFileSync(path.join(ROOT, 'assets/css/mi-carrera.css'), 'utf8');
assert(!/copero/i.test(css), 'no forbidden external refs in css');

const { MC, document } = loadMiCarreraUI();
assert(MC.UI && MC.UI.boot, 'UI boot exported');
assert(MC.UI.SCENES.indexOf('RECAP') !== -1, 'RECAP scene listed');
assert(MC.UI.SCENES.indexOf('CAREER_CARD') !== -1, 'CAREER_CARD scene listed');

const root = document.createElement('div');
root.setAttribute('data-mc-root', '1');
const stage = document.createElement('div');
stage.setAttribute('data-mc-stage', '1');
root.appendChild(stage);

const ctrl = MC.UI.createController(root);
ctrl.render();
assert(ctrl.session().scene === 'INTRO', 'starts INTRO');
assert(stage.children.length === 1, 'renders a scene node');

ctrl.onAction('start');
assert(ctrl.session().scene === 'CREATE', 'start → CREATE');

const s = ctrl.session();
s.draft = { name: 'Test', country: 'AR', age: 17, position: 'ST', profile: 'finisher', seasonYear: 2026, seed: 424242 };
s.createStep = 'profile';
ctrl.onAction('create-finish');
assert(ctrl.session().scene === 'FIRST_CLUB', 'create-finish → FIRST_CLUB');
assert((ctrl.session().firstClubs || []).length === 3, 'exactly 3 first clubs');

const clubId = ctrl.session().firstClubs[0].clubId;
const fakeBtn = document.createElement('button');
fakeBtn.setAttribute('data-club', clubId);
ctrl.onAction('pick-first-club', fakeBtn);
assert(ctrl.session().scene === 'DEBUT', 'pick club → DEBUT');
assert(ctrl.session().career.currentClubId === clubId, 'career club set by engine');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nUI smoke passed.');
