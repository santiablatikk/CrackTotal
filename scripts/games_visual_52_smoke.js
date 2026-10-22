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

function balancedHtml(file, rawHtml) {
  const html = rawHtml.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'');
  const voidTags = new Set([
    'area','base','br','col','embed','hr','img','input',
    'link','meta','param','source','track','wbr'
  ]);
  const stack = [];
  const tags = /<\/?([a-z][\w:-]*)(?:\s[^<>]*?)?\s*\/?>/gi;
  let match;
  while ((match = tags.exec(html)) !== null) {
    const name = match[1].toLowerCase();
    if (voidTags.has(name)) continue;
    if (match[0].startsWith('</')) {
      assert.equal(stack.pop(), name,
        file+': mismatched closing tag </'+name+'>');
    } else if (!match[0].endsWith('/>')) {
      stack.push(name);
    }
  }
  assert.deepEqual(stack, [], file+': unclosed game HTML elements');
}

const shell = read('assets/css/game-shell.css');
balancedCss('game-shell.css', shell);
assert.doesNotMatch(shell,/["']Oswald["']/,'Game shell must not reintroduce Oswald');
assert.doesNotMatch(shell,/rgba\(37,\s*99,\s*235/,'Blue legacy overlay should not override forest design');
assert.match(shell,/"Space Grotesk"/,'The shared game-shell headline must match 5.2');
assert.match(shell,/#b5eb53/,'Accessible lime focus outline');
assert.match(shell,/--ct-shell-container:\s*1180px/,'Game pages need a shared container token');
assert.match(shell,/--ct-shell-focus:\s*3px solid/,'All games must share the focus ring');
assert.match(shell,/body\.ct-ds :is\(main, article, section, form, nav\)/,
  'Protect compact game forms and card overflow in every game');

for (const [html,css,selector] of games) {
  const page = read(html);
  const styles = read(css);
  balancedHtml(html,page);
  balancedCss(css,styles);
  assert.ok(page.includes(css),html+': missing actual game stylesheet');
  assert.ok(styles.includes(selector),css+': missing scoped game component');
  assert.match(styles,/@media\s*\(?max-width/i,css+': missing responsive rule');
  assert.match(styles,/focus-visible|outline:/,css+': missing focus affordance');
  if (html !== 'pasala-1v1.html') {
    assert.match(page,/assets\/css\/design-system\/index\.css/,html+': missing shared design system');
    assert.match(page,/game-shell\.css\?v=20261021-premium4/,html+': game shell not refreshed');
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

const qsmPage = read('quiensabemas.html');
const qsmStyles = read('assets/css/qsm-1v1.css');
assert.equal((qsmPage.match(/class="ct-quiz-stage"/g)||[]).length,1,
  'QSM must have one editorial stage, never duplicated question layouts');
assert.match(qsmStyles,/\.ct-quiz-stage\s*\{[\s\S]*?grid-template-columns:/,
  'Quiz question/options stage must have a deliberate desktop composition');
assert.match(qsmStyles,/@media\s*\(max-width:1020px\)/,
  'Quiz must stack the match stage on tablets');
const bluffPage = read('mentiroso.html');
const bluffStyles = read('assets/css/mentiroso.css');
assert.equal((bluffPage.match(/class="ct-bluff-stage"/g)||[]).length,1);
assert.match(bluffStyles,/\.ct-bluff-stage\s*\{[\s\S]*?grid-template-columns:/,
  'Mentiroso needs a dedicated challenge/decision grid');
assert.match(bluffStyles,/@media\(max-width:1020px\)/,
  'Mentiroso must stack the match stage on tablets');
assert.match(read('wordle-futbol.html'),/class="ct-wordle-ledger"/,
  'Wordle streak and countdown belong in one game-status ledger');
assert.match(read('assets/css/wordle.css'),/\.ct-wordle-ledger\s*\{/,
  'Wordle status ledger must be laid out in CSS, not inline');
assert.match(read('assets/css/top10.css'),/\.top10-hero-copy\{display:grid/,
  'Top10 must have an editorial header, not a row of squeezed content');
for(const page of ['pasalache.html','wordle-futbol.html',
                   'quiensabemas.html','mentiroso.html']) {
  assert.match(read(page),/class="ct-game-eyebrow"/,
    page+': must carry Crack Total 5.2 identity');
}

// Responsive layout guards; these do not constitute browser screenshot QA.
assert.ok(read('assets/css/pasala-duel.css').includes('container-type:inline-size'),
  'Ring size must drive duel letter positions');
assert.ok(!/translateY\\(-(?:146|83|132)px\\)/.test(read('assets/css/pasala-duel.css')),
  'Previous fixed-turn orbit radii must be removed');
assert.ok(read('assets/css/pasala-duel.css').includes('42cqw'),
  'Duel orbital radius must scale with its actual circle');
assert.ok(read('assets/css/mentiroso.css').includes('min-height:clamp(240px,40dvh,400px)'),
  'Bluff listing must support long answer lists');
assert.ok(read('assets/css/qsm-1v1.css').includes('max-width:720px'),
  'QSM answers must stack early enough for narrow touchscreens');
assert.ok(read('assets/js/wordle-futbol.js').includes('boardResizeObserver'),
  'Wordle board must recompute size on responsive container changes');
assert.ok(read('assets/js/wordle-futbol.js').includes('card.clientWidth'),
  'Wordle must measure the actual card instead of assuming the viewport width');
assert.ok(read('assets/css/wordle.css').includes('place-content:center'),
  'Variable-length Wordle board stays centered');
console.log('GAMES 5.2 VISUAL CONTRACT: PASS (six game pages, shared shell, HTML nesting, premium match composition, CSS structure, focus and responsive).');
