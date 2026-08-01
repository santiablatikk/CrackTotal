(function () {
    'use strict';

    const normalize = (value) => value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    function initNavigation() {
        const header = document.querySelector('.home-header');
        const toggle = document.getElementById('homeMenuToggle');
        const menu = document.getElementById('homeNavMenu');

        if (!header || !toggle || !menu) return;

        const setOpen = (open) => {
            menu.classList.toggle('is-open', open);
            header.classList.toggle('is-menu-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
            toggle.querySelector('i')?.classList.toggle('fa-bars', !open);
            toggle.querySelector('i')?.classList.toggle('fa-xmark', open);
            document.body.style.overflow = open ? 'hidden' : '';

            menu.querySelectorAll('a, button').forEach((control) => {
                control.tabIndex = open || window.innerWidth > 1050 ? 0 : -1;
            });
        };

        const syncMenuFocusability = () => {
            if (window.innerWidth > 1050) {
                setOpen(false);
                menu.querySelectorAll('a, button').forEach((control) => {
                    control.tabIndex = 0;
                });
            } else if (!menu.classList.contains('is-open')) {
                menu.querySelectorAll('a, button').forEach((control) => {
                    control.tabIndex = -1;
                });
            }
        };

        toggle.addEventListener('click', () => {
            const open = !menu.classList.contains('is-open');
            setOpen(open);
            if (open) menu.querySelector('a, button')?.focus();
        });

        menu.addEventListener('click', (event) => {
            if (event.target.closest('a, button')) setOpen(false);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && menu.classList.contains('is-open')) {
                setOpen(false);
                toggle.focus();
            }
        });

        window.addEventListener('resize', syncMenuFocusability, { passive: true });
        window.addEventListener('scroll', () => {
            header.classList.toggle('is-scrolled', window.scrollY > 16);
        }, { passive: true });

        syncMenuFocusability();
        header.classList.toggle('is-scrolled', window.scrollY > 16);
    }

    function initCatalog() {
        const search = document.getElementById('gameSearch');
        const filters = Array.from(document.querySelectorAll('.home-filter'));
        const cards = Array.from(document.querySelectorAll('.home-game-card'));
        const emptyState = document.getElementById('catalogEmptyState');
        const resultStatus = document.getElementById('catalogResultStatus');

        if (!search || filters.length === 0 || cards.length === 0) return;

        let activeFilter = 'todos';

        const render = () => {
            const query = normalize(search.value);
            let visible = 0;

            cards.forEach((card) => {
                const categories = (card.dataset.categories || '').split(' ');
                const text = normalize(`${card.dataset.search || ''} ${card.textContent}`);
                const categoryMatches = activeFilter === 'todos' || categories.includes(activeFilter);
                const searchMatches = !query || text.includes(query);
                const show = categoryMatches && searchMatches;
                card.hidden = !show;
                if (show) visible += 1;
            });

            if (emptyState) emptyState.hidden = visible !== 0;
            if (resultStatus) {
                resultStatus.textContent = visible === 1
                    ? '1 juego disponible'
                    : `${visible} juegos disponibles`;
            }
        };

        filters.forEach((filter) => {
            filter.addEventListener('click', () => {
                activeFilter = filter.dataset.filter || 'todos';
                filters.forEach((item) => {
                    item.setAttribute('aria-pressed', String(item === filter));
                });
                render();
            });
        });

        search.addEventListener('input', render);
        render();
    }

    function initSearchShortcuts() {
        const search = document.getElementById('gameSearch');
        const searchButtons = document.querySelectorAll('[data-open-search]');

        searchButtons.forEach((button) => {
            button.addEventListener('click', () => {
                document.getElementById('juegos')?.scrollIntoView({ behavior: 'smooth' });
                window.setTimeout(() => search?.focus(), 350);
            });
        });
    }

    function initReveals() {
        const elements = document.querySelectorAll('.home-reveal');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (reduceMotion || !('IntersectionObserver' in window)) {
            elements.forEach((element) => element.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.14, rootMargin: '0px 0px -40px' });

        elements.forEach((element) => observer.observe(element));
    }

    function initCounters() {
        const counters = document.querySelectorAll('[data-count]');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const setFinalValue = (element) => {
            element.textContent = `${element.dataset.count || '0'}${element.dataset.suffix || ''}`;
        };

        if (reduceMotion || !('IntersectionObserver' in window)) {
            counters.forEach(setFinalValue);
            return;
        }

        const animate = (element) => {
            const target = Number(element.dataset.count || 0);
            const suffix = element.dataset.suffix || '';
            const duration = 900;
            const start = performance.now();

            const frame = (time) => {
                const progress = Math.min((time - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                element.textContent = `${Math.round(target * eased)}${suffix}`;
                if (progress < 1) requestAnimationFrame(frame);
            };

            requestAnimationFrame(frame);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                animate(entry.target);
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.6 });

        counters.forEach((counter) => observer.observe(counter));
    }

    function updateProfileLabels() {
        let playerName = '';
        try {
            playerName = localStorage.getItem('playerName') || '';
        } catch (error) {
            playerName = '';
        }

        document.querySelectorAll('[data-profile-label]').forEach((element) => {
            element.textContent = playerName ? `Perfil de ${playerName}` : 'Crear perfil';
        });
    }

    function updateYear() {
        document.querySelectorAll('[data-current-year]').forEach((element) => {
            element.textContent = String(new Date().getFullYear());
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initNavigation();
        initCatalog();
        initSearchShortcuts();
        initReveals();
        initCounters();
        updateProfileLabels();
        updateYear();
    });
})();
