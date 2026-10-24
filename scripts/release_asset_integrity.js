'use strict';
// Validate direct local HTML/CSS references before release; no external dependencies.
// This does not prove that dynamically constructed JavaScript routes exist.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const targetExt=/\.(?:html?|css|m?js|json|webp|jpe?g|png|gif|svg|ico|woff2?|xml|txt|webmanifest)$/i;
const errors=[];
const scanned=[];
function resolveResource(owner,raw){
 if(!raw||/^(?:https?:|\/\/|data:|mailto:|tel:|javascript:|#|blob:|\$\{|\{\{)/i.test(raw))return;
 const stripped=raw.split(/[?#]/)[0].trim();
 if(!stripped||!targetExt.test(stripped))return;
 let decoded;
 try{decoded=decodeURIComponent(stripped)}catch{errors.push(owner+': malformed URL '+raw);return}
 const rel=decoded.startsWith('/')?decoded.replace(/^\/+/, ''):path.join(path.dirname(owner),decoded);
 const dest=path.resolve(ROOT,rel);
 if(dest!==ROOT&&!dest.startsWith(ROOT+path.sep)){
   errors.push(owner+': path escapes repository: '+raw);return;
 }
 if(!fs.existsSync(dest))errors.push(owner+': missing '+raw+' (resolved '+path.relative(ROOT,dest)+')');
}
function scanHtml(file){
 const s=fs.readFileSync(path.join(ROOT,file),'utf8');
 for(const m of s.matchAll(/\b(?:src|href|poster|data-src)\s*=\s*(["'])(.*?)\1/gi))resolveResource(file,m[2]);
 scanned.push(file);
}
function scanCss(file){
 const s=fs.readFileSync(path.join(ROOT,file),'utf8');
 for(const m of s.matchAll(/url\(\s*(?:(["'])(.*?)\1|([^)'"]+))\s*\)/gi)){
   resolveResource(file,(m[2]||m[3]||'').trim());
 }
 // Also handle CSS string-style import without url().
 for(const m of s.matchAll(/@import\s+(["'])([^"']+)\1/gi))resolveResource(file,m[2]);
 scanned.push(file);
}
for(const name of fs.readdirSync(ROOT)){
 if(name.endsWith('.html')&&fs.statSync(path.join(ROOT,name)).isFile())scanHtml(name);
}
const cssRoot=path.join(ROOT,'assets/css');
function walk(dir){
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
   const full=path.join(dir,e.name);
   if(e.isDirectory())walk(full);
   else if(e.isFile()&&e.name.endsWith('.css'))scanCss(path.relative(ROOT,full));
 }
}
walk(cssRoot);
if(errors.length){
 console.error('Local references broken: '+errors.length);
 for(const e of errors.slice(0,80))console.error('- '+e);
 process.exit(1);
}
assert(scanned.length>50,'Unexpectedly few pages and stylesheets scanned');
console.log('Crack Total 5.1 references PASS: '+scanned.length+' HTML/CSS files, no missing local direct assets');
