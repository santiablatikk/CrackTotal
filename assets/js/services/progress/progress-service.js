/**
 * ProgressService — XP, levels, streaks, achievements, history.
 * UI components consume this facade only.
 */
(function () {
    'use strict';

    const Services = (window.CrackTotalServices = window.CrackTotalServices || {});
    const EVENT = 'cracktotal:progress-updated';
    const UNLOCK_EVENT = 'cracktotal:achievement-unlocked';
    const LEVEL_EVENT = 'cracktotal:level-up';
    const XP_EVENT = 'cracktotal:xp-gained';

    let state = null;
    let ready = false;
    let saveTimer = null;

    function cfg() {
        return window.CrackTotalGamificationConfig || {};
    }

    function todayKey(date) {
        const d = date instanceof Date ? date : new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }

    function shiftDayKey(key, delta) {
        const parts = String(key).split('-').map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        d.setDate(d.getDate() + delta);
        return todayKey(d);
    }

    function defaultAchievements() {
        const map = {};
        (cfg().achievements || []).forEach((def) => {
            map[def.id] = {
                id: def.id,
                progress: 0,
                target: def.target || 1,
                unlocked: false,
                unlockedAt: null
            };
        });
        return map;
    }

    function createDefaultState() {
        const name =
            (window.CrackTotalProfile && window.CrackTotalProfile.getPlayerName && window.CrackTotalProfile.getPlayerName()) ||
            (typeof localStorage !== 'undefined' ? localStorage.getItem('playerName') : '') ||
            '';
        return {
            version: cfg().version || 1,
            profile: {
                displayName: name || 'Invitado',
                createdAt: new Date().toISOString(),
                lastActiveAt: new Date().toISOString()
            },
            xp: { total: 0, events: [] },
            streak: { current: 0, best: 0, lastPlayDate: null },
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                correctAnswers: 0,
                incorrectAnswers: 0,
                totalPlayTimeSec: 0,
                dailyChallenges: 0,
                perfectRoscos: 0,
                triviaWins: 0,
                byGame: {}
            },
            achievements: defaultAchievements(),
            badges: [],
            history: { matches: [], achievements: [], activity: [] },
            meta: { legacyMigrated: false }
        };
    }

    function ensureAchievements(s) {
        const defs = cfg().achievements || [];
        defs.forEach((def) => {
            if (!s.achievements[def.id]) {
                s.achievements[def.id] = {
                    id: def.id,
                    progress: 0,
                    target: def.target || 1,
                    unlocked: false,
                    unlockedAt: null
                };
            } else {
                s.achievements[def.id].target = def.target || s.achievements[def.id].target || 1;
            }
        });
    }

    function emit(name, detail) {
        try {
            window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
        } catch (error) {
            /* ignore */
        }
    }

    function scheduleSave() {
        if (saveTimer) window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(() => {
            if (Services.ProgressStorage) Services.ProgressStorage.save(state);
        }, 80);
    }

    function persistNow() {
        if (saveTimer) {
            window.clearTimeout(saveTimer);
            saveTimer = null;
        }
        if (Services.ProgressStorage) return Services.ProgressStorage.save(state);
        return Promise.resolve(false);
    }

    function levelsSorted() {
        return (cfg().levels || []).slice().sort((a, b) => a.minXp - b.minXp);
    }

    function resolveLevel(totalXp) {
        const levels = levelsSorted();
        let current = levels[0] || { id: 'novato', name: 'Novato', minXp: 0 };
        let next = null;
        for (let i = 0; i < levels.length; i += 1) {
            if (totalXp >= levels[i].minXp) current = levels[i];
            if (levels[i].minXp > totalXp) {
                next = levels[i];
                break;
            }
        }
        if (!next && levels.length) {
            const last = levels[levels.length - 1];
            if (current.id === last.id) next = null;
        }
        const floor = current.minXp || 0;
        const ceiling = next ? next.minXp : floor + 500;
        const span = Math.max(1, ceiling - floor);
        const into = Math.max(0, totalXp - floor);
        const progress = next ? Math.min(1, into / span) : 1;
        return {
            current: current,
            next: next,
            xpIntoLevel: into,
            xpForNext: next ? span : 0,
            progress: progress,
            totalXp: totalXp
        };
    }

    function pushActivity(type, message, meta) {
        const item = {
            id: 'act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            type: type,
            message: message,
            at: new Date().toISOString(),
            meta: meta || {}
        };
        state.history.activity.unshift(item);
        const limit = cfg().activityLimit || 50;
        if (state.history.activity.length > limit) {
            state.history.activity = state.history.activity.slice(0, limit);
        }
        return item;
    }

    function awardXp(eventId, meta) {
        const table = cfg().xpTable || {};
        const row = table[eventId];
        if (!row || !row.amount) return null;
        const before = resolveLevel(state.xp.total);
        state.xp.total += Number(row.amount) || 0;
        const entry = {
            id: 'xp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            eventId: eventId,
            amount: row.amount,
            label: row.label || eventId,
            at: new Date().toISOString(),
            meta: meta || {}
        };
        state.xp.entries.unshift(entry);
        const xpLimit = cfg().xpHistoryLimit || 80;
        if (state.xp.entries.length > xpLimit) state.xp.entries = state.xp.entries.slice(0, xpLimit);

        const after = resolveLevel(state.xp.total);
        emit(XP_EVENT, { entry: entry, level: after });
        pushActivity('xp', '+' + row.amount + ' XP · ' + entry.label, { eventId: eventId });

        if (after.current.id !== before.current.id) {
            const bonus = table.level_up_bonus;
            if (bonus && bonus.amount) {
                state.xp.total += Number(bonus.amount) || 0;
                state.xp.entries.unshift({
                    id: 'xp_lvl_' + Date.now(),
                    eventId: 'level_up_bonus',
                    amount: bonus.amount,
                    label: bonus.label || 'Bonus de nivel',
                    at: new Date().toISOString(),
                    meta: { levelId: after.current.id }
                });
            }
            pushActivity('level', 'Subiste a ' + after.current.name, { levelId: after.current.id });
            emit(LEVEL_EVENT, { level: after.current, previous: before.current });
            if (after.current.id === 'leyenda') grantBadge('badge_legend');
        }
        return entry;
    }

    function grantBadge(badgeId) {
        if (!badgeId) return;
        if (state.badges.indexOf(badgeId) !== -1) return;
        state.badges.push(badgeId);
        const def = (cfg().badges || []).find((b) => b.id === badgeId);
        pushActivity('badge', 'Insignia: ' + ((def && def.name) || badgeId), { badgeId: badgeId });
    }

    function progressValueFor(rule) {
        const stats = state.stats;
        if (!rule || !rule.type) return 0;
        switch (rule.type) {
            case 'games_played':
                return stats.gamesPlayed;
            case 'wins':
                return stats.gamesWon;
            case 'correct_answers':
                return stats.correctAnswers;
            case 'streak_days':
                return state.streak.current;
            case 'perfect_rosco':
                return stats.perfectRoscos;
            case 'daily_challenge':
                return stats.dailyChallenges;
            case 'trivia_wins':
                return stats.triviaWins;
            case 'game_wins': {
                const g = stats.byGame[rule.gameId] || {};
                return g.wins || 0;
            }
            default:
                return 0;
        }
    }

    function evaluateAchievements(context) {
        const unlockedNow = [];
        (cfg().achievements || []).forEach((def) => {
            const row = state.achievements[def.id];
            if (!row || row.unlocked) return;

            let progress = progressValueFor(def.rule);
            if (def.rule && def.rule.type === 'perfect_rosco' && context && context.perfectRosco) {
                progress = Math.max(progress, 1);
            }
            row.progress = Math.min(def.target || 1, progress);
            if (row.progress >= (def.target || 1)) {
                row.unlocked = true;
                row.unlockedAt = new Date().toISOString();
                unlockedNow.push(def);
                state.history.achievements.unshift({
                    id: def.id,
                    title: def.title,
                    at: row.unlockedAt
                });
                if (state.history.achievements.length > 30) {
                    state.history.achievements = state.history.achievements.slice(0, 30);
                }
                if (def.badgeId) grantBadge(def.badgeId);
                awardXp('achievement_unlock', { achievementId: def.id });
                pushActivity('achievement', 'Logro: ' + def.title, { achievementId: def.id });
                emit(UNLOCK_EVENT, { achievement: def, state: row });
            }
        });
        return unlockedNow;
    }

    function updateStreak(playDateKey) {
        const key = playDateKey || todayKey();
        const prev = state.streak.lastPlayDate;
        let gainedStreakXp = false;

        if (!prev) {
            state.streak.current = 1;
        } else if (prev === key) {
            // same day — keep streak
        } else if (prev === shiftDayKey(key, -1)) {
            state.streak.current += 1;
            gainedStreakXp = true;
        } else {
            state.streak.current = 1;
        }

        state.streak.lastPlayDate = key;
        if (state.streak.current > state.streak.best) state.streak.best = state.streak.current;
        if (gainedStreakXp && state.streak.current > 1) {
            awardXp('streak_day', { streak: state.streak.current });
        }
        return state.streak;
    }

    function ensureGameBucket(gameId) {
        if (!state.stats.byGame[gameId]) {
            state.stats.byGame[gameId] = {
                played: 0,
                wins: 0,
                correct: 0,
                incorrect: 0,
                playTimeSec: 0
            };
        }
        return state.stats.byGame[gameId];
    }

    function isTriviaGame(gameId) {
        return ['top10', 'quiensabemas', 'mentiroso', 'wordle'].indexOf(gameId) !== -1;
    }

    function snapshot() {
        const level = resolveLevel(state.xp.total);
        const accuracyDen = state.stats.correctAnswers + state.stats.incorrectAnswers;
        const accuracy = accuracyDen > 0 ? Math.round((state.stats.correctAnswers / accuracyDen) * 100) : 0;
        const achievementDefs = cfg().achievements || [];
        const achievements = achievementDefs.map((def) => {
            const row = state.achievements[def.id] || {
                progress: 0,
                target: def.target,
                unlocked: false,
                unlockedAt: null
            };
            return Object.assign({}, def, {
                progress: row.progress || 0,
                target: row.target || def.target || 1,
                unlocked: Boolean(row.unlocked),
                unlockedAt: row.unlockedAt || null
            });
        });
        const badgeDefs = cfg().badges || [];
        const badges = badgeDefs.map((b) =>
            Object.assign({}, b, { earned: state.badges.indexOf(b.id) !== -1 })
        );

        const xpEntries = Array.isArray(state.xp && state.xp.entries) ? state.xp.entries : [];
        const matches = (state.history && Array.isArray(state.history.matches)) ? state.history.matches : [];
        const achHistory = (state.history && Array.isArray(state.history.achievements)) ? state.history.achievements : [];
        const activity = (state.history && Array.isArray(state.history.activity)) ? state.history.activity : [];

        return {
            profile: Object.assign({}, state.profile),
            xp: { total: (state.xp && state.xp.total) || 0, entries: xpEntries.slice(0, 12) },
            level: level,
            streak: Object.assign({}, state.streak || { current: 0, best: 0, lastPlayDate: null }),
            stats: Object.assign({}, state.stats || {}, { accuracy: accuracy }),
            achievements: achievements,
            badges: badges,
            history: {
                matches: matches.slice(0, 12),
                achievements: achHistory.slice(0, 8),
                activity: activity.slice(0, 12)
            },
            unlockedCount: achievements.filter((a) => a.unlocked).length,
            totalAchievements: achievements.length
        };
    }

    function notify(options) {
        emit(EVENT, { snapshot: snapshot() });
        if (options && options.immediate) {
            persistNow();
        } else {
            scheduleSave();
        }
    }

    async function init() {
        if (ready && state) return snapshot();
        const stored = Services.ProgressStorage ? await Services.ProgressStorage.load() : null;
        state = stored && typeof stored === 'object' ? stored : createDefaultState();
        if (!state.profile) state = createDefaultState();
        if (!state.xp || typeof state.xp !== 'object') state.xp = { total: 0, entries: [] };
        if (!Array.isArray(state.xp.entries)) state.xp.entries = [];
        if (typeof state.xp.total !== 'number') state.xp.total = Number(state.xp.total) || 0;
        if (!state.streak) state.streak = { current: 0, best: 0, lastPlayDate: null };
        if (!state.stats) state.stats = createDefaultState().stats;
        if (!state.stats.byGame) state.stats.byGame = {};
        if (!state.achievements) state.achievements = {};
        ensureAchievements(state);
        if (!state.badges) state.badges = [];
        if (!state.history) state.history = { matches: [], achievements: [], activity: [] };
        if (!Array.isArray(state.history.matches)) state.history.matches = [];
        if (!Array.isArray(state.history.achievements)) state.history.achievements = [];
        if (!Array.isArray(state.history.activity)) state.history.activity = [];
        if (!state.meta) state.meta = { legacyMigrated: false };

        const liveName =
            (window.CrackTotalProfile && window.CrackTotalProfile.getPlayerName && window.CrackTotalProfile.getPlayerName()) ||
            localStorage.getItem('playerName') ||
            '';
        if (liveName) state.profile.displayName = liveName;

        ready = true;
        if (cfg().features && cfg().features.migrateLegacyStats !== false) {
            migrateLegacyOnce();
        }
        await persistNow();
        return snapshot();
    }

    function migrateLegacyOnce() {
        if (state.meta.legacyMigrated) return;
        try {
            const pasalache = JSON.parse(localStorage.getItem('pasalacheUserStats') || 'null');
            const history = JSON.parse(localStorage.getItem('pasalacheGameHistory') || '[]');
            if (pasalache && typeof pasalache === 'object') {
                const played = Number(pasalache.gamesPlayed) || 0;
                const won = Number(pasalache.gamesWon) || 0;
                const correct = Number(pasalache.totalCorrectAnswers) || 0;
                const incorrect = Number(pasalache.totalIncorrectAnswers) || 0;
                state.stats.gamesPlayed = Math.max(state.stats.gamesPlayed, played);
                state.stats.gamesWon = Math.max(state.stats.gamesWon, won);
                state.stats.correctAnswers = Math.max(state.stats.correctAnswers, correct);
                state.stats.incorrectAnswers = Math.max(state.stats.incorrectAnswers, incorrect);
                const bucket = ensureGameBucket('pasalache');
                bucket.played = Math.max(bucket.played, played);
                bucket.wins = Math.max(bucket.wins, won);
                bucket.correct = Math.max(bucket.correct, correct);
                bucket.incorrect = Math.max(bucket.incorrect, incorrect);
                if (state.xp.total === 0 && played > 0) {
                    state.xp.total = played * 10 + won * 25;
                }
            }
            if (Array.isArray(history) && history.length && !state.history.matches.length) {
                history.slice(0, 12).forEach((game) => {
                    state.history.matches.push({
                        id: 'legacy_' + (game.timestamp || game.date || Math.random()),
                        gameId: 'pasalache',
                        gameName: 'Pasala Che',
                        result: game.result || 'defeat',
                        score: game.correctAnswers || game.score || 0,
                        correctAnswers: game.correctAnswers || 0,
                        incorrectAnswers: game.incorrectAnswers || 0,
                        durationSec: game.timeSpent || game.time || 0,
                        at: game.timestamp || game.date || new Date().toISOString()
                    });
                });
            }
            if (!state.profile.createdAt && history[history.length - 1]) {
                state.profile.createdAt = history[history.length - 1].timestamp || history[history.length - 1].date;
            }
            evaluateAchievements({});
        } catch (error) {
            /* ignore migration errors */
        }
        state.meta.legacyMigrated = true;
    }

    /**
     * Public: record a finished match. Safe to call from games.
     */
    function recordMatch(input) {
        if (!ready || !state) {
            // Lazy init sync path for games that fire before profile page
            try {
                const raw = localStorage.getItem(cfg().storageKey || 'ct_progress_v1');
                state = raw ? JSON.parse(raw) : createDefaultState();
            } catch (e) {
                state = createDefaultState();
            }
            ensureAchievements(state);
            ready = true;
            if (!state.meta.legacyMigrated && cfg().features && cfg().features.migrateLegacyStats !== false) {
                migrateLegacyOnce();
            }
        }

        const payload = input || {};
        const gameId = String(payload.gameId || 'unknown');
        const gameName = payload.gameName || gameId;
        const won = Boolean(payload.won || payload.result === 'victory');
        const correct = Number(payload.correctAnswers) || 0;
        const incorrect = Number(payload.incorrectAnswers) || 0;
        const duration = Number(payload.durationSec) || 0;
        const perfect =
            Boolean(payload.perfect) ||
            (gameId === 'pasalache' && won && incorrect === 0 && correct >= 26);
        const daily = Boolean(payload.dailyChallenge || gameId === 'top10');

        const wasFirst = state.stats.gamesPlayed === 0;
        state.stats.gamesPlayed += 1;
        if (won) state.stats.gamesWon += 1;
        state.stats.correctAnswers += correct;
        state.stats.incorrectAnswers += incorrect;
        state.stats.totalPlayTimeSec += Math.max(0, duration);
        if (perfect) state.stats.perfectRoscos += 1;
        if (daily) state.stats.dailyChallenges += 1;
        if (won && isTriviaGame(gameId)) state.stats.triviaWins += 1;

        const bucket = ensureGameBucket(gameId);
        bucket.played += 1;
        if (won) bucket.wins += 1;
        bucket.correct += correct;
        bucket.incorrect += incorrect;
        bucket.playTimeSec += Math.max(0, duration);

        updateStreak(todayKey());
        state.profile.lastActiveAt = new Date().toISOString();

        const match = {
            id: payload.id || 'm_' + Date.now(),
            gameId: gameId,
            gameName: gameName,
            result: won ? 'victory' : payload.result || 'defeat',
            score: payload.score != null ? Number(payload.score) : correct,
            correctAnswers: correct,
            incorrectAnswers: incorrect,
            durationSec: duration,
            at: payload.at || new Date().toISOString(),
            meta: payload.meta || {}
        };
        state.history.matches.unshift(match);
        const hLimit = cfg().historyLimit || 40;
        if (state.history.matches.length > hLimit) {
            state.history.matches = state.history.matches.slice(0, hLimit);
        }
        pushActivity('match', (won ? 'Victoria' : 'Partida') + ' en ' + gameName, {
            gameId: gameId,
            won: won
        });

        if (wasFirst) awardXp('first_game', { gameId: gameId });
        awardXp('match_played', { gameId: gameId });
        if (won) awardXp('victory', { gameId: gameId });
        if (perfect || (payload.perfectAnswers && Number(payload.perfectAnswers) > 0)) {
            awardXp('perfect_answers', { gameId: gameId });
        }
        if (daily) awardXp('daily_challenge', { gameId: gameId });

        const unlocked = evaluateAchievements({ perfectRosco: perfect });
        notify({ immediate: true });
        return { match: match, unlocked: unlocked, snapshot: snapshot() };
    }

    function touchDaily() {
        if (!ready) return null;
        // Visiting profile counts as soft activity for display, but streak only grows on play.
        state.profile.lastActiveAt = new Date().toISOString();
        scheduleSave();
        return snapshot();
    }

    function setDisplayName(name) {
        if (!state) return;
        state.profile.displayName = String(name || '').trim() || 'Invitado';
        notify();
    }

    function resetProgress() {
        state = createDefaultState();
        ready = true;
        persistNow();
        notify();
        return snapshot();
    }

    function getAchievement(id) {
        return snapshot().achievements.find((a) => a.id === id) || null;
    }

    Services.Progress = {
        init: init,
        getSnapshot: function () {
            return state ? snapshot() : null;
        },
        recordMatch: recordMatch,
        touchDaily: touchDaily,
        setDisplayName: setDisplayName,
        resetProgress: resetProgress,
        getAchievement: getAchievement,
        resolveLevel: function (xp) {
            return resolveLevel(typeof xp === 'number' ? xp : (state && state.xp.total) || 0);
        },
        events: {
            UPDATED: EVENT,
            UNLOCK: UNLOCK_EVENT,
            LEVEL_UP: LEVEL_EVENT,
            XP: XP_EVENT
        }
    };

    window.CrackTotalProgress = Services.Progress;
})();
