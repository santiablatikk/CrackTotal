/**
 * Football Hub data service.
 * Today: mock JSON. Tomorrow: flip CrackTotalConfig.hub.source to "api".
 * UI components must only consume the normalized shapes returned here.
 */
(function () {
    'use strict';

    const Services = (window.CrackTotalServices = window.CrackTotalServices || {});

    const RESOURCES = {
        liveMatches: 'live-matches',
        upcomingMatches: 'upcoming-matches',
        recentResults: 'recent-results',
        news: 'news',
        gameOfDay: 'game-of-day',
        userRanking: 'user-ranking'
    };

    function hubConfig() {
        const cfg = window.CrackTotalConfig || {};
        return Object.assign(
            {
                enabled: true,
                source: 'mock',
                mockBasePath: 'assets/data/hub',
                apiBasePath: '',
                simulateLatencyMs: 420,
                cacheTtlMs: 60 * 1000
            },
            cfg.hub || {}
        );
    }

    function resourceUrl(key) {
        const hub = hubConfig();
        const file = RESOURCES[key];
        if (!file) throw new Error('Unknown hub resource: ' + key);

        if (hub.source === 'api' && hub.apiBasePath) {
            return String(hub.apiBasePath).replace(/\/$/, '') + '/' + file;
        }
        return String(hub.mockBasePath).replace(/\/$/, '') + '/' + file + '.json';
    }

    function sleep(ms) {
        return new Promise((resolve) => window.setTimeout(resolve, ms));
    }

    async function fetchJson(url) {
        if (window.CrackTotalServices && window.CrackTotalServices.http) {
            const result = await window.CrackTotalServices.http.get(url, { retries: 1 });
            return result.data;
        }
        const response = await fetch(url, { credentials: 'same-origin' });
        if (!response.ok) {
            const error = new Error('HTTP ' + response.status);
            error.status = response.status;
            throw error;
        }
        return response.json();
    }

    async function loadResource(key) {
        const hub = hubConfig();
        const cacheKey = 'hub_' + key;
        const cache = window.CrackTotalServices && window.CrackTotalServices.cache;

        if (cache) {
            const cached = cache.get(cacheKey);
            if (cached) {
                return { ok: true, data: cached, fromCache: true };
            }
        }

        try {
            if (hub.source === 'mock' && hub.simulateLatencyMs > 0) {
                await sleep(hub.simulateLatencyMs);
            }
            const raw = await fetchJson(resourceUrl(key));
            const data = normalize(key, raw);
            if (cache) cache.set(cacheKey, data, hub.cacheTtlMs);
            return { ok: true, data, fromCache: false };
        } catch (error) {
            return {
                ok: false,
                data: emptyShape(key),
                error: error,
                message:
                    (window.CrackTotalServices &&
                        window.CrackTotalServices.errors &&
                        window.CrackTotalServices.errors.toFriendlyMessage(error)) ||
                    'No pudimos cargar esta sección.'
            };
        }
    }

    function emptyShape(key) {
        if (key === 'gameOfDay') return { updatedAt: null, item: null };
        if (key === 'userRanking') return { updatedAt: null, game: '', href: 'ranking.html', items: [] };
        return { updatedAt: null, items: [] };
    }

    function normalizeMatchList(raw) {
        const items = Array.isArray(raw && raw.items) ? raw.items : [];
        return {
            updatedAt: (raw && raw.updatedAt) || null,
            items: items.map((item) => ({
                id: String(item.id || ''),
                competition: item.competition || '',
                home: {
                    name: (item.home && item.home.name) || '',
                    short: (item.home && item.home.short) || '',
                    score: item.home && item.home.score != null ? Number(item.home.score) : null
                },
                away: {
                    name: (item.away && item.away.name) || '',
                    short: (item.away && item.away.short) || '',
                    score: item.away && item.away.score != null ? Number(item.away.score) : null
                },
                minute: item.minute != null ? Number(item.minute) : null,
                kickoff: item.kickoff || null,
                finishedAt: item.finishedAt || null,
                status: item.status || 'scheduled',
                venue: item.venue || ''
            }))
        };
    }

    function normalize(key, raw) {
        if (key === 'news') {
            const items = Array.isArray(raw && raw.items) ? raw.items : [];
            return {
                updatedAt: (raw && raw.updatedAt) || null,
                items: items.map((item) => ({
                    id: String(item.id || ''),
                    title: item.title || '',
                    summary: item.summary || '',
                    category: item.category || '',
                    href: item.href || 'blog.html',
                    image: item.image || '',
                    publishedAt: item.publishedAt || null
                }))
            };
        }
        if (key === 'gameOfDay') {
            const item = raw && raw.item ? raw.item : null;
            return {
                updatedAt: (raw && raw.updatedAt) || null,
                item: item
                    ? {
                          id: String(item.id || ''),
                          gameId: item.gameId || '',
                          title: item.title || '',
                          eyebrow: item.eyebrow || 'Juego recomendado',
                          description: item.description || '',
                          href: item.href || 'games.html',
                          cta: item.cta || 'Jugar',
                          badge: item.badge || '',
                          image: item.image || '',
                          facts: Array.isArray(item.facts) ? item.facts : []
                      }
                    : null
            };
        }
        if (key === 'userRanking') {
            const items = Array.isArray(raw && raw.items) ? raw.items : [];
            return {
                updatedAt: (raw && raw.updatedAt) || null,
                game: (raw && raw.game) || 'Ranking',
                href: (raw && raw.href) || 'ranking.html',
                items: items.map((item) => ({
                    rank: Number(item.rank) || 0,
                    name: item.name || 'Jugador',
                    score: item.score != null ? Number(item.score) : 0,
                    meta: item.meta || ''
                }))
            };
        }
        return normalizeMatchList(raw);
    }

    async function loadHubBundle() {
        const keys = Object.keys(RESOURCES);
        const entries = await Promise.all(
            keys.map(async (key) => {
                const result = await loadResource(key);
                return [key, result];
            })
        );
        return Object.fromEntries(entries);
    }

    Services.hub = {
        RESOURCES,
        loadResource,
        loadHubBundle,
        resourceUrl
    };
})();
