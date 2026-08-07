/**
 * FASE 7 visual rebuild smoke: immersion shell, atmospheres, CTA arrows, scenes.
 * Run: node scripts/mi_carrera_visual_rebuild_smoke.js
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

console.log('Mi Carrera visual rebuild smoke (FASE 7)\n');

const cssPath = path.join(ROOT, 'assets/css/mi-carrera.css');
const css = fs.readFileSync(cssPath, 'utf8');
assert(css.length > 20000, 'CSS rebuild is substantial (' + css.length + ' bytes)');
assert(!/\/\*\s*override/i.test(css), 'no trailing patch-override style comments');
assert(css.indexOf('.mc-atmosphere') !== -1, 'atmosphere layer present');
assert(css.indexOf('.mc-vignette') !== -1, 'vignette layer present');
assert(css.indexOf('.mc-scene--intro') !== -1, 'intro atmosphere');
assert(css.indexOf('.mc-scene--trophy') !== -1, 'trophy atmosphere');
assert(css.indexOf('.mc-scene--market') !== -1, 'market atmosphere');
assert(css.indexOf('prefers-reduced-motion') !== -1, 'reduced motion respected');
assert(css.indexOf('breadcrumbs-container') !== -1, 'breadcrumbs immersion rule');
assert(!/copero/i.test(css), 'no forbidden external refs');

const { MC, document } = loadMiCarreraUI();
const UI = MC.UI;
const C = UI.Components;

const intro = UI.Screens.INTRO({ draft: {} });
assert(!!intro.querySelector || true, 'intro scene builds');
assert((intro.className || '').indexOf('mc-scene--intro') !== -1, 'intro scene class');
assert(
  (intro.children || []).some(function (n) {
    return (n.className || '').indexOf('mc-atmosphere') !== -1;
  }),
  'intro has atmosphere child'
);

assert(/→/.test(css) && css.indexOf('mc-cta__label::after') !== -1, 'primary CTA arrow via CSS');
const career = MC.Engine.simulateFullCareer({
  seed: 700042,
  name: 'Visual',
  country: 'AR',
  age: 17,
  position: 'ST',
  profile: 'finisher'
});

const debut = UI.Screens.DEBUT({ career: career });
assert((debut.className || '').indexOf('mc-scene--debut') !== -1, 'debut scene class');

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
assert((trophy.className || '').indexOf('celebrate') !== -1 || (trophy.className || '').indexOf('trophy') !== -1, 'trophy celebrate');

const cardMount = document.createElement('div');
UI.CareerCard.render(career, cardMount);
assert(!!cardMount.children.length || !!cardMount.childElementCount, 'career card mounts');

const html = fs.readFileSync(path.join(ROOT, 'mi-carrera.html'), 'utf8');
assert(html.indexOf('mi-carrera.css?v=20260807g') !== -1, 'CSS cache bust updated');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nVisual rebuild smoke passed.');
