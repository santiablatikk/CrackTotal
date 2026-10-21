'use strict';
/**
 * Crack Total 5.2 visual contract — static guardrails for six games.
 *
 * This is NOT a substitute for real-browser screenshot/accessibility QA.
 * It blocks regressions in stylesheet inclusion, design identity, selector
 * availability, mobile safeguards and intentional content copy.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const games = [
  ['pasalache.html','assets/css/pasalache.css','body.game-body.ct-ds .rosco-container'],
  ['pasala-1v1.html','assets/css/pasala-duel.css','.match-stage'],
  ['top10.html','assets/css/top10.css','body.top10-body .top10-ranking-panel'],
  ['wordle-futbol.html','assets/css/wordle.css','body.wordle-body .tile'],
  ['quiensabemas.html','assets/css/qsm-1v1.css','body.qsm-1v1-body .lobby-panel'],
  ['mentiroso.html','assets/css/mentiroso.css','body.mentiroso-body .lobby-card']
];

function balancedCss(file, source) {
  // Ignore CSS strings/comments when counting structural braces.
  let depth = 0, comment = false, quoted = null, escape = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (comment) {
      if (c === '*' && n === '/') { comment = false; i++; }
      continue;
    }
    if (quoted) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === quoted) quoted = null;
      continue;
    }
    if (c === '/' && n === '*') { comment = true; i++; continue; }
    if (c === '"' || c === "'") { quoted = c; continue; }
    if (c === '{') depth++;
    if (c === '}') { depth--; assert.ok(depth >= 0, file+': extra closing brace'); }
  }
  assert.equal(depth,0,file+': unbalanced CSS braces');
  assert.equal(comment,false,file+': unclosed comment');
  assert.equal(quoted,null,file+': unclosed quoted string');
}
const shell = read('assets/css/game-shell.css');
balancedCss('game-shell.css', shell);
assert.doesNotMatch(shell,/["']Oswald["']/,'Game shell must not reintroduce Oswald');
assert.doesNotMatch(shell,/rgba\(37,\s*99,\s*235/,'Blue legacy overlay should not override forest design');
assert.match(shell,/"Space Grotesk"/,'The shared game-shell headline must match 5.2');
assert.match(shell,/#b5eb53/,'Accessible lime focus outline');

for (const [html,css,selector] of games) {
  const page = read(html);
  const styles = read(css);
  balancedCss(css,styles);
  assert.ok(page.includes(css),html+': missing actual game stylesheet');
  assert.ok(styles.includes(selector),css+': missing scoped game component');
  assert.match(styles,/@media\s*\(?max-width/i,css+': missing responsive rule');
  assert.match(styles,/focus-visible|outline:/,css+': missing focus affordance');
  if (html !== 'pasala-1v1.html') {
    assert.match(page,/assets\/css\/design-system\/index\.css/,html+': missing shared design system');
    assert.match(page,/game-shell\.css\?v=20261021-premium3/,html+': game shell not refreshed');
  }
}
const responsiveCss = ['assets/css/pasalache.css','assets/css/top10.css','assets/css/wordle.css'];
for (const p of responsiveCss) assert.match(read(p),/2026|5\.2/,p+': expected 5.2 design rules');
assert.match(read('quiensabemas.html'),/seis niveles y 36 preguntas/,
  'QSM lobby must describe six levels and 36 questions, not ten');
assert.match(read('assets/js/wordle-futbol.js'),/wordLength/,
  'Wordle board must preserve dynamic sizing for variable-length answers');
assert.match(read('assets/css/pasala-duel.css'),/2026|5\.2/,
  'Standalone duel styles must stay compatible');
console.log('GAMES 5.2 VISUAL CONTRACT: PASS (six game pages, shared shell, CSS structure, focus, responsive, factual lobby copy).');
