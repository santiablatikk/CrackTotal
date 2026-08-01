/**
 * Football Hub orchestrator — mounts into #footballHub on Home.
 */
(function () {
    'use strict';

    const PANELS = [
        {
            key: 'liveMatches',
            mount: 'hubLive',
            render: 'renderLive',
            skeleton: 3
        },
        {
            key: 'upcomingMatches',
            mount: 'hubUpcoming',
            render: 'renderUpcoming',
            skeleton: 3
        },
        {
            key: 'recentResults',
            mount: 'hubResults',
            render: 'renderResults',
            skeleton: 3
        },
        {
            key: 'news',
            mount: 'hubNews',
            render: 'renderNews',
            skeleton: 3
        },
        {
            key: 'gameOfDay',
            mount: 'hubGameDay',
            render: 'renderGameOfDay',
            skeleton: 2
        },
        {
            key: 'userRanking',
            mount: 'hubRanking',
            render: 'renderRanking',
            skeleton: 5
        }
    ];

    function isEnabled() {
        const cfg = window.CrackTotalConfig;
        if (!cfg) return true;
        if (cfg.hub && cfg.hub.enabled === false) return false;
        return true;
    }

    function showSkeletons() {
        const renderers = window.CrackTotalUI && window.CrackTotalUI.hubRenderers;
        if (!renderers) return;
        PANELS.forEach((panel) => {
            const node = document.getElementById(panel.mount);
            if (!node) return;
            node.setAttribute('aria-busy', 'true');
            node.textContent = '';
            node.appendChild(renderers.skeletonRows(panel.skeleton));
        });
    }

    async function loadAndRender() {
        const root = document.getElementById('footballHub');
        if (!root || !isEnabled()) return;

        const service = window.CrackTotalServices && window.CrackTotalServices.hub;
        const renderers = window.CrackTotalUI && window.CrackTotalUI.hubRenderers;
        if (!service || !renderers) return;

        showSkeletons();
        root.classList.add('is-loading');

        const bundle = await service.loadHubBundle();

        PANELS.forEach((panel) => {
            const node = document.getElementById(panel.mount);
            if (!node) return;
            const result = bundle[panel.key];
            const fn = renderers[panel.render];
            if (typeof fn === 'function') fn(node, result);
            node.removeAttribute('aria-busy');
        });

        root.classList.remove('is-loading');
        root.classList.add('is-ready');
    }

    function init() {
        if (!document.getElementById('footballHub')) return;
        loadAndRender();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
