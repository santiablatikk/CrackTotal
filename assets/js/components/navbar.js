/**
 * CrackTotalUI.navbar — canonical main-navigation markup
 */
(function () {
    'use strict';

    const UI = (window.CrackTotalUI = window.CrackTotalUI || {});

    const NAV_ITEMS = [
        { key: 'home', href: '/', label: 'Inicio', icon: 'fa-home', aria: 'Ir al inicio' },
        { key: 'games', href: 'games.html', label: 'Juegos', icon: 'fa-gamepad', aria: 'Ir a los juegos' },
        { key: 'profile', href: 'profile.html', label: 'Perfil', icon: 'fa-user', aria: 'Ver mi perfil' },
        { key: 'ranking', href: 'ranking.html', label: 'Rankings', icon: 'fa-trophy', aria: 'Ver ranking general' },
        { key: 'logros', href: 'logros.html', label: 'Logros', icon: 'fa-medal', aria: 'Ver mis logros' },
        { key: 'blog', href: 'blog.html', label: 'Blog', icon: 'fa-blog', aria: 'Leer el blog' },
        { key: 'about', href: 'about.html', label: 'Acerca de', icon: 'fa-info-circle', aria: 'Acerca de nosotros' },
        { key: 'contact', href: 'contact.html', label: 'Contacto', icon: 'fa-envelope', aria: 'Contactar con nosotros' }
    ];

    function detectActive(explicit) {
        if (explicit) return explicit;
        const path = (window.location.pathname || '').toLowerCase();
        if (path.endsWith('/') || path.endsWith('index.html')) return 'home';
        if (path.includes('games')) return 'games';
        if (path.includes('profile')) return 'profile';
        if (path.includes('ranking')) return 'ranking';
        if (path.includes('logros')) return 'logros';
        if (path.includes('blog')) return 'blog';
        if (path.includes('about')) return 'about';
        if (path.includes('contact')) return 'contact';
        return '';
    }

    function renderMarkup(activeKey) {
        const items = NAV_ITEMS.map((item) => {
            const current = item.key === activeKey;
            return (
                '<li><a href="' +
                item.href +
                '" aria-label="' +
                item.aria +
                '"' +
                (current ? ' aria-current="page" class="active"' : '') +
                '><i class="fas ' +
                item.icon +
                '" aria-hidden="true"></i> ' +
                item.label +
                '</a></li>'
            );
        }).join('');

        return (
            '<nav class="main-navigation ct-navbar" role="navigation" aria-label="Navegación principal">' +
            '<a href="/" class="nav-logo" aria-label="Crack Total - Inicio">' +
            'Crack Total <i class="fas fa-futbol" aria-hidden="true"></i>' +
            '</a>' +
            '<button class="nav-toggle" type="button" aria-label="Abrir menú de navegación" aria-expanded="false" aria-controls="ctMainNavList" id="ctNavToggle">' +
            '<i class="fas fa-bars" aria-hidden="true"></i>' +
            '</button>' +
            '<ul id="ctMainNavList">' +
            items +
            '</ul>' +
            '</nav>'
        );
    }

    function mount(target, options) {
        if (!target) return null;
        const opts = options || {};
        const active = detectActive(opts.active || target.getAttribute('data-active') || '');
        const wrap = document.createElement('div');
        wrap.innerHTML = renderMarkup(active);
        const nav = wrap.firstElementChild;
        target.replaceWith(nav);
        return nav;
    }

    UI.navbar = {
        items: NAV_ITEMS,
        detectActive,
        renderMarkup,
        mount
    };
})();
