'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const normalize = x => String(x ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
let found = 0, eligible = 0, quarantined = 0, verified = 0;
const categories = ['A', 'B', 'C', 'D'];
for (let level = 1; level <= 6; level++) {
  const file = path.join(__dirname, '../assets/data', 'level_' + level + '.json');
  const questions = JSON.parse(fs.readFileSync(file, 'utf8')).preguntas;
  assert.ok(Array.isArray(questions) && questions.length > 0, 'Empty QSM level ' + level);
  for (const [i, q] of questions.entries()) {
    found++;
    assert.ok(typeof q.pregunta === 'string' && q.pregunta.trim(), 'Invalid question '+ level+'/'+i);
    assert.ok(categories.every(k => typeof q.opciones?.[k] === 'string'), 'Missing option '+level+'/'+i);
    assert.ok(categories.includes(q.respuesta_correcta), 'Invalid answer key '+level+'/'+i);
    const choices = categories.map(k => normalize(q.opciones[k]));
    assert.ok(choices.every(Boolean), 'Empty option '+level+'/'+i);
    assert.strictEqual(new Set(choices).size, 4, 'Equivalent distractors '+level+'/'+i);
    const correct = q.opciones[q.respuesta_correcta];
    if (q.respuesta) assert.strictEqual(normalize(q.respuesta), normalize(correct), 'Divergent canonical answer '+level+'/'+i);
    if (['retired','ambiguous','pending'].includes(q.audit_status)) {
      quarantined++; continue;
    }
    eligible++;
    if (q.audit_status === 'verified_official') {
      verified++;
      assert.ok(/^https:\/\//.test(q.source_url || ''), 'Official verification without URL '+level+'/'+i);
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(q.verified_at || ''), 'Verification without date '+level+'/'+i);
    }
  }
}
assert.strictEqual(found, 375);
assert.strictEqual(quarantined, 1);
assert.strictEqual(eligible, 374);
console.log('QSM BANK: PASS ('+found+' entries; '+eligible+' structurally eligible; '+quarantined+' explicitly quarantined; '+verified+' marked with cited sources). Structural checks DO NOT attest individual factual accuracy.');
