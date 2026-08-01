/**
 * Crack Total — application config (stubs / feature flags)
 * No live sports providers are wired yet.
 */
(function () {
    'use strict';

    const AppConfig = {
        appName: 'Crack Total',
        version: '3.3.0',
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
         * Football Hub data source.
         * source: "mock" reads assets/data/hub/*.json
         * source: "api" uses apiBasePath + resource name (no UI changes needed)
         */
        hub: {
            enabled: true,
            source: 'mock',
            mockBasePath: 'assets/data/hub',
            apiBasePath: '',
            simulateLatencyMs: 420,
            cacheTtlMs: 60 * 1000
        },

        features: {
            designSystem: true,
            playerProfileModal: true,
            footballHub: true,
            liveMatches: false,
            sportsNews: false,
            sportsRankings: false,
            apiFootball: false
        },

        /**
         * Placeholders for future data providers.
         * Do not call these until a real integration is added.
         */
        providers: {
            footballApi: {
                enabled: false,
                name: 'api-football',
                baseUrl: '',
                notes: 'Reserved. Set hub.source="api" and hub.apiBasePath when ready.'
            },
            news: {
                enabled: false,
                name: 'news-stub',
                baseUrl: '',
                notes: 'Reserved. Not connected.'
            }
        },

        isFeatureEnabled(flag) {
            return Boolean(this.features && this.features[flag]);
        }
    };

    window.CrackTotalConfig = AppConfig;
})();
