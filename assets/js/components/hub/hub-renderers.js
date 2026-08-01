/**
 * Presentational renderers for Football Hub cards.
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

    function skeletonRows(count) {
        const frag = document.createDocumentFragment();
        for (let i = 0; i < count; i += 1) {
            const row = el('div', 'hub-skeleton-row');
            row.innerHTML =
                '<span class="ct-skeleton ct-skeleton--title"></span>' +
                '<span class="ct-skeleton"></span>' +
                '<span class="ct-skeleton"></span>';
            frag.appendChild(row);
        }
        return frag;
    }

    function renderEmpty(container, title, text) {
        container.textContent = '';
        if (UI.emptyState) {
            UI.emptyState.render(container, { title, text, icon: '○' });
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

    function matchRow(match, mode) {
        const row = el('article', 'hub-match');
        const top = el('div', 'hub-match__meta');
        top.appendChild(el('span', 'hub-match__comp', match.competition));

        if (mode === 'live' && match.minute != null) {
            const live = el('span', 'hub-match__live');
            live.innerHTML = '<i class="fas fa-circle" aria-hidden="true"></i> ' + match.minute + "'";
            top.appendChild(live);
        } else if (mode === 'upcoming') {
            top.appendChild(el('span', 'hub-match__time', Format().formatKickoff(match.kickoff) || ''));
        } else if (mode === 'result') {
            top.appendChild(el('span', 'hub-match__time', Format().formatRelativeDay(match.finishedAt) || ''));
        }

        const teams = el('div', 'hub-match__teams');
        const home = el('div', 'hub-match__team');
        home.appendChild(el('span', 'hub-match__name', match.home.name));
        const away = el('div', 'hub-match__team');
        away.appendChild(el('span', 'hub-match__name', match.away.name));

        if (mode === 'live' || mode === 'result') {
            home.appendChild(el('span', 'hub-match__score', String(match.home.score ?? '-')));
            away.appendChild(el('span', 'hub-match__score', String(match.away.score ?? '-')));
        }

        teams.appendChild(home);
        teams.appendChild(away);
        row.appendChild(top);
        row.appendChild(teams);
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
        items.forEach((item) => list.appendChild(matchRow(item, mode)));
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
        const list = el('div', 'hub-news-list');
        items.forEach((item) => {
            const link = el('a', 'hub-news-item');
            link.href = item.href || 'blog.html';
            if (item.image) {
                const media = el('div', 'hub-news-item__media');
                const img = document.createElement('img');
                img.src = item.image;
                img.alt = '';
                img.loading = 'lazy';
                img.decoding = 'async';
                media.appendChild(img);
                link.appendChild(media);
            }
            const body = el('div', 'hub-news-item__body');
            if (item.category) body.appendChild(el('span', 'ct-badge ct-badge--primary', item.category));
            body.appendChild(el('h4', 'hub-news-item__title', item.title));
            body.appendChild(el('p', 'hub-news-item__summary', item.summary));
            link.appendChild(body);
            list.appendChild(link);
        });
        container.appendChild(list);
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
        const cta = el('span', 'hub-game-day__cta');
        cta.textContent = item.cta || 'Jugar';
        cta.innerHTML += ' <i class="fas fa-arrow-right" aria-hidden="true"></i>';
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
        skeletonRows,
        renderLive(container, result) {
            renderMatchList(container, result, 'live', 'Sin partidos en vivo');
        },
        renderUpcoming(container, result) {
            renderMatchList(container, result, 'upcoming', 'Agenda vacía');
        },
        renderResults(container, result) {
            renderMatchList(container, result, 'result', 'Sin resultados');
        },
        renderNews,
        renderGameOfDay,
        renderRanking
    };
})();
