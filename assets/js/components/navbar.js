/**
 * CrackTotalUI.navbar — canonical Home shell navigation
 */
(function () {
    'use strict';

    const UI = (window.CrackTotalUI = window.CrackTotalUI || {});

    const NAV_ITEMS = [
        { key: 'home', href: '/', label: 'Inicio' },
        { key: 'games', href: 'games.html', label: 'Juegos' },
        { key: 'historias', href: '/#historias', label: 'Historias' },
        { key: 'blog', href: 'blog.html', label: 'Actualidad' },
        { key: 'ranking', href: 'ranking.html', label: 'Rankings' },
        { key: 'logros', href: 'logros.html', label: 'Logros' },
        { key: 'profile', href: 'profile.html', label: 'Perfil', profile: true }
    ];

    function detectActive(explicit) {
        if (explicit) return explicit;
        const path = (window.location.pathname || '').toLowerCase();
        if (path.endsWith('/') || path.endsWith('index.html')) return 'home';
        if (
            path.includes('games') ||
            path.includes('pasalache') ||
            path.includes('top10') ||
            path.includes('mentiroso') ||
            path.includes('quiensabemas') ||
            path.includes('wordle')
        ) {
            return 'games';
        }
        if (path.includes('profile')) return 'profile';
        if (path.includes('ranking')) return 'ranking';
        if (path.includes('logros')) return 'logros';
        if (path.includes('blog')) return 'blog';
        return '';
    }

    function profileLabel() {
        try {
            const name = localStorage.getItem('playerName') || '';
            return name ? 'Perfil de ' + name : 'Crear perfil';
        } catch (error) {
            return 'Perfil';
        }
    }

    function renderMarkup(activeKey) {
        const items = NAV_ITEMS.map(function (item) {
            const current = item.key === activeKey;
            const label = item.profile ? profileLabel() : item.label;
            return (
                '<li><a class="home-nav-link" href="' +
                item.href +
                '"' +
                (current ? ' aria-current="page"' : '') +
                (item.profile ? ' data-profile-label' : '') +
                '>' +
                label +
                '</a></li>'
            );
        }).join('');

        return (
            '<header class="home-header ct-navbar" aria-label="Cabecera principal">' +
            '<nav class="home-navbar home-shell" aria-label="Navegación principal">' +
            '<a class="home-brand" href="/" aria-label="Crack Total, inicio">' +
            '<span class="home-brand-mark" aria-hidden="true"><i class="fas fa-futbol"></i></span>' +
            '<span>Crack Total</span>' +
            '</a>' +
            '<ul class="home-nav-list" id="homeNavMenu">' +
            items +
            '<li>' +
            '<button class="home-nav-search" type="button" data-open-search>' +
            '<i class="fas fa-search" aria-hidden="true"></i>' +
            'Buscar' +
            '</button>' +
            '</li>' +
            '</ul>' +
            '<button class="home-menu-toggle" id="homeMenuToggle" type="button" aria-controls="homeNavMenu" aria-expanded="false" aria-label="Abrir menú de navegación">' +
            '<i class="fas fa-bars" aria-hidden="true"></i>' +
            '</button>' +
            '<a class="home-nav-play" href="games.html">' +
            '<i class="fas fa-play" aria-hidden="true"></i>' +
            'Jugar' +
            '</a>' +
            '</nav>' +
            '</header>'
        );
    }

    function bindNavigation(header) {
        const toggle = header.querySelector('#homeMenuToggle');
        const menu = header.querySelector('#homeNavMenu');
        if (!toggle || !menu) return;

        const setOpen = function (open) {
            menu.classList.toggle('is-open', open);
            header.classList.toggle('is-menu-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute(
                'aria-label',
                open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'
            );
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars', !open);
                icon.classList.toggle('fa-xmark', open);
            }
            document.body.style.overflow = open ? 'hidden' : '';
            menu.querySelectorAll('a, button').forEach(function (control) {
                control.tabIndex = open || window.innerWidth > 1050 ? 0 : -1;
            });
        };

        const syncMenuFocusability = function () {
            if (window.innerWidth > 1050) {
                setOpen(false);
                menu.querySelectorAll('a, button').forEach(function (control) {
                    control.tabIndex = 0;
                });
            } else if (!menu.classList.contains('is-open')) {
                menu.querySelectorAll('a, button').forEach(function (control) {
                    control.tabIndex = -1;
                });
            }
        };

        toggle.addEventListener('click', function () {
            const open = !menu.classList.contains('is-open');
            setOpen(open);
            if (open) {
                const first = menu.querySelector('a, button');
                if (first) first.focus();
            }
        });

        menu.addEventListener('click', function (event) {
            if (event.target.closest('a, button')) setOpen(false);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && menu.classList.contains('is-open')) {
                setOpen(false);
                toggle.focus();
            }
        });

        window.addEventListener('resize', syncMenuFocusability, { passive: true });
        window.addEventListener(
            'scroll',
            function () {
                header.classList.toggle('is-scrolled', window.scrollY > 16);
            },
            { passive: true }
        );

        header.querySelectorAll('[data-open-search]').forEach(function (button) {
            button.addEventListener('click', function () {
                const search = document.getElementById('gameSearch');
                if (search) {
                    const catalog = document.getElementById('juegos');
                    if (catalog) catalog.scrollIntoView({ behavior: 'smooth' });
                    window.setTimeout(function () {
                        search.focus();
                    }, 350);
                    return;
                }
                window.location.href = 'games.html#juegos';
            });
        });

        syncMenuFocusability();
        header.classList.toggle('is-scrolled', window.scrollY > 16);
    }

    function mount(target, options) {
        if (!target) return null;
        const opts = options || {};
        const active = detectActive(opts.active || target.getAttribute('data-active') || '');
        const wrap = document.createElement('div');
        wrap.innerHTML = renderMarkup(active);
        const header = wrap.firstElementChild;
        target.replaceWith(header);
        bindNavigation(header);
        header.setAttribute('data-home-nav-bound', 'true');
        return header;
    }

    UI.navbar = {
        items: NAV_ITEMS,
        detectActive: detectActive,
        renderMarkup: renderMarkup,
        mount: mount
    };
})();
