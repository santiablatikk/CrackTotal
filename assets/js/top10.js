/* Top 10 - Juego Diario
   - Tema diario tomado de assets/data/top10_pool.json
   - Se aceptan apellidos (normalización simple)
   - Guarda progreso del día en localStorage: found, attempts, streak
*/
(function(){
  const STATE_KEY = 'top10_state_v1';
  const LAST_DAY_KEY = 'top10_last_day_v1';
  const ACCEPTED_VARIANTS = {
    'ronaldo': ['cristiano', 'c ronaldo'],
    'messi': ['leo messi','lionel'],
    'van persie': ['vanpersie', 'persie'],
    'higuaín': ['higuain','pipita'],
    'müller': ['muller']
  };

  let topic = null; // { id, title, source, answers: ['messi (AR)', ...] }
  let foundSet = new Set();
  let attempts = 0;
  let startTime = Date.now();
  let savedOnce = false;

  function normalize(s){
    return (s||'').toString().toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu,'')
      .replace(/[^a-z\s-]/g,'').replace(/\s+/g,' ').trim();
  }

  function isTodayKey(){
    const d = new Date();
    return `${d.getUTCFullYear()}-${d.getUTCMonth()+1}-${d.getUTCDate()}`;
  }

  async function pickDailyTopic(){
    // Cargar pool base + extendido si existe
    const [base, extra] = await Promise.all([
      fetch('assets/data/top10_pool.json').then(r=>r.json()),
      fetch('assets/data/top10_pool_extended.json').then(r=>r.json()).catch(()=>[])
    ]);
    const merged = Array.isArray(extra) ? base.concat(extra) : base;
    const pool = merged.length ? merged : base;
    const todayKey = isTodayKey();
    const seed = new Date(todayKey).getTime()/86400000; // días
    const idx = Math.floor((seed % pool.length + pool.length) % pool.length);
    topic = pool[idx];
  }

  function loadState(){
    const today = isTodayKey();
    const last = localStorage.getItem(LAST_DAY_KEY);
    const raw = localStorage.getItem(STATE_KEY);
    if (last === today && raw){
      try{
        const parsed = JSON.parse(raw);
        foundSet = new Set(parsed.found||[]);
        attempts = parsed.attempts||0;
        startTime = parsed.startTime||Date.now();
        savedOnce = !!parsed.savedOnce;
        return true;
      }catch{ return false; }
    }
    return false;
  }

  function saveState(){
    localStorage.setItem(LAST_DAY_KEY, isTodayKey());
    localStorage.setItem(STATE_KEY, JSON.stringify({
      found: Array.from(foundSet),
      attempts,
      startTime,
      savedOnce
    }));
  }

  function answerKey(ans){
    const idx = ans.indexOf('(');
    const base = idx>0 ? ans.slice(0, idx).trim() : ans.trim();
    return normalize(base);
  }

  function renderBoard(){
    const list = document.getElementById('answersList');
    list.innerHTML = '';
    topic.answers.forEach((ans, i)=>{
      const li = document.createElement('li');
      const pos = i+1;
      const solved = foundSet.has(ans);
      li.className = solved? 'solved' : '';
      const hint = ans.match(/\(([^)]+)\)/);
      const country = hint? hint[1] : '';
      const hintText = country? `(${country})` : '';
      li.innerHTML = `<span class="pos">${pos}.</span><span class="hint">${hintText}</span><span class="label">${solved? ans.toUpperCase(): '—'.repeat(6)}</span>`;
      list.appendChild(li);
    });
    document.getElementById('foundCount').innerHTML = `<i class="fas fa-check"></i> ${foundSet.size}/10`;
    const pf = document.getElementById('progressFill');
    if (pf) pf.style.width = `${foundSet.size * 10}%`;
  }

  function showMessage(msg){
    const el = document.getElementById('messageBox');
    el.textContent = msg;
    setTimeout(()=>{ el.textContent=''; }, 1500);
  }

  function expandVariants(s){
    const base = normalize(s);
    const variants = [base];
    Object.keys(ACCEPTED_VARIANTS).forEach(key=>{
      if (base===normalize(key)) variants.push(...ACCEPTED_VARIANTS[key].map(normalize));
    });
    return new Set(variants);
  }

  function trySubmit(value){
    if (!value) return;
    attempts += 1;
    const guessNorm = normalize(value);
    const guessSet = expandVariants(guessNorm);
    const matched = topic.answers.find(ans => guessSet.has(answerKey(ans)));
    if (matched){
      if (foundSet.has(matched)){
        showMessage('Ya lo tenías.');
      } else {
        foundSet.add(matched);
        renderBoard();
        pushGuessBadge(matched.toUpperCase(), true);
        showMessage('¡Acertaste!');
      }
    } else {
      pushGuessBadge(value, false);
      showMessage('No está en el Top 10.');
    }
    saveState();
    checkCompletion();
  }

  function pushGuessBadge(text, ok){
    const c = document.getElementById('guessesContainer');
    const b = document.createElement('span');
    b.className = 'guess';
    b.style.borderColor = ok? 'rgba(34,197,94,.45)' : 'rgba(239,68,68,.45)';
    b.style.background = ok? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.18)';
    b.textContent = text;
    c.prepend(b);
  }

  function checkCompletion(){
    if (foundSet.size === 10){
      const elapsed = Math.max(1, Math.floor((Date.now()-startTime)/1000));
      const mm = Math.floor(elapsed/60);
      const ss = (elapsed%60).toString().padStart(2,'0');
      document.getElementById('statFound').textContent = '10';
      document.getElementById('statAttempts').textContent = attempts.toString();
      document.getElementById('statTime').textContent = `${mm}:${ss}`;
      showResult(true);
      lockForToday();
      if (!savedOnce && window.firebaseService){
        savedOnce = true; saveState();
        try{
          window.firebaseService.saveMatch('top10', {
            playerName: localStorage.getItem('playerName') || 'Anónimo',
            score: 10,
            correctAnswers: 10,
            totalQuestions: 10,
            accuracy: 100,
            duration: elapsed,
            gameResult: 'victory',
            resultDescription: topic.title,
            gameVersion: '1.0'
          });
        }catch(e){ console.warn('Top10 saveMatch error', e); }
      }
    }
  }

  function showResult(won){
    const modal = document.getElementById('resultModal');
    document.getElementById('resultTitle').textContent = won? '¡Completado!' : 'Fin del intento';
    document.getElementById('resultMessage').textContent = won? '¡Top 10 completo!': 'Vuelve mañana para otro desafío.';
    modal.style.display = 'flex';
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
    tick(); setInterval(tick,1000);
  }

  // Timer de 2 minutos
  function startRoundTimer(){
    const total = 120; // segundos
    let left = total;
    const chip = document.getElementById('timerChip');
    const update = () => {
      const mm = String(Math.floor(left/60)).padStart(2,'0');
      const ss = String(left%60).padStart(2,'0');
      if (chip) chip.innerHTML = `<i class="fas fa-clock"></i> ${mm}:${ss}`;
      left -= 1;
      if (left < 0){
        // tiempo agotado
        showResult(false);
        lockForToday();
        clearInterval(timerId);
      }
    };
    update();
    const timerId = setInterval(update, 1000);
  }

  function attachHandlers(){
    const input = document.getElementById('surnameInput');
    const btn = document.getElementById('submitBtn');
    const submit = ()=>{ const v=input.value.trim(); input.value=''; trySubmit(v); input.focus(); };
    input.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); submit(); }});
    btn.addEventListener('click', submit);
    document.getElementById('shareTop10Btn')?.addEventListener('click', ()=>{
      const title = document.getElementById('topicTitle').textContent;
      const text = `Top 10 - ${title}\n✔ ${foundSet.size}/10 en ${attempts} intentos`;
      if (navigator.share){ navigator.share({ title: 'Top 10', text, url: location.href }).catch(()=>{}); }
      else { navigator.clipboard?.writeText(`${text} ${location.href}`); alert('Resultado copiado'); }
    });
  }

  async function init(){
    await pickDailyTopic();
    document.getElementById('topicTitle').textContent = topic.title;
    document.getElementById('gameNumber').innerHTML = `<i class="fas fa-hashtag"></i> Juego #${topic.id}`;
    if (!loadState()){ foundSet.clear(); attempts = 0; startTime = Date.now(); saveState(); }
    renderBoard();
    attachHandlers();
    // botón rendirse
    const giveUp = document.getElementById('giveUpBtn');
    if (giveUp){
      giveUp.addEventListener('click', ()=>{
        topic.answers.forEach(ans => foundSet.add(ans));
        renderBoard();
        showResult(false);
        lockForToday();
        saveState();
      });
    }
    startRoundTimer();
    if (foundSet.size === 10){ lockForToday(); document.getElementById('resultModal').style.display='flex'; }
  }

  document.addEventListener('DOMContentLoaded', init);
})();

