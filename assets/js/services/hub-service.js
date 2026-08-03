/**
 * Hub facade — same normalized shapes as before for UI renderers.
 * Routes MOCK vs API via FootballApiConfig.MODE and falls back to mock JSON.
 */
(function () {
    'use strict';

    const Services = (window.CrackTotalServices = window.CrackTotalServices || {});

    // Match fixtures were removed from product UI; keep only editorial/game helpers.
    const RESOURCES = {
        news: 'news',
        gameOfDay: 'game-of-day',
        userRanking: 'user-ranking'
    };

    const API_KEYS = {};

    function footballConfig() {
        return window.CrackTotalFootballApiConfig || {
            MODE: 'MOCK',
            isMock: true,
            isApi: false,
            canUseApi() { return false; },
            mock: { basePath: 'assets/data/hub', simulateLatencyMs: 420 },
            features: { fallbackToMockOnError: true, newsFromMock: true, gameOfDayFromMock: true, userRankingFromMock: true }
        };
    }

    function sleep(ms) {
        return new Promise((resolve) => window.setTimeout(resolve, ms));
    }

    function emptyShape(key) {
        if (key === 'gameOfDay') return { updatedAt: null, item: null };
        if (key === 'userRanking') return { updatedAt: null, game: '', href: 'ranking.html', items: [] };
        if (key === 'competitions') return { updatedAt: null, items: [] };
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

    function mockUrl(key) {
        const cfg = footballConfig();
        const file = RESOURCES[key];
        const base = (cfg.mock && cfg.mock.basePath) || 'assets/data/hub';
        return String(base).replace(/\/$/, '') + '/' + file + '.json';
    }

    async function fetchMockJson(key) {
        const cfg = footballConfig();
        const latency = (cfg.mock && cfg.mock.simulateLatencyMs) || 0;
        if (latency > 0 && cfg.isMock) await sleep(latency);

        const url = mockUrl(key);
        if (Services.http) {
            const result = await Services.http.get(url, { retries: 1, requestId: 'mock-' + key });
            return normalize(key, result.data);
        }
        const response = await fetch(url, { credentials: 'same-origin' });
        if (!response.ok) {
            const error = new Error('HTTP ' + response.status);
            error.status = response.status;
            throw error;
        }
        return normalize(key, await response.json());
    }

    async function loadMockResource(key, meta) {
        const cache = Services.CacheManager;
        const cacheKey = 'mock_' + key;
        if (cache) {
            const hit = cache.get(cacheKey);
            if (hit) {
                return Object.assign(
                    {
                        ok: true,
                        data: hit,
                        fromCache: true,
                        fromStored: Boolean(meta && meta.fromStored),
                        isFallback: Boolean(meta && meta.isFallback),
                        source: 'mock'
                    },
                    meta || {}
                );
            }
        }

        try {
            const data = await fetchMockJson(key);
            if (cache) cache.set(cacheKey, data, cache.defaultTtl('mock'));
            return Object.assign(
                {
                    ok: true,
                    data: data,
                    fromCache: false,
                    fromStored: Boolean(meta && meta.isFallback),
                    isFallback: Boolean(meta && meta.isFallback),
                    source: 'mock'
                },
                meta || {}
            );
        } catch (error) {
            const failure = Services.ErrorManager
                ? Services.ErrorManager.wrapFailure(error, 'mock:' + key)
                : { message: 'No pudimos cargar esta sección.' };
            if (cache) {
                const stale = cache.getStale(cacheKey);
                if (stale && stale.value) {
                    return {
                        ok: true,
                        data: stale.value,
                        fromCache: true,
                        fromStored: true,
                        isFallback: true,
                        source: 'mock',
                        message: failure.message
                    };
                }
            }
            return {
                ok: true,
                data: emptyShape(key),
                fromCache: false,
                fromStored: true,
                isFallback: true,
                source: 'mock',
                message: failure.message
            };
        }
    }

    function alwaysMock(key) {
        const features = footballConfig().features || {};
        if (key === 'news') return features.newsFromMock !== false;
        if (key === 'gameOfDay') return features.gameOfDayFromMock !== false;
        if (key === 'userRanking') return features.userRankingFromMock !== false;
        return false;
    }

    async function loadApiResource(key) {
        const football = Services.FootballService;
        const methodName = API_KEYS[key];
        if (!football || !methodName || typeof football[methodName] !== 'function') {
            return loadMockResource(key, { isFallback: true, message: 'Servicio API no disponible' });
        }

        const result = await football[methodName]();
        if (result.ok && result.data && Array.isArray(result.data.items) && result.data.items.length) {
            return Object.assign({ source: 'api' }, result);
        }

        // Empty API payload or soft failure → mock fallback so Home never looks broken
        if (footballConfig().features && footballConfig().features.fallbackToMockOnError !== false) {
            const mock = await loadMockResource(key, {
                isFallback: true,
                fromStored: true,
                message: (result && result.message) || 'Mostrando datos almacenados'
            });
            return mock;
        }

        return Object.assign(
            {
                ok: true,
                data: (result && result.data) || emptyShape(key),
                source: 'api',
                fromStored: Boolean(result && result.fromStored),
                isFallback: Boolean(result && result.isFallback)
            },
            result || {}
        );
    }

    async function loadResource(key) {
        if (!RESOURCES[key] && key !== 'competitions') {
            throw new Error('Unknown hub resource: ' + key);
        }

        const cfg = footballConfig();

        if (key === 'competitions') {
            if (cfg.canUseApi && cfg.canUseApi() && Services.FootballService) {
                return Services.FootballService.getCompetitions();
            }
            return { ok: true, data: emptyShape('competitions'), source: 'mock' };
        }

        if (alwaysMock(key) || !cfg.canUseApi || !cfg.canUseApi()) {
            return loadMockResource(key);
        }

        try {
            return await loadApiResource(key);
        } catch (error) {
            if (error && error.name === 'AbortError') {
                return {
                    ok: false,
                    data: emptyShape(key),
                    source: 'api',
                    aborted: true,
                    message: 'Solicitud cancelada'
                };
            }
            if (Services.ErrorManager) Services.ErrorManager.wrapFailure(error, key);
            return loadMockResource(key, {
                isFallback: true,
                fromStored: true,
                message: 'Mostrando datos almacenados'
            });
        }
    }

    async function loadHubBundle(options) {
        const opts = options || {};
        const keys = Object.keys(RESOURCES);
        const quiet = Boolean(opts.quiet);

        if (!quiet && Services.ApiClient) {
            // Cancel stale in-flight API calls before a full reload
            Services.ApiClient.abort('fixtures-live');
            Services.ApiClient.abort('fixtures-upcoming');
            Services.ApiClient.abort('fixtures-results');
        }

        const entries = await Promise.all(
            keys.map(async (key) => {
                const result = await loadResource(key);
                return [key, result];
            })
        );

        const bundle = Object.fromEntries(entries);
        bundle._meta = {
            mode: footballConfig().MODE,
            hasLive: false,
            showingStored: Object.values(bundle).some(
                (item) => item && typeof item === 'object' && item.isFallback
            )
        };
        return bundle;
    }

    Services.hub = {
        RESOURCES,
        loadResource,
        loadHubBundle,
        mockUrl
    };
})();
