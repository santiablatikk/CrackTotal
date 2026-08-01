/**
 * CrackTotalUI gamification components — Design System based (ct-*).
 * ProfileCard, XPBar, AchievementCard, Badge, LevelCard,
 * StatsGrid, HistoryCard, RankingCard, ActivityFeed, StreakWidget
 */
(function () {
    'use strict';

    const UI = (window.CrackTotalUI = window.CrackTotalUI || {});
    const G = (UI.gamification = UI.gamification || {});

    function el(tag, className, html) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (html != null) node.innerHTML = html;
        return node;
    }

    function formatDuration(totalSec) {
        const sec = Math.max(0, Number(totalSec) || 0);
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        if (h > 0) return h + 'h ' + m + 'm';
        if (m > 0) return m + ' min';
        return sec + 's';
    }

    function formatDate(iso) {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return '—';
        }
    }

    function formatRelative(iso) {
        if (!iso) return '';
        try {
            const diff = Date.now() - new Date(iso).getTime();
            const mins = Math.floor(diff / 60000);
            if (mins < 1) return 'Ahora';
            if (mins < 60) return 'Hace ' + mins + ' min';
            const hours = Math.floor(mins / 60);
            if (hours < 24) return 'Hace ' + hours + ' h';
            const days = Math.floor(hours / 24);
            return 'Hace ' + days + ' d';
        } catch (e) {
            return '';
        }
    }

    /* ---------- XPBar ---------- */
    G.XPBar = {
        create(options) {
            const opts = options || {};
            const root = el('div', 'ct-xp-bar');
            root.innerHTML =
                '<div class="ct-xp-bar__meta"><span class="ct-xp-bar__label"></span><span class="ct-xp-bar__values"></span></div>' +
                '<div class="ct-xp-bar__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
                '<div class="ct-xp-bar__fill"></div></div>';
            const api = {
                el: root,
                update(level) {
                    const L = level || {};
                    const pct = Math.round((L.progress || 0) * 100);
                    const label = root.querySelector('.ct-xp-bar__label');
                    const values = root.querySelector('.ct-xp-bar__values');
                    const fill = root.querySelector('.ct-xp-bar__fill');
                    const track = root.querySelector('.ct-xp-bar__track');
                    label.textContent = L.next
                        ? 'Progreso a ' + L.next.name
                        : 'Nivel máximo';
                    values.textContent = L.next
                        ? (L.xpIntoLevel || 0) + ' / ' + (L.xpForNext || 0) + ' XP'
                        : (L.totalXp || 0) + ' XP';
                    track.setAttribute('aria-valuenow', String(pct));
                    requestAnimationFrame(() => {
                        fill.style.width = pct + '%';
                        if (opts.animate !== false) fill.classList.add('is-animated');
                    });
                },
                mount(parent) {
                    if (parent) parent.appendChild(root);
                    return api;
                }
            };
            if (opts.level) api.update(opts.level);
            return api;
        }
    };

    /* ---------- StreakWidget ---------- */
    G.StreakWidget = {
        create(options) {
            const streak = (options && options.streak) || { current: 0, best: 0 };
            const root = el('div', 'ct-streak');
            root.innerHTML =
                '<div class="ct-streak__icon" aria-hidden="true"><i class="fas fa-fire"></i></div>' +
                '<div class="ct-streak__body">' +
                '<p class="ct-streak__eyebrow">Racha actual</p>' +
                '<p class="ct-streak__value"><span data-streak-current>0</span> días</p>' +
                '<p class="ct-streak__best">Mejor: <strong data-streak-best>0</strong></p>' +
                '</div>';
            const api = {
                el: root,
                update(next) {
                    const s = next || { current: 0, best: 0 };
                    root.querySelector('[data-streak-current]').textContent = String(s.current || 0);
                    root.querySelector('[data-streak-best]').textContent = String(s.best || 0);
                    root.classList.toggle('is-hot', (s.current || 0) >= 3);
                },
                mount(parent) {
                    if (parent) parent.appendChild(root);
                    return api;
                }
            };
            api.update(streak);
            return api;
        }
    };

    /* ---------- LevelCard ---------- */
    G.LevelCard = {
        create(options) {
            const level = (options && options.level) || {};
            const current = level.current || { name: 'Novato', icon: 'fa-seedling' };
            const root = el('div', 'ct-level-card');
            root.innerHTML =
                '<div class="ct-level-card__icon" aria-hidden="true"><i class="fas"></i></div>' +
                '<div><p class="ct-level-card__eyebrow">Nivel</p><p class="ct-level-card__name"></p>' +
                '<p class="ct-level-card__xp"></p></div>';
            const api = {
                el: root,
                update(nextLevel) {
                    const L = nextLevel || level;
                    const cur = L.current || current;
                    root.querySelector('.ct-level-card__icon i').className = 'fas ' + (cur.icon || 'fa-star');
                    root.querySelector('.ct-level-card__name').textContent = cur.name || 'Novato';
                    root.querySelector('.ct-level-card__xp').textContent = (L.totalXp || 0) + ' XP total';
                    if (cur.color) root.style.setProperty('--ct-level-accent', cur.color);
                },
                mount(parent) {
                    if (parent) parent.appendChild(root);
                    return api;
                }
            };
            api.update(level);
            return api;
        }
    };

    /* ---------- Badge ---------- */
    G.Badge = {
        create(options) {
            const b = options || {};
            const root = el('div', 'ct-game-badge' + (b.earned ? ' is-earned' : ' is-locked'));
            root.setAttribute('title', b.description || b.name || '');
            root.innerHTML =
                '<span class="ct-game-badge__icon" aria-hidden="true"><i class="fas ' +
                (b.icon || 'fa-medal') +
                '"></i></span>' +
                '<span class="ct-game-badge__name"></span>';
            root.querySelector('.ct-game-badge__name').textContent = b.name || 'Insignia';
            return {
                el: root,
                mount(parent) {
                    if (parent) parent.appendChild(root);
                    return this;
                }
            };
        }
    };

    /* ---------- AchievementCard ---------- */
    G.AchievementCard = {
        create(options) {
            const a = options || {};
            const pct = Math.min(100, Math.round(((a.progress || 0) / Math.max(1, a.target || 1)) * 100));
            const root = el('article', 'ct-achievement' + (a.unlocked ? ' is-unlocked' : ''));
            root.innerHTML =
                '<div class="ct-achievement__icon" aria-hidden="true"><i class="fas ' +
                (a.icon || 'fa-trophy') +
                '"></i></div>' +
                '<div class="ct-achievement__body">' +
                '<h4 class="ct-achievement__title"></h4>' +
                '<p class="ct-achievement__desc"></p>' +
                '<div class="ct-achievement__progress"><span style="width:' +
                pct +
                '%"></span></div>' +
                '<p class="ct-achievement__meta"></p></div>';
            root.querySelector('.ct-achievement__title').textContent = a.title || 'Logro';
            root.querySelector('.ct-achievement__desc').textContent = a.description || '';
            const meta = a.unlocked
                ? 'Desbloqueado · ' + formatDate(a.unlockedAt)
                : (a.progress || 0) + ' / ' + (a.target || 1);
            root.querySelector('.ct-achievement__meta').textContent = meta;
            return {
                el: root,
                mount(parent) {
                    if (parent) parent.appendChild(root);
                    return this;
                }
            };
        }
    };

    /* ---------- StatsGrid ---------- */
    G.StatsGrid = {
        create(options) {
            const stats = (options && options.stats) || {};
            const root = el('div', 'ct-stats-grid');
            const items = [
                { key: 'gamesPlayed', label: 'Juegos jugados', icon: 'fa-gamepad' },
                { key: 'gamesWon', label: 'Partidas ganadas', icon: 'fa-trophy' },
                { key: 'accuracy', label: '% aciertos', icon: 'fa-bullseye', suffix: '%' },
                { key: 'totalPlayTimeSec', label: 'Tiempo total', icon: 'fa-clock', format: formatDuration },
                { key: 'streak', label: 'Racha actual', icon: 'fa-fire', custom: true },
                { key: 'bestStreak', label: 'Mejor racha', icon: 'fa-medal', custom: true }
            ];
            items.forEach((item) => {
                const card = el('div', 'ct-stat ct-stat--gamified');
                let value = stats[item.key];
                if (item.key === 'streak') value = (options && options.streak && options.streak.current) || 0;
                if (item.key === 'bestStreak') value = (options && options.streak && options.streak.best) || 0;
                if (item.format) value = item.format(value);
                else if (item.suffix) value = String(value != null ? value : 0) + item.suffix;
                else value = String(value != null ? value : 0);
                card.innerHTML =
                    '<div class="ct-stat__icon" aria-hidden="true"><i class="fas ' +
                    item.icon +
                    '"></i></div>' +
                    '<div class="ct-stat__value"></div><div class="ct-stat__label"></div>';
                card.querySelector('.ct-stat__value').textContent = value;
                card.querySelector('.ct-stat__label').textContent = item.label;
                root.appendChild(card);
            });
            return {
                el: root,
                mount(parent) {
                    if (parent) parent.appendChild(root);
                    return this;
                }
            };
        }
    };

    /* ---------- HistoryCard ---------- */
    G.HistoryCard = {
        create(options) {
            const matches = (options && options.matches) || [];
            const root = el('div', 'ct-history-card');
            root.innerHTML = '<h3 class="ct-history-card__title">Últimos juegos</h3><ul class="ct-history-card__list"></ul>';
            const list = root.querySelector('ul');
            if (!matches.length) {
                list.innerHTML =
                    '<li class="ct-history-card__empty">Todavía no hay partidas. ¡Jugá tu primer partido!</li>';
            } else {
                matches.forEach((m) => {
                    const li = el('li', 'ct-history-card__item');
                    const win = m.result === 'victory';
                    li.innerHTML =
                        '<span class="ct-history-card__game"></span>' +
                        '<span class="ct-badge ' +
                        (win ? 'ct-badge--primary' : '') +
                        '">' +
                        (win ? 'Victoria' : 'Derrota') +
                        '</span>' +
                        '<span class="ct-history-card__score"></span>' +
                        '<span class="ct-history-card__when"></span>';
                    li.querySelector('.ct-history-card__game').textContent = m.gameName || m.gameId;
                    li.querySelector('.ct-history-card__score').textContent =
                        (m.score != null ? m.score : m.correctAnswers || 0) + ' pts';
                    li.querySelector('.ct-history-card__when').textContent = formatRelative(m.at);
                    list.appendChild(li);
                });
            }
            return {
                el: root,
                mount(parent) {
                    if (parent) parent.appendChild(root);
                    return this;
                }
            };
        }
    };

    /* ---------- ActivityFeed ---------- */
    G.ActivityFeed = {
        create(options) {
            const items = (options && options.items) || [];
            const root = el('div', 'ct-activity-feed');
            root.innerHTML = '<h3 class="ct-activity-feed__title">Actividad reciente</h3><ul></ul>';
            const list = root.querySelector('ul');
            if (!items.length) {
                list.innerHTML = '<li class="ct-activity-feed__empty">Sin actividad todavía.</li>';
            } else {
                items.forEach((item) => {
                    const li = el('li', 'ct-activity-feed__item ct-activity-feed__item--' + (item.type || 'info'));
                    li.innerHTML = '<span class="ct-activity-feed__msg"></span><span class="ct-activity-feed__when"></span>';
                    li.querySelector('.ct-activity-feed__msg').textContent = item.message || '';
                    li.querySelector('.ct-activity-feed__when').textContent = formatRelative(item.at);
                    list.appendChild(li);
                });
            }
            return {
                el: root,
                mount(parent) {
                    if (parent) parent.appendChild(root);
                    return this;
                }
            };
        }
    };

    /* ---------- RankingCard ---------- */
    G.RankingCard = {
        create(options) {
            const opts = options || {};
            const root = el('div', 'ct-ranking-card');
            root.innerHTML =
                '<div class="ct-ranking-card__head"><h3></h3><div class="ct-ranking-card__tabs" role="tablist"></div></div>' +
                '<ol class="ct-ranking-card__list"></ol>';
            root.querySelector('h3').textContent = opts.title || 'Rankings';
            const tabs = root.querySelector('.ct-ranking-card__tabs');
            const list = root.querySelector('.ct-ranking-card__list');
            const scopes = opts.scopes || ['global', 'weekly', 'monthly', 'friends'];
            const labels = { global: 'Global', weekly: 'Semanal', monthly: 'Mensual', friends: 'Amigos' };
            let active = opts.activeScope || scopes[0];

            function paint(items) {
                list.textContent = '';
                (items || []).slice(0, 8).forEach((row) => {
                    const li = el('li', 'ct-ranking-card__row' + (row.isYou ? ' is-you' : ''));
                    li.innerHTML =
                        '<span class="ct-ranking-card__rank"></span>' +
                        '<span class="ct-ranking-card__name"></span>' +
                        '<span class="ct-ranking-card__meta"></span>' +
                        '<span class="ct-ranking-card__score"></span>';
                    li.querySelector('.ct-ranking-card__rank').textContent = '#' + (row.rank || '—');
                    li.querySelector('.ct-ranking-card__name').textContent = row.name || 'Jugador';
                    li.querySelector('.ct-ranking-card__meta').textContent = row.meta || '';
                    li.querySelector('.ct-ranking-card__score').textContent = String(row.score != null ? row.score : 0);
                    list.appendChild(li);
                });
            }

            scopes.forEach((scope) => {
                const btn = el('button', 'ct-button ct-button--ghost ct-button--sm');
                btn.type = 'button';
                btn.textContent = labels[scope] || scope;
                btn.setAttribute('role', 'tab');
                btn.setAttribute('aria-selected', scope === active ? 'true' : 'false');
                btn.addEventListener('click', () => {
                    active = scope;
                    tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', 'false'));
                    btn.setAttribute('aria-selected', 'true');
                    if (typeof opts.onScopeChange === 'function') opts.onScopeChange(scope);
                });
                tabs.appendChild(btn);
            });

            paint(opts.items || []);
            return {
                el: root,
                setItems: paint,
                mount(parent) {
                    if (parent) parent.appendChild(root);
                    return this;
                }
            };
        }
    };

    /* ---------- ProfileCard ---------- */
    G.ProfileCard = {
        create(options) {
            const snap = options || {};
            const root = el('section', 'ct-profile-card');
            const initials =
                UI.avatar && UI.avatar.initialsFrom
                    ? UI.avatar.initialsFrom(snap.profile && snap.profile.displayName)
                    : '?';
            root.innerHTML =
                '<div class="ct-profile-card__identity">' +
                '<div class="ct-avatar ct-avatar--lg ct-profile-card__avatar" aria-hidden="true"></div>' +
                '<div class="ct-profile-card__copy">' +
                '<p class="ct-profile-card__eyebrow"><span class="ct-badge ct-badge--primary">Perfil Crack Total</span></p>' +
                '<h2 class="ct-profile-card__name"></h2>' +
                '<p class="ct-profile-card__joined"></p>' +
                '</div></div>' +
                '<div class="ct-profile-card__widgets" data-profile-widgets></div>' +
                '<div class="ct-profile-card__xp" data-profile-xp></div>';

            root.querySelector('.ct-profile-card__avatar').textContent = initials;
            root.querySelector('.ct-profile-card__name').textContent =
                (snap.profile && snap.profile.displayName) || 'Invitado';
            root.querySelector('.ct-profile-card__joined').textContent =
                'Miembro desde ' + formatDate(snap.profile && snap.profile.createdAt);

            const widgets = root.querySelector('[data-profile-widgets]');
            G.LevelCard.create({ level: snap.level }).mount(widgets);
            G.StreakWidget.create({ streak: snap.streak }).mount(widgets);
            G.XPBar.create({ level: snap.level }).mount(root.querySelector('[data-profile-xp]'));

            return {
                el: root,
                mount(parent) {
                    if (parent) parent.appendChild(root);
                    return this;
                }
            };
        }
    };

    /* Toast helpers for unlock / level */
    G.notifyUnlock = function (achievement) {
        if (UI.toast && UI.toast.show) {
            UI.toast.show({
                type: 'success',
                message: 'Logro desbloqueado: ' + (achievement.title || 'Nuevo logro')
            });
        }
    };

    G.notifyLevelUp = function (level) {
        if (UI.toast && UI.toast.show) {
            UI.toast.show({
                type: 'success',
                message: '¡Subiste de nivel! Ahora sos ' + (level.name || 'crack')
            });
        }
    };

    G.formatDuration = formatDuration;
    G.formatDate = formatDate;
})();
