'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'pasala-1v1.html'), 'utf8');
const client = fs.readFileSync(path.join(root, 'assets/js/pasala-duel-client.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'assets/css/pasala-duel.css'), 'utf8');

// The arena uses zero frontend build tooling. Catch stale scripts and missing
// DOM hooks early, before a browser gets stuck at "Conectando a la arena".
assert.match(html, /pasala-duel-client\.js\?v=15/);
assert.match(html, /pasala-duel\.css\?v=20261023-compact-duel6/);
new Function(client);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML id');
const referenced = [...new Set([...client.matchAll(/\$\('([\w-]+)'\)/g)].map(match => match[1]))];
for (const id of referenced) {
  assert.ok(ids.includes(id), 'Missing arena DOM target: ' + id);
}
for (const id of ['createForm', 'joinForm', 'watchForm', 'randomButton',
  'copyInvite', 'copyCode', 'copySpectator', 'shareResult', 'rematchHint', 'streamPhase', 'streamClock', 'streamAudience', 'resultStats',
  'duelMode', 'duelModeHelp', 'otherClock', 'opponentRing', 'opponentRingSide', 'matchStage', 'turnHint',
  'turnTransition', 'turnTransitionCountdown', 'lobbyPlayers', 'lobbyPlayersList',
  'answerCorrection', 'correctionInput', 'correctButton', 'confirmAnswer']) {
  assert.ok(ids.includes(id), 'Expected arena control missing: ' + id);
}
assert.match(client, /case 'answerPending':/, 'Provisional answer must render privately');
assert.match(client, /reviseAnswer/, 'Client can submit one correction');
assert.match(styles, /\.is-rival-turn/, 'Rival-turn emphasis layout');
assert.match(client, /case 'closed':/, 'Host-close client handler');
assert.match(client, /activeSlot/, 'Turn-based mode must display authoritative active player');
assert.match(client, /mode:\$\('duelMode'\)\.value/, 'Mode must be sent to server on room creation');
assert.match(client, /function shareResultText\(/, 'Shareable result generated from server verdict');
assert.match(client, /score-meter/, 'Both players expose spoiler-free progress bars');
assert.match(client, /state\.room\?\.phase === 'finished'/, 'Final screen freezes the countdown');
assert.match(client, /copyInvite'\)\.hidden = state\.spectator/, 'Invite controls hidden for spectators');
assert.match(styles, /prefers-reduced-motion/, 'Reduced motion styles');
console.log('Arena UI smoke OK: ' + referenced.length + ' JS DOM hooks, unique IDs, stream controls and asset versions');
