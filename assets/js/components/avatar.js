/**
 * CrackTotalUI.avatar — initials / icon avatar
 */
(function () {
    'use strict';

    const UI = (window.CrackTotalUI = window.CrackTotalUI || {});

    function initialsFrom(name) {
        const parts = String(name || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);
        if (!parts.length) return '?';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    function create(options) {
        const opts = Object.assign({ name: '', label: '', size: 'md', className: '' }, options || {});
        const el = document.createElement('span');
        el.className = ['ct-avatar', opts.size === 'lg' ? 'ct-avatar--lg' : '', opts.className]
            .filter(Boolean)
            .join(' ');
        el.setAttribute('role', 'img');
        el.setAttribute('aria-label', opts.label || opts.name || 'Usuario');
        el.textContent = initialsFrom(opts.name);
        return {
            el,
            setName(name) {
                el.textContent = initialsFrom(name);
                el.setAttribute('aria-label', name || opts.label || 'Usuario');
            },
            mount(parent) {
                if (parent) parent.appendChild(el);
                return this;
            }
        };
    }

    UI.avatar = { create, initialsFrom };
})();
