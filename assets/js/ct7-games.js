/**
 * Crack Total 7.0 — two editorial offline games, one factual bank.
 * Results are explicitly local-only and MUST NOT enter verified Firestore rankings.
 * No third-party dependencies, HTML injection, or guessed server scores.
 */
(function () {
  'use strict';
  var mode = document.body.dataset.ct7Mode;
  if (mode !== 'identity' && mode !== 'career') return;
  var $ = function (id) { return document.getElementById(id); };
  var DATA_URL = 'assets/data/career-challenge-verified.json';
  var PROGRESS_KEY = 'ct7:local-progress:v1';
  var SESSION_KEY = 'ct7:session:' + mode + ':v1';
  var LIMIT = 6;
  var records = [];
  var clubCrests = {};
  var byId = new Map();
  var state = null;
  var ramProgress = null;

  function normalized(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[’´]/g, "'").toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
      .replace(/\s+/g, ' ');
  }
  function readStore(storage, key) {
    try { return JSON.parse(storage.getItem(key) || 'null'); } catch (error) { return null; }
  }
  function writeStore(storage, key, value) {
    try { storage.setItem(key, JSON.stringify(value)); return true; } catch (error) { return false; }
  }
  function progress() {
    var saved = readStore(localStorage, PROGRESS_KEY);
    if (saved && saved.version === 1) return saved;
    return ramProgress || {
      version: 1, xp: 0, rounds: 0, correct: 0, games: 0, best: 0,
      streak: 0, lastDay: '', daily: {}, recentIds: [], achievements: [], history: []
    };
  }
  function saveProgress(p) {
    ramProgress = p;
    return writeStore(localStorage, PROGRESS_KEY, p);
  }
  function saveSession() { if (state) writeStore(sessionStorage, SESSION_KEY, state); }
  function current() { return state && byId.get(state.order[state.index]); }
  function todayUtc() { return new Date().toISOString().slice(0, 10); }
  function daysBetween(a, b) {
    return Math.floor((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
  }
  function getRandomInt(max) {
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      var bucket = new Uint32Array(1);
      window.crypto.getRandomValues(bucket);
      return bucket[0] % max;
    }
    return Math.floor(Math.random() * max);
  }
  function shuffled(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = getRandomInt(i + 1);
      var temp = copy[i]; copy[i] = copy[j]; copy[j] = temp;
    }
    return copy;
  }
  function makeOrder() {
    var recent = new Set(progress().recentIds || []);
    var fresh = shuffled(records.filter(function (item) { return !recent.has(item.id); }));
    var previous = shuffled(records.filter(function (item) { return recent.has(item.id); }));
    return fresh.concat(previous).slice(0, Math.min(LIMIT, records.length))
      .map(function (item) { return item.id; });
  }
  function initialRevealed(rec) {
    return mode === 'identity' ? 1 : Math.min(2, Math.max(1, rec.clubs.length - 1));
  }
  function availableClues(rec) { return mode === 'identity' ? rec.hints : rec.clubs; }

  // Approved portraits appear ONLY when a round is resolved. Never spoil the question.
  function approvedPortrait(rec) {
    var p = rec && rec.portrait;
    var allowedLicenses = {
      'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/',
      'CC BY-SA 2.0': 'https://creativecommons.org/licenses/by-sa/2.0/',
      'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/'
    };
    if (!p || allowedLicenses[p.license] !== p.license_url ||
        !/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\/[A-Za-z0-9_%().-]+\.(?:jpg|JPG)\?width=480$/.test(p.url) ||
        !/^https:\/\/commons\.wikimedia\.org\/wiki\/File:[^?#]+\.(?:jpg|JPG)$/.test(p.source_page) ||
        !p.creator || !p.checked_at || !p.caption) return null;
    return p;
  }
  function renderAnswerPortrait(rec) {
    var target = $('answerPortrait');
    target.replaceChildren();
    target.hidden = true;
    var portrait = approvedPortrait(rec);
    if (!portrait) return;
    var figure = document.createElement('figure');
    figure.className = 'ct7-portrait-figure';
    var image = document.createElement('img');
    image.className = 'ct7-player-portrait';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.width = 200; image.height = 264;
    image.alt = 'Fotografía de ' + rec.name;
    image.src = portrait.url;
    image.addEventListener('error', function () { target.hidden = true; target.replaceChildren(); });
    var caption = document.createElement('figcaption');
    var attribution = document.createElement('a');
    attribution.href = portrait.source_page;
    attribution.target = '_blank';
    attribution.rel = 'noopener noreferrer';
    attribution.textContent = 'Foto: ' + portrait.creator + ' · ' + portrait.license;
    var licenseLink = document.createElement('a');
    licenseLink.href = portrait.license_url;
    licenseLink.target = '_blank';
    licenseLink.rel = 'noopener noreferrer';
    licenseLink.textContent = 'Licencia';
    caption.appendChild(attribution);
    caption.appendChild(licenseLink);
    figure.appendChild(image);
    figure.appendChild(caption);
    target.appendChild(figure);
    target.hidden = false;
  }
  // Use authentic, documented club emblems only as factual team identification.
  // Trademarks remain the club's property. A monogram is the resilient fallback.
  function reviewedCrest(clubName) {
    var item = clubCrests[clubName];
    if (!item || item.license !== 'PD-textlogo' || item.trademark !== true ||
        !item.credit || !item.source_page || !item.checked_at ||
        !/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\/[A-Za-z0-9_%().-]+\.(?:png|svg)\?width=80$/.test(item.url) ||
        !/^https:\/\/commons\.wikimedia\.org\/wiki\/File:[A-Za-z0-9_%().-]+\.(?:png|svg)$/.test(item.source_page)) return null;
    return item;
  }
  function clubMarker(clubName) {
    var marker = document.createElement('span');
    marker.className = 'ct7-club-marker';
    marker.setAttribute('aria-hidden', 'true');
    var initials = String(clubName).replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 ]/g, '')
      .split(/\s+/).filter(Boolean).slice(0, 2).map(function (x) { return x[0]; }).join('').toUpperCase();
    marker.textContent = initials;
    var crest = reviewedCrest(clubName);
    if (crest) {
      var img = document.createElement('img');
      img.className = 'ct7-verified-club-crest';
      img.src = crest.url;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = '';
      img.title = clubName + ' · escudo identificativo (sin afiliación)';
      img.addEventListener('error', function () { marker.textContent = initials; });
      marker.replaceChildren(img);
    }
    return marker;
  }
  function setScreen(view) {
    ['start', 'play', 'answer', 'finish'].forEach(function (name) {
      $(name + 'View').hidden = name !== view;
    });
  }
  function status(message) { $('gameFeedback').textContent = message; }
  function refreshSide() {
    var p = progress();
    $('localXp').textContent = String(p.xp || 0);
    $('localWins').textContent = String(p.correct || 0);
    $('localStreak').textContent = String(p.streak || 0);
    var today = p.daily && p.daily[todayUtc()] || { rounds: 0, correct: 0 };
    var amount = Math.min(3, today.rounds || 0);
    $('missionProgress').style.width = (amount / 3 * 100) + '%';
    $('missionCounter').textContent = amount + ' / 3 RONDAS';
    $('dailyMission').textContent = amount >= 3
      ? 'Misión cumplida. Medalla Explorador desbloqueada en este dispositivo.'
      : 'Completá ' + (3 - amount) + ' ronda' + (3 - amount === 1 ? '' : 's') + ' hoy para ganar la medalla Explorador.';
  }
  function updateHeader() {
    var round = state ? Math.min(LIMIT, state.index + 1) : 0;
    $('roundLabel').textContent = 'RONDA ' + String(round).padStart(2, '0') + ' / 06';
    $('scoreLabel').textContent = String(state ? state.score : 0).padStart(4, '0') + ' PTS';
    var completed = state ? state.index + ((state.phase === 'answer' || state.phase === 'finish') ? 1 : 0) : 0;
    completed = Math.min(LIMIT, completed);
    $('roundProgress').setAttribute('aria-valuenow', String(completed));
    $('roundProgressFill').style.width = completed / LIMIT * 100 + '%';
  }
  function buildClues(rec) {
    var items = availableClues(rec);
    var list = $('clueList');
    list.replaceChildren();
    for (var i = 0; i < items.length; i++) {
      var row = document.createElement('div');
      row.className = 'ct7-clue' + (i < state.revealed ? ' is-revealed' : ' is-hidden');
      var counter = document.createElement('span');
      counter.className = 'ct7-clue-index';
      counter.textContent = String(i + 1).padStart(2, '0');
      var content = document.createElement('span');
      content.className = 'ct7-clue-body';
      content.textContent = i < state.revealed ? items[i] : 'Pista reservada';
      row.appendChild(counter);
      if (mode === 'career' && i < state.revealed) row.appendChild(clubMarker(items[i]));
      row.appendChild(content); list.appendChild(row);
    }
    $('revealLabel').textContent = state.revealed + ' / ' + items.length + ' PISTAS';
    $('attemptsLabel').textContent = (3 - state.attempts) + ' INTENTOS';
    $('revealButton').hidden = state.revealed >= items.length;
    $('revealButton').disabled = state.revealed >= items.length;
  }
  function showPlay() {
    var rec = current(); if (!rec) { finish(); return; }
    setScreen('play'); renderAnswerPortrait(null); updateHeader(); buildClues(rec);
    $('questionHeading').textContent = mode === 'identity' ? 'UN NOMBRE. CUATRO PISTAS.' : 'RECONSTRUÍ LA TRAYECTORIA.';
    $('guessInput').value = '';
    status('');
    $('guessInput').focus({ preventScroll: true });
    saveSession();
  }
  function recordResult(rec, won, points) {
    var p = progress(), day = todayUtc();
    if (!p.daily || typeof p.daily !== 'object') p.daily = {};
    if (!p.history || !Array.isArray(p.history)) p.history = [];
    if (!p.achievements || !Array.isArray(p.achievements)) p.achievements = [];
    if (p.lastDay !== day) {
      p.streak = p.lastDay && daysBetween(p.lastDay, day) === 1 ? (p.streak || 0) + 1 : 1;
      p.lastDay = day;
    }
    if (!p.daily[day]) p.daily[day] = { rounds: 0, correct: 0 };
    p.daily[day].rounds += 1;
    if (won) p.daily[day].correct += 1;
    p.rounds = (p.rounds || 0) + 1;
    if (won) p.correct = (p.correct || 0) + 1;
    p.xp = (p.xp || 0) + (won ? Math.max(10, Math.floor(points / 10)) : 0);
    p.recentIds = [rec.id].concat((p.recentIds || []).filter(function (id) { return id !== rec.id; })).slice(0, 12);
    p.history.unshift({ id: rec.id, mode: mode, won: won, points: points, date: day, scope: 'local-only' });
    p.history.length = Math.min(60, p.history.length);
    if (p.daily[day].rounds >= 3 && !p.achievements.includes('explorador')) p.achievements.push('explorador');
    if (p.correct >= 10 && !p.achievements.includes('observador')) p.achievements.push('observador');
    saveProgress(p);
    refreshSide();
  }
  function award(won) {
    if (!state || state.phase !== 'play') return;
    var rec = current(); if (!rec) return;
    var points = won ? Math.max(70, 400 - (state.revealed - 1) * 60 - state.attempts * 90) : 0;
    state.score += points;
    if (won) state.correct += 1;
    state.phase = 'answer';
    state.result = { won: won, points: points };
    recordResult(rec, won, points);
    saveSession();
    setScreen('answer'); updateHeader();
    $('answerState').textContent = won ? 'ACIERTO / JUGADA DE PRIMER NIVEL' : 'NO SALIÓ / LA PRÓXIMA ES TUYA';
    $('answerName').textContent = rec.name.toUpperCase();
    renderAnswerPortrait(rec);
    $('answerText').textContent = mode === 'identity'
      ? 'Pistas completas: ' + rec.hints.join(' · ')
      : 'Carrera de clubes: ' + rec.clubs.join(' → ');
    $('answerPoints').textContent = won ? '+' + points + ' PUNTOS' : '0 PUNTOS';
    $('answerSource').href = rec.source_urls[0];
    $('nextButton').textContent = state.index === state.order.length - 1 ? 'VER RESULTADO ↗' : 'SIGUIENTE JUGADOR ↗';
    $('nextButton').focus({ preventScroll: true });
  }
  function finish() {
    if (!state) return;
    if (state.phase !== 'finish') {
      var p = progress();
      p.games = (p.games || 0) + 1;
      p.best = Math.max(p.best || 0, state.score);
      saveProgress(p);
    }
    state.phase = 'finish'; saveSession();
    setScreen('finish'); updateHeader();
    $('finishHeading').textContent = state.correct >= 5 ? 'PARTIDAZO.' : state.correct >= 3 ? 'BUEN PARTIDO.' : 'HAY REVANCHA.';
    $('finishSummary').textContent = state.correct + ' jugadores identificados sobre ' + state.order.length + '. Tus puntos son locales y no modifican rankings competitivos.';
    var stats = $('finishNumbers'); stats.replaceChildren();
    [['PUNTOS', state.score], ['ACIERTOS', state.correct + ' / ' + state.order.length],
      ['XP LOCAL GANADA', progress().xp]].forEach(function (pair) {
      var row = document.createElement('div');
      var label = document.createElement('span'); label.textContent = pair[0];
      var val = document.createElement('strong'); val.textContent = pair[1];
      row.append(label, val); stats.append(row);
    });
    refreshSide();
  }
  function restore() {
    var saved = readStore(sessionStorage, SESSION_KEY);
    if (!saved || saved.version !== 1 || saved.mode !== mode ||
        !Array.isArray(saved.order) || saved.order.length !== LIMIT ||
        saved.order.some(function (id) { return !byId.has(id); }) ||
        !['play','answer','finish'].includes(saved.phase) ||
        !Number.isInteger(saved.index) || saved.index < 0 || saved.index >= LIMIT ||
        !Number.isFinite(saved.score) || saved.score < 0 || !Number.isInteger(saved.correct) ||
        !Number.isInteger(saved.revealed) || !Number.isInteger(saved.attempts)) return false;
    state = saved;
    if (state.phase === 'play') showPlay();
    else if (state.phase === 'answer') {
      // Persisted result was counted on the prior submit. Repaint only.
      var rec = current();
      setScreen('answer'); updateHeader();
      $('answerState').textContent = state.result && state.result.won ? 'ACIERTO / JUGADA DE PRIMER NIVEL' : 'NO SALIÓ / LA PRÓXIMA ES TUYA';
      $('answerName').textContent = rec.name.toUpperCase();
      renderAnswerPortrait(rec);
      $('answerText').textContent = mode === 'identity' ? 'Pistas completas: ' + rec.hints.join(' · ') : 'Carrera de clubes: ' + rec.clubs.join(' → ');
      $('answerPoints').textContent = state.result && state.result.won ? '+' + state.result.points + ' PUNTOS' : '0 PUNTOS';
      $('answerSource').href = rec.source_urls[0];
      $('nextButton').textContent = state.index === LIMIT - 1 ? 'VER RESULTADO ↗' : 'SIGUIENTE JUGADOR ↗';
    } else finish();
    return true;
  }
  function begin() {
    var order = makeOrder();
    if (order.length < LIMIT) { status('El catálogo todavía no contiene suficientes futbolistas.'); return; }
    state = { version: 1, mode: mode, order: order, index: 0, score: 0, correct: 0,
      attempts: 0, revealed: initialRevealed(byId.get(order[0])), phase: 'play', result: null };
    showPlay();
  }
  function submit(event) {
    event.preventDefault();
    if (!state || state.phase !== 'play') return;
    var answer = normalized($('guessInput').value);
    if (!answer) { status('Escribí un nombre antes de responder.'); return; }
    var rec = current();
    var accepted = [rec.name].concat(rec.aliases).map(normalized);
    if (accepted.includes(answer)) { award(true); return; }
    state.attempts += 1;
    if (state.attempts >= 3) { award(false); return; }
    $('attemptsLabel').textContent = (3 - state.attempts) + ' INTENTOS';
    status('No es ese futbolista. Te quedan ' + (3 - state.attempts) + ' intentos.');
    $('guessInput').select();
    saveSession();
  }
  function reveal() {
    if (!state || state.phase !== 'play') return;
    var rec = current(), max = availableClues(rec).length;
    if (state.revealed >= max) return;
    state.revealed++; buildClues(rec); saveSession();
  }
  function next() {
    if (!state || state.phase !== 'answer') return;
    if (state.index >= state.order.length - 1) { finish(); return; }
    state.index++;
    state.attempts = 0; state.revealed = initialRevealed(current()); state.phase = 'play';
    state.result = null;
    showPlay();
  }
  function init() {
    $('startButton').addEventListener('click', begin);
    $('guessForm').addEventListener('submit', submit);
    $('revealButton').addEventListener('click', reveal);
    $('passButton').addEventListener('click', function () { award(false); });
    $('nextButton').addEventListener('click', next);
    $('againButton').addEventListener('click', begin);
    refreshSide();
    fetch(DATA_URL, { cache: 'no-cache' }).then(function (response) {
      if (!response.ok) throw Error('HTTP ' + response.status);
      return response.json();
    }).then(function (json) {
      if (!json || !Array.isArray(json.records) || json.editorial_scope !== 'male-senior-football') throw Error('Catálogo inválido');
      clubCrests = json.club_crests && typeof json.club_crests === 'object' ? json.club_crests : {};
      records = json.records.filter(function (rec) {
        return rec && rec.id && rec.name && Array.isArray(rec.aliases) &&
          Array.isArray(rec.clubs) && rec.clubs.length >= 2 &&
          Array.isArray(rec.hints) && rec.hints.length === 4 &&
          Array.isArray(rec.source_urls) && rec.source_urls.length &&
          rec.source_urls.every(function (url) { return /^https:\/\/(www\.fifa\.com|inside\.fifa\.com|publications\.fifa\.com|www\.uefa\.com|es\.uefa\.com)\//.test(url); }) &&
          rec.verified_at && rec.verified_at <= todayUtc();
      });
      byId = new Map(records.map(function (rec) { return [rec.id, rec]; }));
      if (records.length < LIMIT) throw Error('Contenido insuficiente para jugar');
      $('startButton').disabled = false;
      restore();
    }).catch(function (error) {
      $('startButton').disabled = true;
      var alert = document.createElement('p');
      alert.className = 'ct7-feedback';
      alert.setAttribute('role', 'alert');
      alert.textContent = 'El catálogo no se pudo cargar. Probá de nuevo más tarde. (' + error.message + ')';
      $('startView').appendChild(alert);
    });
  }
  $('startButton').disabled = true;
  init();
})();
