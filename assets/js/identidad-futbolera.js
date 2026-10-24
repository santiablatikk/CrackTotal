/* Crack Total 6.3 — Identidad Futbolera.
   Two self-contained single-player modes. Local results are NOT official online rankings. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const MODE = new URLSearchParams(location.search).get('modo') === 'carrera' ? 'carrera' : 'pistas';
  const TOTAL = 5;
  const SESSION = 'ct_identidad_partida_v1';
  const RECENT = 'ct_identidad_recientes_v1';
  const norm = value => String(value || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim();
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const remove = key => { try { localStorage.removeItem(key); } catch {} };
  let catalog = [];
  let game = null;
  let busy = false;

  function modeName() { return MODE === 'carrera' ? 'Adiviná la carrera' : '¿Quién soy?'; }
  function shuffle(items) {
    const list = items.slice();
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }
  function pool() {
    const eligible = catalog.filter(item => MODE === 'pistas' || item.clubes.length > 1);
    const recent = read(RECENT);
    const skip = Array.isArray(recent) ? recent : [];
    const fresh = shuffle(eligible.filter(item => !skip.includes(item.id)));
    const old = shuffle(eligible.filter(item => skip.includes(item.id)));
    return fresh.concat(old).slice(0, TOTAL).map(item => item.id);
  }
  function current() {
    return catalog.find(item => item.id === game?.ids[game.index]) || null;
  }
  function clues(item) { return MODE === 'carrera' ? item.clubes : item.pistas; }
  function save() { if (game && !game.ended) write(SESSION, game); }
  function flag(message,kind) {
    $('idStatus').textContent = message;
    $('idStatus').dataset.state = kind || 'neutral';
  }
  function displayList(list) {
    const root = $('idClues');
    root.replaceChildren();
    list.forEach((clue,i) => {
      const node = document.createElement('li');
      node.className = 'ctid-clue';
      const index = document.createElement('span');
      index.className = 'ctid-clue-index';
      index.textContent = String(i+1).padStart(2,'0');
      const text = document.createElement('span');
      text.className = 'ctid-clue-text';
      text.textContent = clue;
      node.append(index,text);
      root.append(node);
    });
  }
  function render() {
    if (!game || game.ended) return;
    const item = current();
    if (!item) { finish(); return; }
    const all = clues(item);
    game.visible = Math.min(all.length,Math.max(1,game.visible));
    $('idRound').textContent = String(game.index+1).padStart(2,'0') + ' / ' + TOTAL;
    $('idScore').textContent = String(game.score);
    $('idHits').textContent = String(game.correct);
    $('idQuestion').textContent = MODE === 'carrera'
      ? '¿De quién es esta trayectoria?' : '¿De qué futbolista hablamos?';
    $('idPrompt').textContent = MODE === 'carrera'
      ? 'Clubes destacados, ordenados por su primera etapa. No necesariamente son todos.'
      : 'Las pistas aparecen de a una. Cuantas menos necesites, más sumás.';
    displayList(all.slice(0,game.visible));
    $('idHint').disabled = game.revealed || game.visible >= all.length;
    $('idHint').textContent = game.visible >= all.length ? 'No quedan más pistas' :
      MODE === 'carrera' ? 'Revelar otro club' : 'Revelar otra pista';
    $('idHint').hidden = game.revealed;
    $('idSkip').hidden = game.revealed;
    $('idAnswer').hidden = game.revealed;
    $('idNext').hidden = !game.revealed;
    $('idReveal').hidden = !game.revealed;
    $('idSubmit').disabled = game.revealed;
    $('idProgress').style.width = Math.round((game.index / TOTAL)*100)+'%';
    $('idProgressTrack').setAttribute('aria-valuenow',String(game.index));
    if (game.revealed) {
      $('idSolution').textContent = item.nombre;
      $('idSource').href = item.fuente;
      $('idSource').rel = 'noopener noreferrer';
      $('idSource').textContent = 'Consultar la fuente de la trayectoria ↗';
      $('idNext').textContent = game.index === TOTAL - 1 ? 'Ver resultado final →' : 'Siguiente futbolista →';
    }
    save();
  }
  function persistRecent() {
    const old = read(RECENT);
    const seen = Array.isArray(old) ? old : [];
    write(RECENT,[...game.ids,...seen.filter(id=>!game.ids.includes(id))].slice(0,10));
  }
  function reveal(success,points,message) {
    game.revealed = true;
    if (success) { game.correct++; game.score += points; }
    else game.missed++;
    $('idAnswerInput').value = '';
    flag(message,success?'success':'danger');
    persistRecent();
    render();
    $('idNext').focus();
  }
  function answer(evt) {
    evt.preventDefault();
    if (busy || !game || game.revealed || game.ended) return;
    const value = norm($('idAnswerInput').value);
    if (!value) { flag('Escribí un nombre antes de confirmar.','warning'); return; }
    const item = current();
    const accepted = item.aliases.some(alias => norm(alias) === value) || norm(item.nombre) === value;
    if (accepted) {
      const score = Math.max(20,120-game.visible*20-game.attempts*10);
      reveal(true,score,'¡Era '+item.nombre+'! +'+score+' puntos.');
      return;
    }
    game.attempts++;
    $('idAnswerInput').value = '';
    if (game.attempts >= 3) {
      reveal(false,0,'Se terminaron los intentos. Era '+item.nombre+'.');
    } else {
      flag('No es. Te quedan '+(3-game.attempts)+' intentos.','warning');
      $('idAnswerInput').focus();
      save();
    }
  }
  function next() {
    if (!game || !game.revealed || game.ended) return;
    game.index++;
    if (game.index === TOTAL) { finish(); return; }
    game.visible = 1; game.attempts = 0; game.revealed = false;
    flag('Nueva ronda. Mirá bien las pistas.','neutral');
    render(); $('idAnswerInput').focus();
  }
  async function finish() {
    if (!game || game.ended) return;
    busy = true; game.ended = true; remove(SESSION);
    $('idPlay').hidden = true; $('idFinish').hidden = false;
    $('idFinalScore').textContent = String(game.score);
    $('idFinalHits').textContent = String(game.correct)+' de '+TOTAL;
    $('idFinalHeading').textContent = game.correct === TOTAL ? 'Partida perfecta.' :
      game.correct >= 3 ? 'Buen partido.' : 'Hay revancha.';
    $('idFinalDetail').textContent = 'Tu resultado es local. No entra en el ranking competitivo.';
    $('idProgress').style.width = '100%';
    const Progress = window.CrackTotalProgress;
    if (Progress && typeof Progress.recordMatch === 'function') {
      try {
        await Progress.init();
        Progress.recordMatch({
          id: 'identidad-'+MODE+'-'+game.startedAt,
          gameId: MODE === 'carrera' ? 'trayectoria' : 'quien-soy',
          gameName: modeName(), won: game.correct >= 3,
          result: game.correct >= 3 ? 'victory' : 'defeat',
          score: game.score, correctAnswers: game.correct,
          incorrectAnswers: game.missed,
          durationSec: Math.max(0,Math.round((Date.now()-game.startedAt)/1000)),
          meta: { verifiedOnline:false,version:'2026-10-24-v1',mode:MODE }
        });
      } catch (e) { $('idFinalDetail').textContent += ' No pudimos guardar el progreso local.'; }
    }
    busy = false;
  }
  function start() {
    if (busy || catalog.length < TOTAL) return;
    game = {mode:MODE,ids:pool(),index:0,visible:1,attempts:0,correct:0,missed:0,
      score:0,startedAt:Date.now(),revealed:false,ended:false,version:'2026-10-24-v1'};
    $('idPlay').hidden=false; $('idFinish').hidden=true;
    $('idAnswerInput').value='';
    flag('Ronda 1: confiá en tu memoria.','neutral');
    render();
    $('idAnswerInput').focus();
  }
  function init() {
    document.querySelectorAll('[data-identity-mode]').forEach(link=>{
      const active=link.dataset.identityMode===MODE;
      link.classList.toggle('is-active',active);
      if (active) link.setAttribute('aria-current','page');
    });
    $('idModeTag').textContent=MODE==='carrera'?'EL MAPA DE CLUBES':'CUATRO PISTAS';
    $('idModeName').textContent=modeName().toUpperCase();
    $('idModeDescription').textContent=MODE==='carrera'
      ? 'Seguí el recorrido del jugador. Cada club revelado vale una pista menos.'
      : 'Una identidad, cuatro pistas. Arriesgá temprano y llevate más puntos.';
    $('idAnswer').addEventListener('submit',answer);
    $('idHint').addEventListener('click',()=>{
      if(!game || game.revealed || game.ended)return;
      game.visible=Math.min(clues(current()).length,game.visible+1);
      flag('Una pista más. El puntaje máximo de esta ronda baja.','neutral');render();
    });
    $('idSkip').addEventListener('click',()=>{if(game&&!game.revealed)reveal(false,0,'Pasaste. Era '+current().nombre+'.')});
    $('idNext').addEventListener('click',next);
    $('idReplay').addEventListener('click',start);
    fetch('assets/data/identidad-futbolera.json',{cache:'no-store'}).then(r=>{
      if(!r.ok)throw Error('No se pudo cargar el banco');
      return r.json();
    }).then(data=>{
      if(!data || data.version!=='2026-10-24-v1' || !Array.isArray(data.jugadores))throw Error('Banco incompatible');
      catalog=data.jugadores.filter(item=>item && typeof item.id==='string' &&
        Array.isArray(item.aliases)&&Array.isArray(item.pistas)&&item.pistas.length===4 &&
        Array.isArray(item.clubes) && item.clubes.length>0 && typeof item.fuente==='string');
      const stored=read(SESSION);
      if(stored && stored.mode===MODE && stored.version===data.version &&
         !stored.ended && Date.now()-stored.startedAt<24*3600000 &&
         Array.isArray(stored.ids) && stored.ids.length===TOTAL &&
         stored.ids.every(id=>catalog.some(p=>p.id===id)) &&
         Number.isInteger(stored.index) && stored.index>=0&&stored.index<TOTAL &&
         Number.isInteger(stored.visible)&&stored.visible>0 &&
         Number.isInteger(stored.attempts)&&stored.attempts>=0&&stored.attempts<3 &&
         Number.isFinite(stored.score)&&stored.score>=0 &&
         Number.isInteger(stored.correct)&&stored.correct>=0&&stored.correct<=TOTAL &&
         Number.isInteger(stored.missed)&&stored.missed>=0&&stored.missed<=TOTAL) {
        game=stored;render();flag('Retomaste tu partida guardada en este dispositivo.','neutral');
      } else { start(); }
    }).catch(error=>{
      $('idLoadError').hidden=false;
      $('idLoadError').textContent='No pudimos cargar los jugadores. Revisá tu conexión e intentá recargar la página.';
      $('idPlay').hidden=true;
      console.warn('[Identidad Futbolera]',error.message);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
