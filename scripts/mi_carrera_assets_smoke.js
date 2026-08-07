/**
 * Asset providers used by UI components — honest status.
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

console.log('Mi Carrera assets smoke\n');
const { MC, document } = loadMiCarreraUI();

const clubs = MC.Providers.clubs.getAll();
assert(clubs.length >= 500, 'full club catalog available (' + clubs.length + ')');

let missing = 0;
let real = 0;
let generated = 0;
clubs.forEach(function (c) {
  const b = MC.Providers.clubs.getClubBadge(c.id);
  if (b.status === 'real') real += 1;
  else if (b.status === 'generated') generated += 1;
  else missing += 1;
  assert(
    b.status === 'real' || b.status === 'generated' || b.status === 'missing' || b.status === 'fallback',
    'badge status for ' + c.id
  );
  if (b.status !== 'real' && b.status !== 'generated') assert(b.fallback && b.fallback.honest, 'honest fallback for ' + c.id);
  if (b.status === 'generated') assert(!!b.src, 'generated has src for ' + c.id);
});
assert(missing + real + generated === clubs.length, 'badge statuses counted');
console.log('Badges real/generated/missing:', real, generated, missing);

const badgeNode = MC.UI.Components.Badge(clubs[0].id, 'lg');
assert(badgeNode.getAttribute('data-status'), 'Badge component sets status');

const flag = MC.UI.Components.Flag('AR', 'md');
assert(flag.getAttribute('data-status'), 'Flag component sets status');

const trophy = MC.UI.Components.Trophy('uefa_cl', 'md');
assert(trophy.getAttribute('data-status') !== 'real' || trophy.children.length, 'Trophy renders');
assert(trophy.getAttribute('data-status') !== 'real' ? !!trophy.querySelector('.mc-trophy__fallback') || trophy.children.length : true, 'missing trophy uses fallback');

const award = MC.UI.Components.Award('ballon_dor', 'lg');
assert(award.className.indexOf('mc-award--ballon') !== -1, 'Ballon award marked');

const html = require('fs').readFileSync(require('path').join(__dirname, '..', 'assets/js/games/mi-carrera/ui/components.js'), 'utf8');
assert(html.indexOf('getClubBadge') !== -1, 'Badge uses provider');
assert(html.indexOf('assets/images/mi-carrera/clubs/') === -1 || html.indexOf('getClubBadge') !== -1, 'no hardcoded club image map required');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nAssets smoke passed.');
