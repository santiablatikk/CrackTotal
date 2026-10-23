'use strict';
// Release-candidate structural guard. Not a substitute for live Render/browser QA.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
// Release 6.0 deliberately restores Mi Carrera; previous retirement assertions
// would silently keep the actual simulation unavailable.
const restored=[
 'mi-carrera.html',
 'assets/css/mi-carrera.css',
 'assets/data/mi-carrera/clubs.json',
 'assets/js/games/mi-carrera/ui/app.js',
 'assets/images/mi-carrera'
];
for(const item of restored)assert(fs.existsSync(path.join(ROOT,item)),'Restored game missing: '+item);
for(const page of ['index.html','games.html']){
 assert(read(page).includes('href="mi-carrera.html"'),page+' must link restored career game');
}
for(const page of ['index.html','games.html','pasalache.html','top10.html',
 'wordle-futbol.html','quiensabemas.html','mentiroso.html','profile.html',
 'ranking.html','logros.html','blog.html']){
 assert(read(page).includes('design-system/index.css'),page+' missing shared design system');
}
const arena=read('pasala-1v1.html');
assert(arena.includes('pasala-duel.css'),'Arena must load dedicated CSS');
const server=read('server.js');
assert(server.includes("pathname === '/mi-carrera'"),'Legacy career bookmark must resolve to restored page');
assert(!server.includes("pathname === '/mi-carrera.html' || pathname === '/mi-carrera'"),'Career must not redirect to catalog');

assert(server.includes("pathname === '/__ct_release/health'"),'Release identity health endpoint must exist');
assert(server.includes('RENDER_GIT_COMMIT'),'Release health must report Render-provided commit');
assert(server.includes('RENDER_GIT_BRANCH'),'Release health must report Render-provided branch');
assert(server.includes("'Cache-Control': 'no-store, no-cache, must-revalidate'"),'Release health cannot be cached');
require('node:vm').runInNewContext('new Function('+JSON.stringify(server)+')');

const sw=read('sw.js');
assert(sw.includes("APP_VERSION = '6.0.0'"),'Service worker cache generation must be bumped');
const workflows=fs.readdirSync(path.join(ROOT,'.github/workflows'));
assert(workflows.includes('deploy.yml')&&!workflows.includes('promote-mi-carrera.yml'));
const deploy=read('.github/workflows/deploy.yml');
assert(deploy.includes('npm ci')&&deploy.includes('npm test'),'Production build must run tests');
assert(deploy.includes('RENDER_DEPLOY_HOOK'),'Production is deployed through Render');
assert(deploy.includes('[prod-4] Confirm exact production commit'),'Production workflow must verify actual live deployment');
assert(deploy.includes('github.sha')&&deploy.includes('.commit == $sha'),'Production verification must compare exact commit SHA');
assert(deploy.includes('cracktotal.com/__ct_release.json'),'Verify the static canonical domain');
assert(deploy.includes('cracktotal-static'),'Production verifier must target Render Static Site');
const releaseWriter=read('scripts/write_release_manifest.js');
assert(releaseWriter.includes('RENDER_GIT_COMMIT')&&releaseWriter.includes('RENDER_GIT_BRANCH'),'Static release manifest must report Render identity');
assert(releaseWriter.includes('__ct_release.json'),'Static build must write identity file');
const buildPkg=JSON.parse(read('package.json'));
assert(buildPkg.scripts.build.includes('write_release_manifest.js'),'Render build must emit release manifest');
assert(deploy.includes('exit 1'),'Missing live release must fail closed');

const builder=read('scripts/build-netlify-preview.cjs');
assert(builder.includes('fs.rmSync(out'),'Preview output must be cleaned before rebuilding');
assert(builder.includes('Restored Mi Carrera game or dependencies missing from preview'),'Preview must carry complete career game');
const pkg=JSON.parse(read('package.json'));
assert(pkg.scripts.test.includes('mi_carrera_assets_smoke.cjs'),'Career game integrity must be in CI');
console.log('Crack Total 6.0 release smoke PASS — restored career, updated SW, GitHub/Render release guards');
