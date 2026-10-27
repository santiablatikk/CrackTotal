'use strict';
// CT7.5 — reject user-submitted HTML inside legacy scoreboards.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const tbody={innerHTML:''};
const ctx={window:{},document:{getElementById:()=>tbody},console:{log(){},warn(){},error(){}},
 setTimeout(){},Date,Number,String,Math};
vm.runInNewContext(read('assets/js/ranking-helper.js'),ctx,{filename:'ranking-helper.js'});
const helper=ctx.window.rankingHelper;
assert(helper);
const attack='<img src=x onerror=alert(1)>';
helper.populateRankingTable([{playerName:attack,totalGames:7,victories:2,defeats:5,timeouts:0,
 bestScore:'<svg onload=alert(1)>',averageScore:0,winRate:25,bestAccuracy:99,averageAccuracy:50}]);
assert(!tbody.innerHTML.includes(attack),'No raw malicious player names');
assert(tbody.innerHTML.includes('&lt;img'),'Escaped nickname must be displayed');
assert(!tbody.innerHTML.includes('<svg'),'Metrics must be numeric');
helper.populateRankingTable([{playerName:attack,score:19,totalQuestions:25,accuracy:80}]);
assert(!tbody.innerHTML.includes(attack),'Legacy individual nickname must be escaped');
helper.showError(attack);assert(!tbody.innerHTML.includes(attack),'Error messages must be escaped');
helper.showEmpty(attack);assert(!tbody.innerHTML.includes(attack),'Empty state must be escaped');
const bank=JSON.parse(read('assets/data/career-challenge-verified.json'));
const portraits=bank.records.filter(p=>p.portrait);
assert.equal(bank.records.length,35);assert.equal(portraits.length,25);
const ids=new Set();
for(const r of portraits){
 assert(!ids.has(r.id),'Duplicate portrait');ids.add(r.id);
 const p=r.portrait;
 const match=/^CC BY-SA (2\.0|3\.0|4\.0)$/.exec(p.license);
 assert(match,'Unreviewed license '+r.id);
 assert.equal(p.license_url,'https://creativecommons.org/licenses/by-sa/'+match[1]+'/');
 assert.match(p.url,/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\/[A-Za-z0-9_%().-]+\.(?:jpg|JPG)\?width=480$/);
 assert.match(p.source_page,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:[A-Za-z0-9_%().-]+\.(?:jpg|JPG)$/);
 const img=decodeURIComponent(p.url.split('/Special:FilePath/')[1].split('?')[0]);
 const origin=decodeURIComponent(p.source_page.split('/File:')[1]);
 assert.equal(img,origin,'Incorrect source credit '+r.id);
 assert(p.creator&&p.caption&&/^2026-10-2[67]$/.test(p.checked_at),'Missing image attribution '+r.id);
}
const game=read('assets/js/ct7-games.js');
assert.match(game,/renderAnswerPortrait\(null\)/);
assert.doesNotMatch(game,/\.innerHTML\s*=/);
assert.equal(Object.keys(bank.club_crests).length,2);
for(const [club,item] of Object.entries(bank.club_crests)){
 assert(['Boca Juniors','River Plate'].includes(club));
 assert.equal(item.license,'PD-textlogo');
 assert.equal(item.trademark,true);
 assert.match(item.url,/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//);
 assert.match(item.source_page,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
 assert(item.usage.includes('sin afiliación'));
}
console.log('PASS CT7.5: 25 licensed portraits, 2 sourced crests, provenance, and no legacy ranking XSS');
