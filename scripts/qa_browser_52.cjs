'use strict';
// Crack Total 5.2 browser QA. No browser npm dependency required.
// Covers rendered entry screens, not active matches, modals or mobile keyboards.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const {spawn} = require('node:child_process');
const {setTimeout: sleep} = require('node:timers/promises');

const args = {};
for (let i = 2; i < process.argv.length; ++i) {
  if (process.argv[i] === '--baseline') args.baseline = true;
  else if (process.argv[i].startsWith('--')) args[process.argv[i].slice(2)] = process.argv[++i];
}
const root = path.resolve(args.root || '.');
const out = path.resolve(args.out || 'ct-visual-qa');
const widths = (args.widths || '320,360,375,390,430,768,1024,1366,1440,1920').split(',').map(Number);
const games = (args.games || 'pasalache.html,pasala-1v1.html,top10.html,wordle-futbol.html,quiensabemas.html,mentiroso.html').split(',');
const mimes = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.json':'application/json'};
function serve(req,res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const target = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (target !== root && !target.startsWith(root + path.sep)) {res.writeHead(403).end();return;}
    fs.stat(target,(err,info)=>{
      if (err) {res.writeHead(404).end();return;}
      const file = info.isDirectory() ? path.join(target,'index.html') : target;
      fs.readFile(file,(error,bytes)=>{
        if (error) {res.writeHead(404).end();return;}
        res.writeHead(200,{'content-type':mimes[path.extname(file)] || 'application/octet-stream','cache-control':'no-store'}).end(bytes);
      });
    });
  } catch {res.writeHead(400).end();}
}
function probe(expectedWidth) {
  const width = window.innerWidth;
  const inspectWidth = Math.min(width, expectedWidth);
  const protrusions = [...document.body.querySelectorAll('*')].filter(el=>{
    const style=getComputedStyle(el),rect=el.getBoundingClientRect();
    return style.display!=='none' && style.visibility!=='hidden' && rect.width>0 && rect.right>inspectWidth+1;
  }).sort((a,b)=>b.getBoundingClientRect().right-a.getBoundingClientRect().right).slice(0,8).map(el=>{
    const rect=el.getBoundingClientRect();
    return {tag:el.tagName.toLowerCase(),id:el.id,cls:String(el.className).slice(0,50),left:Math.round(rect.left),right:Math.round(rect.right)};
  });
  const selectors = 'button,input,textarea,select,.board,.keyboard,.rosco-circle,.duel-ring,.top10-game-layout,.ct-quiz-stage,.ct-bluff-stage';
  const nodes = [...document.querySelectorAll(selectors)].filter(el=>{
    const style=getComputedStyle(el),rect=el.getBoundingClientRect();
    return style.display!=='none' && style.visibility!=='hidden' && rect.width>0 && rect.height>0;
  });
  const offscreen=nodes.filter(el=>{
    const rect=el.getBoundingClientRect();
    return rect.left < -2 || rect.right > width + 2;
  }).slice(0,15).map(el=>({tag:el.tagName.toLowerCase(),id:el.id || '',className:String(el.className).slice(0,60)}));
  const undersizeButtons=nodes.filter(el=>el.tagName==='BUTTON' && (el.getBoundingClientRect().height<44 || el.getBoundingClientRect().width<44)).length;
  return {title:document.title,width,docWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-width,offscreen,undersizeButtons,protrusions};
}
async function main(){
  if (widths.some(w=>!Number.isInteger(w) || w<280 || w>3000))throw Error('Invalid viewport');
  fs.mkdirSync(out,{recursive:true});
  const server = http.createServer(serve);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const httpPort=server.address().port;
  const debugPort=9300+Math.floor(Math.random()*200);
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'ct-game-qa-'));
  const chrome=spawn(process.env.CHROME_BIN || 'google-chrome',[
    '--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-first-run',
    '--remote-debugging-port='+debugPort,'--user-data-dir='+profile,'about:blank'
  ],{stdio:'ignore'});
  let ws;
  try {
    let target;
    for(let i=0;i<55;i++){
      if(chrome.exitCode!==null)throw Error('Chromium exited');
      try {
        const response=await fetch('http://127.0.0.1:'+debugPort+'/json/list');
        target=(await response.json()).find(item=>item.type==='page');
        if(target)break;
      } catch {}
      await sleep(200);
    }
    if(!target)throw Error('Cannot access Chrome DevTools protocol');
    ws=new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{
      ws.addEventListener('open',resolve,{once:true});
      ws.addEventListener('error',reject,{once:true});
    });
    let sequence=0;
    const pending=new Map();
    ws.onmessage=event=>{
      const msg=JSON.parse(event.data);
      if(msg.id && pending.has(msg.id)){
        const next=pending.get(msg.id);pending.delete(msg.id);
        msg.error ? next.reject(Error(msg.error.message)) : next.resolve(msg.result);
      }
    };
    const command=(method,params={})=>new Promise((resolve,reject)=>{
      const id=++sequence;pending.set(id,{resolve,reject});
      ws.send(JSON.stringify({id,method,params}));
    });
    await command('Page.enable');await command('Runtime.enable');
    const rows=[];
    for(const width of widths)for(const game of games){
      await command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<=430});
      await command('Page.navigate',{url:'http://127.0.0.1:'+httpPort+'/'+game});
      await sleep(1500);
      const r=await command('Runtime.evaluate',{expression:'('+probe.toString()+')('+width+')',returnByValue:true});
      if(r.exceptionDetails || !r.result || !r.result.value)throw Error('Browser probe failed for '+game+' '+width);
      const row={game,expectedWidth:width,...r.result.value};
      rows.push(row);
      if(width===360 || width===1366){
        const image=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        fs.writeFileSync(path.join(out,game.replace('.html','')+'-'+width+'.png'),Buffer.from(image.data,'base64'));
      }
      console.log((args.baseline?'BEFORE':'AFTER')+' '+game+' '+width+': viewport='+row.width+', overflow='+row.overflow+', offscreen='+row.offscreen.length);
      if (row.overflow>2 || row.width!==width)console.log('   PROTRUSIONS '+JSON.stringify(row.protrusions));
    }
    fs.writeFileSync(path.join(out,'metrics.json'),JSON.stringify({baseline:!!args.baseline,rows},null,2));
    const failed=rows.filter(x=>!x.title.includes('Crack Total') || x.expectedWidth!==x.width || x.overflow>2 || x.offscreen.length);
    const summary='# Crack Total 5.2 — Chromium QA\n\n'+(args.baseline?'Before':'After')+' · '+rows.length+' viewport/page combinations · '+failed.length+' alerts\n\n'+
      (failed.map(x=>'- '+x.game+' '+x.expectedWidth+'px: title='+x.title+', overflow='+x.overflow+', offscreen='+x.offscreen.length).join('\n') || 'No reported overflow or offscreen primary controls')+
      '\n\nScope: initial screens only. Gameplay, results, virtual keyboard, WebSocket and disconnect states require separate QA.\n';
    fs.writeFileSync(path.join(out,'SUMMARY.md'),summary);
    if(failed.length&&!args.baseline)process.exitCode=1;
  } finally {
    if(ws)ws.close();
    chrome.kill('SIGTERM');
    server.close();
    // Chromium may still be exiting. Profile remains only in the temporary runner directory.
  }
}
main().catch(error=>{console.error(error);process.exitCode=1});
