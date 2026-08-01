/**
 * Presentational renderers for Football Hub (premium sports cover).
 * Accept normalized data only — never fetch.
 */
(function () {
    'use strict';

    const UI = (window.CrackTotalUI = window.CrackTotalUI || {});
    const Format = () => window.CrackTotalHubFormat || {};

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null && text !== '') node.textContent = text;
        return node;
    }

    function crest(team) {
        const short = (team && (team.short || Format().initials(team.name))) || '?';
        const node = el('span', 'hub-crest', String(short).slice(0, 3).toUpperCase());
        node.setAttribute('aria-hidden', 'true');
        return node;
    }

    function compBadge(name) {
        const tone = Format().competitionTone ? Format().competitionTone(name) : 'default';
        const badge = el('span', 'hub-comp hub-comp--' + tone, name || 'Competición');
        return badge;
    }

    function skeletonRows(count) {
        const frag = document.createDocumentFragment();
        for (let i = 0; i < count; i += 1) {
            const row = el('div', 'hub-skeleton-row hub-skeleton-row--rich');
            row.innerHTML =
                '<span class="ct-skeleton ct-skeleton--title"></span>' +
                '<span class="ct-skeleton hub-skeleton-block"></span>' +
                '<span class="ct-skeleton"></span>';
            frag.appendChild(row);
        }
        return frag;
    }

    function renderEmpty(container, title, text, actions) {
        container.textContent = '';
        if (UI.emptyState) {
            UI.emptyState.render(container, {
                title: title,
                text: text,
                icon: '○',
                actions: actions || [],
                className: 'hub-empty'
            });
            return;
        }
        container.appendChild(el('p', 'hub-fallback-empty', text));
    }

    function renderError(container, message) {
        container.textContent = '';
        if (UI.errorState) {
            UI.errorState.render(container, {
                title: 'No disponible',
                text: message || 'No pudimos cargar esta sección.'
            });
            return;
        }
        container.appendChild(el('p', 'hub-fallback-error', message || 'Error al cargar'));
    }

    function matchLabel(match, mode) {
        const home = (match.home && match.home.name) || 'Local';
        const away = (match.away && match.away.name) || 'Visitante';
        const comp = match.competition || 'Partido';
        if (mode === 'live') {
            return (
                comp +
                ' en vivo: ' +
                home +
                ' ' +
                (match.home && match.home.score != null ? match.home.score : '-') +
                ' - ' +
                (match.away && match.away.score != null ? match.away.score : '-') +
                ' ' +
                away +
                (match.minute != null ? ', minuto ' + match.minute : '')
            );
        }
        if (mode === 'result') {
            return (
                'Resultado ' +
                comp +
                ': ' +
                home +
                ' ' +
                (match.home && match.home.score != null ? match.home.score : '-') +
                ' - ' +
                (match.away && match.away.score != null ? match.away.score : '-') +
                ' ' +
                away
            );
        }
        return 'Próximo ' + comp + ': ' + home + ' vs ' + away;
    }

    function matchCard(match, mode, options) {
        const opts = options || {};
        const featured = Boolean(opts.featured);
        const row = el(
            'article',
            'hub-match hub-match--' + mode + (featured ? ' hub-match--featured' : '')
        );
        row.dataset.matchId = match.id || '';
        if (match.competition) row.dataset.competition = match.competition;
        row.setAttribute('aria-label', matchLabel(match, mode));

        const top = el('div', 'hub-match__meta');
        top.appendChild(compBadge(match.competition));

        if (mode === 'live') {
            const live = el('span', 'hub-match__live');
            const minute = match.minute != null ? Number(match.minute) : 0;
            live.innerHTML =
                '<i class="fas fa-circle" aria-hidden="true"></i> <span data-live-minute="' +
                minute +
                '">' +
                minute +
                "'</span>";
            top.appendChild(live);
        } else if (mode === 'upcoming') {
            const time = el('span', 'hub-match__time');
            time.textContent = Format().formatKickoff(match.kickoff) || '';
            top.appendChild(time);
            if (match.kickoff) {
                const cd = el('span', 'hub-match__countdown');
                cd.dataset.kickoff = match.kickoff;
                cd.textContent = Format().formatCountdown
                    ? Format().formatCountdown(match.kickoff)
                    : '';
                top.appendChild(cd);
            }
        } else if (mode === 'result') {
            top.appendChild(
                el('span', 'hub-match__time', Format().formatRelativeDay(match.finishedAt) || 'FT')
            );
        }

        const stage = el('div', 'hub-match__stage');
        const home = el('div', 'hub-match__side');
        home.appendChild(crest(match.home));
        home.appendChild(el('span', 'hub-match__name', (match.home && match.home.name) || ''));

        const scoreBox = el('div', 'hub-match__scoreboard');
        if (mode === 'live' || mode === 'result') {
            scoreBox.appendChild(
                el(
                    'span',
                    'hub-match__score hub-match__score--big',
                    String(match.home && match.home.score != null ? match.home.score : '-')
                )
            );
            scoreBox.appendChild(el('span', 'hub-match__sep', '–'));
            scoreBox.appendChild(
                el(
                    'span',
                    'hub-match__score hub-match__score--big',
                    String(match.away && match.away.score != null ? match.away.score : '-')
                )
            );
        } else {
            scoreBox.appendChild(el('span', 'hub-match__vs', 'VS'));
        }

        const away = el('div', 'hub-match__side hub-match__side--away');
        away.appendChild(crest(match.away));
        away.appendChild(el('span', 'hub-match__name', (match.away && match.away.name) || ''));

        stage.appendChild(home);
        stage.appendChild(scoreBox);
        stage.appendChild(away);

        row.appendChild(top);
        row.appendChild(stage);

        if (match.venue) {
            row.appendChild(el('p', 'hub-match__venue', match.venue));
        }

        return row;
    }

    function renderMatchList(container, result, mode, emptyTitle) {
        container.textContent = '';
        if (!result || !result.ok) {
            renderError(container, result && result.message);
            return;
        }
        const items = (result.data && result.data.items) || [];
        if (!items.length) {
            renderEmpty(container, emptyTitle, 'No hay partidos para mostrar ahora.');
            return;
        }
        const list = el('div', 'hub-match-list');
        items.forEach((item, index) => {
            list.appendChild(matchCard(item, mode, { featured: index === 0 && mode === 'live' }));
        });
        container.appendChild(list);
    }

    function renderFeatured(container, matches, emptyOptions) {
        container.textContent = '';
        if (!matches || !matches.length) {
            const empty = emptyOptions || {};
            renderEmpty(
                container,
                empty.title || 'Sin destacados',
                empty.text || 'Cuando haya partidos, aparecerán acá.',
                empty.actions || [{ label: 'Jugar ahora', href: 'games.html', variant: 'primary' }]
            );
            return;
        }
        const wrap = el('div', 'hub-carousel');
        const track = el('div', 'hub-carousel__track');
        track.setAttribute('tabindex', '0');
        matches.slice(0, 6).forEach((item, index) => {
            const slide = el('div', 'hub-carousel__slide');
            const mode = item._mode || (item.status === 'live' ? 'live' : item.status === 'finished' ? 'result' : 'upcoming');
            slide.appendChild(matchCard(item, mode, { featured: true }));
            slide.style.setProperty('--hub-delay', index * 40 + 'ms');
            track.appendChild(slide);
        });
        const prev = el('button', 'hub-carousel__nav hub-carousel__nav--prev');
        prev.type = 'button';
        prev.setAttribute('aria-label', 'Partido anterior');
        prev.innerHTML = '<i class="fas fa-chevron-left" aria-hidden="true"></i>';
        const next = el('button', 'hub-carousel__nav hub-carousel__nav--next');
        next.type = 'button';
        next.setAttribute('aria-label', 'Partido siguiente');
        next.innerHTML = '<i class="fas fa-chevron-right" aria-hidden="true"></i>';
        wrap.appendChild(prev);
        wrap.appendChild(track);
        wrap.appendChild(next);
        container.appendChild(wrap);
    }

    function renderBoard(container, items, mode, emptyTitle, emptyOptions) {
        container.textContent = '';
        if (!items || !items.length) {
            const empty = emptyOptions || {};
            renderEmpty(
                container,
                emptyTitle || 'Sin partidos',
                empty.text || 'No hay partidos en esta vista.',
                empty.actions || [{ label: 'Jugar ahora', href: 'games.html', variant: 'primary' }]
            );
            return;
        }
        const list = el('div', 'hub-match-list hub-match-list--board');
        items.forEach((item, index) => {
            const card = matchCard(item, mode || item._mode || 'upcoming', {
                featured: index === 0
            });
            card.classList.add('hub-reveal-item');
            card.style.setProperty('--hub-delay', Math.min(index, 8) * 45 + 'ms');
            list.appendChild(card);
        });
        container.appendChild(list);
    }

    function renderNews(container, result) {
        container.textContent = '';
        if (!result || !result.ok) {
            renderError(container, result && result.message);
            return;
        }
        const items = (result.data && result.data.items) || [];
        if (!items.length) {
            renderEmpty(container, 'Sin noticias', 'Todavía no hay notas destacadas.');
            return;
        }

        const layout = el('div', 'hub-news-visual');
        items.forEach((item, index) => {
            const link = el('a', 'hub-news-card' + (index === 0 ? ' hub-news-card--hero' : ''));
            link.href = item.href || 'blog.html';
            if (item.image) {
                const media = el('div', 'hub-news-card__media');
                const img = document.createElement('img');
                img.src = item.image;
                img.alt = item.title || 'Noticia';
                img.loading = 'lazy';
                img.decoding = 'async';
                media.appendChild(img);
                link.appendChild(media);
            }
            link.setAttribute('aria-label', item.title || 'Leer noticia');
            const body = el('div', 'hub-news-card__body');
            if (item.category) body.appendChild(el('span', 'ct-badge ct-badge--primary', item.category));
            body.appendChild(el('h4', 'hub-news-card__title', item.title));
            body.appendChild(el('p', 'hub-news-card__summary', item.summary));
            link.appendChild(body);
            layout.appendChild(link);
        });
        container.appendChild(layout);
    }

    function renderMostRead(container, result) {
        container.textContent = '';
        const items = (result && result.data && result.data.items) || [];
        if (!items.length) {
            renderEmpty(container, 'Lo más leído', 'Pronto vas a ver las notas top.');
            return;
        }
        const box = el('div', 'hub-most-read');
        box.appendChild(el('h3', 'hub-panel__title', 'Lo más leído'));
        const list = el('ol', 'hub-most-read__list');
        items.slice(0, 5).forEach((item, index) => {
            const li = el('li', 'hub-most-read__item');
            const link = el('a', 'hub-most-read__link');
            link.href = item.href || 'blog.html';
            link.appendChild(el('span', 'hub-most-read__rank', String(index + 1)));
            const copy = el('div', 'hub-most-read__copy');
            copy.appendChild(el('p', 'hub-most-read__title', item.title));
            if (item.category) copy.appendChild(el('p', 'hub-most-read__cat', item.category));
            link.appendChild(copy);
            li.appendChild(link);
            list.appendChild(li);
        });
        box.appendChild(list);
        container.appendChild(box);
    }

    function renderSpotlightCard(container, data, kind) {
        container.textContent = '';
        if (!data) {
            renderEmpty(container, 'Destacado', 'Contenido no disponible.');
            return;
        }
        const card = el('article', 'hub-spotlight-card hub-spotlight-card--' + kind);
        if (data.image) {
            const media = el('div', 'hub-spotlight-card__media');
            const img = document.createElement('img');
            img.src = data.image;
            img.alt = '';
            img.loading = 'lazy';
            img.decoding = 'async';
            media.appendChild(img);
            card.appendChild(media);
        }
        const body = el('div', 'hub-spotlight-card__body');
        body.appendChild(el('p', 'hub-spotlight-card__eyebrow', data.role || data.eyebrow || 'Destacado'));
        body.appendChild(el('h3', 'hub-spotlight-card__title', data.name || data.title || ''));
        if (data.team || data.competition) {
            body.appendChild(el('p', 'hub-spotlight-card__meta', data.team || data.competition));
        }
        if (data.stat) body.appendChild(el('p', 'hub-spotlight-card__stat', data.stat));
        if (data.blurb || data.text) {
            body.appendChild(el('p', 'hub-spotlight-card__text', data.blurb || data.text));
        }
        card.appendChild(body);
        container.appendChild(card);
    }

    function renderTrivia(container, trivia) {
        container.textContent = '';
        if (!trivia) {
            renderEmpty(container, 'Trivia', 'Volvé más tarde.');
            return;
        }
        const card = el('article', 'hub-trivia');
        card.appendChild(el('p', 'hub-trivia__eyebrow', 'Trivia rápida'));
        card.appendChild(el('h3', 'hub-trivia__q', trivia.question));
        const options = el('div', 'hub-trivia__options');
        (trivia.options || []).forEach((label, index) => {
            const btn = el('button', 'hub-trivia__option');
            btn.type = 'button';
            btn.textContent = label;
            btn.dataset.index = String(index);
            options.appendChild(btn);
        });
        card.appendChild(options);
        const feedback = el('p', 'hub-trivia__feedback');
        feedback.hidden = true;
        card.appendChild(feedback);
        const cta = el('a', 'hub-trivia__cta ct-button ct-button--primary');
        cta.href = trivia.ctaHref || 'games.html';
        cta.textContent = trivia.ctaLabel || 'Jugar ahora';
        card.appendChild(cta);

        options.addEventListener('click', (event) => {
            const btn = event.target.closest('.hub-trivia__option');
            if (!btn || options.classList.contains('is-locked')) return;
            options.classList.add('is-locked');
            const chosen = Number(btn.dataset.index);
            const correct = Number(trivia.answerIndex);
            Array.from(options.children).forEach((node, idx) => {
                if (idx === correct) node.classList.add('is-correct');
                else if (idx === chosen) node.classList.add('is-wrong');
            });
            feedback.hidden = false;
            feedback.textContent =
                chosen === correct ? '¡Bien! Seguís en ritmo de crack.' : 'Casi. Entrá a jugar y mejorá.';
        });

        container.appendChild(card);
    }

    function renderGameOfDay(container, result) {
        container.textContent = '';
        if (!result || !result.ok) {
            renderError(container, result && result.message);
            return;
        }
        const item = result.data && result.data.item;
        if (!item) {
            renderEmpty(container, 'Sin recomendación', 'Volvé más tarde por el juego del día.');
            return;
        }
        const card = el('a', 'hub-game-day');
        card.href = item.href || 'games.html';
        if (item.image) {
            const media = el('div', 'hub-game-day__media');
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = '';
            img.loading = 'lazy';
            img.decoding = 'async';
            media.appendChild(img);
            card.appendChild(media);
        }
        const body = el('div', 'hub-game-day__body');
        body.appendChild(el('p', 'hub-game-day__eyebrow', item.eyebrow));
        const titleRow = el('div', 'hub-game-day__title-row');
        titleRow.appendChild(el('h4', 'hub-game-day__title', item.title));
        if (item.badge) titleRow.appendChild(el('span', 'ct-badge ct-badge--warm', item.badge));
        body.appendChild(titleRow);
        body.appendChild(el('p', 'hub-game-day__text', item.description));
        if (item.facts && item.facts.length) {
            const facts = el('ul', 'hub-game-day__facts');
            item.facts.forEach((fact) => facts.appendChild(el('li', '', fact)));
            body.appendChild(facts);
        }
        const cta = el('span', 'hub-game-day__cta ct-button ct-button--primary');
        cta.textContent = item.cta || 'Jugar ahora';
        body.appendChild(cta);
        card.appendChild(body);
        container.appendChild(card);
    }

    function renderRanking(container, result) {
        container.textContent = '';
        if (!result || !result.ok) {
            renderError(container, result && result.message);
            return;
        }
        const items = (result.data && result.data.items) || [];
        if (!items.length) {
            renderEmpty(container, 'Ranking vacío', 'Todavía no hay puntuaciones publicadas.');
            return;
        }
        const list = el('div', 'hub-rank-list');
        items.forEach((item) => {
            const row = el('article', 'hub-rank-item');
            row.appendChild(el('span', 'hub-rank-item__pos', String(item.rank)));
            const avatar = el('span', 'ct-avatar hub-rank-item__avatar', Format().initials(item.name));
            avatar.setAttribute('aria-hidden', 'true');
            row.appendChild(avatar);
            const copy = el('div', 'hub-rank-item__copy');
            copy.appendChild(el('p', 'hub-rank-item__name', item.name));
            if (item.meta) copy.appendChild(el('p', 'hub-rank-item__meta', item.meta));
            row.appendChild(copy);
            row.appendChild(el('span', 'hub-rank-item__score', String(item.score)));
            list.appendChild(row);
        });
        container.appendChild(list);
        if (result.data.href) {
            const more = el('a', 'hub-card__more', 'Ver ranking completo');
            more.href = result.data.href;
            container.appendChild(more);
        }
    }

    UI.hubRenderers = {
        skeletonRows: skeletonRows,
        matchCard: matchCard,
        renderLive: function (container, result) {
            renderMatchList(container, result, 'live', 'Sin partidos en vivo');
        },
        renderUpcoming: function (container, result) {
            renderMatchList(container, result, 'upcoming', 'Agenda vacía');
        },
        renderResults: function (container, result) {
            renderMatchList(container, result, 'result', 'Sin resultados');
        },
        renderNews: renderNews,
        renderMostRead: renderMostRead,
        renderFeatured: renderFeatured,
        renderBoard: renderBoard,
        renderSpotlightCard: renderSpotlightCard,
        renderTrivia: renderTrivia,
        renderGameOfDay: renderGameOfDay,
        renderRanking: renderRanking
    };
})();
