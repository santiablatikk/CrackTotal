'use strict';
// Structural regression gate. Browser screenshot and gameplay tests remain separate.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('wordle-futbol.html');
const css=read('assets/css/wordle.css');
const shared=read('assets/css/game-experience-2.css');
const js=read('assets/js/wordle-futbol.js');
const pos=part=>html.indexOf(part);
assert.ok(pos('game-shell.css')<pos('wordle.css?v=20261023-layout6'),'Wordle CSS must load after shared shell');
assert.match(html,/class="wordle-playfield"/);
assert.match(html,/id="board"/);
assert.match(html,/class="keyboard"/);
assert.match(css,/\.wordle-playfield\s*\{/);
assert.match(css,/\.wordle-playfield \.board\s*\{/);
assert.match(css,/place-content:center/);
assert.match(css,/width:min\(100%,570px\)/);
assert(!/body\.wordle-body\.ct-ds \.board/.test(shared),'Shared CSS must not override Wordle board');
assert(!/body\.wordle-body\.ct-ds \.wordle-card/.test(shared),'Shared CSS must not override Wordle card');
assert.match(js,/boardEl\.closest\('\.wordle-playfield'\)/);
assert.match(js,/boardResizeObserver\.observe\(playfield\)/);
assert.match(js,/wordLength/);
assert.match(js,/restoreGame\(\)/);
console.log('PASS Wordle 6.0 layout structure: one responsive playfield, isolated CSS, dynamic tiles and daily persistence hooks');

assert.match(js,/revealFinishDelayMs = 90 \* Math\.max\(0, guessArr\.length - 1\) \+ 470/,
  'Wordle outcome modal should wait until all tiles have visibly revealed their rating');
assert.match(js,/setTimeout\(\(\) => openResultModal\(false\), revealFinishDelayMs\)/,
  'Wordle defeat must retain a visible final row before opening the result');
assert.match(js,/openResultModal\(true\);\s*\}, revealFinishDelayMs\)/,
  'Wordle victory must reveal all correct tiles before showing the result');
