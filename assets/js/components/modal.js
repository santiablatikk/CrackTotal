/**
 * CrackTotalUI.modal — accessible modal with focus trap / Escape / restore focus
 */
(function () {
    'use strict';

    const UI = (window.CrackTotalUI = window.CrackTotalUI || {});
    const FOCUSABLE =
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function getFocusable(root) {
        return Array.from(root.querySelectorAll(FOCUSABLE)).filter(
            (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
        );
    }

    function createModal(options) {
        const opts = Object.assign(
            {
                title: '',
                body: '',
                actions: [],
                closeOnOverlay: true,
                closeOnEscape: true,
                labelledBy: null,
                className: ''
            },
            options || {}
        );

        let lastFocused = null;
        let open = false;

        const overlay = document.createElement('div');
        overlay.className = 'ct-modal-overlay';
        overlay.setAttribute('data-open', 'false');
        overlay.hidden = true;

        const dialog = document.createElement('div');
        dialog.className = ['ct-modal', opts.className].filter(Boolean).join(' ');
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');

        const titleId = `ct-modal-title-${Math.random().toString(36).slice(2, 9)}`;
        if (opts.title) {
            const title = document.createElement('h2');
            title.className = 'ct-modal__title';
            title.id = titleId;
            title.textContent = opts.title;
            dialog.appendChild(title);
            dialog.setAttribute('aria-labelledby', opts.labelledBy || titleId);
        }

        const body = document.createElement('div');
        body.className = 'ct-modal__body';
        if (typeof opts.body === 'string') {
            body.textContent = opts.body;
        } else if (opts.body instanceof Node) {
            body.appendChild(opts.body);
        }
        dialog.appendChild(body);

        if (opts.actions && opts.actions.length) {
            const actions = document.createElement('div');
            actions.className = 'ct-modal__actions';
            opts.actions.forEach((action) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = [
                    'ct-button',
                    action.variant ? `ct-button--${action.variant}` : 'ct-button--secondary'
                ].join(' ');
                btn.textContent = action.label || 'OK';
                btn.addEventListener('click', () => {
                    if (typeof action.onClick === 'function') {
                        action.onClick(api);
                    }
                    if (action.close !== false) {
                        api.close();
                    }
                });
                actions.appendChild(btn);
            });
            dialog.appendChild(actions);
        }

        overlay.appendChild(dialog);

        function onKeydown(event) {
            if (!open) return;
            if (event.key === 'Escape' && opts.closeOnEscape) {
                event.preventDefault();
                api.close();
                return;
            }
            if (event.key !== 'Tab') return;
            const focusable = getFocusable(dialog);
            if (!focusable.length) {
                event.preventDefault();
                dialog.focus();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        function onOverlayClick(event) {
            if (opts.closeOnOverlay && event.target === overlay) {
                api.close();
            }
        }

        const api = {
            el: overlay,
            dialog,
            open() {
                if (open) return api;
                lastFocused = document.activeElement;
                if (!overlay.isConnected) {
                    document.body.appendChild(overlay);
                }
                overlay.hidden = false;
                overlay.setAttribute('data-open', 'true');
                overlay.classList.add('is-open');
                document.body.classList.add('ct-modal-open');
                open = true;
                document.addEventListener('keydown', onKeydown);
                overlay.addEventListener('click', onOverlayClick);
                window.setTimeout(() => {
                    const focusable = getFocusable(dialog);
                    (focusable[0] || dialog).focus();
                }, 0);
                return api;
            },
            close() {
                if (!open) return api;
                open = false;
                overlay.setAttribute('data-open', 'false');
                overlay.classList.remove('is-open');
                document.body.classList.remove('ct-modal-open');
                document.removeEventListener('keydown', onKeydown);
                overlay.removeEventListener('click', onOverlayClick);
                window.setTimeout(() => {
                    overlay.hidden = true;
                }, 200);
                if (lastFocused && typeof lastFocused.focus === 'function') {
                    lastFocused.focus();
                }
                return api;
            },
            destroy() {
                api.close();
                overlay.remove();
                return api;
            },
            setBody(content) {
                body.textContent = '';
                if (typeof content === 'string') {
                    body.textContent = content;
                } else if (content instanceof Node) {
                    body.appendChild(content);
                }
                return api;
            }
        };

        if (!dialog.hasAttribute('tabindex')) {
            dialog.tabIndex = -1;
        }

        return api;
    }

    UI.modal = {
        create: createModal,
        confirm(options) {
            return new Promise((resolve) => {
                const modal = createModal(
                    Object.assign(
                        {
                            title: 'Confirmar',
                            body: '',
                            actions: [
                                {
                                    label: (options && options.cancelLabel) || 'Cancelar',
                                    variant: 'ghost',
                                    onClick() {
                                        resolve(false);
                                    }
                                },
                                {
                                    label: (options && options.confirmLabel) || 'Confirmar',
                                    variant: (options && options.danger) ? 'danger' : 'primary',
                                    onClick() {
                                        resolve(true);
                                    }
                                }
                            ]
                        },
                        options || {}
                    )
                );
                modal.open();
            });
        }
    };
})();
