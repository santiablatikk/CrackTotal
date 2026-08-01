/**
 * Shared formatting helpers for Football Hub presentation.
 */
(function () {
    'use strict';

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function initials(name) {
        const parts = String(name || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);
        if (!parts.length) return '?';
        if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    function formatKickoff(iso) {
        if (!iso) return '';
        try {
            const date = new Date(iso);
            if (Number.isNaN(date.getTime())) return '';
            const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            return days[date.getDay()] + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
        } catch (e) {
            return '';
        }
    }

    function formatRelativeDay(iso) {
        if (!iso) return '';
        try {
            const date = new Date(iso);
            if (Number.isNaN(date.getTime())) return '';
            const now = new Date();
            const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startThat = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const diffDays = Math.round((startToday - startThat) / 86400000);
            if (diffDays === 0) return 'Hoy';
            if (diffDays === 1) return 'Ayer';
            return pad(date.getDate()) + '/' + pad(date.getMonth() + 1);
        } catch (e) {
            return '';
        }
    }

    function formatCountdown(iso) {
        if (!iso) return '';
        const target = new Date(iso).getTime();
        if (Number.isNaN(target)) return '';
        let diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
        const d = Math.floor(diff / 86400);
        diff %= 86400;
        const h = Math.floor(diff / 3600);
        diff %= 3600;
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        if (d > 0) return d + 'd ' + pad(h) + ':' + pad(m);
        return pad(h) + ':' + pad(m) + ':' + pad(s);
    }

    function competitionTone(name) {
        const key = String(name || '').toLowerCase();
        if (key.includes('champions')) return 'ucl';
        if (key.includes('libertadores')) return 'lib';
        if (key.includes('premier')) return 'epl';
        if (key.includes('liga profesional') || key.includes('argentina')) return 'arg';
        if (key.includes('la liga')) return 'laliga';
        if (key.includes('serie a')) return 'seriea';
        if (key.includes('bundesliga')) return 'bundes';
        if (key.includes('ligue')) return 'ligue1';
        if (key.includes('mundial') || key.includes('clubes')) return 'wc';
        return 'default';
    }

    window.CrackTotalHubFormat = {
        initials: initials,
        formatKickoff: formatKickoff,
        formatRelativeDay: formatRelativeDay,
        formatCountdown: formatCountdown,
        competitionTone: competitionTone
    };
})();
