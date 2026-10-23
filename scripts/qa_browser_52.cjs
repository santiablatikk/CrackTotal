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
const viewportHeight = Number(args.height || '900');
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
  // A horizontally scrollable group (e.g. filter chips) legitimately contains
  // off-viewport choices. Only exempt children when the actual scroll container
  // is itself within the viewport; never suppress a real body overflow.
  const isInIntentionalScroller = el => {
    let parent=el.parentElement;
    while(parent && parent!==document.body) {
      const css=getComputedStyle(parent);
      const box=parent.getBoundingClientRect();
      if (/^(auto|scroll)$/.test(css.overflowX) &&
          parent.scrollWidth > parent.clientWidth+2 &&
          box.left>=-2 && box.right<=width+2) return true;
      parent=parent.parentElement;
    }
    return false;
  };
  const offscreen=nodes.filter(el=>{
    const rect=el.getBoundingClientRect();
    return (rect.left < -2 || rect.right > width + 2) && !isInIntentionalScroller(el);
  }).slice(0,15).map(el=>({tag:el.tagName.toLowerCase(),id:el.id || '',className:String(el.className).slice(0,60)}));
  const undersizeButtons=nodes.filter(el=>el.tagName==='BUTTON' && (el.getBoundingClientRect().height<44 || el.getBoundingClientRect().width<44)).length;
  return {title:document.title,width,height:innerHeight,docHeight:document.documentElement.scrollHeight,docWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-width,offscreen,undersizeButtons,protrusions};
}

/*
 * Explicitly synthetic layout fixtures. These reveal existing game DOM and
 * populate it with deterministic *display-only* samples. They do not use
 * WebSocket, award points, mutate persistence, or verify game rules.
 */
function stageMatchFixture(game) {
  const $ = id => document.getElementById(id);
  const show = el => {
    if (!el) return;
    el.hidden = false;
    el.style.removeProperty('display');
  };
  const hide = el => {
    if (!el) return;
    el.hidden = true;
    el.style.display = 'none';
  };
  for (const m of document.querySelectorAll('.modal-overlay')) hide(m);
  let stage;
  switch (game) {
    case 'pasalache.html': {
      stage = $('gameContainer');
      show(stage);
      for (const el of document.querySelectorAll('.loading-start-screen')) hide(el);
      $('questionText').textContent = '¿Qué selección ganó la Copa América 2021 después de vencer a Brasil en la final?';
      $('currentLetterText').textContent = 'A';
      const list = $('lettersContainer');
      if (list && !list.querySelector('.letter')) {
        const letters = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
        for (let i = 0; i < letters.length; i++) {
          const el = document.createElement('span');
          el.className = 'letter' + (i === 0 ? ' active' : '');
          el.textContent = letters[i];
          el.style.left = '50%';
          el.style.top = '50%';
          list.appendChild(el);
        }
        const radius = list.clientWidth / 2 - (list.firstElementChild?.getBoundingClientRect().width || 26) / 2;
        [...list.children].forEach((el,i)=>{
          const angle = i / letters.length * 2 * Math.PI;
          el.style.transform = 'translate(' + (Math.sin(angle)*radius) + 'px,' + (-Math.cos(angle)*radius) + 'px)';
        });
      }
      break;
    }
    case 'pasala-1v1.html': {
      stage = $('match');
      show(stage);
      // Deterministically capture the real turns-stage CSS, not a generic stage.
      $('matchStage').classList.add('turns-stage');
      hide(document.querySelector('.lobby-area'));
      hide(document.querySelector('.arena-hero'));
      hide($('readyPanel'));
      show($('questionPanel'));
      $('matchStatus').textContent = 'TURNO DE JUGADOR 1';
      $('questionText').textContent = '¿Qué futbolista argentino fue campeón mundial en 2022 y jugó en Rosario Central?';
      $('displayRoom').textContent = 'ARENA12345';
      const score = $('scoreboard');
      if (score && !score.children.length) {
        score.innerHTML = '<div class="score-player is-active"><div class="score-name">JUGADOR 1<span>TU ROSCO</span></div><strong class="score-value">08</strong></div><div class="score-versus">VS</div><div class="score-player"><div class="score-name">RIVAL<span>ROSCO RIVAL</span></div><strong class="score-value">06</strong></div>';
      }
      const ring = $('duelRing');
      if (ring && !ring.children.length) {
        for (const [i,l] of [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].entries()) {
          const cell=document.createElement('span');
          cell.className='ring-letter'+(i===0?' current':i<8?' correct':'');
          cell.style.setProperty('--angle',i / 26 * 360 + 'deg');
          cell.textContent=l;
          ring.appendChild(cell);
        }
      }
      break;
    }
    case 'top10.html': {
      hide($('startOverlay'));
      stage = $('top10GameCard');
      show(stage);
      $('topicTitle').textContent = 'Diez clubes con más puntos en la temporada 2024/25';
      const list = $('answersList');
      if (list && !list.children.length) {
        for (let i = 0; i < 10; i++) {
          const li=document.createElement('li');
          li.className=i<3?'solved':'';
          li.innerHTML='<span class="pos">' + String(i+1).padStart(2,'0') + '</span><span class="label">' + (i<3?['Bayern München','Bayer Leverkusen','Eintracht Frankfurt'][i]:'POR DESCUBRIR') + '</span><span class="top10-row-metric">' + (i<3?'75':'—') + '</span>';
          list.appendChild(li);
        }
      }
      break;
    }
    case 'wordle-futbol.html':
      stage = document.querySelector('.wordle-card');
      break;
    case 'quiensabemas.html': {
      stage = $('gameArea');
      show(stage);
      hide(document.querySelector('.lobby-container'));
      hide($('waitingArea'));
      $('qsmQuestionText').textContent = '¿Qué selección ganó la primera edición de la Copa Mundial de la FIFA en 1930?';
      $('questionNumber').textContent = 'Pregunta 12 / 36';
      const options = $('optionsGrid');
      if (options) {
        options.innerHTML='';
        ['Uruguay','Argentina','Brasil','Italia'].forEach((answer,i)=>{
          const button=document.createElement('button');
          button.className='modern-option option-btn'+(i===0?' correct':'');
          button.type='button';
          const badge=document.createElement('span');
          badge.className='option-letter';
          badge.textContent=String.fromCharCode(65+i);
          const text=document.createElement('span');
          text.className='option-text';
          text.textContent=answer;
          button.append(badge,text);
          options.appendChild(button);
        });
      }
      break;
    }
    case 'mentiroso.html': {
      hide($('lobbySection'));
      stage = $('gameContentSection');
      show(stage);
      hide($('waitingArea'));
      $('challengeText').textContent = 'Nombrá futbolistas argentinos que hayan disputado un Mundial entre 2006 y 2022.';
      $('currentBidText').textContent = 'APUESTA EN JUEGO: 20 RESPUESTAS';
      const bid=$('bidInput');
      if(bid)bid.value='21';
      break;
    }
  }
  if (!stage) throw new Error('No match fixture root: ' + game);
  if(game==='pasalache.html'){
    // Real computed foregrounds after every shared CSS layer has loaded.
    // A dark question surface with dark text caused unreadable rounds.
    const readColor=selector=>getComputedStyle(document.querySelector(selector)).color;
    const visibleText=value=>{
      const rgb=(value.match(/\d+/g)||[]).slice(0,3).map(Number);
      return rgb.length===3&&rgb[0]>=175&&rgb[1]>=175&&rgb[2]>=160;
    };
    const question=readColor('.question-card .question-text');
    const heading=readColor('.question-card .question-header h3');
    const answer=readColor('.question-card .answer-input');
    if(!visibleText(question)||!visibleText(heading)||!visibleText(answer))
      throw Error('Unreadable Pasala match text: '+JSON.stringify({question,heading,answer}));
  }
  if(game==='pasala-1v1.html'&&window.innerWidth<=780){
    const side=document.querySelector('#matchStage .question-side').getBoundingClientRect();
    const own=document.getElementById('ownRingSide').getBoundingClientRect();
    const answer=document.getElementById('answerInput').getBoundingClientRect();
    if(own.top<side.top||answer.width<160)
      throw Error('Duel responsive interaction must precede the progress ring and keep answer usable');
  }
  if(game==='top10.html'&&window.innerWidth<=600){
    const field=document.getElementById('surnameInput').getBoundingClientRect();
    const submit=document.getElementById('submitBtn').getBoundingClientRect();
    const controls=document.querySelector('.top10-play-panel .input-area').getBoundingClientRect();
    if(field.width<controls.width*.85||submit.width<controls.width*.85||submit.top<field.bottom-2)
      throw Error('Top10 mobile controls remain squeezed or overlapping');
  }
  const box=stage.getBoundingClientRect();
  if (box.width < 150 || getComputedStyle(stage).display==='none') {
    throw new Error('Match fixture remained hidden: ' + game);
  }
  const top=box.top+window.scrollY - 70;
  window.scrollTo({top:Math.max(0,top),behavior:'instant'});
  return {fixture:'synthetic-match',game,stageWidth:Math.round(box.width)};
}


/** Actual Wordle browser interactions, not simulated game state. */
function checkWordleLiveLayout() {
  const playfield=document.querySelector('.wordle-playfield');
  const board=document.querySelector('.wordle-playfield .board');
  const keyboard=document.querySelector('.wordle-playfield .keyboard');
  const card=document.querySelector('.wordle-card');
  if(!playfield||!board||!keyboard||!card)throw Error('Wordle layout hierarchy missing');
  const box=el=>el.getBoundingClientRect();
  const stage=box(playfield),b=box(board),k=box(keyboard),c=box(card);
  const center=rect=>rect.left+rect.width/2;
  const boardDelta=Math.abs(center(b)-center(stage));
  const keyboardDelta=Math.abs(center(k)-center(stage));
  const tiles=[...board.querySelectorAll('.tile')];
  const columns=Number(board.dataset.columns);
  if(!Number.isInteger(columns)||columns<2||columns>32||tiles.length!==columns*6)
    throw Error('Wordle board shape wrong: '+columns+'/'+tiles.length);
  if(boardDelta>2||keyboardDelta>2)throw Error('Puzzle off center: board '+boardDelta+' keyboard '+keyboardDelta);
  if(b.left<c.left-1||b.right>c.right+1||k.left<c.left-1||k.right>c.right+1)
    throw Error('Wordle board/keyboard protrudes outside card');
  if(stage.width<100||k.width<100)throw Error('Wordle playfield unusably narrow');
  const keys=[...keyboard.querySelectorAll('button.key')];
  if(keys.length<25 || keys.some(el=>box(el).right>innerWidth+2||box(el).left<-2))
    throw Error('Wordle virtual keyboard not fully reachable');
  if(document.querySelector('.daily-overlay')?.style.display==='grid')
    throw Error('Expected a fresh daily game, got completed state');
  const letter=keyboard.querySelector('.key[data-key="m"]');
  const del=keyboard.querySelector('.key[data-key="⌫"]');
  if(!letter||!del)throw Error('Wordle virtual controls missing');
  letter.click();
  const first=board.querySelector('[data-row="0"][data-col="0"]');
  if(first?.textContent!=='M')throw Error('Click did not enter letter');
  del.click();
  if(first?.textContent)throw Error('Backspace did not clear tile');
  letter.click();
  const state=JSON.parse(localStorage.getItem('wordle_game_state_v1')||'null');
  if(state?.board?.[0]?.[0]!=='m')throw Error('Wordle in-progress move not persisted');
  return {columns,tiles:tiles.length,boardDelta,keyboardDelta,boardWidth:b.width,keyboardWidth:k.width,moveSaved:true};
}
function verifyWordleReload() {
  const first=document.querySelector('#board [data-row="0"][data-col="0"]');
  if(first?.textContent!=='M')throw Error('Reload lost typed wordle progress');
  const enter=document.querySelector('.key[data-key="↵"]');
  if(!enter)throw Error('Wordle submit key missing after reload');
  enter.click();
  if(document.getElementById('message')?.textContent!=='Faltan letras')
    throw Error('Incomplete guess should not consume a turn');
  const state=JSON.parse(localStorage.getItem('wordle_game_state_v1')||'null');
  if(state?.currentRow!==0)throw Error('Invalid guess advanced the daily game');
  return true;
}


function qsmLongProbe(){
 const buttons=[...document.querySelectorAll('#optionsGrid .modern-option.option-btn')];
 if(buttons.length!==4)throw Error('QSM fixture must have four real-style choices');
 const samples=[
  'Club Atlético del Sur con una denominación deportiva excepcionalmente extensa',
  'Asociación Deportiva de un futbolista con apellido compuesto de más de sesenta caracteres',
  'Club de Fútbol Internacional con selección y federación nombradas en la misma respuesta',
  'Atlético Deportivo Ciudad del Fútbol con nombre extraordinariamente largo para pruebas'
 ];
 buttons.forEach((button,i)=>{
  const label=button.querySelector('.option-text');
  if(!label)throw Error('QSM choice missing the real option-text child');
  label.textContent=samples[i];
 });
 buttons[0].classList.add('incorrect');
 const bg=getComputedStyle(buttons[0]).backgroundColor;
 const rgb=(bg.match(/\d+/g)||[]).slice(0,3).map(Number);
 if(rgb.length!==3||rgb[0]<100||rgb[0]<rgb[1]*1.5)
  throw Error('Incorrect answer state not styled as red: '+bg);
 if(buttons.some(button=>button.scrollWidth>button.clientWidth+2||button.scrollHeight>button.clientHeight+2))
  throw Error('Long football option labels clipped in match');
 return {count:buttons.length,
  tallest:Math.round(Math.max(...buttons.map(b=>b.getBoundingClientRect().height))),
  narrowest:Math.round(Math.min(...buttons.map(b=>b.getBoundingClientRect().width))),failureColor:bg};
}

async function main(){
  if (widths.some(w=>!Number.isInteger(w) || w<280 || w>3000)||!Number.isInteger(viewportHeight)||viewportHeight<480||viewportHeight>2160)throw Error('Invalid viewport');
  fs.mkdirSync(out,{recursive:true});
  const server = http.createServer(serve);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const httpPort=server.address().port;
  // Chrome selects a free port itself (port=0) and writes DevToolsActivePort.
  // Randomly guessing ports previously caused intermittent CI connection failures.
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'ct-game-qa-'));
  const chrome=spawn(process.env.CHROME_BIN || 'google-chrome',[
    '--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-first-run',
    '--disable-background-networking','--no-default-browser-check',
    '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'
  ],{stdio:'ignore'});
  let ws;
  try {
    let target;
    for(let i=0;i<100;i++){
      if(chrome.exitCode!==null)throw Error('Chromium exited unexpectedly: '+chrome.exitCode);
      try {
        const portfile=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split(/\r?\n/);
        const debugPort=Number(portfile[0]);
        if(Number.isInteger(debugPort)&&debugPort>0){
          const response=await fetch('http://127.0.0.1:'+debugPort+'/json/list');
          target=(await response.json()).find(item=>item.type==='page');
          if(target)break;
        }
      } catch {}
      await sleep(200);
    }
    if(!target)throw Error('Cannot access Chrome DevTools protocol (port discovery timed out)');
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
      await command('Emulation.setDeviceMetricsOverride',{width,height:viewportHeight,deviceScaleFactor:1,mobile:width<=430});
      await command('Page.navigate',{url:'http://127.0.0.1:'+httpPort+'/'+game});
      await sleep(1500);
      // A consent dialog masks actual content in baseline screenshots;
      // reject optional cookies in this disposable browser profile for visual QA.
      const rejected=await command('Runtime.evaluate',{
        expression:"(function(){const b=[...document.querySelectorAll('button,[role=button]')].find(x=>x.textContent?.trim().toLowerCase().includes('rechazar todo'));if(!b)return false;b.click();return true})()",
        returnByValue:true
      });
      if (rejected.result?.value) await sleep(350);

      if(args.fixture === 'wordle-live') {
        if(game!=='wordle-futbol.html')throw Error('wordle-live requires Wordle page');
        // Each width is a separate fresh-play case. Do not accumulate guesses
        // across viewports in the disposable Chromium profile.
        await command('Runtime.evaluate',{expression:"localStorage.removeItem('wordle_game_state_v1')",returnByValue:true});
        await command('Page.reload',{ignoreCache:true});
        await sleep(1500);
        // Isolated local test server and browser profile. A real keyboard click,
        // localStorage persistence, navigation reload and validation are exercised.
        const first=await command('Runtime.evaluate',{
          expression:'('+checkWordleLiveLayout.toString()+')()',
          returnByValue:true
        });
        if(first.exceptionDetails||!first.result?.value?.moveSaved)
          throw Error('Wordle live interaction failed '+width+': '+
            JSON.stringify(first.exceptionDetails||first.result).slice(0,800));
        await command('Page.reload',{ignoreCache:true});
        await sleep(1500);
        // Resolve the asynchronous daily-pool fetch before making persistence
        // assertions; a fixed 1.5s timer is not a reliable loading contract.
        let restored=null,diagnostics=null;
        for(let attempt=0;attempt<24;attempt++){
          const read=await command('Runtime.evaluate',{
            expression:"(() => {let saved=null;try{saved=JSON.parse(localStorage.getItem('wordle_game_state_v1')||'null')}catch{};return {saved:saved?.board?.[0]?.[0],day:saved?.day,target:saved?.target,tile:document.querySelector('#board [data-row=\\\"0\\\"][data-col=\\\"0\\\"]')?.textContent,tiles:document.querySelectorAll('#board .tile').length,ready:document.readyState,message:document.getElementById('message')?.textContent}})()",
            returnByValue:true
          });
          diagnostics=read.result?.value;
          if(diagnostics?.tile==='M')break;
          await sleep(250);
        }
        if(diagnostics?.tile!=='M')throw Error('Wordle reload did not restore saved move at '+width+': '+JSON.stringify(diagnostics));
        restored=await command('Runtime.evaluate',{
          expression:'('+verifyWordleReload.toString()+')()',
          returnByValue:true
        });
        if(restored.exceptionDetails||restored.result?.value!==true)
          throw Error('Wordle live reload failed '+width+': '+
            JSON.stringify(restored.exceptionDetails||restored.result).slice(0,800));
        console.log('WORDLE LIVE '+width+'px: '+JSON.stringify(first.result.value));
      }
      if(['match','bluff-long','qsm-long'].includes(args.fixture)) {
        const result = await command('Runtime.evaluate',{
          expression:'('+stageMatchFixture.toString()+')('+JSON.stringify(game)+')',
          returnByValue:true,awaitPromise:true
        });
        if(result.exceptionDetails || !result.result?.value?.stageWidth)
          throw Error('Match fixture injection failed: '+game+' '+JSON.stringify(result.exceptionDetails || result.result));
        await sleep(180);
      }
      if(args.fixture==='bluff-long'){
        if(game!=='mentiroso.html')throw Error('Fixture only for Mentiroso');
        const inspected=await command('Runtime.evaluate',{
          expression: "(() => {"+
            "const bid=document.getElementById('biddingPhase');"+
            "const phase=document.getElementById('validationPhase');
            const progress=document.getElementById('validationProgress');"+
            "const list=document.getElementById('answersToValidateList');"+
            "const confirm=document.getElementById('submitValidationButton');"+
            "if(!phase||!list||!confirm||!progress)throw Error('Validation nodes missing');"+
            "bid.style.display='none';phase.style.display='block';list.replaceChildren();"+
            "for(let i=0;i<25;i++){const li=document.createElement('li');"+
            "const name=document.createElement('span');name.textContent='Respuesta futbolera extensa '+(i+1);"+
            "const actions=document.createElement('div');actions.className='validation-buttons';"+
            "for(const cls of ['correct','incorrect']){const b=document.createElement('button');"+
            "b.type='button';b.className='validate-'+cls;b.textContent=cls==='correct'?'✓':'×';actions.appendChild(b);}"+
            "li.append(name,actions);list.appendChild(li);}"+
            "const css=getComputedStyle(list);const rect=list.getBoundingClientRect();"+
            "const buttons=[...list.querySelectorAll('.validation-buttons button')];if(buttons.some(b=>b.getBoundingClientRect().width<44||b.getBoundingClientRect().height<44))throw Error('Mentiroso validator targets smaller than 44px');if(list.children.length!==25||list.scrollHeight<=list.clientHeight+2||"+
            "!['auto','scroll'].includes(css.overflowY)||rect.width<175)"+
            "throw Error('Mentiroso 25-item list not scrollable');"+
            "list.scrollIntoView({behavior:'instant',block:'center'});"+
            "return {items:list.children.length,height:list.clientHeight,scroll:list.scrollHeight};})()",
          returnByValue:true
        });
        if(inspected.exceptionDetails||inspected.result?.value?.items!==25)
          throw Error('Mentiroso long-list fixture failed at '+width+': '+JSON.stringify(inspected.exceptionDetails||inspected.result).slice(0,700));
        console.log('MENTIROSO 25 RESPONSES '+width+': '+JSON.stringify(inspected.result.value));
      }
      if(args.fixture==='qsm-long'){
        if(game!=='quiensabemas.html')throw Error('qsm-long expects QSM');
        const checked=await command('Runtime.evaluate',{
          expression:'('+qsmLongProbe.toString()+')()',
          returnByValue:true
        });
        if(checked.exceptionDetails||checked.result?.value?.count!==4)
          throw Error('QSM long-answer layout failed '+width+': '+JSON.stringify(checked.exceptionDetails||checked.result).slice(0,700));
        console.log('QSM LONG OPTIONS '+width+': '+JSON.stringify(checked.result.value));
      }
      // The renderer sometimes swaps execution contexts immediately after
      // navigation on CI. Retry transient evaluation failures, not layout failures.
      let r;
      for(let attempt=0;attempt<4;attempt++){
        r=await command('Runtime.evaluate',{expression:'('+probe.toString()+')('+width+')',returnByValue:true});
        if(!r.exceptionDetails && r.result?.value)break;
        await sleep(350);
      }
      if(r.exceptionDetails || !r.result || !r.result.value)throw Error(
        'Browser probe failed for '+game+' '+width+': '+JSON.stringify(r.exceptionDetails || r.result).slice(0,600)
      );
      const row={game,expectedWidth:width,fixture:args.fixture || 'entry',...r.result.value};
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
    const summary='# Crack Total 6.0 — Chromium QA\n\n'+(args.baseline?'Before':'After')+' · '+rows.length+' viewport/page combinations · '+failed.length+' alerts\n\n'+
      (failed.map(x=>'- '+x.game+' '+x.expectedWidth+'px: title='+x.title+', overflow='+x.overflow+', offscreen='+x.offscreen.length).join('\n') || 'No reported overflow or offscreen primary controls')+
      '\n\nScope: ' + (args.fixture === 'match' ? 'synthetic match-state layout only (no game logic or WebSocket assertions).' : args.fixture === 'wordle-live' ? 'real local Wordle keyboard clicks, deletion, saved progress, page reload, invalid submit, and layout geometry (no backend or date rollover assertions).' : 'initial screens only. Gameplay, results, WebSocket and disconnect states require separate QA.') + '\n';
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
