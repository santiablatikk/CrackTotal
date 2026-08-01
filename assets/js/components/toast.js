/**
 * CrackTotalUI.toast — accessible toasts + bridge to window.notifications
 */
(function () {
    'use strict';

    const UI = (window.CrackTotalUI = window.CrackTotalUI || {});
    const DEFAULT_DURATION = 4200;
    let host = null;

    function ensureHost() {
        if (host && document.body.contains(host)) return host;
        host = document.createElement('div');
        host.className = 'ct-toast-host';
        host.setAttribute('aria-live', 'polite');
        host.setAttribute('aria-relevant', 'additions');
        document.body.appendChild(host);
        return host;
    }

    function dismiss(toastEl) {
        if (!toastEl || toastEl.dataset.leaving === 'true') return;
        toastEl.dataset.leaving = 'true';
        toastEl.classList.remove('is-visible');
        window.setTimeout(() => toastEl.remove(), 240);
    }

    function show(options) {
        const opts = typeof options === 'string'
            ? { message: options }
            : Object.assign({}, options || {});

        const type = opts.type || 'info';
        const message = opts.message || opts.title || '';
        const title = opts.title && opts.message ? opts.title : '';
        const duration = typeof opts.duration === 'number' ? opts.duration : DEFAULT_DURATION;

        if (opts.silent || !message) {
            return { dismiss() {} };
        }

        const toast = document.createElement('div');
        toast.className = `ct-toast ct-toast--${type}`;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

        const body = document.createElement('p');
        body.className = 'ct-toast__message';
        body.textContent = title ? `${title}: ${message}` : message;
        toast.appendChild(body);

        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'ct-toast__close';
        close.setAttribute('aria-label', 'Cerrar notificación');
        close.innerHTML = '&times;';
        close.addEventListener('click', () => dismiss(toast));
        toast.appendChild(close);

        ensureHost().appendChild(toast);
        window.requestAnimationFrame(() => toast.classList.add('is-visible'));

        let timer = null;
        if (duration > 0) {
            timer = window.setTimeout(() => dismiss(toast), duration);
        }

        return {
            el: toast,
            dismiss() {
                if (timer) window.clearTimeout(timer);
                dismiss(toast);
            }
        };
    }

    const api = {
        show,
        info(message, options) {
            return show(Object.assign({}, options, { type: 'info', message }));
        },
        success(message, options) {
            return show(Object.assign({}, options, { type: 'success', message }));
        },
        warning(message, options) {
            return show(Object.assign({}, options, { type: 'warning', message }));
        },
        error(message, options) {
            return show(Object.assign({}, options, { type: 'error', message }));
        }
    };

    UI.toast = api;

    function bridgeNotifications() {
        const existing = window.notifications;
        const isFullSystem = existing && typeof existing.show === 'function' && existing.constructor && existing.constructor.name === 'NotificationSystem';

        if (isFullSystem) {
            return;
        }

        window.notifications = {
            __ctBridged: true,
            info(title, message, options) {
                if (options && options.silent) return;
                api.show({ type: 'info', title, message, duration: (options && options.duration) || DEFAULT_DURATION });
            },
            success(title, message, options) {
                if (options && options.silent) return;
                api.show({ type: 'success', title, message, duration: (options && options.duration) || DEFAULT_DURATION });
            },
            warning(title, message, options) {
                if (options && options.silent) return;
                api.show({ type: 'warning', title, message, duration: (options && options.duration) || 6000 });
            },
            error(title, message, options) {
                if (options && options.silent) return;
                api.show({ type: 'error', title, message, duration: (options && options.duration) || 7000 });
            }
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bridgeNotifications);
    } else {
        bridgeNotifications();
    }
})();
