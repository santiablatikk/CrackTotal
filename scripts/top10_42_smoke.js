'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const core=require('../assets/js/top10-verified.js');
const pool=JSON.parse(read('assets/data/top10_verified_v2.json'));
const old=JSON.parse(read('assets/data/top10_pool.json'));
const legacy=JSON.parse(read('assets/data/top10_pool_extended.json'));
assert.equal(old.length+legacy.length,38,'38 in-scope legacy topics remain; one women’s football topic is retired and retained in Git history');
assert.equal(pool.length,4,'The immutable version-2 rotation must not be modified in place');
assert(pool.every(core.validate),'Only source-backed, structurally valid topics allowed');
assert.equal(new Set(pool.map(x=>x.id)).size,pool.length,'IDs unique');
const official={
'ct-top10-bl-2024-25-final':[82,69,60,57,55,52,51,51,50,45],
'ct-top10-bl-2023-24-final':[90,73,72,65,63,47,46,42,42,42],
'ct-top10-bl-2022-23-final':[71,71,66,62,59,50,50,49,46,43],
'ct-top10-pl-2024-25-final':[84,74,71,69,66,66,65,61,56,56]
};
for(const topic of pool){
 assert.equal(topic.answers.length,10);
 assert.deepEqual(topic.metric_values,official[topic.id],topic.id+' official points/order');
 assert.equal(topic.audit_status,'verified_official');
 assert.match(topic.source_url,/^https:\/\/(www\.)?(bundesliga|premierleague)\.com/);
 assert.match(topic.verified_at,/^2026-10-20$/);
 assert(topic.rank_rule.includes('Orden oficial'));
 for(let i=0;i<10;i++){
   assert.equal(core.match(topic,topic.answers[i]),i);
   assert.equal(core.match(topic,topic.answers[i].toUpperCase()),i);
 }
 for(const [answer,aliases] of Object.entries(topic.aliases)){
   for(const alias of aliases)assert.equal(core.match(topic,alias),topic.answers.indexOf(answer),'Alias matches only intended club');
 }
 assert.equal(core.match(topic,'Barcelona'),undefined,'Do not auto-guess unlisted names');
 assert.equal(core.match(topic,''),undefined);
 assert.equal(core.match(topic,'Madr'),undefined);
}
assert.equal(core.match(pool[0],'Bayern Munich'),0);
assert.equal(core.match(pool[3],'Man City'),2);
const date='2026-10-20';
const chosen=core.pick(pool,date);
assert.equal(chosen.id,core.pick(pool,date).id);
assert.notEqual(core.pick(pool,date).id,core.pick(pool,'2026-10-21').id);
assert(!core.validate({...pool[0],audit_status:'editorial_choice'}),'Subjective topics are not eligible');
// Factual verification is tracked separately: schema validation cannot confirm the source itself.
const game=read('assets/js/top10.js'),home=read('assets/js/home.js');
assert(game.includes('top10_verified_v2.json'));
assert(home.includes('top10_verified_v2.json'));
assert(game.includes('verifiedCore.pick(pool,todayKey)'));
assert(home.includes('CTTop10Verified.pick(pool,today)'));
assert(game.includes('verifiedCore.match(topic,value)'));
assert(game.includes('startTime=Date.now()')&&game.includes('startOverlay'));
assert(read('top10.html').includes('top10-verified.js'));
assert(read('index.html').includes('top10-verified.js'));
assert(read('games.html').includes('top10-verified.js'));
assert(read('index.html').includes('ct42-daily-ranks'));
assert.equal((read('index.html').match(/ct42-daily-ranks[\s\S]*?<\/div>/)||[])[0].match(/<span>/g)?.length,10);
console.log('Top 10 4.2 content and mechanics smoke PASS: 4 official tables / 40 positions; aliases; shared UTC picker; 38 in-scope legacy topics preserved');
