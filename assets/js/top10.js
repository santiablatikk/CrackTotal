/* Top 10 - desafío diario 4.2
   - Rotación estable de clasificaciones oficiales en top10_verified_v2.json
   - Nombres de equipos y alias verificados por reto, sin fuzzy matching
   - Guarda progreso del día en localStorage: found, attempts, streak
*/
(function(){
  const STATE_KEY = 'top10_state_v1';
  const LAST_DAY_KEY = 'top10_last_day_v1';
  const HISTORY_KEY = 'top10_history_v1'; // Independiente de los guardados diarios existentes.


  const verifiedCore = window.CTTop10Verified;
  let started = false;
  let topic = null; // { id, title, source, answers: ['messi (AR)', ...] }
  let challengeDay = ''; // Día UTC fijado al elegir el reto: cruzar medianoche no reescribe el día siguiente.
  let foundSet = new Set();
  let attempts = 0;
  let startTime = null;
  let savedOnce = false;
  let publishingResult = false;
  let finished = false;
  let wonToday = false;
  let elapsedSec = null;
  let roundTimer = null;

  function isTodayKey(){
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  async function pickDailyTopic(){
    if(!verifiedCore) throw new Error('Motor de rankings oficiales no disponible');
    const response=await fetch('assets/data/top10_verified_v2.json',{cache:'no-cache'});
    if(!response.ok)throw new Error('No se pudieron cargar los desafíos verificados');
    const pool=await response.json();
    const todayKey=isTodayKey();
    challengeDay = todayKey;
    topic=verifiedCore.pick(pool,todayKey);
  }

    function loadState(){
    const today = challengeDay;
    const last = localStorage.getItem(LAST_DAY_KEY);
    const raw = localStorage.getItem(STATE_KEY);
    if (last === today && raw){
      try{
        const parsed = JSON.parse(raw);
        if (parsed.topicId !== topic.id) return false;
        foundSet = new Set((parsed.found||[]).filter(answer => topic.answers.includes(answer)));
        attempts = parsed.attempts||0;
        startTime = Number.isFinite(parsed.startTime) ? parsed.startTime : null;
        started = typeof parsed.started === 'boolean' ? parsed.started : true;
        savedOnce = !!parsed.savedOnce;
        finished = !!parsed.finished;
        wonToday = !!parsed.won;
        elapsedSec = Number.isFinite(parsed.elapsedSec) ? parsed.elapsedSec : null;
        return true;
      }catch{ return false; }
    }
    return false;
  }

  function saveState(){
    localStorage.setItem(LAST_DAY_KEY, challengeDay);
    localStorage.setItem(STATE_KEY, JSON.stringify({
      topicId: topic.id,
      found: Array.from(foundSet),
      attempts,
      startTime,
      started,
      savedOnce,
      finished,
      won: wonToday,
      elapsedSec
    }));
  }

  // Historial local de partidas terminadas. No cambia los registros diarios ni Firebase.
  function readHistory(){
    try {
      const rows = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (!Array.isArray(rows)) return [];
      return rows.filter(row => row && /^\d{4}-\d{2}-\d{2}$/.test(row.day) &&
        typeof row.title === 'string' && Number.isInteger(row.score) &&
        row.score >= 0 && row.score <= 10).slice(0, 30);
    } catch { return []; }
  }

  function renderHistory(){
    const list = document.getElementById('top10History');
    if (!list) return;
    list.replaceChildren();
    const rows = readHistory().slice(0, 7);
    if (!rows.length) {
      const empty = document.createElement('li');
      empty.className = 'top10-history-empty';
      empty.textContent = 'Todavía no completaste desafíos en este dispositivo.';
      list.appendChild(empty);
      return;
    }
    rows.forEach(row => {
      const item = document.createElement('li');
      item.className = 'top10-history-item';
      const headline = document.createElement('strong');
      headline.textContent = row.day + ' · ' + row.title;
      const detail = document.createElement('span');
      const duration = Number.isFinite(row.seconds) ?
        Math.floor(row.seconds / 60) + ':' + String(row.seconds % 60).padStart(2, '0') : '—';
      detail.textContent = (row.won ? 'COMPLETADO' : 'FINALIZADO') + ' · ' + row.score +
        '/10 · ' + (Number.isInteger(row.attempts) ? row.attempts : '—') +
        ' intento' + (row.attempts === 1 ? '' : 's') + ' · ' + duration;
      item.append(headline, detail);
      list.appendChild(item);
    });
  }

  function recordHistory(){
    const day = challengeDay;
    const row = { day, topicId: topic.id, title: topic.title, score: foundSet.size,
      attempts, seconds: elapsedSec, won: wonToday };
    const rows = readHistory().filter(previous => previous.day !== day);
    rows.unshift(row);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(rows.slice(0, 30))); }
    catch (error) { console.warn('Top10: historial local no disponible', error); }
    renderHistory();
  }

  function renderBoard(revealAll = false){
    const list=document.getElementById('answersList');
    list.replaceChildren();
    topic.answers.forEach((ans,i)=>{
      const solved=foundSet.has(ans),visible=solved||revealAll;
      const li=document.createElement('li');
      li.className=solved?'solved':revealAll?'revealed':'';
      const pos=document.createElement('span');
      pos.className='pos';pos.textContent=String(i+1).padStart(2,'0');
      const name=document.createElement('span');
      name.className='label';name.textContent=visible?ans:'······';
      const stat=document.createElement('span');
      stat.className='top10-row-metric';stat.textContent=visible?topic.metric_values[i]+' pts':'—';
      li.append(pos,name,stat);list.appendChild(li);
    });
    document.getElementById('foundCount').textContent=foundSet.size+'/10';
    const progress=document.getElementById('progressFill');
    progress.style.width=(foundSet.size*10)+'%';
    document.querySelector('.top10-ranking-panel')?.setAttribute('aria-label', 'Ranking: '+foundSet.size+' de 10 respuestas acertadas');
  }
  let messageTimeout=null;
  function showMessage(text, type='info'){
    const el=document.getElementById('messageBox');
    clearTimeout(messageTimeout);el.textContent=text;
    el.dataset.result=type;
    messageTimeout=setTimeout(()=>{if(el.textContent===text)el.textContent='';},2200);
  }
  function trySubmit(value){
    if(!value||finished||!started)return;
    if(startTime!==null&&Date.now()-startTime>=120000){showResult(false);lockForToday();return}
    const idx=verifiedCore.match(topic,value);
    const matched=Number.isInteger(idx)?topic.answers[idx]:null;
    if(matched&&foundSet.has(matched)){showMessage('Ese equipo ya lo encontraste.','info');return}
    attempts+=1;
    if(matched){
      foundSet.add(matched);
      renderBoard();pushGuessBadge(matched,true);
      showMessage('¡Correcto! Puesto '+(idx+1)+' · '+topic.metric_values[idx]+' pts','correct');
      document.getElementById('answersList')?.children[idx]?.classList.add('newly-solved');
    }else{pushGuessBadge(value,false);showMessage('No está entre los diez primeros.','incorrect')}
    saveState();checkCompletion();
  }

    function pushGuessBadge(text, ok){
    const c = document.getElementById('guessesContainer');
    const b = document.createElement('span');
    b.className = 'guess';
    b.style.borderColor = ok? 'rgba(34,197,94,.45)' : 'rgba(239,68,68,.45)';
    b.style.background = ok? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.18)';
    b.textContent = text;
    c.prepend(b);
    while(c.children.length>8)c.lastElementChild.remove();
  }

  async function checkCompletion(){
    if (foundSet.size === 10 && !finished){
      finished = true; wonToday = true;
      saveState();
      const elapsed = Math.max(1, Math.floor((Date.now()-startTime)/1000));
      const mm = Math.floor(elapsed/60);
      const ss = (elapsed%60).toString().padStart(2,'0');
      document.getElementById('statFound').textContent = '10';
      document.getElementById('statAttempts').textContent = attempts.toString();
      document.getElementById('statTime').textContent = `${mm}:${ss}`;
      showResult(true);
      lockForToday();
      if (!savedOnce && !publishingResult && window.firebaseService){
        publishingResult = true;
        try{
          const playerName = window.CrackTotalProfile
            ? await window.CrackTotalProfile.ensurePlayerName({ reason: 'publish-score' })
            : localStorage.getItem('playerName');
          if (!playerName) return;

          const saved = await window.firebaseService.saveMatch('top10', {
            playerName,
            score: 10,
            correctAnswers: 10,
            totalQuestions: 10,
            accuracy: 100,
            duration: elapsed,
            gameResult: 'victory',
            resultDescription: topic.title,
            gameVersion: '1.0'
          });
          if (saved !== false) {
            savedOnce = true;
            saveState();
          }
        }catch(e){ console.warn('Top10 saveMatch error', e); }
      }
    }
  }

  let progressReported = false;
  function showResult(won){
    finished = true; wonToday = !!won;
    renderBoard(true);
    if (roundTimer !== null) { clearInterval(roundTimer); roundTimer = null; }
    document.getElementById('surnameInput').disabled = true;
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('giveUpBtn').disabled = true;
    if (elapsedSec === null) elapsedSec = Math.max(1, Math.min(120, Math.floor((Date.now()-startTime)/1000)));
    saveState();
    recordHistory();
    const elapsed = elapsedSec;
    document.getElementById('statFound').textContent = String(foundSet.size);
    document.getElementById('statAttempts').textContent = String(attempts);
    document.getElementById('statTime').textContent = `${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,'0')}`;
    const summary=document.getElementById('resultRanking');
    if(summary){
      summary.replaceChildren();
      topic.answers.forEach((answer,i)=>{
        const row=document.createElement('li');
        if(foundSet.has(answer))row.className='found';
        const rank=document.createElement('span');rank.textContent=String(i+1).padStart(2,'0');
        const name=document.createElement('strong');name.textContent=answer;
        const pts=document.createElement('span');pts.textContent=topic.metric_values[i]+' '+topic.unit;
        row.append(rank,name,pts);summary.appendChild(row);
      });
      const sourceLink=document.getElementById('resultSource');
      sourceLink.href=topic.source_url;
    }
    const modal = document.getElementById('resultModal');
    document.getElementById('gameNumber').textContent = 'FINALIZADO';
    document.getElementById('resultTitle').textContent = won? '¡Completado!' : 'Fin del intento';
    document.getElementById('resultMessage').textContent = won? '¡Top 10 completo!': `Encontraste ${foundSet.size} de 10. Mañana hay un nuevo desafío.`;
    modal.style.display = 'flex';
    document.getElementById('closeResultBtn')?.focus({preventScroll:true});
    if (!progressReported && window.CrackTotalProgressBridge) {
      progressReported = true;
      window.CrackTotalProgressBridge.reportMatch({
        gameId: 'top10',
        gameName: 'Top 10',
        won: Boolean(won),
        result: won ? 'victory' : 'defeat',
        score: foundSet.size,
        correctAnswers: foundSet.size,
        incorrectAnswers: Math.max(0, attempts - foundSet.size),
        durationSec: elapsed,
        perfect: Boolean(won),
        dailyChallenge: true
      });
    }
  }

  function lockForToday(){
    document.getElementById('dailyOverlay').style.display = 'flex';
    updateCountdown();
  }

  function updateCountdown(){
    const el = document.getElementById('overlayCountdown');
    const tick = () => {
      const now = new Date();
      const next = new Date(now); next.setUTCHours(24,0,0,0);
      const diff = Math.max(0, Math.floor((next-now)/1000));
      const h = String(Math.floor(diff/3600)).padStart(2,'0');
      const m = String(Math.floor((diff%3600)/60)).padStart(2,'0');
      const s = String(diff%60).padStart(2,'0');
      el.textContent = `Próximo en ${h}:${m}:${s}`;
    };
    tick(); if(!window.__ctTop10Countdown)window.__ctTop10Countdown=setInterval(tick,1000);
  }

  // El reloj se basa en startTime, guardado junto al tema. Recargar no suma tiempo.
  function startRoundTimer(){
    const chip = document.getElementById('timerChip');
    const update = () => {
      if (finished || !started) return;
      const left = Math.max(0, 120 - Math.floor((Date.now()-startTime)/1000));
      const mm = String(Math.floor(left/60)).padStart(2,'0');
      const ss = String(left%60).padStart(2,'0');
      if (chip){chip.textContent = `${mm}:${ss}`;chip.classList.toggle('is-urgent',left<=20);}
      if (left === 0) {
        showResult(false);
        lockForToday();
      }
    };
    update();
    if (!finished) roundTimer = setInterval(update,1000);
  }

  function attachHandlers(){
    const input = document.getElementById('surnameInput');
    const btn = document.getElementById('submitBtn');
    const submit = ()=>{if(!started||finished)return;const v=input.value.trim();input.value='';trySubmit(v);if(!finished)input.focus({preventScroll:true});};
    input.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); submit(); }});
    btn.addEventListener('click', submit);
    // El reto queda bloqueado por hoy, pero cerrar el resultado debe permitir
    // inspeccionar las diez posiciones. El antiguo aviso tapaba el ranking.
    const dismiss=()=>{
      document.getElementById('resultModal').style.display='none';
      if (finished) document.getElementById('dailyOverlay').style.display='none';
      document.getElementById('topicTitle')?.focus({preventScroll:true});
    };
    document.getElementById('closeResultBtn')?.addEventListener('click',dismiss);
    document.getElementById('viewRankingBtn')?.addEventListener('click',dismiss);
    document.getElementById('shareTop10Btn')?.addEventListener('click', ()=>{
      const title = document.getElementById('topicTitle').textContent;
      const marks=topic.answers.map(ans=>foundSet.has(ans)?'🟩':'⬛').join('');
      const text=`Crack Total · TOP 10 · ${challengeDay}\n${foundSet.size}/10 · ${marks}\n${title}`;
      if (navigator.share){ navigator.share({ title: 'Top 10', text, url: location.href }).catch(()=>{}); }
      else { navigator.clipboard?.writeText(`${text} ${location.href}`); alert('Resultado copiado'); }
    });
  }

  function begin(){
    if(started||finished)return;
    started=true;startTime=Date.now();
    document.getElementById('startOverlay').hidden=true;
    document.getElementById('top10GameCard').hidden=false;
    document.getElementById('surnameInput').disabled=false;
    document.getElementById('submitBtn').disabled=false;
    document.getElementById('giveUpBtn').disabled=false;
    saveState();startRoundTimer();
    document.getElementById('surnameInput').focus({preventScroll:true});
  }
  async function init(){
    try{await pickDailyTopic()}
    catch(error){
      console.error('Top 10: official challenge unavailable',error);
      document.getElementById('startOverlay').hidden=false;
      document.getElementById('startOverlayTitle').textContent='Desafío no disponible';
      document.getElementById('startOverlayDetail').textContent='No se pudo cargar el ranking oficial del día.';
      document.getElementById('startBtn').hidden=true;
      return;
    }
    document.getElementById('topicTitle').textContent=topic.title;
    document.getElementById('topicCategory').textContent=topic.competition+' · '+topic.season;
    document.getElementById('startCompetition').textContent=topic.competition.toUpperCase()+' / '+topic.season;
    document.getElementById('startOverlayDetail').textContent=topic.title+' Tenés 120 segundos para encontrar los diez clubes de la clasificación final.';
    document.getElementById('gameNumber').textContent='RETO DEL DÍA';
    const source=document.getElementById('topicSource');
    source.textContent=topic.source+' · Verificado '+topic.verified_at+' ↗';
    source.href=topic.source_url;
    source.target='_blank';source.rel='noopener noreferrer';
    if(!loadState()){
      const previous=localStorage.getItem(STATE_KEY);
      if(previous&&localStorage.getItem(LAST_DAY_KEY)===challengeDay){
        try{localStorage.setItem('top10_retired_backup_'+challengeDay,previous)}catch{}
      }
      foundSet.clear();attempts=0;started=false;startTime=null;
      savedOnce=false;finished=false;wonToday=false;elapsedSec=null;saveState();
    }
    renderBoard();renderHistory();attachHandlers();
    document.getElementById('startBtn').addEventListener('click',begin);
    document.getElementById('giveUpBtn').addEventListener('click',()=>{
      if(!started||finished)return;
      showResult(false);lockForToday();
    });
    if(finished){
      document.getElementById('startOverlay').hidden=true;
      document.getElementById('top10GameCard').hidden=false;
      progressReported=true;showResult(wonToday);lockForToday();
    }else if(started){
      document.getElementById('startOverlay').hidden=true;
      document.getElementById('top10GameCard').hidden=false;
      document.getElementById('surnameInput').disabled=false;
      document.getElementById('submitBtn').disabled=false;
      document.getElementById('giveUpBtn').disabled=false;
      startRoundTimer();
    }else{
      document.getElementById('startOverlay').hidden=false;
      document.getElementById('top10GameCard').hidden=true;
      document.getElementById('startBtn').focus({preventScroll:true});
    }
  }

    document.addEventListener('DOMContentLoaded', init);
})();

