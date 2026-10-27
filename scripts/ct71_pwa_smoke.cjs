'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sw=read('sw.js'),reg=read('assets/js/ct7-pwa.js');
assert.doesNotThrow(()=>new Function(sw));assert.doesNotThrow(()=>new Function(reg));
const manifest=JSON.parse(read('config/manifest.json'));
assert.equal(manifest.scope,'/');assert.equal(manifest.display,'standalone');
assert.equal(manifest.theme_color,'#101b1b');assert.equal(manifest.background_color,'#101b1b');
assert(manifest.icons.some(x=>x.src==='/assets/icons/ct7-app.svg'&&x.sizes==='any'));
assert(!/push-notifications|background-sync|share-target|file-handling/i.test(JSON.stringify(manifest)));
for(const page of ['index.html','games.html','quien-soy.html','adivina-carrera.html','ordena-historia.html','conexiones.html','profile.html']){
 const html=read(page);
 for(const token of ['assets/js/ct7-pwa.js','config/manifest.json','assets/css/ct7-pwa.css'])
   assert(html.includes(token),page+' missing '+token);
}
const expected=['/quien-soy.html','/adivina-carrera.html','/ordena-historia.html','/conexiones.html',
'/assets/js/ct7-games.js','/assets/js/ct7-timeline.js','/assets/js/ct71-conexiones.js',
'/assets/data/career-challenge-verified.json','/assets/data/timeline-verified.json','/assets/data/conexiones-verified.json',
'/assets/css/ct7-games.css','/assets/css/ct7-timeline.css','/assets/css/ct71-conexiones.css',
'/assets/css/ct74-unified.css','/assets/css/ct7-pwa.css',
'/assets/css/design-system/tokens.css','/assets/icons/ct7-app.svg','/portada.ico'];
expected.forEach(p=>assert(fs.existsSync(path.join(root,p.slice(1))),'Missing '+p));
const handlers={};let activated=false,claimed=false,online=true,fetchCalls=0;
const storage=new Map([['crack-total-dynamic-v6.0.0',new Map([['/profile.html','private']])],['unrelated',new Map()]]);
const caches={
 async keys(){return [...storage.keys()]},
 async delete(key){return storage.delete(key)},
 async open(key){
   if(!storage.has(key))storage.set(key,new Map());
   const b=storage.get(key);
   return {
    async addAll(list){for(const req of list) {
      const url=typeof req==='string'?req:req.url;
      const p=new URL(url,'https://ct.test').pathname;
      assert(fs.existsSync(path.join(root,p.slice(1))),'Missing offline '+p);
      b.set(p,{offline:true,url:p,clone(){return this;}});
    }},
    async put(key,response){b.set(key,response)},
    async match(key){return b.get(key)}
   };
 }
};
class Request{constructor(url){this.url=url;}}
const self={location:{origin:'https://ct.test'},addEventListener(n,fn){handlers[n]=fn},
 skipWaiting(){activated=true;},clients:{async claim(){claimed=true;}}};
const fetch=async req=>{fetchCalls++;if(!online)throw Error('Offline');
 return {ok:true,status:200,type:'basic',clone(){return this;}};
};
vm.runInNewContext(sw,{self,caches,Request,Response:class {constructor(body,init){this.body=body;this.status=init.status;}},fetch,URL,Set,Promise});
async function emit(name,event){let result;handlers[name]({...event,waitUntil(task){result=task},respondWith(task){result=task}});
 return result?await result:undefined;
}
(async()=>{
 await emit('install',{});
 const own=[...storage.keys()].find(k=>k.startsWith('ct7-offline-'));
 assert(own);const paths=[...storage.get(own).keys()];
 assert.deepEqual(paths.sort(),expected.slice().sort());
 assert(!paths.some(p=>['rankings','firebase','matches','user_stats','index.html','games.html'].some(t=>p.includes(t))));
 await emit('activate',{});
 assert(claimed);assert(!storage.has('crack-total-dynamic-v6.0.0'));assert(storage.has('unrelated'));
 online=false;
 const get=(p,mode='navigate',method='GET')=>emit('fetch',{request:{url:'https://ct.test'+p,mode,method}});
 assert((await get('/quien-soy.html?ignored=1')).offline,'Solo game unavailable offline');
 assert((await get('/assets/data/career-challenge-verified.json','same-origin')).offline,'Quiz bank unavailable offline');
 const before=fetchCalls;
 for(const p of ['/ranking.html','/profile.html','/api/ranking','/matches','/server.js'])
   assert.equal(await get(p),undefined,'Private or online resource must not be cached '+p);
 assert.equal(await emit('fetch',{request:{url:'https://other.test/quien-soy.html',mode:'navigate',method:'GET'}}),undefined);
 assert.equal(await get('/quien-soy.html','navigate','POST'),undefined);
 assert.equal(fetchCalls,before);
 await emit('message',{data:{type:'CT7_ACTIVATE_UPDATE'}});
 assert(activated);
 console.log('CT7.1 PWA PASS: four playable offline modes, cache isolation, deliberate update');
})().catch(e=>{console.error(e);process.exitCode=1});
