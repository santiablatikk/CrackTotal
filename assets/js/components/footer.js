/**
 * CrackTotalUI.footer — canonical site-footer markup
 */
(function () {
    'use strict';

    const UI = (window.CrackTotalUI = window.CrackTotalUI || {});

    function renderMarkup() {
        const year = new Date().getFullYear();
        return (
            '<footer class="site-footer ct-footer" role="contentinfo">' +
            '<div class="footer-content">' +
            '<div class="footer-links">' +
            '<a href="/"><i class="fas fa-home" aria-hidden="true"></i> Inicio</a>' +
            '<a href="blog.html"><i class="fas fa-blog" aria-hidden="true"></i> Blog</a>' +
            '<a href="contact.html"><i class="fas fa-envelope" aria-hidden="true"></i> Contacto</a>' +
            '<a href="cookies.html"><i class="fas fa-cookie-bite" aria-hidden="true"></i> Cookies</a>' +
            '<a href="privacy.html"><i class="fas fa-lock" aria-hidden="true"></i> Privacidad</a>' +
            '<a href="terminos.html"><i class="fas fa-file-contract" aria-hidden="true"></i> Términos</a>' +
            '<a href="about.html"><i class="fas fa-info-circle" aria-hidden="true"></i> Acerca de</a>' +
            '</div>' +
            '<button class="footer-share-button" type="button" onclick="shareSite()" aria-label="Compartir sitio web en redes sociales">' +
            '<i class="fas fa-share-alt" aria-hidden="true"></i> Compartir' +
            '</button>' +
            '<div class="footer-copyright">' +
            '&copy; <span data-ct-year>' +
            year +
            '</span> Crack Total. Todos los derechos reservados.' +
            '</div>' +
            '</div>' +
            '</footer>'
        );
    }

    function mount(target) {
        if (!target) return null;
        const wrap = document.createElement('div');
        wrap.innerHTML = renderMarkup();
        const footer = wrap.firstElementChild;
        target.replaceWith(footer);
        return footer;
    }

    UI.footer = {
        renderMarkup,
        mount
    };
})();
