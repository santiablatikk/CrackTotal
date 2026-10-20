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
console.log('ARENA 5.2 CLIENT INTEGRITY: PASS — protocol handshake, isolated staging, recovery and asset versions.');
