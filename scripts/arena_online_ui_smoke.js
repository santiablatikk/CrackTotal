'use strict';
// Guards connection setup of QSM and Mentiroso online from accidentally
// falling back to production or using an incompatible 5.2 staging protocol.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const server = read('server.js');
const qsm = read('assets/js/quiensabemas_1v1.js');
const mentiroso = read('assets/js/mentiroso.js');
for (const [file, code] of [['server.js',server],
  ['assets/js/quiensabemas_1v1.js',qsm],
  ['assets/js/mentiroso.js',mentiroso]]) {
  assert.doesNotThrow(()=>new Function(code),file+' must compile');
}
assert.match(server,/arena:hello/);
assert.match(server,/cracktotal-arena-5\.2/);
assert.match(server,/qsmResume: LEGACY_SESSION_RECOVERY/);
assert.match(server,/mentirosoObjective: OBJECTIVE_MENTIROSO/);
assert.match(server,/case 'resumeRoom':/);
assert.match(server,/case 'timeOut':/);
assert.match(server,/function armQsmQuestionClock\(/);
assert.match(server,/room\.questionResolved = true/);
assert.match(server,/CT_STAGING === 'true'/);
assert.match(server,/CT_OBJECTIVE_MENTIROSO === 'true'/);
for (const [label,source,feature] of [
  ['QSM',qsm,/features\?\.qsmResume === true/],
  ['Mentiroso',mentiroso,/features\?\.mentirosoObjective === true/]
]) {
  assert.match(source,/cracktotal-arena-staging\.onrender\.com/, label+' preview staging endpoint');
  assert.match(source,/deploy-preview-1--zingy-haupia-53b742\.netlify\.app/,label+' exact staging preview');
  assert.match(source,/case 'arena:hello':/,label+' protocol handshake');
  assert.match(source,feature,label+' incompatible server must block matchmaking');
  assert.match(source,/sendToServer\('resumeRoom',/,label+' secure recovery');
  assert.match(source,/case 'roomResumed':/,label+' state restoration');
  assert.match(source,/case 'resumeError':/,label+' gracefully expired room');
  assert.match(source,/case 'opponentDisconnected':/,label+' pause state');
}
const qsmHtml = read('quiensabemas.html');
const mentirosoHtml = read('mentiroso.html');
assert.match(qsmHtml,/quiensabemas_1v1\.js\?v=20261021-arena52/);
assert.match(mentirosoHtml,/mentiroso\.js\?v=20261021-arena52/);
assert.match(mentirosoHtml,/mentiroso\.css\?v=20261021-arena52/);
assert.match(mentirosoHtml,/id="bidUniverseHint"/);
assert.match(mentirosoHtml,/id="answerCounter"/);

const mapperStart = qsm.indexOf('function qsmPlayersById(players) {');
const mapperEnd = qsm.indexOf('\n// --- Initialization ---', mapperStart);
assert.ok(mapperStart >= 0 && mapperEnd > mapperStart, 'QSM player-normalization helper missing');
const normalizePlayers = new Function(qsm.slice(mapperStart, mapperEnd) +
    '\nreturn qsmPlayersById;')();
const p1 = {id:'player-abc',name:'Titular',score:3};
const p2 = {id:'player-def',name:'Invitado',score:2};
for (const shape of [
  { player1:p1, player2:p2 },
  { [p1.id]:p1, [p2.id]:p2 },
  [p1,p2]
]) {
  const mapped = normalizePlayers(shape);
  assert.deepEqual(Object.keys(mapped),[p1.id,p2.id]);
  assert.equal(mapped[p1.id].score,3);
  assert.equal(mapped[p2.id].name,'Invitado');
}
assert.deepEqual(normalizePlayers(null), {});
assert.match(qsm,/gameState\.players = qsmPlayersById\(payload\.players\);/,
  'QSM incoming messages must normalize live server player lists');
const mentirosoCss = read('assets/css/mentiroso.css');
assert.doesNotMatch(mentirosoHtml, /Crack Total 4\.3 · Mentiroso/,
  'Legacy page-specific CSS must no longer live inline');
assert.match(mentirosoCss, /Crack Total 5\.2: single source of truth for Mentiroso/,
  'Canonical Mentiroso stylesheet must contain the visual corrections');
assert.match(mentirosoCss,/\.lobby-card \.form-group label\s*\{[^}]*color:\s*#eaf2e8/s,
  'Lobby form labels need readable contrast');
assert.ok(mentirosoHtml.indexOf('assets/css/mentiroso.css') >
  mentirosoHtml.indexOf('assets/css/game-shell.css'),
  'Game-specific CSS must follow the shared game shell');

const qsmCss = read('assets/css/qsm-1v1.css');
assert.match(qsmHtml,/qsm-1v1\.css\?v=20261021-arena52/,
  'QSM should load its canonical game-specific stylesheet');
assert.ok(qsmHtml.indexOf('assets/css/qsm-1v1.css') >
  qsmHtml.indexOf('assets/css/game-shell.css'),
  'QSM stylesheet should override the shared shell');
assert.doesNotMatch(qsmHtml,/Crack Total 4\.3 · Quién Sabe Más/,
  'The old inline QSM visual system should be consolidated');
assert.match(qsmCss,/Crack Total 5\.2 — QSM \/ shared Arena visual language/,
  'QSM must carry the 5.2 Arena visual language');
assert.match(qsmCss,/\.form-group label\s*\{[^}]*color:#eaf2e8/s,
  'QSM form labels must remain readable');
console.log('ARENA 5.2 CLIENT INTEGRITY: PASS — protocol handshake, isolated staging, recovery and asset versions.');
