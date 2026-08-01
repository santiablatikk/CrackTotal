/**
 * RefreshManager — adaptive polling for Football Hub.
 * Live matches → 60s; otherwise → 15 minutes.
 */
(function () {
    'use strict';

    const Services = (window.CrackTotalServices = window.CrackTotalServices || {});

    let timerId = null;
    let running = false;
    let lastHadLive = false;
    let onTick = null;

    function intervals() {
        const cfg = window.CrackTotalFootballApiConfig && window.CrackTotalFootballApiConfig.refresh;
        return {
            live: (cfg && cfg.liveIntervalMs) || 60 * 1000,
            idle: (cfg && cfg.idleIntervalMs) || 15 * 60 * 1000
        };
    }

    function clear() {
        if (timerId) {
            window.clearTimeout(timerId);
            timerId = null;
        }
    }

    function schedule() {
        clear();
        if (!running || typeof onTick !== 'function') return;
        const ms = lastHadLive ? intervals().live : intervals().idle;
        timerId = window.setTimeout(async () => {
            try {
                await onTick({ reason: 'interval', hadLive: lastHadLive });
            } catch (error) {
                if (Services.ErrorManager) {
                    Services.ErrorManager.log('warn', 'Refresh tick failed', { error: String(error && error.message) });
                }
            }
            if (running) schedule();
        }, ms);
    }

    function start(callback, options) {
        stop();
        onTick = callback;
        running = true;
        lastHadLive = Boolean(options && options.hadLive);
        schedule();
    }

    function stop() {
        running = false;
        clear();
        onTick = null;
        if (Services.ApiClient) Services.ApiClient.abortAll();
    }

    function notifyLiveState(hasLive) {
        const next = Boolean(hasLive);
        if (next === lastHadLive) return;
        lastHadLive = next;
        if (running) schedule();
    }

    Services.RefreshManager = {
        start,
        stop,
        notifyLiveState,
        isRunning() {
            return running;
        }
    };
})();
