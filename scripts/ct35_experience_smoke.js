'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const homepage = read('index.html');
const gamesPage = read('games.html');
const arena = read('pasala-1v1.html');
const arenaClient = read('assets/js/pasala-duel-client.js');
const homeScript = read('assets/js/home.js');
const homeStyles = read('assets/css/home-4.css');
const topScript = read('assets/js/top10.js');
const wordleScript = read('assets/js/wordle-futbol.js');
const wordlePage = read('wordle-futbol.html');

for (const id of ['stagingSetup', 'stagingServerInput', 'stagingSetupFeedback']) {
  assert(arena.includes('id="' + id + '"'), 'Arena staging control missing: ' + id);
}
assert(arenaClient.includes("['https:', 'wss:'].includes(proposed.protocol)"), 'Only secure public staging URL schemes must be allowed');
assert(arenaClient.includes("host === 'cracktotal.com' || host.endsWith('.cracktotal.com')"), 'Never offer to connect the production backend from preview');
assert(arenaClient.includes("location.hostname==='deploy-preview-1--zingy-haupia-53b742.netlify.app'"), 'Only the exact PR preview or Render staging may auto-connect to Arena');
assert(arenaClient.includes("'wss://cracktotal-arena-staging.onrender.com'"), 'The confirmed separate Render staging endpoint must be used');
assert(arenaClient.includes("const urlOverride=override || (isStaging ? STAGING : '');"), 'Only staging/local overrides may be propagated to shared room links');
assert(arenaClient.includes("const wsUrl=urlOverride || (isProduction ? provided : '');"), 'Public static site must require an explicitly configured production WS server');
assert(!arenaClient.includes("location.host)"), 'Never infer a WebSocket backend from the static-site host');
assert(arenaClient.includes("lobbyUrl.searchParams.set('server', urlOverride)"), 'Leaving the duel must preserve the selected staging server');
assert(arenaClient.includes('setupForm.hidden = !isStaticPreview || !!urlOverride || watchOnly'), 'The staging setup must be hidden outside static preview');

for (const id of ['ct35-daily-title', 'homeDailyTop10Title', 'homeDailyTop10Context',
  'homeDailyTop10Status', 'homeDailyWordleStatus', 'homeDailyDate']) {
  assert(homepage.includes('id="' + id + '"'), 'Daily home element missing: ' + id);
}
assert(homeStyles.includes('.ct4-daily-grid'), 'Daily challenge visual styling missing');
for (const id of ['homeDailyTop10Title', 'homeDailyTop10Status', 'homeDailyWordleStatus']) {
  assert(gamesPage.includes('id="' + id + '"'), 'Catalog daily link missing: ' + id);
}
assert(gamesPage.includes('assets/js/home.js?v=20261019b'), 'Catalog must load today’s real status script');
assert(homeStyles.includes('@media(max-width:760px)'), 'Daily mobile layout missing');
assert(homeScript.includes("new Date().toISOString().slice(0, 10)"), 'Daily topic teaser must use UTC');
assert(homeScript.includes("readSaved('top10_state_v1')"), 'Home status must be sourced from saved real progress');
assert(homeScript.includes("readSaved('wordle_game_state_v1')"), 'Wordle status must be sourced from real state');
assert(!homepage.includes('¿Quién es actualmente el máximo goleador'), 'No floating factual claims on home');

// Verified pool selection mirrors Top 10's UTC day seed: no unverified data in the teaser.
const base = JSON.parse(read('assets/data/top10_verified_v2.json'));
const extended = [];
const norm = a => String(a).toLowerCase().replace(/ø/g, 'o').replace(/æ/g, 'ae')
  .replace(/œ/g, 'oe').replace(/ß/g, 'ss').replace(/ł/g, 'l')
  .normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z\s]/g, ' ')
  .replace(/\s+/g, ' ').trim();
const verified = base.concat(extended).filter(item => item.audit_status === 'verified_official' && item.source_url && item.verified_at &&
  Array.isArray(item.answers) && item.answers.length === 10 &&
  new Set(item.answers.map(norm)).size === 10);
assert(verified.length > 0, 'Verified daily pool must not be empty');
const utcDay = new Date().toISOString().slice(0, 10);
const seed = new Date(utcDay).getTime() / 86400000;
const today = verified[Math.floor((seed % verified.length + verified.length) % verified.length)];
assert(today.title && today.source_url.startsWith('https://'), 'Daily topic must have verified source');
assert(homeScript.includes("CTTop10Verified.pick(pool,today)"), 'Homepage must use the game\'s verified daily picker');
assert(topScript.includes('challengeDay = todayKey'), 'Top 10 needs to freeze the UTC date at round start');
assert(topScript.includes('localStorage.setItem(LAST_DAY_KEY, challengeDay)'), 'Crossing midnight must not overwrite tomorrow’s progress');

assert(wordleScript.includes('if (inputLocked || finished) return;'), 'Keyboard input must be stopped after daily completion');
assert(wordleScript.includes('if (inputLocked || finished || currentRow >= BOARD_ROWS) return;'), 'Typing must respect daily lock');
assert(!wordleScript.includes("document.addEventListener('keydown', blockAll"), 'Do not swallow a random keyboard event');
assert(wordlePage.includes('id="message" role="status" aria-live="polite"'), 'Wordle feedback must be accessible');
console.log('Crack Total experience smoke PASS — staging setup, 4.0 daily module, locked Wordle, UTC rollover');
