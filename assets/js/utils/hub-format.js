/**
 * Formatting helpers for Football Hub UI (pure, no DOM).
 */
(function () {
    'use strict';

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function formatKickoff(iso) {
        if (!iso) return '';
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return '';
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return days[date.getDay()] + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    }

    function formatRelativeDay(iso) {
        if (!iso) return '';
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return '';
        const now = new Date();
        const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startThat = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffDays = Math.round((startToday - startThat) / 86400000);
        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays === -1) return 'Mañana';
        return pad(date.getDate()) + '/' + pad(date.getMonth() + 1);
    }

    function initials(name) {
        const parts = String(name || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);
        if (!parts.length) return '?';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    window.CrackTotalHubFormat = {
        formatKickoff,
        formatRelativeDay,
        initials
    };
})();
