/**
 * CrackTotalUI.errorState — empty-state variant for errors
 */
(function () {
    'use strict';

    const UI = (window.CrackTotalUI = window.CrackTotalUI || {});

    function create(options) {
        const opts = Object.assign(
            {
                title: 'Algo salió mal',
                text: 'No pudimos cargar este contenido. Probá de nuevo.',
                icon: '!',
                actions: [],
                className: ''
            },
            options || {}
        );

        if (!UI.emptyState || typeof UI.emptyState.create !== 'function') {
            const el = document.createElement('div');
            el.className = 'ct-empty ct-error';
            el.setAttribute('role', 'alert');
            el.innerHTML =
                '<h3 class="ct-empty__title"></h3><p class="ct-empty__text"></p>';
            el.querySelector('.ct-empty__title').textContent = opts.title;
            el.querySelector('.ct-empty__text').textContent = opts.text;
            return { el, mount(parent) { if (parent) { parent.innerHTML = ''; parent.appendChild(el); } return this; } };
        }

        const state = UI.emptyState.create(
            Object.assign({}, opts, {
                className: ['ct-error', opts.className].filter(Boolean).join(' ')
            })
        );
        state.el.setAttribute('role', 'alert');
        return state;
    }

    UI.errorState = {
        create,
        render(container, options) {
            if (!container) return null;
            return create(options).mount(container);
        }
    };
})();
