'use strict';
// Release-candidate structural guard. Not a substitute for live Render/browser QA.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const removed=[
 'mi-carrera.html',
 'assets/css/mi-carrera.css',
 'assets/data/mi-carrera',
 'assets/js/games/mi-carrera',
 'assets/images/mi-carrera',
 '.github/workflows/promote-mi-carrera.yml',
 'scripts/run_mi_carrera_smokes.js'
];
for(const x of removed)assert(!fs.existsSync(path.join(ROOT,x)),'Retired file still present: '+x);
const pages=['index.html','games.html','pasalache.html','top10.html',
 'wordle-futbol.html','quiensabemas.html','mentiroso.html','profile.html',
 'ranking.html','logros.html','blog.html'];
for(const p of pages){
 const html=read(p);
 assert(!/mi-carrera(?:\.html|\.css|\/)/i.test(html),p+' must not reference retired game');
 assert(html.includes('design-system/index.css'),p+' missing shared design system');
}
const arena=read('pasala-1v1.html');
assert(arena.includes('pasala-duel.css'),'Standalone Arena must load its own independent design system');
assert(!arena.includes('mi-carrera'),'Standalone Arena must not reference retired game');
const server=read('server.js');
assert(server.includes("pathname === '/mi-carrera.html'"),'Old URL must redirect on production');
assert(server.includes("'Location': '/games.html'"),'Retired game must redirect to current game catalog');
const sw=read('sw.js');
assert(sw.includes("APP_VERSION = '5.1.0'"),'Service worker cache generation must be bumped');
const workflows=fs.readdirSync(path.join(ROOT,'.github/workflows'));
assert(workflows.includes('deploy.yml')&&!workflows.includes('promote-mi-carrera.yml'));
const deploy=read('.github/workflows/deploy.yml');
assert(deploy.includes('npm ci')&&deploy.includes('npm test'),'Production build must run tests');
assert(deploy.includes('RENDER_DEPLOY_HOOK'),'Production is deployed through Render');
const builder=read('scripts/build-netlify-preview.cjs');
assert(builder.includes('fs.rmSync(out'),'Preview output must be cleaned before rebuilding');
assert(builder.includes("mi-carrera.html"),'Preview must reject retired pages');
const pkg=JSON.parse(read('package.json'));
assert(!pkg.scripts.test.includes('mi_carrera'),'Obsolete tests cannot be part of release CI');
console.log('Crack Total 5.1 cleanup smoke PASS — retired game removed, no page references, SW upgraded, GitHub/Render release guards');
