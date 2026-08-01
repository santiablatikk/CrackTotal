/**
 * CrackTotalServices.errors — logger + friendly toast messages (no alert)
 */
(function () {
    'use strict';

    const Services = (window.CrackTotalServices = window.CrackTotalServices || {});

    const FRIENDLY = {
        network: 'No pudimos conectar. Revisá tu red e intentá de nuevo.',
        timeout: 'La solicitud tardó demasiado. Probá otra vez en unos segundos.',
        unauthorized: 'No tenés permiso para esta acción.',
        notFound: 'No encontramos lo que buscabas.',
        server: 'Hay un problema temporal en el servidor.',
        unknown: 'Algo salió mal. Intentalo de nuevo.'
    };

    function toFriendlyMessage(error) {
        if (!error) return FRIENDLY.unknown;
        if (typeof error === 'string') return error;

        const status = error.status;
        const name = error.name || '';
        const message = error.message || '';

        if (name === 'AbortError' || /timeout|aborted/i.test(message)) {
            return FRIENDLY.timeout;
        }
        if (status === 401 || status === 403) return FRIENDLY.unauthorized;
        if (status === 404) return FRIENDLY.notFound;
        if (status >= 500) return FRIENDLY.server;
        if (/failed to fetch|network/i.test(message)) return FRIENDLY.network;
        return FRIENDLY.unknown;
    }

    function log(level, error, context) {
        const payload = {
            level,
            message: error && error.message ? error.message : String(error),
            status: error && error.status,
            context: context || null,
            time: new Date().toISOString()
        };
        if (level === 'error') {
            console.error('[CrackTotal]', payload, error);
        } else if (level === 'warn') {
            console.warn('[CrackTotal]', payload, error);
        } else {
            console.info('[CrackTotal]', payload);
        }
        return payload;
    }

    function notify(message, type) {
        if (window.CrackTotalUI && window.CrackTotalUI.toast) {
            window.CrackTotalUI.toast.show({ type: type || 'error', message });
            return;
        }
        if (window.notifications && typeof window.notifications.error === 'function') {
            if (type === 'warning' && window.notifications.warning) {
                window.notifications.warning('Aviso', message);
            } else if (type === 'info' && window.notifications.info) {
                window.notifications.info('Info', message);
            } else {
                window.notifications.error('Error', message);
            }
        }
    }

    function handle(error, options) {
        const opts = Object.assign({ toast: true, level: 'error', context: null }, options || {});
        const friendly = opts.message || toFriendlyMessage(error);
        log(opts.level, error, opts.context);
        if (opts.toast) {
            notify(friendly, opts.level === 'warn' ? 'warning' : 'error');
        }
        return friendly;
    }

    Services.errors = {
        messages: FRIENDLY,
        toFriendlyMessage,
        log,
        handle,
        notify
    };
})();
