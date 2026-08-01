/**
 * FootballService — domain API for Hub matches/competitions.
 * Uses ApiClient + Mapper + CacheManager. No UI knowledge.
 */
(function () {
    'use strict';

    const Services = (window.CrackTotalServices = window.CrackTotalServices || {});

    function config() {
        return window.CrackTotalFootballApiConfig || {};
    }

    function client() {
        return Services.ApiClient;
    }

    function cache() {
        return Services.CacheManager;
    }

    function mapper() {
        return Services.ApiFootballMapper;
    }

    function errors() {
        return Services.ErrorManager;
    }

    function todayIso() {
        return new Date().toISOString().slice(0, 10);
    }

    function shiftDays(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().slice(0, 10);
    }

    async function cachedFetch(cacheKey, ttlKind, fetcher) {
        const c = cache();
        if (c) {
            const hit = c.get(cacheKey);
            if (hit) {
                return { ok: true, data: hit, fromCache: true, fromStored: false, isFallback: false };
            }
        }

        try {
            const data = await fetcher();
            if (c) c.set(cacheKey, data, c.defaultTtl(ttlKind));
            return { ok: true, data: data, fromCache: false, fromStored: false, isFallback: false };
        } catch (error) {
            if (error && error.name === 'AbortError') {
                throw error;
            }
            const failure = errors() ? errors().wrapFailure(error, cacheKey) : { ok: false, fallback: true, message: String(error) };
            if (c) {
                const stale = c.getStale(cacheKey);
                if (stale && stale.value) {
                    return {
                        ok: true,
                        data: stale.value,
                        fromCache: true,
                        fromStored: true,
                        isFallback: true,
                        message: failure.message
                    };
                }
            }
            return {
                ok: false,
                data: { updatedAt: null, items: [] },
                fromCache: false,
                fromStored: false,
                isFallback: true,
                message: failure.message,
                error: error
            };
        }
    }

    async function getLiveMatches() {
        const cfg = config();
        const limit = (cfg.limits && cfg.limits.live) || 12;
        return cachedFetch('api_live', 'live', async () => {
            const result = await client().get(
                '/fixtures',
                { live: 'all', timezone: cfg.timezone },
                { requestId: 'fixtures-live' }
            );
            return mapper().mapFixtureList(result.response, limit);
        });
    }

    async function getUpcomingMatches() {
        const cfg = config();
        const limit = (cfg.limits && cfg.limits.upcoming) || 12;
        return cachedFetch('api_upcoming', 'upcoming', async () => {
            const result = await client().get(
                '/fixtures',
                {
                    next: String(limit),
                    timezone: cfg.timezone
                },
                { requestId: 'fixtures-upcoming' }
            );
            return mapper().mapFixtureList(result.response, limit);
        });
    }

    async function getRecentResults() {
        const cfg = config();
        const limit = (cfg.limits && cfg.limits.results) || 12;
        return cachedFetch('api_results', 'results', async () => {
            // Prefer finished fixtures from yesterday + today for denser sports-hub feel
            const result = await client().get(
                '/fixtures',
                {
                    last: String(limit),
                    timezone: cfg.timezone,
                    status: 'FT'
                },
                { requestId: 'fixtures-results' }
            );
            let mapped = mapper().mapFixtureList(result.response, limit);
            if (!mapped.items.length) {
                const byDate = await client().get(
                    '/fixtures',
                    {
                        date: shiftDays(-1),
                        timezone: cfg.timezone,
                        status: 'FT'
                    },
                    { requestId: 'fixtures-results-date' }
                );
                mapped = mapper().mapFixtureList(byDate.response, limit);
            }
            return mapped;
        });
    }

    async function getCompetitions() {
        const cfg = config();
        const limit = (cfg.limits && cfg.limits.competitions) || 40;
        return cachedFetch('api_competitions', 'competitions', async () => {
            const result = await client().get(
                '/leagues',
                { current: 'true' },
                { requestId: 'leagues-current' }
            );
            return mapper().mapCompetitions(result.response, limit);
        });
    }

    Services.FootballService = {
        getLiveMatches,
        getUpcomingMatches,
        getRecentResults,
        getCompetitions,
        todayIso
    };
})();
