/**
 * Football Hub / API-Football — single source of configuration.
 *
 * Switch data mode with ONE variable:
 *   MODE: 'MOCK' | 'API'
 *
 * API key: set once via window.CrackTotalEnv.API_FOOTBALL_KEY
 * (load a private env script before this file, or inject from backend later).
 * Never duplicate the key across files.
 */
(function () {
    'use strict';

    const env = window.CrackTotalEnv || {};

    /**
     * ★ Change only this to switch Mock ↔ Production API.
     */
    const MODE = 'MOCK';

    const FootballApiConfig = {
        MODE: MODE,
        isMock: MODE === 'MOCK',
        isApi: MODE === 'API',

        provider: 'api-football',
        baseUrl: 'https://v3.football.api-sports.io',
        apiKey: env.API_FOOTBALL_KEY || env.apiFootballKey || '',

        headers: {
            keyHeader: 'x-apisports-key'
        },

        /** Preferred leagues for upcoming/results when filtering (API-Football IDs). */
        leagues: {
            // 128 Liga Profesional AR, 39 EPL, 140 La Liga, 135 Serie A, 78 Bundesliga, 61 Ligue 1, 2 UCL, 13 Libertadores
            focus: [128, 39, 140, 135, 78, 61, 2, 13]
        },

        timezone: 'America/Argentina/Buenos_Aires',

        limits: {
            live: 12,
            upcoming: 12,
            results: 12,
            competitions: 40
        },

        cache: {
            prefix: 'ct_hub_v1_',
            ttl: {
                liveMs: 60 * 1000,
                upcomingMs: 15 * 60 * 1000,
                resultsMs: 15 * 60 * 1000,
                competitionsMs: 60 * 60 * 1000,
                mockMs: 5 * 60 * 1000,
                defaultMs: 5 * 60 * 1000
            }
        },

        refresh: {
            liveIntervalMs: 60 * 1000,
            idleIntervalMs: 15 * 60 * 1000
        },

        http: {
            timeoutMs: 12000,
            retries: 1,
            retryDelayMs: 500
        },

        mock: {
            basePath: 'assets/data/hub',
            simulateLatencyMs: 420
        },

        features: {
            useApiForMatches: MODE === 'API',
            useApiForCompetitions: MODE === 'API',
            newsFromMock: true,
            gameOfDayFromMock: true,
            userRankingFromMock: true,
            fallbackToMockOnError: true,
            showStoredIndicator: true
        },

        hasApiKey() {
            return Boolean(String(this.apiKey || '').trim());
        },

        canUseApi() {
            return this.isApi && this.hasApiKey();
        }
    };

    window.CrackTotalFootballApiConfig = FootballApiConfig;

    // Keep app-config hub flags in sync when present
    if (window.CrackTotalConfig) {
        window.CrackTotalConfig.hub = Object.assign({}, window.CrackTotalConfig.hub, {
            enabled: true,
            source: FootballApiConfig.isApi ? 'api' : 'mock',
            mockBasePath: FootballApiConfig.mock.basePath,
            mode: FootballApiConfig.MODE
        });
        window.CrackTotalConfig.features = Object.assign({}, window.CrackTotalConfig.features, {
            footballHub: true,
            apiFootball: FootballApiConfig.isApi,
            liveMatches: FootballApiConfig.isApi
        });
        window.CrackTotalConfig.providers = Object.assign({}, window.CrackTotalConfig.providers, {
            footballApi: {
                enabled: FootballApiConfig.isApi,
                name: 'api-football',
                baseUrl: FootballApiConfig.baseUrl,
                notes: FootballApiConfig.hasApiKey()
                    ? 'Configured via CrackTotalEnv.API_FOOTBALL_KEY'
                    : 'Set MODE=API and CrackTotalEnv.API_FOOTBALL_KEY'
            }
        });
    }
})();
