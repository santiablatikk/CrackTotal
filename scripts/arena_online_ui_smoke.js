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
assert.match(server,/contentVersions: \{ mentiroso: objectiveMentiroso\.catalog\.version \}/);
assert.match(mentiroso,/contentVersions\?\.mentiroso === MENTIROSO_EXPECTED_BANK_VERSION/);
assert.match(server,/case 'resumeRoom':/);
assert.match(server,/case 'timeOut':/);
assert.match(server,/function armQsmQuestionClock\(/);
assert.match(server,/state\.phaseDeadline - Date\.now\(\)/,
  'Mentiroso objective timer must use server deadline rather than interval counts');
assert.match(server,/room\.questionResolved = true/);
assert.match(server,/payload\.questionId !== room\.questionToken/,
  'Backend must reject packets belonging to a previous QSM question');
assert.match(qsm,/questionId: gameState\.questionId/,
  'QSM client must attach the server-issued question ID to answers');
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
assert.match(qsmHtml,/quiensabemas_1v1\.js\?v=20261023-real-options6/);
assert.match(mentirosoHtml,/mentiroso\.js\?v=20261023-validation6/);
assert.match(mentirosoHtml,/mentiroso\.css\?v=20261023-validation6/);
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
assert.match(qsmHtml,/qsm-1v1\.css\?v=20261023-real-options6/,
  'QSM should load its canonical game-specific stylesheet');
assert.ok(qsmHtml.indexOf('<link rel="stylesheet" href="assets/css/qsm-1v1.css') >
  qsmHtml.indexOf('<link rel="stylesheet" href="assets/css/game-shell.css'),
  'QSM stylesheet should override the shared shell');
assert.doesNotMatch(qsmHtml,/Crack Total 4\.3 · Quién Sabe Más/,
  'The old inline QSM visual system should be consolidated');
assert.match(qsmCss,/Crack Total 5\.2 — QSM \/ shared Arena visual language/,
  'QSM must carry the 5.2 Arena visual language');
assert.match(qsmCss,/\.form-group label\s*\{[^}]*color:#eaf2e8/s,
  'QSM form labels must remain readable');
console.log('ARENA 5.2 CLIENT INTEGRITY: PASS — protocol handshake, isolated staging, recovery and asset versions.');

// 6.1: execute only the standalone URL configuration, with synthetic location
// values. This is a routing contract, not evidence of deployed WebSocket health.
const vm=require('node:vm');
const qsmConfig=qsm.slice(0,qsm.indexOf('// --- DOM Elements ---'));
const mentirosoConfig=mentiroso.slice(0,mentiroso.indexOf('const MENTIROSO_EXPECTED_BANK_VERSION'));
assert(qsmConfig.includes('QSM_ARENA_HOST')&&mentirosoConfig.includes('MENTIROSO_ARENA_HOST'),
  'Staging Render must not silently route to legacy production online service');
function endpoint(code,host,search,resultExpression){
  const sandbox={location:{hostname:host,search},URLSearchParams,console:{log(){}}};
  return vm.runInNewContext(code+';'+resultExpression,sandbox,{timeout:1000});
}
const previewHost='deploy-preview-1--zingy-haupia-53b742.netlify.app';
const renderHost='cracktotal-arena-staging.onrender.com';
for(const [title,code,accessor] of [
 ['QSM',qsmConfig,'CONFIG.WEBSOCKET_URL'],
 ['Mentiroso',mentirosoConfig,'WEBSOCKET_URL']
]){
  for(const host of [renderHost,previewHost]){
    assert.equal(endpoint(code,host,'',accessor),'wss://cracktotal-arena-staging.onrender.com',
      title+' must route the exact approved preview to Arena staging');
  }
  for(const host of ['localhost','127.0.0.1','other-preview.netlify.app']){
    assert.equal(endpoint(code,host,'',accessor),null,
      title+' development/unknown preview must not access production');
  }
  for(const host of ['www.cracktotal.com','cracktotal.com','cracktotal-pz9u.onrender.com']){
    assert.equal(endpoint(code,host,'',accessor),'wss://cracktotal-servidor.onrender.com',
      title+' production endpoint may not be silently changed');
    assert.equal(endpoint(code,host,'?server=wss://attacker.invalid',accessor),
      'wss://cracktotal-servidor.onrender.com',
      title+' production must ignore preview-only override');
  }
  assert.equal(endpoint(code,'localhost','?server=wss://localhost.invalid',accessor),
    'wss://localhost.invalid',title+' staging override must be explicit and secure');
  assert.equal(endpoint(code,'localhost','?server=ws://localhost.invalid',accessor),null,
    title+' insecure ws override must not be allowed');
}
assert.match(server,/configured\.push\('https:\/\/cracktotal-arena-staging\.onrender\.com'\)/,
  'Staging same-origin browser must be explicitly allowed by its WebSocket server');
console.log('ARENA 6.1 ENDPOINT ROUTING: PASS — production isolated from Render staging, Netlify previews and localhost.');
