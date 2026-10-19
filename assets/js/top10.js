/* Top 10 - Juego Diario
   - Tema diario tomado de assets/data/top10_pool.json
   - Se aceptan apellidos (normalización simple)
   - Guarda progreso del día en localStorage: found, attempts, streak
*/
(function(){
  const STATE_KEY = 'top10_state_v1';
  const LAST_DAY_KEY = 'top10_last_day_v1';
  const HISTORY_KEY = 'top10_history_v1'; // Independiente de los guardados diarios existentes.
  const ACCEPTED_VARIANTS = {
    'ronaldo': ['cristiano', 'c ronaldo'],
    'messi': ['leo messi','lionel'],
    'van persie': ['vanpersie', 'persie'],
    'higuaín': ['higuain','pipita'],
    'müller': ['muller'],
    'paris saint-germain': ['psg', 'paris sg'],
    'psg': ['paris saint-germain', 'paris sg'],
    'españa': ['spain', 'seleccion espanola'],
    'dembélé': ['dembele', 'ousmane dembele'],
    'flamengo': ['cr flamengo', 'mengao'],
    'álvarez': ['alvarez', 'julian alvarez', 'julian'],
    'alvarez': ['álvarez', 'julian alvarez', 'julian']
  };

  const ISO2 = {
    ARG:'AR', AR:'AR', BRA:'BR', BR:'BR', URU:'UY', UY:'UY', CHI:'CL', CL:'CL',
    COL:'CO', CO:'CO', PER:'PE', PE:'PE', PAR:'PY', PY:'PY', ECU:'EC', EC:'EC',
    BOL:'BO', BO:'BO', VEN:'VE', VE:'VE', MEX:'MX', MX:'MX', USA:'US', US:'US',
    CAN:'CA', CA:'CA', ESP:'ES', ES:'ES', POR:'PT', PT:'PT', FRA:'FR', FR:'FR',
    ITA:'IT', IT:'IT', GER:'DE', DE:'DE', NED:'NL', NL:'NL', BEL:'BE', BE:'BE',
    ENG:'GB', GBR:'GB', GB:'GB', SCO:'GB', WAL:'GB', IRL:'IE', IE:'IE',
    SWE:'SE', SE:'SE', NOR:'NO', NO:'NO', DEN:'DK', DK:'DK', POL:'PL', PL:'PL',
    UKR:'UA', UA:'UA', CRO:'HR', HR:'HR', SRB:'RS', RS:'RS', SUI:'CH', SUIZ:'CH', CH:'CH',
    AUT:'AT', AT:'AT', TUR:'TR', TR:'TR', GRE:'GR', GR:'GR', RUS:'RU', RU:'RU',
    JPN:'JP', JP:'JP', KOR:'KR', KR:'KR', AUS:'AU', AU:'AU', NGA:'NG', NG:'NG',
    SEN:'SN', SN:'SN', CIV:'CI', CI:'CI', CMR:'CM', CM:'CM', GHA:'GH', GH:'GH',
    MAR:'MA', MA:'MA', EGY:'EG', EG:'EG', RSA:'ZA', ZA:'ZA', QAT:'QA', QA:'QA',
    UAE:'AE', AE:'AE', KSA:'SA', SA:'SA', CHN:'CN', CN:'CN'
  };

  function toIso2(code){
    if (!code) return '';
    const raw = String(code).trim().toUpperCase().replace(/[^A-Z]/g,'');
    return ISO2[raw] || (raw.length === 2 ? raw : '');
  }

  function flagEmoji(iso2){
    if (!iso2 || iso2.length !== 2) return '';
    const A = 0x1F1E6;
    return String.fromCodePoint(
      A + iso2.charCodeAt(0) - 65,
      A + iso2.charCodeAt(1) - 65
    );
  }

  function flagMarkup(code){
    const iso2 = toIso2(code);
    if (!iso2) return '';
    const emoji = flagEmoji(iso2);
    // Prefer local SVG crest/flag when present; fall back to emoji (no hotlink).
    return `<img class="flag" src="assets/images/flags/${iso2.toLowerCase()}.svg" width="20" height="14" alt="" loading="lazy" decoding="async" data-emoji="${emoji}" onerror="this.outerHTML='<span class=\\'flag-emoji\\' aria-hidden=\\'true\\'>'+this.dataset.emoji+'</span>'" /><span class="sr-only">${iso2}</span>`;
  }

  let topic = null; // { id, title, source, answers: ['messi (AR)', ...] }
  let challengeDay = ''; // Día UTC fijado al elegir el reto: cruzar medianoche no reescribe el día siguiente.
  let foundSet = new Set();
  let attempts = 0;
  let startTime = Date.now();
  let savedOnce = false;
  let publishingResult = false;
  let finished = false;
  let wonToday = false;
  let elapsedSec = null;
  let roundTimer = null;

  function normalize(s){
    return (s||'').toString().toLowerCase()
      .replace(/ø/g,'o').replace(/æ/g,'ae').replace(/œ/g,'oe').replace(/ß/g,'ss').replace(/ł/g,'l')
      .normalize('NFD').replace(/\p{Diacritic}/gu,'')
      .replace(/[^a-z\s]/g,' ').replace(/\s+/g,' ').trim();
  }

  function isTodayKey(){
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  async function pickDailyTopic(){
    // Cargar pool base + extendido si existe
    const [base, extra] = await Promise.all([
      fetch('assets/data/top10_pool.json').then(r=>r.json()),
      fetch('assets/data/top10_pool_extended.json').then(r=>r.json()).catch(()=>[])
    ]);
    const merged = Array.isArray(extra) ? base.concat(extra) : base;
    // Solo listas con fuente oficial documentada, fecha y diez respuestas distintas.
    // Conservamos las listas históricas sin auditar en disco, fuera del desafío diario.
    const pool = merged.filter(item => item.source_url && item.verified_at &&
      Array.isArray(item.answers) && item.answers.length === 10 &&
      new Set(item.answers.map(normalize)).size === 10);
    if (!pool.length) throw new Error('No hay desafíos diarios con fuentes verificadas.');
    const todayKey = isTodayKey();
    challengeDay = todayKey;
    const seed = new Date(todayKey).getTime()/86400000; // días
    const idx = Math.floor((seed % pool.length + pool.length) % pool.length);
    topic = pool[idx];
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
        startTime = parsed.startTime||Date.now();
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
      const hasClubHint = !!topic.hints?.[i];
      const flag = hasClubHint ? '' : (country ? flagMarkup(country) : '');
      const hintText = hasClubHint ? topic.hints[i] : (country ? `(${String(country).toUpperCase()})` : '');
      li.innerHTML = `<span class="pos">${pos}.</span><span class="hint">${flag}${hintText}</span><span class="label">${solved? ans.toUpperCase(): '—'.repeat(6)}</span>`;
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
    if (!value || finished) return;
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
    const modal = document.getElementById('resultModal');
    document.getElementById('resultTitle').textContent = won? '¡Completado!' : 'Fin del intento';
    document.getElementById('resultMessage').textContent = won? '¡Top 10 completo!': `Encontraste ${foundSet.size} de 10. Mañana hay un nuevo desafío.`;
    modal.style.display = 'flex';
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
    tick(); setInterval(tick,1000);
  }

  // El reloj se basa en startTime, guardado junto al tema. Recargar no suma tiempo.
  function startRoundTimer(){
    const chip = document.getElementById('timerChip');
    const update = () => {
      if (finished) return;
      const left = Math.max(0, 120 - Math.floor((Date.now()-startTime)/1000));
      const mm = String(Math.floor(left/60)).padStart(2,'0');
      const ss = String(left%60).padStart(2,'0');
      if (chip) chip.innerHTML = `<i class="fas fa-clock"></i> ${mm}:${ss}`;
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
    const source = document.getElementById('topicSource');
    if (source) { source.textContent = `${topic.source} · Verificado ${topic.verified_at} · Ver ranking original ↗`;
      source.href = topic.source_url; source.target = '_blank'; source.rel = 'noopener noreferrer'; }
    if (!loadState()) { foundSet.clear(); attempts = 0; startTime = Date.now(); savedOnce = false;
      finished = false; wonToday = false; elapsedSec = null; saveState(); }
    renderBoard();
    renderHistory();
    attachHandlers();
    // botón rendirse
    const giveUp = document.getElementById('giveUpBtn');
    if (giveUp){
      giveUp.addEventListener('click', ()=>{
        showResult(false);
        lockForToday();
        saveState();
      });
    }
    if (finished) {
      progressReported = true; // No volver a reportar una partida guardada al recargar.
      showResult(wonToday);
      lockForToday();
    } else startRoundTimer();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

