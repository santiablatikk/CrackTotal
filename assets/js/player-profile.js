(function () {
    'use strict';

    const STORAGE_KEY = 'playerName';
    const MAX_LENGTH = 20;
    const BANNED_WORDS = ['pene', 'pelotudo', 'puto', 'chota'];
    const contextCopy = {
        'publish-score': {
            title: 'Guardá tu puntuación',
            description: 'Elegí un nombre para aparecer en el ranking. Tu partida local queda guardada aunque canceles.'
        },
        'save-progress': {
            title: 'Guardá tu progreso',
            description: 'Creá un perfil local para reconocer tu progreso en tus próximas partidas.'
        },
        'create-profile': {
            title: 'Creá tu perfil',
            description: 'Tu nombre se guarda en este dispositivo y podés cambiarlo cuando quieras.'
        },
        'join-game': {
            title: 'Elegí tu nombre de juego',
            description: 'Necesitamos un alias para identificarte dentro de la sala.'
        },
        'change-name': {
            title: 'Cambiá tu nombre',
            description: 'El nuevo alias se usará en tus próximas partidas y publicaciones.'
        }
    };

    let pendingRequest = null;
    let lastFocusedElement = null;

    function safeStorageGet() {
        try {
            return localStorage.getItem(STORAGE_KEY) || '';
        } catch (error) {
            return '';
        }
    }

    function safeStorageSet(value) {
        try {
            localStorage.setItem(STORAGE_KEY, value);
            return true;
        } catch (error) {
            return false;
        }
    }

    function validatePlayerName(value) {
        const name = String(value || '').normalize('NFC').trim().replace(/\s+/g, ' ');

        if (!name) {
            return { valid: false, name, message: 'Ingresá un nombre para continuar.' };
        }
        if (name.length > MAX_LENGTH) {
            return { valid: false, name, message: `Usá ${MAX_LENGTH} caracteres o menos.` };
        }
        if (!/^[\p{L}\p{N} ._'’-]+$/u.test(name)) {
            return { valid: false, name, message: 'Usá letras, números, espacios, puntos, guiones o apóstrofes.' };
        }

        const lowerName = name.toLocaleLowerCase('es');
        if (BANNED_WORDS.some((word) => lowerName.includes(word))) {
            return { valid: false, name, message: 'Ese nombre contiene una palabra no permitida.' };
        }

        return { valid: true, name, message: '' };
    }

    function ensureStylesheet() {
        if (document.querySelector('link[data-player-profile-styles]')) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'assets/css/player-profile.css?v=20260801';
        link.dataset.playerProfileStyles = 'true';
        document.head.appendChild(link);
    }

    function createDialog() {
        if (document.getElementById('ctProfileDialog')) return;

        const dialog = document.createElement('div');
        dialog.id = 'ctProfileDialog';
        dialog.className = 'ct-profile-dialog';
        dialog.hidden = true;
        dialog.innerHTML = `
            <div class="ct-profile-dialog__backdrop" data-profile-cancel aria-hidden="true"></div>
            <section class="ct-profile-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="ctProfileTitle" aria-describedby="ctProfileDescription">
                <div class="ct-profile-dialog__icon" aria-hidden="true"><i class="fas fa-user-plus"></i></div>
                <h2 id="ctProfileTitle">Creá tu perfil</h2>
                <p class="ct-profile-dialog__description" id="ctProfileDescription">Tu nombre se guarda en este dispositivo.</p>
                <form id="ctProfileForm" novalidate>
                    <label for="ctProfileName">Nombre o alias</label>
                    <input id="ctProfileName" name="playerName" type="text" maxlength="${MAX_LENGTH}" autocomplete="nickname" placeholder="Ejemplo: El 10" aria-describedby="ctProfileError">
                    <p class="ct-profile-dialog__error" id="ctProfileError" role="alert" aria-live="polite"></p>
                    <div class="ct-profile-dialog__actions">
                        <button class="ct-profile-dialog__cancel" type="button" data-profile-cancel>Cancelar</button>
                        <button class="ct-profile-dialog__submit" type="submit">Continuar</button>
                    </div>
                </form>
            </section>
        `;
        document.body.appendChild(dialog);

        dialog.querySelectorAll('[data-profile-cancel]').forEach((control) => {
            control.addEventListener('click', cancelPendingRequest);
        });
        dialog.querySelector('#ctProfileForm').addEventListener('submit', submitProfile);
        dialog.addEventListener('keydown', trapFocus);
    }

    function getFocusableElements() {
        const dialog = document.getElementById('ctProfileDialog');
        if (!dialog || dialog.hidden) return [];
        return Array.from(dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'));
    }

    function trapFocus(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            cancelPendingRequest();
            return;
        }
        if (event.key !== 'Tab') return;

        const focusable = getFocusableElements();
        if (focusable.length === 0) return;
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

    function openDialog(reason) {
        ensureStylesheet();
        createDialog();

        const dialog = document.getElementById('ctProfileDialog');
        const copy = contextCopy[reason] || contextCopy['create-profile'];
        const input = dialog.querySelector('#ctProfileName');
        const error = dialog.querySelector('#ctProfileError');

        lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        dialog.querySelector('#ctProfileTitle').textContent = copy.title;
        dialog.querySelector('#ctProfileDescription').textContent = copy.description;
        input.value = safeStorageGet();
        input.setAttribute('aria-invalid', 'false');
        error.textContent = '';
        dialog.hidden = false;
        document.body.classList.add('ct-profile-dialog-open');
        window.setTimeout(() => input.focus(), 0);
    }

    function closeDialog() {
        const dialog = document.getElementById('ctProfileDialog');
        if (!dialog) return;
        dialog.hidden = true;
        document.body.classList.remove('ct-profile-dialog-open');
        lastFocusedElement?.focus();
        lastFocusedElement = null;
    }

    function resolvePending(value) {
        const request = pendingRequest;
        pendingRequest = null;
        closeDialog();
        request?.resolve(value);
    }

    function cancelPendingRequest() {
        resolvePending(null);
    }

    function submitProfile(event) {
        event.preventDefault();
        const input = event.currentTarget.querySelector('#ctProfileName');
        const error = event.currentTarget.querySelector('#ctProfileError');
        const validation = validatePlayerName(input.value);

        if (!validation.valid) {
            input.setAttribute('aria-invalid', 'true');
            error.textContent = validation.message;
            input.focus();
            return;
        }

        if (!safeStorageSet(validation.name)) {
            input.setAttribute('aria-invalid', 'true');
            error.textContent = 'No pudimos guardar el nombre en este navegador.';
            input.focus();
            return;
        }

        input.setAttribute('aria-invalid', 'false');
        error.textContent = '';
        window.dispatchEvent(new CustomEvent('cracktotal:profile-updated', {
            detail: { playerName: validation.name }
        }));

        if (typeof window.updateAllPlayerNameElements === 'function') {
            window.updateAllPlayerNameElements();
        }

        resolvePending(validation.name);
    }

    function ensurePlayerName(options = {}) {
        const reason = options.reason || 'create-profile';
        const force = Boolean(options.force);
        const current = validatePlayerName(safeStorageGet());

        if (!force && current.valid) return Promise.resolve(current.name);
        if (pendingRequest) return pendingRequest.promise;

        let resolver;
        const promise = new Promise((resolve) => {
            resolver = resolve;
        });
        pendingRequest = { promise, resolve: resolver, reason };
        openDialog(reason);
        return promise;
    }

    async function runWithPlayerName(action, options = {}) {
        const name = await ensurePlayerName(options);
        if (!name) return { completed: false, playerName: null, result: null };
        const result = typeof action === 'function' ? await action(name) : null;
        return { completed: true, playerName: name, result };
    }

    window.CrackTotalProfile = Object.freeze({
        getPlayerName: safeStorageGet,
        validatePlayerName,
        ensurePlayerName,
        runWithPlayerName
    });

    ensureStylesheet();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createDialog, { once: true });
    } else {
        createDialog();
    }
})();
