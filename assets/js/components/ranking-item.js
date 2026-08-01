/**
 * CrackTotalUI.rankingItem — ranking row factory
 */
(function () {
    'use strict';

    const UI = (window.CrackTotalUI = window.CrackTotalUI || {});

    function create(options) {
        const opts = Object.assign(
            { rank: 1, name: 'Jugador', meta: '', score: '', className: '' },
            options || {}
        );
        const el = document.createElement('article');
        el.className = ['ct-ranking-item', opts.className].filter(Boolean).join(' ');
        el.innerHTML =
            '<div class="ct-ranking-item__rank"></div>' +
            '<div><p class="ct-ranking-item__name"></p><p class="ct-ranking-item__meta"></p></div>' +
            '<div class="ct-ranking-item__score"></div>';
        el.querySelector('.ct-ranking-item__rank').textContent = String(opts.rank);
        el.querySelector('.ct-ranking-item__name').textContent = opts.name;
        el.querySelector('.ct-ranking-item__meta').textContent = opts.meta || '';
        el.querySelector('.ct-ranking-item__score').textContent = opts.score === '' || opts.score == null ? '' : String(opts.score);
        return {
            el,
            mount(parent) {
                if (parent) parent.appendChild(el);
                return this;
            }
        };
    }

    UI.rankingItem = { create };
})();
