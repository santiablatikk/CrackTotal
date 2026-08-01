/**
 * CrackTotalUI.loader — loading indicator factory
 */
(function () {
    'use strict';

    const UI = (window.CrackTotalUI = window.CrackTotalUI || {});

    function createLoader(options) {
        const opts = Object.assign(
            {
                label: 'Cargando…',
                block: false,
                className: ''
            },
            options || {}
        );

        const el = document.createElement('div');
        el.className = [
            'ct-loader',
            opts.block ? 'ct-loader--block' : '',
            opts.className
        ]
            .filter(Boolean)
            .join(' ');
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.innerHTML =
            '<span class="ct-loader__spinner" aria-hidden="true"></span>' +
            '<span class="ct-loader__label"></span>';
        el.querySelector('.ct-loader__label').textContent = opts.label;

        return {
            el,
            setLabel(text) {
                const label = el.querySelector('.ct-loader__label');
                if (label) label.textContent = text || '';
            },
            mount(parent) {
                if (parent) parent.appendChild(el);
                return this;
            },
            unmount() {
                el.remove();
                return this;
            }
        };
    }

    function showIn(container, options) {
        if (!container) return null;
        container.setAttribute('aria-busy', 'true');
        const loader = createLoader(Object.assign({ block: true }, options));
        loader.mount(container);
        return {
            loader,
            clear() {
                loader.unmount();
                container.removeAttribute('aria-busy');
            }
        };
    }

    UI.loader = {
        create: createLoader,
        showIn
    };
})();
