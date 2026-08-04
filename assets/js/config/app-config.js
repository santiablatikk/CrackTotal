/**
 * Crack Total — application config (stubs / feature flags)
 * No live sports providers are wired yet.
 */
(function () {
    'use strict';

    const AppConfig = {
        appName: 'Crack Total',
        version: '3.6.3',
        env: 'browser',

        urls: {
            home: '/',
            games: '/games.html',
            profile: '/profile.html',
            ranking: '/ranking.html',
            apiBase: '' // future REST base; empty = unused
        },

        cache: {
            defaultTtlMs: 5 * 60 * 1000,
            shortTtlMs: 60 * 1000,
            longTtlMs: 60 * 60 * 1000,
            prefix: 'ct_cache_'
        },

        http: {
            timeoutMs: 10000,
            retries: 1,
            retryDelayMs: 400
        },

        /**
         * Football Hub — source of truth for MODE is football-api-config.js
         * (synced on load). Keep this object for backwards compatibility.
         */
        hub: {
            enabled: false,
            source: 'mock',
            mockBasePath: 'assets/data/hub',
            apiBasePath: '',
            simulateLatencyMs: 420,
            cacheTtlMs: 60 * 1000
        },

        features: {
            designSystem: true,
            playerProfileModal: true,
            footballHub: false,
            gamification: true,
            liveMatches: false,
            sportsNews: false,
            sportsRankings: false,
            apiFootball: false
        },

        providers: {
            footballApi: {
                enabled: false,
                name: 'api-football',
                baseUrl: 'https://v3.football.api-sports.io',
                notes: 'Configure via assets/js/config/football-api-config.js (MODE + CrackTotalEnv.API_FOOTBALL_KEY).'
            },
            news: {
                enabled: false,
                name: 'news-stub',
                baseUrl: '',
                notes: 'Hub news remains on local mock JSON.'
            }
        },

        isFeatureEnabled(flag) {
            return Boolean(this.features && this.features[flag]);
        }
    };

    window.CrackTotalConfig = AppConfig;
})();
