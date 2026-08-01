/**
 * RankingService — architecture for global / weekly / monthly / friends.
 * Uses mock JSON initially; swap fetcher later without touching cards.
 */
(function () {
    'use strict';

    const Services = (window.CrackTotalServices = window.CrackTotalServices || {});

    function cfg() {
        return (window.CrackTotalGamificationConfig && window.CrackTotalGamificationConfig.rankings) || {
            mockBasePath: 'assets/data/rankings',
            scopes: ['global', 'weekly', 'monthly', 'friends']
        };
    }

    function injectLocalPlayer(items, scope) {
        const snap = Services.Progress && Services.Progress.getSnapshot && Services.Progress.getSnapshot();
        if (!snap) return items;
        const name = snap.profile.displayName || 'Vos';
        const score = snap.xp.total || 0;
        const list = items.slice();
        const existing = list.findIndex((row) => row.isYou || row.name === name);
        if (existing >= 0) {
            list[existing] = Object.assign({}, list[existing], {
                name: name,
                score: Math.max(Number(list[existing].score) || 0, score),
                isYou: true,
                meta: snap.level.current.name
            });
        } else {
            list.push({
                rank: list.length + 1,
                name: name,
                score: score,
                meta: snap.level.current.name,
                isYou: true
            });
        }
        list.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
        list.forEach((row, idx) => {
            row.rank = idx + 1;
        });
        return list.slice(0, 20);
    }

    async function fetchScope(scope) {
        const base = String(cfg().mockBasePath || 'assets/data/rankings').replace(/\/$/, '');
        const url = base + '/' + scope + '.json';
        try {
            const response = await fetch(url, { credentials: 'same-origin' });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const data = await response.json();
            const items = Array.isArray(data.items) ? data.items : [];
            return {
                ok: true,
                scope: scope,
                updatedAt: data.updatedAt || null,
                items: injectLocalPlayer(items, scope),
                source: 'mock'
            };
        } catch (error) {
            return {
                ok: true,
                scope: scope,
                updatedAt: null,
                items: injectLocalPlayer([], scope),
                source: 'fallback',
                message: 'Ranking simulado'
            };
        }
    }

    Services.RankingService = {
        scopes() {
            return (cfg().scopes || []).slice();
        },
        getRanking(scope) {
            const allowed = this.scopes();
            const key = allowed.indexOf(scope) !== -1 ? scope : 'global';
            return fetchScope(key);
        },
        getAll() {
            return Promise.all(this.scopes().map((s) => fetchScope(s))).then((rows) => {
                const map = {};
                rows.forEach((row) => {
                    map[row.scope] = row;
                });
                return map;
            });
        }
    };
})();
