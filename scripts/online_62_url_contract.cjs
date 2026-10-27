'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const duel=read('assets/js/pasala-duel-client.js');
const qsm=read('assets/js/quiensabemas_1v1.js');
const bluff=read('assets/js/mentiroso.js');
const start=duel.indexOf('  const STAGING='),end=duel.indexOf('  const safeCode',start);
assert(start>0&&end>start,'Duel origin contract missing');
const duet=duel.slice(start,end);
const qm=qsm.slice(0,qsm.indexOf('// --- DOM Elements ---'));
const bm=bluff.slice(0,bluff.indexOf('const MENTIROSO_EXPECTED_BANK_VERSION'));
function evaluate(code,host,search,out){
  return vm.runInNewContext(code+';'+out,{
    location:{hostname:host,search},URLSearchParams,
    window:{CRACK_TOTAL_DUEL_WS_URL:''},params:new URLSearchParams(search),
    console:{log(){}}
  });
}
const staging='wss://cracktotal-arena-staging.onrender.com';
for(const host of ['cracktotal-arena-staging.onrender.com','deploy-preview-1--zingy-haupia-53b742.netlify.app']){
  assert.equal(evaluate(duet,host,'','wsUrl'),staging);
  assert.equal(evaluate(qm,host,'','CONFIG.WEBSOCKET_URL'),staging);
  assert.equal(evaluate(bm,host,'','WEBSOCKET_URL'),staging);
}
for(const host of ['localhost','127.0.0.1','preview-other.netlify.app']){
  assert.equal(evaluate(duet,host,'','wsUrl'),'');
  assert.equal(evaluate(qm,host,'','CONFIG.WEBSOCKET_URL'),null);
  assert.equal(evaluate(bm,host,'','WEBSOCKET_URL'),null);
}
for(const host of ['cracktotal.com','www.cracktotal.com']){
  assert.equal(evaluate(duet,host,'?server=wss://example.org','wsUrl'),
    'wss://cracktotal-arena-prod.onrender.com',
    'Production host must use tested dedicated Arena, never query/staging/custom overrides');
  assert.equal(evaluate(qm,host,'?server=wss://example.org','CONFIG.WEBSOCKET_URL'),
    'wss://cracktotal-servidor.onrender.com');
  assert.equal(evaluate(bm,host,'?server=wss://example.org','WEBSOCKET_URL'),
    'wss://cracktotal-servidor.onrender.com');
}
assert.equal(evaluate(duet,'localhost','?server=wss://localhost.example','wsUrl'),'wss://localhost.example');
// Opening a socket must not enable matchmaking: require exact Arena handshake.
const openIndex=duel.indexOf('    ws.onopen = () => {');
const messageIndex=duel.indexOf('    ws.onmessage = event => {',openIndex);
assert(openIndex>0&&messageIndex>openIndex,'Duel open/message handler missing');
assert(!duel.slice(openIndex,messageIndex).includes('state.connected = true'),
  'Never expose online play before protocol and feature negotiation');
assert.match(duel,/message\.type === 'arena:hello'/);
assert.match(duel,/message\.payload\?\.protocol !== 'cracktotal-arena-5\.2'/);
assert.match(duel,/message\.payload\?\.features\?\.pasalaDuel !== true/);
assert.match(duel,/if \(!state\.connected \|\| typeof message\.type/);
assert.match(duel,/incompatible = true/);
assert.match(duel,/if \(!incompatible && !state\.manualLeave/);
console.log('PASS 6.2: production/staging WebSocket routing is deliberate and isolated');
