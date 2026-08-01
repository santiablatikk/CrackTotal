/**
 * Profile gamification mount — composes reusable components into #ctGamificationRoot.
 * Does not alter legacy per-game tabs in profile.js.
 */
(function () {
    'use strict';

    async function mount() {
        const root = document.getElementById('ctGamificationRoot');
        if (!root) return;
        if (!window.CrackTotalProgress || !window.CrackTotalUI || !window.CrackTotalUI.gamification) return;

        const Progress = window.CrackTotalProgress;
        const G = window.CrackTotalUI.gamification;
        const Ranking = window.CrackTotalServices && window.CrackTotalServices.RankingService;

        let snap;
        try {
            await Progress.init();
            Progress.touchDaily();
            snap = Progress.getSnapshot();
        } catch (error) {
            root.innerHTML =
                '<div class="ct-empty" role="status"><p class="ct-empty__title">No se pudo cargar el progreso</p><p class="ct-empty__text">Recargá la página e intentá de nuevo.</p></div>';
            return;
        }
        if (!snap) return;

        root.textContent = '';
        root.classList.add('ct-gamification');

        G.ProfileCard.create(snap).mount(root);

        const statsPanel = document.createElement('section');
        statsPanel.className = 'ct-gamification__panel';
        statsPanel.setAttribute('aria-label', 'Estadísticas de progreso');
        const statsTitle = document.createElement('h3');
        statsTitle.textContent = 'Tu progreso';
        statsPanel.appendChild(statsTitle);
        G.StatsGrid.create({ stats: snap.stats, streak: snap.streak }).mount(statsPanel);
        root.appendChild(statsPanel);

        const mid = document.createElement('div');
        mid.className = 'ct-gamification__grid';

        const achPanel = document.createElement('section');
        achPanel.className = 'ct-gamification__panel';
        achPanel.innerHTML =
            '<h3>Logros <span class="ct-badge">' +
            snap.unlockedCount +
            '/' +
            snap.totalAchievements +
            '</span></h3>';
        const achGrid = document.createElement('div');
        achGrid.className = 'ct-achievements-grid';
        snap.achievements.forEach((a) => G.AchievementCard.create(a).mount(achGrid));
        achPanel.appendChild(achGrid);

        const badgePanel = document.createElement('div');
        badgePanel.className = 'ct-badges-row';
        badgePanel.style.marginTop = '0.85rem';
        snap.badges.forEach((b) => G.Badge.create(b).mount(badgePanel));
        achPanel.appendChild(badgePanel);

        const side = document.createElement('div');
        side.style.display = 'grid';
        side.style.gap = '1rem';
        G.HistoryCard.create({ matches: snap.history.matches }).mount(side);
        const histWrap = side.lastElementChild;
        if (histWrap) histWrap.classList.add('ct-gamification__panel');
        G.ActivityFeed.create({ items: snap.history.activity }).mount(side);
        const actWrap = side.lastElementChild;
        if (actWrap) actWrap.classList.add('ct-gamification__panel');

        mid.appendChild(achPanel);
        mid.appendChild(side);
        root.appendChild(mid);

        const rankPanel = document.createElement('section');
        rankPanel.className = 'ct-gamification__panel';
        root.appendChild(rankPanel);

        let rankingCard = null;
        async function loadScope(scope) {
            if (!Ranking) return;
            const data = await Ranking.getRanking(scope);
            if (!rankingCard) {
                rankingCard = G.RankingCard.create({
                    title: 'Rankings',
                    scopes: Ranking.scopes(),
                    activeScope: scope,
                    items: data.items,
                    onScopeChange: loadScope
                });
                rankPanel.appendChild(rankingCard.el);
            } else {
                rankingCard.setItems(data.items);
            }
        }
        await loadScope('global');

        function floatXp(entry) {
            if (!entry) return;
            const node = document.createElement('div');
            node.className = 'ct-xp-toast-float';
            node.textContent = '+' + entry.amount + ' XP';
            document.body.appendChild(node);
            window.setTimeout(() => node.remove(), 1200);
        }

        window.addEventListener(Progress.events.XP, (event) => {
            floatXp(event.detail && event.detail.entry);
        });
        window.addEventListener(Progress.events.UNLOCK, (event) => {
            if (G.notifyUnlock) G.notifyUnlock((event.detail && event.detail.achievement) || {});
        });
        window.addEventListener(Progress.events.LEVEL_UP, (event) => {
            if (G.notifyLevelUp) G.notifyLevelUp((event.detail && event.detail.level) || {});
        });
        window.addEventListener(Progress.events.UPDATED, () => {
            // Soft refresh on next open; avoid full remount thrash during same session paints
        });
    }

    window.CrackTotalProfileGamification = { remount: mount };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
