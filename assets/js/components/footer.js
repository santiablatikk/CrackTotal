/**
 * CrackTotalUI.footer — canonical Home shell footer
 */
(function () {
    'use strict';

    const UI = (window.CrackTotalUI = window.CrackTotalUI || {});

    function renderMarkup() {
        const year = new Date().getFullYear();
        return (
            '<footer class="home-footer ct-footer" role="contentinfo">' +
            '<div class="home-shell">' +
            '<div class="home-footer-grid">' +
            '<div class="home-footer-brand">' +
            '<a class="home-brand" href="/">' +
            '<span class="home-brand-mark" aria-hidden="true"><i class="fas fa-futbol"></i></span>' +
            '<span>Crack Total</span>' +
            '</a>' +
            '<p>Juegos y desafíos para quienes viven el fútbol dentro y fuera de la cancha.</p>' +
            '</div>' +
            '<div>' +
            '<h2>Competí</h2>' +
            '<ul class="home-footer-links">' +
            '<li><a href="games.html">Juegos</a></li>' +
            '<li><a href="/#historias">Historias</a></li>' +
            '<li><a href="ranking.html">Rankings</a></li>' +
            '<li><a href="logros.html">Logros</a></li>' +
            '<li><a href="profile.html">Perfil</a></li>' +
            '</ul>' +
            '</div>' +
            '<div>' +
            '<h2>Descubrí</h2>' +
            '<ul class="home-footer-links">' +
            '<li><a href="blog.html">Actualidad</a></li>' +
            '<li><a href="about.html">Acerca de</a></li>' +
            '<li><a href="contact.html">Contacto</a></li>' +
            '<li><button class="home-share" type="button" data-ct-share>Compartir</button></li>' +
            '</ul>' +
            '</div>' +
            '<div>' +
            '<h2>Legal</h2>' +
            '<ul class="home-footer-links">' +
            '<li><a href="privacy.html">Privacidad</a></li>' +
            '<li><a href="cookies.html">Cookies</a></li>' +
            '<li><a href="terminos.html">Términos</a></li>' +
            '<li><a href="ads-policy.html">Publicidad</a></li>' +
            '<li><a href="disclaimer.html">Disclaimer</a></li>' +
            '</ul>' +
            '</div>' +
            '</div>' +
            '<div class="home-footer-bottom">' +
            '<span>© <span data-current-year data-ct-year>' +
            year +
            '</span> Crack Total. Todos los derechos reservados.</span>' +
            '<span>Hecho para quienes nunca dejan de hablar de fútbol.</span>' +
            '</div>' +
            '</div>' +
            '</footer>'
        );
    }

    function bindShare(footer) {
        footer.querySelectorAll('[data-ct-share]').forEach(function (button) {
            button.addEventListener('click', function () {
                if (typeof window.shareSite === 'function') {
                    window.shareSite();
                    return;
                }
                const shareData = {
                    title: 'Crack Total',
                    text: 'Juegos y desafíos de fútbol en Crack Total',
                    url: window.location.origin + '/'
                };
                if (navigator.share) {
                    navigator.share(shareData).catch(function () {});
                } else if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(shareData.url).catch(function () {});
                }
            });
        });
    }

    function mount(target) {
        if (!target) return null;
        const wrap = document.createElement('div');
        wrap.innerHTML = renderMarkup();
        const footer = wrap.firstElementChild;
        target.replaceWith(footer);
        bindShare(footer);
        return footer;
    }

    UI.footer = {
        renderMarkup: renderMarkup,
        mount: mount
    };
})();
