'use strict';
// Structural quality gate; never equate passing with independent football verification.
const assert=require('node:assert/strict');
const bank=require('../assets/data/pasalache_2025.json');
const registry=require('../docs/audit/content-61-ledger.json');
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,' ').replace(/\s+/g,' ').trim();
let added=0;const seen=new Set();
assert.equal(bank.length,26,'26 Pasala letter groups required');
for(const group of bank){
  for(const q of group.preguntas){
    const k=normalize(q.pregunta);assert(k&&!seen.has(k),'Duplicate Pasala question '+q.pregunta);seen.add(k);
    const answer=normalize(q.respuesta),letter=normalize(group.letra);
    assert((/^contiene/i).test(q.pregunta)?answer.includes(letter):answer.startsWith(letter),'Wrong rosco letter '+q.pregunta);
    if(q.content_batch==='ct-6.1-official-batch-01'){
      added++;
      assert.equal(q.audit_status,'verified_official','Newly reviewed question requires audit status');
      assert.match(q.source_url||'',/^https:\/\/(www\.)?(fifa\.com|uefa\.com)\//,'Official source URL required');
      assert.equal(q.verified_at,'2026-10-24','New content needs an explicit review date');
    }
  }
}
assert(added>=24,'The sourced content expansion must be preserved');
assert(registry.records.some(r=>r.file==='assets/data/preguntas_combinadas.json'&&r.status==='pending_factual_review'),'Legacy bank must not be auto-certified');
assert(registry.records.some(r=>r.file==='assets/data/level_1.json'&&r.status==='pending_factual_review'),'QSM factual review still pending');
console.log('CONTENT 6.1: PASS ('+added+' new sourced Pasala questions; '+registry.records.length+' inventoried records).');
console.log('This verifies structure and provenance fields, not each historical football assertion.');
