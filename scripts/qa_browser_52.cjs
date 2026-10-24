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
async function ct7LiveProbe() {
  const assert = (condition,message) => { if (!condition) throw Error(message); };
  const mode = document.body.dataset.ct7Mode;
  assert(['identity','career'].includes(mode),'Invalid CT7 game mode');
  const $ = id => document.getElementById(id);
  const response = await fetch('/assets/data/career-challenge-verified.json');
  const bank = await response.json();
  for(let retry=0;retry<24 && $('startButton').disabled;retry++)
    await new Promise(resolve => setTimeout(resolve,100));
  assert(!$('startButton').disabled,'Game bank did not initialize');
  $('startButton').click();
  assert(!$('playView').hidden,'Start action did not open a game');
  const key='ct7:session:'+mode+':v1';
  const order=JSON.parse(sessionStorage.getItem(key)).order;
  assert(order.length===6&&new Set(order).size===6,'Fresh game must not duplicate footballers');
  let score=0;
  for(let i=0;i<6;i++){
    const session=JSON.parse(sessionStorage.getItem(key));
    assert(session.index===i,'Round progression mismatch');
    const record=bank.records.find(r=>r.id===session.order[i]);
    assert(record,'Unknown server-source record');
    assert($('clueList').children.length >= 2,'Actual clue list not rendered');
    if (i===0) {
      $('guessInput').value='Futbolista que no existe 999';
      $('guessForm').requestSubmit();
      assert($('attemptsLabel').textContent.includes('2 INTENTOS'),'Wrong answers must decrement attempts');
      $('revealButton').click();
      assert(JSON.parse(sessionStorage.getItem(key)).revealed > session.revealed,
        'Reveal must consume a new clue');
    }
    $('guessInput').value=record.name;
    $('guessForm').requestSubmit();
    assert(!$('answerView').hidden,'Correct answer must reveal source/result');
    assert($('answerSource').href.startsWith('https://'),'Provenance link missing');
    score=JSON.parse(sessionStorage.getItem(key)).score;
    $('nextButton').click();
  }
  assert(!$('finishView').hidden,'Six rounds must end in final scoreboard');
  const state=JSON.parse(sessionStorage.getItem(key));
  assert(state.correct===6&&state.score===score,'Final total must be verified against actual play');
  const local=JSON.parse(localStorage.getItem('ct7:local-progress:v1'));
  assert(local.history.every(h=>h.scope==='local-only'),'Cannot pass local client points as verified');
  assert(local.achievements.includes('explorador'),'Daily mission should unlock');
  const content=$('finishView').textContent.trim().slice(0,70);
  return {mode,correct:state.correct,score:state.score,rounds:local.rounds,
    mission:local.achievements.includes('explorador'),finished:true,summary:content};
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
      throw Error('Duel responsive layout: '+JSON.stringify({
        viewport:window.innerWidth,questionTop:side.top,ownRingTop:own.top,
        questionWidth:side.width,answerWidth:answer.width,
        matchHidden:document.getElementById('match').hidden,
        questionHidden:document.getElementById('questionPanel').hidden,
        orderQuestion:getComputedStyle(document.querySelector('#matchStage .question-side')).order,
        orderRing:getComputedStyle(document.getElementById('ownRingSide')).order
      }));
    if(window.innerWidth<=600){
      const share=document.getElementById('copyInvite').getBoundingClientRect();
      const spectator=document.getElementById('copySpectator').getBoundingClientRect();
      if(Math.abs(share.top-spectator.top)>2||
         share.width<100||spectator.width<100||
         share.height<44||spectator.height<44)
        throw Error('Duel room sharing must remain accessible side by side before play');
    }
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


async function qsmLongProbe(){
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
 buttons[1].classList.add('incorrect');
 // Background-color is animated. Assert after the CSS transition completes,
 // rather than misreporting its initial frame as the final computed state.
 await new Promise(resolve=>setTimeout(resolve,240));
 const bg=getComputedStyle(buttons[1]).backgroundColor;
 const rgb=(bg.match(/\d+/g)||[]).slice(0,3).map(Number);
 if(rgb.length!==3||rgb[0]<100||rgb[0]<rgb[1]*1.5)
  throw Error('Incorrect answer state not styled as red: '+bg);
 if(buttons.some(button=>button.scrollWidth>button.clientWidth+2||button.scrollHeight>button.clientHeight+2))
  throw Error('Long football option labels clipped in match');
 return {count:buttons.length,
  tallest:Math.round(Math.max(...buttons.map(b=>b.getBoundingClientRect().height))),
  narrowest:Math.round(Math.min(...buttons.map(b=>b.getBoundingClientRect().width))),failureColor:bg};
}


async function pasalaLiveFillProbe(){
  const $=id=>document.getElementById(id);
  async function until(fn,label){
    for(let i=0;i<125;i++){
      const value=fn(); if(value)return value;
      await new Promise(ok=>setTimeout(ok,100));
    }
    throw Error('Pasala hotfix '+label+' timed out');
  }
  const color=(letter,expected,cls)=>{
    const el=document.querySelector('#lettersContainer .letter[data-letter="'+letter+'"]');
    if(!el||!el.classList.contains(cls)||el.dataset.status!==cls)
      throw Error('Pasala '+letter+' expected '+cls+', got '+(el?.className||'missing')+' '+el?.dataset.status);
    const bg=getComputedStyle(el).backgroundColor;
    if(bg!==expected)throw Error('Pasala '+letter+' color expected '+expected+', got '+bg);
    return bg;
  };
  $('startGameButton').click();
  const enter=await until(()=>{
    const b=$('startGameAfterLoadingButton');
    return b&&!b.disabled?b:null;
  },'questions loaded');
  enter.click();
  await until(()=>document.querySelector('#lettersContainer .letter[data-letter="A"].active'),'initial active A');
  const pass=$('pasapalabraButton'),input=$('answerInput'),submit=$('submitAnswerBtnIcon');
  if(!pass||!input||!submit)throw Error('Missing real answer/pass controls');
  pass.click();
  await until(()=>document.querySelector('#lettersContainer .letter[data-letter="B"].active'),'B active after pass');
  color('A','rgb(255, 204, 69)','pending');
  const q=$('questionText').textContent;
  const bank=await (await fetch('assets/data/pasalache_2025.json')).json();
  const answer=bank.find(g=>g.letra==='B')?.preguntas.find(record=>record.pregunta===q)?.respuesta;
  if(!answer)throw Error('Real displayed B question missing in male football bank: '+q);
  input.value=answer;
  submit.click();
  await until(()=>document.querySelector('#lettersContainer .letter[data-letter="C"].active'),'C active after right B');
  color('B','rgb(33, 184, 135)','correct');
  input.value='zzzzzz_nonexistent_answer_999999';
  submit.click();
  await until(()=>document.querySelector('#lettersContainer .letter[data-letter="D"].active'),'D active after wrong C');
  color('C','rgb(226, 72, 92)','incorrect');
  // All subsequent letters pass and eventually return to yellow A.
  for(let k=68;k<=90;k++){
    const letter=String.fromCharCode(k);
    if(!document.querySelector('#lettersContainer .letter[data-letter="'+letter+'"].active'))
      throw Error('Wrong letter sequence at '+letter);
    pass.click();
  }
  await until(()=>document.querySelector('#lettersContainer .letter[data-letter="A"].active'),'A after full round');
  color('A','rgb(255, 204, 69)','pending');
  pass.click();
  color('A','rgb(255, 204, 69)','pending');
  color('B','rgb(33, 184, 135)','correct');
  color('C','rgb(226, 72, 92)','incorrect');
  return {passed:'yellow solid',correct:'green solid',incorrect:'red solid',roundTrip:true};
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
        const beforeReload=await command('Runtime.evaluate',{
          expression:"performance.timeOrigin",returnByValue:true
        });
        const oldOrigin=beforeReload.result?.value;
        await command('Runtime.evaluate',{expression:"localStorage.removeItem('wordle_game_state_v1')",returnByValue:true});
        await command('Page.reload',{ignoreCache:true});
        // A reload during a slow asset or daily-pool fetch can temporarily
        // leave the document without the game DOM. Wait for the actual game,
        // rather than relying on 1500ms to represent page readiness.
        let readiness=null;
        for(let attempt=0;attempt<32;attempt++){
          const check=await command('Runtime.evaluate',{
            expression:"(() => ({origin:performance.timeOrigin,ready:document.readyState,playfield:!!document.querySelector('.wordle-playfield'),columns:document.querySelector('#board')?.dataset.columns,tiles:document.querySelectorAll('#board .tile').length,keys:document.querySelectorAll('.keyboard button.key').length}))()",
            returnByValue:true
          });
          readiness=check.result?.value;
          if(readiness?.origin!==oldOrigin&&readiness?.ready==='complete'&&
             readiness?.playfield&&readiness?.tiles>=12&&readiness?.keys>=25)break;
          await sleep(250);
        }
        if(readiness?.origin===oldOrigin||readiness?.ready!=='complete'||
           !readiness?.playfield||readiness.tiles<12||readiness.keys<25)
          throw Error('Wordle game did not initialize after reload at '+width+': '+JSON.stringify(readiness));
        // Isolated local test server and browser profile. A real keyboard click,
        // localStorage persistence, navigation reload and validation are exercised.
        const first=await command('Runtime.evaluate',{
          expression:'('+checkWordleLiveLayout.toString()+')()',
          returnByValue:true
        });
        if(first.exceptionDetails||!first.result?.value?.moveSaved)
          throw Error('Wordle live interaction failed '+width+': '+
            JSON.stringify(first.exceptionDetails||first.result).slice(0,800));
        const firstReloadOrigin=readiness.origin;
        await command('Page.reload',{ignoreCache:true});
        // Verify this is a genuinely new document, not a stale CDP context.
        // Resolve the asynchronous daily-pool fetch before making persistence
        // assertions; a fixed 1.5s timer is not a reliable loading contract.
        let restored=null,diagnostics=null;
        for(let attempt=0;attempt<24;attempt++){
          const read=await command('Runtime.evaluate',{
            expression:"(() => {let saved=null;try{saved=JSON.parse(localStorage.getItem('wordle_game_state_v1')||'null')}catch{};return {origin:performance.timeOrigin,saved:saved?.board?.[0]?.[0],day:saved?.day,target:saved?.target,tile:document.querySelector('#board [data-row=\\\"0\\\"][data-col=\\\"0\\\"]')?.textContent,tiles:document.querySelectorAll('#board .tile').length,ready:document.readyState,message:document.getElementById('message')?.textContent}})()",
            returnByValue:true
          });
          diagnostics=read.result?.value;
          if(diagnostics?.origin!==firstReloadOrigin&&diagnostics?.ready==='complete'&&diagnostics?.tile==='M')break;
          await sleep(250);
        }
        if(diagnostics?.origin===firstReloadOrigin||diagnostics?.ready!=='complete'||diagnostics?.tile!=='M')throw Error('Wordle reload did not restore saved move at '+width+': '+JSON.stringify(diagnostics));
        restored=await command('Runtime.evaluate',{
          expression:'('+verifyWordleReload.toString()+')()',
          returnByValue:true
        });
        if(restored.exceptionDetails||restored.result?.value!==true)
          throw Error('Wordle live reload failed '+width+': '+
            JSON.stringify(restored.exceptionDetails||restored.result).slice(0,800));
        console.log('WORDLE LIVE '+width+'px: '+JSON.stringify(first.result.value));
      }
      if(args.fixture === 'ct7-live') {
        if(game==='profile.html'){
          const result=await command('Runtime.evaluate',{
            expression:"(()=>({xp:Number(document.getElementById('ct7ProfileXp')?.textContent||'0'),"+
              "wins:Number(document.getElementById('ct7ProfileCorrect')?.textContent||'0'),"+
              "entries:document.getElementById('ct7ProfileHistory')?.children.length||0,"+
              "medal:document.getElementById('ct7ProfileMedals')?.textContent||''}))()",
            returnByValue:true
          });
          const data=result.result?.value;
          if(result.exceptionDetails||!data||data.xp<=0||data.wins<6||data.entries<2||
             !data.medal.includes('Explorador'))
            throw Error('CT7 profile failed to display real local history '+width+': '+
              JSON.stringify(result.exceptionDetails||data).slice(0,700));
          console.log('CT7 PROFILE '+width+'px: '+JSON.stringify(data));
        }else{
          if(!['quien-soy.html','adivina-carrera.html'].includes(game))
            throw Error('ct7-live requires editorial games or local profile');
          const result=await command('Runtime.evaluate',{
            expression:'('+ct7LiveProbe.toString()+')()',
            returnByValue:true,awaitPromise:true
          });
          if(result.exceptionDetails||!result.result?.value?.finished)
            throw Error('CT7 REAL CHROME PLAY FAILED '+game+' '+width+': '+
              JSON.stringify(result.exceptionDetails||result.result).slice(0,1300));
          console.log('CT7 LIVE '+game+' '+width+'px: '+JSON.stringify(result.result.value));
        }
      }
      if(args.fixture==='pasala-fill'){
        if(game!=='pasalache.html')throw Error('pasala-fill requires pasalache.html');
        const result=await command('Runtime.evaluate',{
          expression:'('+pasalaLiveFillProbe.toString()+')()',
          returnByValue:true,awaitPromise:true
        });
        if(result.exceptionDetails||!result.result?.value?.roundTrip)
          throw Error('PASALA SOLID FILL REGRESSION at '+width+': '+
            JSON.stringify(result.exceptionDetails||result.result).slice(0,1100));
        console.log('PASALA SOLID FILL VERIFIED '+width+'px: '+JSON.stringify(result.result.value));
      }
      if(['match','bluff-long','qsm-long'].includes(args.fixture)) {
        // Offline duel clients may asynchronously restore their lobby after the
        // synthetic match DOM was staged. Retry that *display-only* staging a
        // bounded number of times; persistent geometry errors still fail.
        let result;
        for(let attempt=0;attempt<4;attempt++){
          result=await command('Runtime.evaluate',{
            expression:'('+stageMatchFixture.toString()+')('+JSON.stringify(game)+')',
            returnByValue:true,awaitPromise:true
          });
          if(!result.exceptionDetails && result.result?.value?.stageWidth)break;
          await sleep(300);
        }
        if(result.exceptionDetails || !result.result?.value?.stageWidth)
          throw Error('Match fixture injection failed: '+game+' '+JSON.stringify(result.exceptionDetails || result.result));
        await sleep(180);
      }
      if(args.fixture==='bluff-long'){
        if(game!=='mentiroso.html')throw Error('Fixture only for Mentiroso');
        const inspected=await command('Runtime.evaluate',{
          expression: "(() => {"+
            "const bid=document.getElementById('biddingPhase');"+
            "const phase=document.getElementById('validationPhase');"+
            "const progress=document.getElementById('validationProgress');"+
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
          returnByValue:true,awaitPromise:true
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
