(function() {
    'use strict';

    const BOARD_ROWS = 6;
    let target = '';
    let currentRow = 0;
    let currentCol = 0;
    let board = [];
    let keyboardState = {}; // letter -> 'correct' | 'present' | 'absent'
    let stats = { played: 0, streak: 0, best: 0, lastDayKey: '' };
    let startTime = Date.now();
    const GAME_KEY = 'wordle_game_state_v1';
    let rowRatings = [];
    let finished = false;
    let wonToday = false;
    let inputLocked = false;
    let boardResizeObserver = null;
    const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; };
    function saveGame(){
        try { localStorage.setItem(GAME_KEY, JSON.stringify({ day:todayKey(), target,
            board, currentRow, currentCol, rowRatings, keyboardState, finished, won:wonToday, startedAt:startTime })); } catch {}
    }
    function restoreGame(){
        let prior; try { prior = JSON.parse(localStorage.getItem(GAME_KEY) || 'null'); } catch { return false; }
        if (!prior || prior.day !== todayKey() || prior.target !== target || !Array.isArray(prior.board) || prior.board.length !== BOARD_ROWS) return false;
        if (!prior.board.every(r => Array.isArray(r) && r.length === target.length && r.every(v=>typeof v==='string' && v.length<=1))) return false;
        board = prior.board;
        if (Number.isFinite(prior.startedAt) && prior.startedAt>0 && prior.startedAt<=Date.now()) startTime=prior.startedAt;
        rowRatings = Array.isArray(prior.rowRatings) ? prior.rowRatings : [];
        currentRow = Math.max(0,Math.min(BOARD_ROWS,Number(prior.currentRow)||0));
        currentCol = Math.max(0,Math.min(target.length,Number(prior.currentCol)||0));
        finished = !!prior.finished; wonToday = !!prior.won;
        keyboardState = prior.keyboardState || {};
        board.forEach((row,r)=>row.forEach((letter,col)=>{
            paintTile(r,col,letter,!!letter);
            const tile = getTile(r,col);
            const status = rowRatings[r]?.[col];
            if (tile && ['correct','present','absent'].includes(status)) tile.classList.add(status);
        }));
        const restoredKeyboard = keyboardState;
        keyboardState = {};
        rowRatings.forEach((row,r)=>{ if (Array.isArray(row)) row.forEach((status,i)=>{
            if (['correct','present','absent'].includes(status) && /^[a-zñ]$/.test(board[r]?.[i]||'')) updateKeyboard(board[r][i],status);
        }); });
        Object.entries(restoredKeyboard).forEach(([letter,status])=>{
            if (/^[a-zñ]$/.test(letter) && ['correct','present','absent'].includes(status)) updateKeyboard(letter,status);
        });
        return true;
    }

    function normalizeWord(str) {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/[^a-zñ]/g, '');
    }

    async function pickDailyWord() {
        try {
            const res = await fetch('assets/data/wordle_pool.json?v=202505272312');
            const pool = await res.json();
            // daily seed by date
            const today = new Date();
            const seed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
            const idx = seed % pool.length;
            const entry = pool[idx];
            target = normalizeWord(entry.answer || entry.name || 'messi');
            setupBoard(target.length);
            loadStats();
            updateStreakDisplay();
            setDailyInfo(idx);
            restoreGame();
            // Mantener bloqueado el juego diario, sin inferir una victoria de la racha.
            if (window.stats.lastDayKey === todayKey() || finished) {
                disableInput();
                if (finished) openResultModal(wonToday);
                const ov = document.getElementById('dailyOverlay');
                if (ov) ov.style.display = 'grid';
            }
        } catch (e) {
            console.error('Wordle pool load error:', e);
            target = 'messi';
            setupBoard(target.length);
            loadStats();
            updateStreakDisplay();
        }
    }

    function setupBoard(wordLength) {
        const boardEl = document.getElementById('board');
        boardEl.innerHTML = '';
        boardEl.style.gridTemplateRows = `repeat(${BOARD_ROWS}, var(--tile-size))`;
        boardEl.style.gridAutoRows = `var(--tile-size)`;

        // Size from the real game card, not a guessed viewport offset.
        // Smaller gaps allow long surnames without cropping letters on phones.
        function sizeBoard() {
            const card = boardEl.closest('.wordle-card') || boardEl.parentElement;
            const css = getComputedStyle(card);
            const available = Math.max(160, Math.min(520,
                card.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight) - 4));
            const gap = Math.max(2, Math.min(6, Math.floor(available / (wordLength * 7))));
            const tile = Math.max(8, Math.min(52,
                Math.floor((available - gap * (wordLength - 1)) / wordLength)));
            boardEl.style.setProperty('--tile-gap', gap + 'px');
            boardEl.style.setProperty('--tile-size', tile + 'px');
            boardEl.style.setProperty('--tile-font', Math.max(9, Math.round(tile * .45)) + 'px');
        }
        if (boardResizeObserver) boardResizeObserver.disconnect();
        sizeBoard();
        if (typeof ResizeObserver !== 'undefined') {
            boardResizeObserver = new ResizeObserver(sizeBoard);
            boardResizeObserver.observe(boardEl.closest('.wordle-card') || boardEl.parentElement);
        }
        board = Array.from({ length: BOARD_ROWS }, () => Array(wordLength).fill(''));

        for (let r = 0; r < BOARD_ROWS; r++) {
            const row = document.createElement('div');
            row.className = 'board-row';
            row.style.gridTemplateColumns = `repeat(${wordLength}, var(--tile-size))`;
            for (let c = 0; c < wordLength; c++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.setAttribute('data-row', String(r));
                tile.setAttribute('data-col', String(c));
                row.appendChild(tile);
            }
            boardEl.appendChild(row);
        }

        buildKeyboard();
        setMessage('Escribí el apellido y presioná Enter');
        bindInput();
    }

    function setMessage(text) {
        const msg = document.getElementById('message');
        if (msg) msg.textContent = text || '';
    }

    function buildKeyboard() {
        const rows = [
            'qwertyuiop',
            'asdfghjklñ',
            '⌫zxcvbnm↵'
        ];
        const r1 = document.getElementById('row1');
        const r2 = document.getElementById('row2');
        const r3 = document.getElementById('row3');
        [r1, r2, r3].forEach(r => r.innerHTML = '');

        rows[0].split('').forEach(ch => r1.appendChild(createKey(ch)));
        rows[1].split('').forEach(ch => r2.appendChild(createKey(ch)));
        rows[2].split('').forEach(ch => r3.appendChild(createKey(ch)));
    }

    function createKey(ch) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'key';
        let label = ch;
        if (ch === '⌫') { btn.classList.add('wide'); label = 'Borrar'; }
        if (ch === '↵') { btn.classList.add('wide'); label = 'Enter'; }
        btn.textContent = label;
        btn.setAttribute('data-key', ch);
        if (ch === '⌫') btn.setAttribute('aria-label', 'Borrar letra');
        if (ch === '↵') btn.setAttribute('aria-label', 'Enviar intento');
        btn.addEventListener('click', onVirtualKey);
        return btn;
    }

    function onVirtualKey(e) {
        if (inputLocked || finished) return;
        const val = e.currentTarget.getAttribute('data-key');
        if (val === '⌫') { handleBackspace(); return; }
        if (val === '↵') { handleEnter(); return; }
        handleLetter(val);
    }

    function bindInput() {
        document.addEventListener('keydown', (e) => {
            if (inputLocked || finished || e.altKey || e.ctrlKey || e.metaKey ||
                e.target?.closest?.('button, a, input, textarea, select, [contenteditable="true"]') ||
                document.querySelector('.modal-overlay.active')) return;
            if (e.key === 'Backspace') { e.preventDefault(); handleBackspace(); return; }
            if (e.key === 'Enter') { e.preventDefault(); handleEnter(); return; }
            const letter = normalizeKey(e.key);
            if (letter) handleLetter(letter);
        });
    }

    function disableInput() {
        // El bloqueo debe persistir también para el teclado físico, no solo el virtual.
        // Nunca interceptar teclas de navegación ni bloquear toda la página.
        inputLocked = true;
        const keys = document.querySelectorAll('.key');
        keys.forEach(k => k.setAttribute('disabled','disabled'));
        setMessage('Juego diario completado. Volvé mañana.');
    }

    function setDailyInfo(idx) {
        const numEl = document.getElementById('gameNumber');
        const cdEl = document.getElementById('nextCountdown');
        const cdModalEl = document.getElementById('nextCountdownModal');
        if (numEl) numEl.textContent = String(idx + 1);
        function tick(){
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setHours(24,0,0,0);
            const ms = tomorrow - now;
            const h = String(Math.floor(ms/3600000)).padStart(2,'0');
            const m = String(Math.floor((ms%3600000)/60000)).padStart(2,'0');
            const s = String(Math.floor((ms%60000)/1000)).padStart(2,'0');
            const txt = `${h}:${m}:${s}`;
            if (cdEl) cdEl.textContent = txt;
            if (cdModalEl) cdModalEl.textContent = txt;
            const cdOv = document.getElementById('nextCountdownOverlay');
            if (cdOv) cdOv.textContent = txt;
        }
        tick();
        setInterval(tick, 1000);
        const rulesBtn = document.getElementById('openRulesBtn');
        const rulesModal = document.getElementById('wordleRulesModal');
        const closeRulesBtn = document.getElementById('closeRulesBtn');
        if (rulesBtn && rulesModal) {
            rulesBtn.onclick = () => rulesModal.classList.add('active');
        }
        if (closeRulesBtn && rulesModal) {
            closeRulesBtn.onclick = () => rulesModal.classList.remove('active');
        }
        if (rulesModal) {
            window.addEventListener('click', function onwr(e){
                if (e.target === rulesModal) {
                    rulesModal.classList.remove('active');
                    window.removeEventListener('click', onwr);
                }
            });
        }
    }

    function normalizeKey(k) {
        const ch = normalizeWord(k).replace(/[^a-zñ]/g, '');
        if (ch.length === 1) return ch;
        return '';
    }

    function handleLetter(letter) {
        if (inputLocked || finished || currentRow >= BOARD_ROWS) return;
        const wordLength = board[0].length;
        if (currentCol >= wordLength) return;
        board[currentRow][currentCol] = letter;
        paintTile(currentRow, currentCol, letter, true);
        // pop feedback
        const tile = getTile(currentRow, currentCol);
        if (tile) {
            tile.classList.remove('pop');
            // force reflow
            void tile.offsetWidth;
            tile.classList.add('pop');
        }
        currentCol++;
        saveGame();
    }

    function handleBackspace() {
        if (inputLocked || finished || currentRow >= BOARD_ROWS) return;
        if (currentCol === 0) return;
        currentCol--;
        board[currentRow][currentCol] = '';
        paintTile(currentRow, currentCol, '', false);
        saveGame();
    }

    function handleEnter() {
        if (inputLocked || finished || currentRow >= BOARD_ROWS) return;
        const wordLength = board[0].length;
        if (currentCol < wordLength) {
            setMessage('Faltan letras');
            // shake row
            for (let i = 0; i < wordLength; i++) {
                const t = getTile(currentRow, i);
                if (t) {
                    t.classList.remove('shake');
                    void t.offsetWidth;
                    t.classList.add('shake');
                }
            }
            return;
        }
        const guess = board[currentRow].join('');
        revealRow(guess);
    }

    function paintTile(r, c, letter, filled) {
        const tile = getTile(r, c);
        if (!tile) return;
        tile.textContent = letter.toUpperCase();
        tile.classList.toggle('filled', !!filled);
        tile.setAttribute('aria-label', filled ? 'Letra ' + letter.toUpperCase() : 'Casilla vacía');
    }

    function getTile(r, c) {
        return document.querySelector(`.tile[data-row="${r}"][data-col="${c}"]`);
    }

    function revealRow(guess) {
        const targetArr = target.split('');
        const guessArr = guess.split('');
        const result = Array(guessArr.length).fill('absent');
        const targetCount = {};

        // count letters in target
        targetArr.forEach(ch => targetCount[ch] = (targetCount[ch] || 0) + 1);

        // first pass: correct
        for (let i = 0; i < guessArr.length; i++) {
            if (guessArr[i] === targetArr[i]) {
                result[i] = 'correct';
                targetCount[guessArr[i]]--;
            }
        }
        // second pass: present
        for (let i = 0; i < guessArr.length; i++) {
            if (result[i] === 'correct') continue;
            const ch = guessArr[i];
            if (targetCount[ch] > 0) {
                result[i] = 'present';
                targetCount[ch]--;
            }
        }

        rowRatings[currentRow] = result;
        // paint
        for (let i = 0; i < guessArr.length; i++) {
            const tile = getTile(currentRow, i);
            tile.classList.add('revealing');
            setTimeout(() => {
                tile.classList.remove('revealing');
                tile.classList.remove('filled');
                tile.classList.add(result[i]);
                const statusNames = { correct: 'posición correcta', present: 'otra posición', absent: 'no está' };
                tile.setAttribute('aria-label', guessArr[i].toUpperCase() + ': ' + statusNames[result[i]]);
                updateKeyboard(guessArr[i], result[i]);
            }, 90 * i);
        }

        if (guess === target) {
            setMessage('¡Golazo! Adivinaste.');
            const attemptsUsed = currentRow + 1;
            currentRow = BOARD_ROWS; // lock
            finished = true; wonToday = true; saveGame();
            tryConfetti();
            registerResult(true,attemptsUsed,Math.max(1,Math.floor((Date.now()-startTime)/1000)));
            openResultModal(true);
            return;
        }

        currentRow++;
        currentCol = 0;
        if (currentRow >= BOARD_ROWS) {
            finished = true; wonToday = false; saveGame();
            setMessage(`La palabra era: ${target.toUpperCase()}`);
            registerResult(false,BOARD_ROWS,Math.max(1,Math.floor((Date.now()-startTime)/1000)));
            openResultModal(false);
        } else {
            saveGame();
            setMessage('Seguí intentando');
        }
    }

    function updateKeyboard(letter, state) {
        const better = (a, b) => {
            const rank = { absent: 0, present: 1, correct: 2 };
            return rank[b] > rank[a] ? b : a;
        };
        keyboardState[letter] = keyboardState[letter] ? better(keyboardState[letter], state) : state;
        const btn = document.querySelector(`.key[data-key="${letter}"]`);
        if (btn) {
            btn.classList.remove('correct', 'present', 'absent');
            btn.classList.add(keyboardState[letter]);
        }
    }

    // init
    document.addEventListener('DOMContentLoaded', pickDailyWord);

    function tryConfetti() {
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        const canvas = document.createElement('canvas');
        canvas.className = 'confetti-canvas';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        resize();
        const pieces = Array.from({length: 120}, () => newPiece());
        let frame = 0;
        const id = setInterval(() => {
            frame++;
            ctx.clearRect(0,0,canvas.width,canvas.height);
            pieces.forEach(p => {
                p.y += p.speed;
                p.x += Math.sin((frame+p.phase)/20);
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            });
            if (frame > 180) {
                clearInterval(id);
                window.removeEventListener('resize',resize);
                canvas.remove();
            }
        }, 16);

        window.addEventListener('resize', resize);
        function resize(){
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        function newPiece(){
            const colors = ['#22c55e','#f59e0b','#60a5fa','#ef4444','#a78bfa'];
            return { x: Math.random()*canvas.width, y: -20, size: 6+Math.random()*6, speed: 2+Math.random()*3, color: colors[(Math.random()*colors.length)|0], phase: Math.random()*100 };
        }
    }
})();

// ==== STATS & RESULT MODAL ====
(function(){
    const KEY = 'wordle_stats';
    const DAY_KEY = () => {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    };
    window.loadStats = function(){
        try {
            const raw = localStorage.getItem(KEY);
            const obj = raw ? JSON.parse(raw) : null;
            if (obj) window.stats = obj;
            if (!window.stats) window.stats = { played:0, streak:0, best:0, lastDayKey:'' };
        } catch { window.stats = { played:0, streak:0, best:0, lastDayKey:'' }; }
    };
    window.saveStats = function(){
        localStorage.setItem(KEY, JSON.stringify(window.stats));
    };
    window.updateStreakDisplay = function(){
        const el = document.getElementById('streakDisplay');
        if (!el) return;
        el.textContent = `Racha: ${window.stats.streak} | Mejor: ${window.stats.best}`;
    };
    window.registerResult = function(win,attemptsUsed,durationSec){
        const today = DAY_KEY();
        if (window.stats.lastDayKey === today) return; // evitar doble conteo
        window.stats.played += 1;
        if (win) {
            // si el día anterior fue la misma fecha-1, mantené racha, sino resetea antes de setear a 1
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate()-1);
            const yk = `${yesterday.getFullYear()}-${yesterday.getMonth()+1}-${yesterday.getDate()}`;
            if (window.stats.lastDayKey === yk) {
                window.stats.streak += 1;
            } else {
                window.stats.streak = 1;
            }
            if (window.stats.streak > window.stats.best) window.stats.best = window.stats.streak;
        } else {
            window.stats.streak = 0;
        }
        window.stats.lastDayKey = today;
        window.saveStats();
        window.updateStreakDisplay();
        publishResult(win,attemptsUsed,durationSec);
    };

    // Los intentos usados definen el puntaje: adivinar en la primera vale más que en la última.
    function scoreFor(win, attemptsUsed) {
        if (!win) return 0;
        return Math.max(10, 100 - (attemptsUsed - 1) * 15);
    }

    async function publishResult(win,attemptsUsed,durationSec) {
        const elapsed = Math.max(1, Number(durationSec)||1);
        const score = scoreFor(win, attemptsUsed);

        if (window.CrackTotalProgressBridge) {
            window.CrackTotalProgressBridge.reportMatch({
                gameId: 'wordle',
                gameName: 'Wordle Futbolero',
                won: win,
                score: score,
                correctAnswers: win ? 1 : 0,
                incorrectAnswers: win ? 0 : 1,
                durationSec: elapsed,
                dailyChallenge: true,
                meta: { attempts: attemptsUsed }
            });
        }

        if (!window.firebaseService || typeof window.firebaseService.saveMatch !== 'function') return;
        try {
            const playerName = window.CrackTotalProfile
                ? await window.CrackTotalProfile.ensurePlayerName({ reason: 'publish-score' })
                : localStorage.getItem('playerName');
            if (!playerName) return;

            await window.firebaseService.saveMatch('wordle', {
                playerName,
                score: score,
                correctAnswers: win ? 1 : 0,
                totalQuestions: 1,
                accuracy: win ? 100 : 0,
                duration: elapsed,
                gameResult: win ? 'victory' : 'defeat',
                resultDescription: win
                    ? `Adivinada en ${attemptsUsed} ${attemptsUsed === 1 ? 'intento' : 'intentos'}`
                    : 'No adivinó la palabra del día',
                gameVersion: '1.0'
            });
        } catch (error) {
            console.warn('Wordle saveMatch error', error);
        }
    }
    window.openResultModal = function(win){
        const modal = document.getElementById('wordleResultModal');
        if (!modal) return;
        const content = document.getElementById('wordleResultContent');
        const title = document.getElementById('resultTitle');
        const msg = document.getElementById('resultMessage');
        const badge = document.getElementById('resultBadge');
        const sPlayed = document.getElementById('statPlayed');
        const sStreak = document.getElementById('statStreak');
        const sBest = document.getElementById('statBest');
        if (title) title.textContent = win ? '¡GANASTE!' : 'PERDISTE';
        if (badge) {
            badge.textContent = win ? 'VICTORIA' : 'DERROTA';
            badge.className = `result-badge ${win ? 'win' : 'lose'}`;
        }
        if (content) {
            content.classList.remove('win','lose');
            content.classList.add(win ? 'win' : 'lose');
        }
        if (msg) msg.textContent = win ? '¡Gran partido! Volvé mañana para el desafío diario.' : 'No pasa nada, mañana hay revancha. Vuelve mañana para intentarlo de nuevo.';
        if (sPlayed) sPlayed.textContent = String(window.stats.played);
        if (sStreak) sStreak.textContent = String(window.stats.streak);
        if (sBest) sBest.textContent = String(window.stats.best);
        modal.classList.add('active');
        const closeBtn = document.getElementById('closeResultModal');
        if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
        const shareBtn = document.getElementById('shareWordleBtn');
        if (shareBtn) shareBtn.onclick = shareResult;
        window.addEventListener('click', function onw(e){
            if (e.target === modal) {
                modal.classList.remove('active');
                window.removeEventListener('click', onw);
            }
        });
    };
    function todayKeyForShare(){ return DAY_KEY(); }
    function shareResult(){
        let visual = '';
        try { const game = JSON.parse(localStorage.getItem('wordle_game_state_v1') || 'null');
            if (game?.day && Array.isArray(game.rowRatings)) visual = game.rowRatings.filter(Array.isArray).map(row=>
                row.map(status=>({correct:'🟩',present:'🟨',absent:'⬛'})[status] || '⬜').join('')).join('\n');
        } catch {}
        const text = `Wordle Futbolero · ${todayKeyForShare()}\n${visual}\nRacha: ${window.stats.streak} · Crack Total`;
        if (navigator.share) {
            navigator.share({ title: 'Wordle Futbolero', text, url: location.href }).catch(()=>{});
        } else {
            navigator.clipboard.writeText(`${text} - ${location.href}`);
            alert('Resultado copiado al portapapeles');
        }
    }
})();
