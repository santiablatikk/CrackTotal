/**
 * Auto-mount CrackTotalUI navbar/footer placeholders
 */
(function () {
    'use strict';

    function mountShell() {
        const UI = window.CrackTotalUI;
        if (!UI) return;

        document.querySelectorAll('[data-ct-navbar]').forEach((node) => {
            if (UI.navbar && typeof UI.navbar.mount === 'function') {
                UI.navbar.mount(node, {
                    active: node.getAttribute('data-active') || undefined
                });
            }
        });

        document.querySelectorAll('[data-ct-footer]').forEach((node) => {
            if (UI.footer && typeof UI.footer.mount === 'function') {
                UI.footer.mount(node);
            }
        });
    }

    // Placeholders are above this script at end of body — mount immediately
    // so defer main.js finds .main-navigation on DOMContentLoaded.
    if (document.readyState === 'loading' && !document.querySelector('[data-ct-navbar], [data-ct-footer]')) {
        document.addEventListener('DOMContentLoaded', mountShell);
    } else {
        mountShell();
    }

    window.CrackTotalUI = window.CrackTotalUI || {};
    window.CrackTotalUI.shell = { mount: mountShell };
})();
