'use strict';
// CT7.3 regression: portraits cannot spoil a question; only approved and credited media appears after a solution.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const bank=JSON.parse(read('assets/data/career-challenge-verified.json'));
const engine=read('assets/js/ct7-games.js');
const featured=bank.records.filter(p=>Boolean(p.portrait));
assert.equal(featured.length,21,'Twenty-one individually reviewed photos must map to stable player IDs');
for(const rec of featured){
  const p=rec.portrait;
  assert(p&&p.creator&&p.caption&&['2026-10-26','2026-10-27'].includes(p.checked_at));
  assert(['CC BY-SA 3.0','CC BY-SA 2.0','CC BY-SA 4.0'].includes(p.license));
  assert.equal(p.license_url,'https://creativecommons.org/licenses/by-sa/'+(p.license.slice(-3))+'/');
  assert.match(p.source_page,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.match(p.url,/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//);
}
assert.equal(bank.records.filter(p=>p.portrait).length,21,'Only reviewed records may have a photo');
for(const page of ['quien-soy.html','adivina-carrera.html']){
  assert.equal((read(page).match(/id="answerPortrait"/g)||[]).length,1);
  assert.match(read(page),/id="answerPortrait"[^>]*hidden/);
}
assert.match(read('assets/css/ct7-games.css'),/\.ct7-player-portrait/);
assert(!/\.innerHTML\s*=|leaderboard_scopes|window\.db/.test(engine));
const fallback=bank.records.find(p=>!p.portrait);
assert(fallback,'At least one player must exercise the no-photo fallback');
class Store{
  constructor(){this.data=new Map();}
  getItem(id){return this.data.get(id)||null;}
  setItem(id,value){this.data.set(id,String(value));}
}
class El{
  constructor(id){this.id=id;this.hidden=false;this.disabled=false;this.children=[];
    this.dataset={};this.attrs={};this.style={};this.callbacks={};this.value='';this.textContent='';this.href='';}
  addEventListener(type,cb){this.callbacks[type]=cb;}
  appendChild(child){this.children.push(child);}
  append(...items){this.children.push(...items);}
  replaceChildren(){this.children=[];}
  setAttribute(k,v){this.attrs[k]=v;}
  focus(){} select(){}
  click(){const cb=this.callbacks.click;assert(cb,'No click listener: '+this.id);cb({preventDefault(){}});}
  submit(){const cb=this.callbacks.submit;assert(cb,'No submit listener');cb({preventDefault(){}});}
}
async function verifyMode(mode,group){
  const dataset={...bank,records:group};
  const elements=new Map(),localStorage=new Store(),sessionStorage=new Store();
  const document={body:{dataset:{ct7Mode:mode}},
    getElementById(id){if(!elements.has(id))elements.set(id,new El(id));return elements.get(id);},
    createElement:tag=>new El(tag)};
  const context={document,window:{},fetch:async()=>({ok:true,json:async()=>dataset}),
    localStorage,sessionStorage,Date,Math,JSON,Number,String,Object,Array,Uint32Array,
    Map,Set,Promise,Error,console};
  vm.runInNewContext(engine,context,{filename:'ct7-games.js'});
  await new Promise(done=>setImmediate(done));
  const el=id=>document.getElementById(id),seen=[];
  el('startButton').click();
  for(let i=0;i<6;i++){
    const state=JSON.parse(sessionStorage.getItem('ct7:session:'+mode+':v1'));
    const rec=dataset.records.find(p=>p.id===state.order[state.index]);
    assert(rec,'Round must be valid');
    assert.equal(el('answerPortrait').hidden,true,'Never show a portrait while guessing');
    assert.equal(el('answerPortrait').children.length,0,'No hidden portrait should preload');
    el('guessInput').value=rec.name;
    el('guessForm').submit();
    assert.equal(el('answerView').hidden,false);
    const target=el('answerPortrait');
    if(rec.portrait){
      assert.equal(target.hidden,false,'Licensed portrait visible after reveal');
      assert.equal(target.children.length,1);
      const figure=target.children[0];
      const photo=figure.children[0],credit=figure.children[1];
      assert.equal(photo.src,rec.portrait.url);
      assert.equal(photo.alt,'Fotografía de '+rec.name);
      assert(credit.children.some(link=>link.href===rec.portrait.source_page));
      assert(credit.children.some(link=>link.href===rec.portrait.license_url));
      seen.push(rec.id);
      photo.callbacks.error();
      assert.equal(target.hidden,true,'Broken image must fall back to text');
      assert.equal(target.children.length,0);
    } else {
      assert.equal(target.hidden,true,'No unlicensed placeholders or guessed portraits');
    }
    el('nextButton').click();
  }
  assert.deepEqual(seen.sort(),group.filter(p=>p.portrait).map(p=>p.id).sort());
}
(async()=>{
  const noPhoto=bank.records.filter(p=>!p.portrait);
  const groups=[];
  for(let i=0;i<featured.length;i+=5){
    const photos=featured.slice(i,i+5);
    groups.push(photos.concat(noPhoto.slice(0,6-photos.length)));
  }
  for(const group of groups){
    await verifyMode('identity',group);
    await verifyMode('career',group);
  }
  console.log('PASS CT7.5: twenty-one licensed portraits, attribution, no spoiler, missing/broken-image fallbacks');
})().catch(e=>{console.error(e);process.exitCode=1});
