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

assert(server.includes("pathname === '/__ct_release/health'"),'Release identity health endpoint must exist');
assert(server.includes('RENDER_GIT_COMMIT'),'Release health must report Render-provided commit');
assert(server.includes('RENDER_GIT_BRANCH'),'Release health must report Render-provided branch');
assert(server.includes("'Cache-Control': 'no-store, no-cache, must-revalidate'"),'Release health cannot be cached');
require('node:vm').runInNewContext('new Function('+JSON.stringify(server)+')');

const sw=read('sw.js');
assert(/const VERSION='ct\\d+-\\d{8}-offline-\\d+';/.test(sw),'SW must use a distinct versioned offline cache');
assert(sw.includes('const CACHE=PREFIX+VERSION'),'Offline cache must use the release version');
assert(sw.includes("if(!PATHS.has(path))return"),'SW must explicitly exclude personalized/online requests');
assert(sw.includes("if(request.method!=='GET')return"),'SW must never cache state-changing HTTP calls');
assert(!sw.includes("DYNAMIC_CACHE_NAME")&&!sw.includes("API_CACHE_NAME"),'Overbroad legacy API caches must be retired');
const workflows=fs.readdirSync(path.join(ROOT,'.github/workflows'));
assert(workflows.includes('deploy.yml')&&!workflows.includes('promote-mi-carrera.yml'));
const deploy=read('.github/workflows/deploy.yml');
assert(deploy.includes('npm ci')&&deploy.includes('npm test'),'Production build must run tests');
assert(deploy.includes('No webhook is invoked'),'Production must use Render auto-deploy without a duplicate hook');
assert(deploy.includes('[prod-4] Confirm exact production commit'),'Production workflow must verify actual live deployment');
assert(deploy.includes('github.sha')&&deploy.includes('.commit == $sha'),'Production verification must compare exact commit SHA');
assert(deploy.includes('EXPECTED_VERSION')&&deploy.includes('.version == $version'),'Production release version must match package version');
assert(deploy.includes('cracktotal.com/__ct_release.json'),'Verify the static canonical domain');
assert(deploy.includes('cracktotal-static'),'Production verifier must target Render Static Site');
const releaseWriter=read('scripts/write_release_manifest.js');
assert(releaseWriter.includes('RENDER_GIT_COMMIT')&&releaseWriter.includes('RENDER_GIT_BRANCH'),'Static release manifest must report Render identity');
assert(releaseWriter.includes('__ct_release.json'),'Static build must write identity file');
assert(releaseWriter.includes("require('../package.json').version"),'Release version must derive from package.json');
const buildPkg=JSON.parse(read('package.json'));
assert(buildPkg.scripts.build.includes('write_release_manifest.js'),'Render build must emit release manifest');
assert(deploy.includes('exit 1'),'Missing live release must fail closed');
assert(deploy.includes('www.cracktotal.com/__ct_release.json'),'Production validation must also check www domain');
assert(deploy.includes('mentiroso.html')&&deploy.includes('wordle-futbol.html'),'Production must smoke-test active game URLs');

const builder=read('scripts/build-netlify-preview.cjs');
assert(builder.includes('fs.rmSync(out'),'Preview output must be cleaned before rebuilding');
assert(builder.includes("mi-carrera.html"),'Preview must reject retired pages');
const pkg=JSON.parse(read('package.json'));
assert(pkg.scripts.test.includes('no_career_smoke.cjs'),'Removed career guard must be in release CI');
console.log('Crack Total 6.0 removed-game cleanup smoke PASS — retired game removed, no page references, SW upgraded, GitHub/Render release guards');
