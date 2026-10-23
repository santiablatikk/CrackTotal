'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
for(const rel of [
  'mi-carrera.html','assets/css/mi-carrera.css','assets/data/mi-carrera',
  'assets/images/mi-carrera','assets/js/games/mi-carrera',
  'scripts/mi_carrera_assets_smoke.cjs'
]) assert(!fs.existsSync(path.join(root,rel)),'Retired game still present: '+rel);
// Static pages, styles and frontend application resources cannot advertise or
// execute a game that the project has deliberately removed.
function walk(dir){
  if(!fs.existsSync(dir))return [];
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
    const full=path.join(dir,e.name);
    return e.isDirectory()?walk(full):e.isFile()?[full]:[];
  });
}
const pageFiles=fs.readdirSync(root,{withFileTypes:true})
  .filter(e=>e.isFile() && e.name.endsWith('.html')).map(e=>path.join(root,e.name));
const assetFiles=walk(path.join(root,'assets')).filter(p=>/\.(css|js|json)$/.test(p));
for(const file of [...pageFiles,...assetFiles]){
  const text=fs.readFileSync(file,'utf8');
  assert(!/mi[-_ ]carrera|MiCarrera/i.test(text),'Retired game reference: '+path.relative(root,file));
}
const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
assert(server.includes("pathname === '/mi-carrera.html'"),'Old career URL must redirect');
assert(server.includes("'Location': '/games.html'"),'Old career URL must not 404');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
assert(!sw.includes('/mi-carrera'),'Service worker must not precache retired game');
console.log('PASS 6.0 removal: no career engine, assets, screens or frontend references; legacy route redirects');
