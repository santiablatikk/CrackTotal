/**
 * CrackTotalUI.statCard — statistic card factory
 */
(function () {
    'use strict';

    const UI = (window.CrackTotalUI = window.CrackTotalUI || {});

    function create(options) {
        const opts = Object.assign({ value: '0', label: '', className: '' }, options || {});
        const el = document.createElement('div');
        el.className = ['ct-stat', opts.className].filter(Boolean).join(' ');
        el.innerHTML = '<div class="ct-stat__value"></div><div class="ct-stat__label"></div>';
        el.querySelector('.ct-stat__value').textContent = String(opts.value);
        el.querySelector('.ct-stat__label').textContent = opts.label || '';
        return {
            el,
            setValue(value) {
                el.querySelector('.ct-stat__value').textContent = String(value);
            },
            mount(parent) {
                if (parent) parent.appendChild(el);
                return this;
            }
        };
    }

    UI.statCard = { create };
})();
