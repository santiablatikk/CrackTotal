/**
 * Exit / continue / new career smoke (FASE 12).
 * Run: node scripts/mi_carrera_exit_restart_smoke.js
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

const { MC, document } = loadMiCarreraUI();
const root = document.createElement('div');
root.setAttribute('data-mc-root', '1');
const stage = document.createElement('div');
stage.setAttribute('data-mc-stage', '1');
root.appendChild(stage);

const ctrl = MC.UI.createController(root);
ctrl.render();

ctrl.onAction('start');
assert(ctrl.session().scene === 'CREATE', 'start → CREATE');

const s = ctrl.session();
s.draft = {
  name: 'ExitTest',
  country: 'AR',
  age: 17,
  position: 'ST',
  profile: 'finisher',
  seasonYear: 2026,
  seed: 5151
};
s.createStep = 'profile';
ctrl.onAction('create-finish');
assert(!!ctrl.session().career, 'career created');

const clubId = ctrl.session().firstClubs[0].clubId;
const btn = document.createElement('button');
btn.setAttribute('data-club', clubId);
ctrl.onAction('pick-first-club', btn);
ctrl.onAction('to-preseason');
assert(ctrl.session().scene === 'PRESEASON', 'in PRESEASON');
assert(MC.Persistence.hasSave() === true, 'progress saved');

ctrl.onAction('ask-exit');
assert(ctrl.session().overlay === 'exit', 'exit confirmation shown');
ctrl.onAction('close-menu');
assert(ctrl.session().overlay == null, 'cancel exit keeps playing');

ctrl.onAction('ask-exit');
ctrl.onAction('confirm-exit');
assert(ctrl.session().scene === 'INTRO', 'exit → INTRO');
assert(MC.Persistence.hasSave() === true, 'exit does not clear save');

ctrl.onAction('continue');
assert(!!ctrl.session().career, 'continue restores career');
assert(ctrl.session().career.player.name === 'ExitTest', 'same player');

ctrl.onAction('ask-new-career');
assert(ctrl.session().overlay === 'new', 'new career confirmation');
ctrl.onAction('close-menu');
assert(ctrl.session().overlay == null, 'cancel new keeps career');

ctrl.onAction('ask-new-career');
ctrl.onAction('confirm-new-career');
assert(ctrl.session().scene === 'CREATE', 'confirm new → CREATE');
assert(MC.Persistence.hasSave() === false, 'new career clears save');

console.log('\nExit/restart smoke', failed ? 'FAILED' : 'passed.');
process.exit(failed ? 1 : 0);
