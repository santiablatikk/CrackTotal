/**
 * Football Hub orchestrator — premium sports cover experience on Home.
 * Uses existing hub-service bundle; presentation-only enhancements.
 */
(function () {
    'use strict';

    const PANELS = [
        { key: 'liveMatches', mount: 'hubLive', render: 'renderLive', skeleton: 3 },
        { key: 'upcomingMatches', mount: 'hubUpcoming', render: 'renderUpcoming', skeleton: 3 },
        { key: 'recentResults', mount: 'hubResults', render: 'renderResults', skeleton: 3 },
        { key: 'news', mount: 'hubNews', render: 'renderNews', skeleton: 3 },
        { key: 'gameOfDay', mount: 'hubGameDay', render: 'renderGameOfDay', skeleton: 2 },
        { key: 'userRanking', mount: 'hubRanking', render: 'renderRanking', skeleton: 5 }
    ];

    let lastSignature = '';
    let lastBundle = null;
    let activeTab = 'hoy';
    const activeCompetitions = new Set();
    let liveTimerId = null;
    let countdownId = null;
    let carouselTimerId = null;
    let spotlightCache = null;
    let uiBound = false;

    function isEnabled() {
        const cfg = window.CrackTotalConfig;
        if (cfg && cfg.hub && cfg.hub.enabled === false) return false;
        if (cfg && cfg.features && cfg.features.footballHub === false) return false;
        return true;
    }

    function renderers() {
        return window.CrackTotalUI && window.CrackTotalUI.hubRenderers;
    }

    function itemsOf(bundle, key) {
        return (bundle && bundle[key] && bundle[key].data && bundle[key].data.items) || [];
    }

    function isSameDay(iso) {
        if (!iso) return false;
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return false;
        const now = new Date();
        return (
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate()
        );
    }

    function showSkeletons() {
        const R = renderers();
        if (!R) return;
        PANELS.forEach((panel) => {
            const node = document.getElementById(panel.mount);
            if (!node) return;
            node.setAttribute('aria-busy', 'true');
            node.textContent = '';
            node.appendChild(R.skeletonRows(panel.skeleton));
        });
        ['hubFeatured', 'hubMatchBoard', 'hubMostRead', 'hubPlayerDay', 'hubTeamDay', 'hubFunFact', 'hubTrivia'].forEach(
            (id) => {
                const node = document.getElementById(id);
                if (!node || !R) return;
                node.setAttribute('aria-busy', 'true');
                node.textContent = '';
                node.appendChild(R.skeletonRows(id === 'hubFeatured' ? 1 : 2));
            }
        );
    }

    function setStoredIndicator(show, message) {
        const cfg = window.CrackTotalFootballApiConfig;
        if (cfg && cfg.features && cfg.features.showStoredIndicator === false) return;
        const el = document.getElementById('hubDataStatus');
        if (!el) return;
        if (show) {
            el.hidden = false;
            el.textContent = message || 'Mostrando datos almacenados';
        } else {
            el.hidden = true;
            el.textContent = '';
        }
    }

    function signatureFor(bundle) {
        try {
            return JSON.stringify(
                PANELS.map((panel) => bundle[panel.key] && bundle[panel.key].data)
            );
        } catch (error) {
            return String(Date.now());
        }
    }

    function collectCompetitions(bundle) {
        const names = new Set();
        ['liveMatches', 'upcomingMatches', 'recentResults'].forEach((key) => {
            itemsOf(bundle, key).forEach((m) => {
                if (m.competition) names.add(m.competition);
            });
        });
        return Array.from(names);
    }

    function paintFilters(bundle) {
        const host = document.getElementById('hubCompFilters');
        if (!host) return;
        const comps = collectCompetitions(bundle);
        host.textContent = '';
        const all = document.createElement('button');
        all.type = 'button';
        all.className = 'hub-filter-chip' + (activeCompetitions.size === 0 ? ' is-active' : '');
        all.textContent = 'Todas';
        all.dataset.comp = '';
        host.appendChild(all);
        comps.forEach((name) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'hub-filter-chip' + (activeCompetitions.has(name) ? ' is-active' : '');
            btn.textContent = name;
            btn.dataset.comp = name;
            host.appendChild(btn);
        });
    }

    function filterByCompetition(list) {
        if (!activeCompetitions.size) return list.slice();
        return list.filter((m) => activeCompetitions.has(m.competition));
    }

    function boardItems(bundle) {
        const live = itemsOf(bundle, 'liveMatches').map((m) => Object.assign({}, m, { _mode: 'live' }));
        const upcoming = itemsOf(bundle, 'upcomingMatches').map((m) =>
            Object.assign({}, m, { _mode: 'upcoming' })
        );
        const results = itemsOf(bundle, 'recentResults').map((m) =>
            Object.assign({}, m, { _mode: 'result' })
        );

        let list = [];
        if (activeTab === 'vivo') list = live;
        else if (activeTab === 'resultados') list = results;
        else if (activeTab === 'proximos') list = upcoming;
        else {
            const todayUp = upcoming.filter((m) => isSameDay(m.kickoff));
            const todayRes = results.filter((m) => isSameDay(m.finishedAt));
            list = live.concat(todayUp.length ? todayUp : upcoming.slice(0, 2)).concat(todayRes);
            if (!list.length) list = live.concat(upcoming).concat(results).slice(0, 8);
        }
        return filterByCompetition(list);
    }

    function featuredItems(bundle) {
        const live = itemsOf(bundle, 'liveMatches').map((m) => Object.assign({}, m, { _mode: 'live' }));
        const upcoming = itemsOf(bundle, 'upcomingMatches').map((m) =>
            Object.assign({}, m, { _mode: 'upcoming' })
        );
        const mix = live.concat(upcoming);
        return filterByCompetition(mix).slice(0, 6);
    }

    function bindCarousel(root) {
        const track = root.querySelector('.hub-carousel__track');
        if (!track) return;
        const prev = root.querySelector('.hub-carousel__nav--prev');
        const next = root.querySelector('.hub-carousel__nav--next');
        const scrollBy = (dir) => {
            const amount = Math.max(280, track.clientWidth * 0.85) * dir;
            track.scrollBy({ left: amount, behavior: 'smooth' });
        };
        if (prev) prev.onclick = () => scrollBy(-1);
        if (next) next.onclick = () => scrollBy(1);

        if (carouselTimerId) window.clearInterval(carouselTimerId);
        carouselTimerId = window.setInterval(() => {
            if (document.hidden) return;
            const max = track.scrollWidth - track.clientWidth - 8;
            if (track.scrollLeft >= max) track.scrollTo({ left: 0, behavior: 'smooth' });
            else scrollBy(1);
        }, 5600);
    }

    function startClocks() {
        if (liveTimerId) window.clearInterval(liveTimerId);
        if (countdownId) window.clearInterval(countdownId);

        liveTimerId = window.setInterval(() => {
            document.querySelectorAll('[data-live-minute]').forEach((node) => {
                let minute = Number(node.getAttribute('data-live-minute')) || 0;
                if (minute < 90) minute += 1;
                else if (minute < 95) minute += 1;
                node.setAttribute('data-live-minute', String(minute));
                node.textContent = minute + "'";
            });
        }, 60000);

        const Format = window.CrackTotalHubFormat;
        countdownId = window.setInterval(() => {
            if (!Format || !Format.formatCountdown) return;
            document.querySelectorAll('[data-kickoff]').forEach((node) => {
                node.textContent = Format.formatCountdown(node.dataset.kickoff);
            });
        }, 1000);
    }

    async function loadSpotlight() {
        if (spotlightCache) return spotlightCache;
        try {
            const response = await fetch('assets/data/hub/spotlight.json', { credentials: 'same-origin' });
            if (!response.ok) throw new Error('spotlight');
            spotlightCache = await response.json();
        } catch (error) {
            spotlightCache = {
                player: {
                    name: 'Lionel Messi',
                    role: 'Jugador destacado',
                    team: 'Inter Miami',
                    stat: 'Referencia ofensiva',
                    blurb: 'El detalle que cambia partidos.',
                    image: 'assets/images/blog/messi.jpg'
                },
                team: {
                    name: 'Real Madrid',
                    role: 'Equipo destacado',
                    competition: 'Champions League',
                    stat: 'Candidato eterno',
                    blurb: 'Intensidad y jerarquía en noches grandes.',
                    image: 'assets/images/blog/championss.jpg'
                },
                funFact: {
                    eyebrow: 'Dato curioso',
                    title: '¿Sabías que…?',
                    text: 'El VAR se usa en las principales ligas del mundo para revisar goles, penales y tarjetas rojas.'
                },
                trivia: {
                    question: '¿Quién tiene más Balones de Oro?',
                    options: ['Cristiano Ronaldo', 'Lionel Messi', 'Michel Platini'],
                    answerIndex: 1,
                    ctaHref: 'pasalache.html',
                    ctaLabel: 'Jugar ahora'
                }
            };
        }
        return spotlightCache;
    }

    function paintExperience(bundle) {
        const R = renderers();
        if (!R || !bundle) return;

        const featuredHost = document.getElementById('hubFeatured');
        if (featuredHost && R.renderFeatured) {
            R.renderFeatured(featuredHost, featuredItems(bundle));
            featuredHost.removeAttribute('aria-busy');
            bindCarousel(featuredHost);
        }

        paintFilters(bundle);

        const board = document.getElementById('hubMatchBoard');
        if (board && R.renderBoard) {
            const list = boardItems(bundle);
            const mode =
                activeTab === 'vivo'
                    ? 'live'
                    : activeTab === 'resultados'
                      ? 'result'
                      : activeTab === 'proximos'
                        ? 'upcoming'
                        : null;
            R.renderBoard(board, list, mode, 'Sin partidos');
            board.removeAttribute('aria-busy');
        }

        const mostRead = document.getElementById('hubMostRead');
        if (mostRead && R.renderMostRead) {
            R.renderMostRead(mostRead, bundle.news);
            mostRead.removeAttribute('aria-busy');
        }

        loadSpotlight().then((spot) => {
            if (R.renderSpotlightCard) {
                const player = document.getElementById('hubPlayerDay');
                const team = document.getElementById('hubTeamDay');
                const fact = document.getElementById('hubFunFact');
                if (player) {
                    R.renderSpotlightCard(player, spot.player, 'player');
                    player.removeAttribute('aria-busy');
                }
                if (team) {
                    R.renderSpotlightCard(team, spot.team, 'team');
                    team.removeAttribute('aria-busy');
                }
                if (fact) {
                    R.renderSpotlightCard(fact, spot.funFact, 'fact');
                    fact.removeAttribute('aria-busy');
                }
            }
            const trivia = document.getElementById('hubTrivia');
            if (trivia && R.renderTrivia) {
                R.renderTrivia(trivia, spot.trivia);
                trivia.removeAttribute('aria-busy');
            }
        });

        startClocks();
        updateTabUi();
    }

    function updateTabUi() {
        document.querySelectorAll('[data-hub-tab]').forEach((btn) => {
            const on = btn.getAttribute('data-hub-tab') === activeTab;
            btn.classList.toggle('is-active', on);
            btn.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        const liveCount = lastBundle ? itemsOf(lastBundle, 'liveMatches').length : 0;
        const liveBadge = document.getElementById('hubLiveCount');
        if (liveBadge) {
            liveBadge.textContent = String(liveCount);
            liveBadge.hidden = liveCount === 0;
        }
    }

    function bindUi() {
        if (uiBound) return;
        uiBound = true;

        document.querySelectorAll('[data-hub-tab]').forEach((btn) => {
            btn.addEventListener('click', () => {
                activeTab = btn.getAttribute('data-hub-tab') || 'hoy';
                if (lastBundle) paintExperience(lastBundle);
            });
        });

        const filters = document.getElementById('hubCompFilters');
        if (filters) {
            filters.addEventListener('click', (event) => {
                const chip = event.target.closest('.hub-filter-chip');
                if (!chip) return;
                const value = chip.dataset.comp || '';
                if (!value) {
                    activeCompetitions.clear();
                } else if (activeCompetitions.has(value)) {
                    activeCompetitions.delete(value);
                } else {
                    activeCompetitions.add(value);
                }
                if (lastBundle) {
                    paintFilters(lastBundle);
                    paintExperience(lastBundle);
                }
            });
        }
    }

    function paintBundle(bundle, options) {
        const R = renderers();
        if (!R || !bundle) return;

        const sig = signatureFor(bundle);
        const force = Boolean(options && options.force);
        if (!force && sig === lastSignature) {
            paintExperience(bundle);
            return;
        }
        lastSignature = sig;
        lastBundle = bundle;

        PANELS.forEach((panel) => {
            const node = document.getElementById(panel.mount);
            if (!node) return;
            const result = bundle[panel.key];
            const fn = R[panel.render];
            if (typeof fn === 'function') fn(node, result);
            node.removeAttribute('aria-busy');
        });

        paintExperience(bundle);

        const meta = bundle._meta || {};
        setStoredIndicator(Boolean(meta.showingStored), 'Mostrando datos almacenados');

        if (window.CrackTotalServices && window.CrackTotalServices.RefreshManager) {
            window.CrackTotalServices.RefreshManager.notifyLiveState(Boolean(meta.hasLive));
        }
    }

    async function loadAndRender(options) {
        const opts = options || {};
        const root = document.getElementById('footballHub');
        if (!root || !isEnabled()) return;

        const service = window.CrackTotalServices && window.CrackTotalServices.hub;
        const R = renderers();
        if (!service || !R) return;

        bindUi();

        if (!opts.silent) {
            showSkeletons();
            root.classList.add('is-loading');
            root.classList.remove('is-ready');
        }

        try {
            const bundle = await service.loadHubBundle({ quiet: Boolean(opts.silent) });
            paintBundle(bundle, { force: !opts.silent });
        } catch (error) {
            if (window.CrackTotalServices && window.CrackTotalServices.ErrorManager) {
                window.CrackTotalServices.ErrorManager.log('error', 'Hub load failed', {
                    error: String(error && error.message)
                });
            }
            setStoredIndicator(true, 'Mostrando datos almacenados');
        } finally {
            root.classList.remove('is-loading');
            root.classList.add('is-ready');
        }
    }

    function startRefresh() {
        const refresh = window.CrackTotalServices && window.CrackTotalServices.RefreshManager;
        if (!refresh) return;
        refresh.start(async () => {
            await loadAndRender({ silent: true });
        }, { hadLive: false });
    }

    function init() {
        if (!document.getElementById('footballHub')) return;
        loadAndRender({ silent: false }).then(startRefresh);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.addEventListener('pagehide', () => {
        if (window.CrackTotalServices && window.CrackTotalServices.RefreshManager) {
            window.CrackTotalServices.RefreshManager.stop();
        }
        if (liveTimerId) window.clearInterval(liveTimerId);
        if (countdownId) window.clearInterval(countdownId);
        if (carouselTimerId) window.clearInterval(carouselTimerId);
    });
})();
