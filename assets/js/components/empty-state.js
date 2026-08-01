/**
 * CrackTotalUI.emptyState — empty content factory
 */
(function () {
    'use strict';

    const UI = (window.CrackTotalUI = window.CrackTotalUI || {});

    function createEmptyState(options) {
        const opts = Object.assign(
            {
                title: 'Nada por aquí',
                text: 'Todavía no hay contenido para mostrar.',
                icon: '',
                actions: [],
                className: ''
            },
            options || {}
        );

        const el = document.createElement('div');
        el.className = ['ct-empty', opts.className].filter(Boolean).join(' ');
        el.setAttribute('role', 'status');

        if (opts.icon) {
            const icon = document.createElement('div');
            icon.className = 'ct-empty__icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = opts.icon;
            el.appendChild(icon);
        }

        const title = document.createElement('h3');
        title.className = 'ct-empty__title';
        title.textContent = opts.title;
        el.appendChild(title);

        const text = document.createElement('p');
        text.className = 'ct-empty__text';
        text.textContent = opts.text;
        el.appendChild(text);

        if (opts.actions && opts.actions.length) {
            const actions = document.createElement('div');
            actions.className = 'ct-empty__actions';
            opts.actions.forEach((action) => {
                const btn = document.createElement(action.href ? 'a' : 'button');
                btn.className = [
                    'ct-button',
                    action.variant ? `ct-button--${action.variant}` : 'ct-button--primary',
                    'ct-button--sm'
                ].join(' ');
                btn.textContent = action.label || 'Acción';
                if (action.href) {
                    btn.href = action.href;
                } else {
                    btn.type = 'button';
                    if (typeof action.onClick === 'function') {
                        btn.addEventListener('click', action.onClick);
                    }
                }
                actions.appendChild(btn);
            });
            el.appendChild(actions);
        }

        return {
            el,
            mount(parent) {
                if (parent) {
                    parent.innerHTML = '';
                    parent.appendChild(el);
                }
                return this;
            },
            unmount() {
                el.remove();
                return this;
            }
        };
    }

    UI.emptyState = {
        create: createEmptyState,
        render(container, options) {
            if (!container) return null;
            return createEmptyState(options).mount(container);
        }
    };
})();
