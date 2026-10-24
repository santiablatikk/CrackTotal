'use strict';
/**
 * Wordle historical-integrity gate. This proves only scheduling and stable
 * identities, not each biographical football fact or live gameplay.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const pool=require('../assets/data/wordle_pool.json');
const baseline=require('../docs/audit/wordle-base-6-0-20261024.json');
const js=fs.readFileSync(path.join(root,'assets/js/wordle-futbol.js'),'utf8');
assert.equal(baseline.length,92,'Original Wordle daily schedule has 92 immutable entries');
assert(pool.length>=baseline.length,'Existing daily entries cannot disappear');
const normal=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-zñ]/g,'');
const seen=new Set();
for(const [i,entry] of pool.entries()){
  const word=normal(entry.answer);
  assert(word.length>=3&&word.length<=20,'Unsupported answer length at '+i);
  assert(!seen.has(word),'Duplicate canonical Wordle answer: '+word);
  seen.add(word);
  assert(Number.isInteger(entry.id),'Missing numeric player/coach id at '+i);
  if(i<baseline.length){
    assert.equal(entry.id,baseline[i].id,'Wordle historical id reordered at '+i);
    assert.equal(entry.answer,baseline[i].answer,'Wordle historical answer changed at '+i);
  }
}
assert.match(js,/\{ from: 0, size: 92 \}/,'Historical rotation size must be frozen');
assert.match(js,/seed % eligibleDailyPoolSize\(seed, pool\.length\)/,'Daily selection must use a pinned window');
assert.doesNotMatch(js,/seed % pool\.length/,'Expanding the pool must not rewrite historical daily choices');
for(const seed of [20240501,20261024,20261025,20271231]){
  const historicalIndex=seed%92;
  assert.equal(historicalIndex,seed%baseline.length,'Baseline scheduling drift '+seed);
}
console.log('WORDLE DAILY: PASS (92 immutable baseline answers; '+pool.length+' available; daily index remains stable until explicitly versioned)');
