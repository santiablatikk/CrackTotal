/**
 * One-shot: replace duplicated nav/footer with DS placeholders + wire scripts.
 * Run: node scripts/migrate-shell.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VERSION = '20260801b';

const SKIP = new Set([
    'index.html', // Home keeps its own shell
    '404.html',
    '500.html',
    'blog-detail-historia-mundial.html' // redirect stub → worldcups
]);

const ACTIVE_BY_FILE = {
    'games.html': 'games',
    'profile.html': 'profile',
    'about.html': 'about',
    'contact.html': 'contact',
    'blog.html': 'blog',
    'logros.html': 'logros',
    'ranking.html': 'ranking',
    'ranking-mentiroso.html': 'ranking',
    'ranking-quiensabemas.html': 'ranking',
    'ranking-crackrapido.html': 'ranking',
    'privacy.html': '',
    'cookies.html': '',
    'terminos.html': '',
    'ads-policy.html': '',
    'disclaimer.html': '',
    'pasalache.html': 'games',
    'top10.html': 'games',
    'wordle-futbol.html': 'games',
    'quiensabemas.html': 'games',
    'mentiroso.html': 'games',
    'crack-rapido.html': 'games',
    '100-futboleros-dicen.html': 'games'
};

const NAV_RE = /<nav\s+class="main-navigation"[^>]*>[\s\S]*?<\/nav>/i;
const FOOTER_RE = /<footer\s+class="site-footer"[^>]*>[\s\S]*?<\/footer>/i;

const SHELL_SCRIPTS = [
    `assets/js/components/navbar.js?v=${VERSION}`,
    `assets/js/components/footer.js?v=${VERSION}`,
    `assets/js/components/shell.js?v=${VERSION}`
];

function detectActive(file) {
    if (Object.prototype.hasOwnProperty.call(ACTIVE_BY_FILE, file)) {
        return ACTIVE_BY_FILE[file];
    }
    if (file.startsWith('blog-detail')) return 'blog';
    return '';
}

function ensureBodyCtDs(html) {
    if (/<body[^>]*\bct-ds\b/i.test(html)) return html;
    if (/<body[^>]*\bclass="/i.test(html)) {
        return html.replace(/<body([^>]*?)\bclass="([^"]*)"/i, '<body$1class="$2 ct-ds"');
    }
    return html.replace(/<body(\s|>)/i, '<body class="ct-ds"$1');
}

function ensureDsCss(html) {
    if (html.includes('design-system/index.css')) {
        return html.replace(
            /assets\/css\/design-system\/index\.css\?v=[^"]+/g,
            `assets/css/design-system/index.css?v=${VERSION}`
        );
    }
    if (/assets\/css\/base\.css[^"]*"/i.test(html)) {
        return html.replace(
            /(<link[^>]+href="assets\/css\/base\.css[^"]*"[^>]*>)/i,
            `$1\n    <link rel="stylesheet" href="assets/css/design-system/index.css?v=${VERSION}">`
        );
    }
    // fallback: before </head>
    return html.replace(
        /<\/head>/i,
        `    <link rel="stylesheet" href="assets/css/design-system/index.css?v=${VERSION}">\n</head>`
    );
}

function ensureShellScripts(html) {
    const missing = SHELL_SCRIPTS.filter((src) => !html.includes(src.split('?')[0]));
    if (!missing.length) return html;

    const tags = missing
        .map((src) => `    <script src="${src}"></script>`)
        .join('\n');

    // Always mount at end of body so placeholders exist before scripts run.
    // Keep before </body> and after content; main.js (defer) still inits after mount on DOMContentLoaded.
    return html.replace(/<\/body>/i, `${tags}\n</body>`);
}

function migrateFile(file) {
    const full = path.join(ROOT, file);
    let html = fs.readFileSync(full, 'utf8');
    const original = html;
    const active = detectActive(file);
    let changed = false;

    if (NAV_RE.test(html)) {
        const activeAttr = active ? ` data-active="${active}"` : '';
        html = html.replace(NAV_RE, `<div data-ct-navbar${activeAttr}></div>`);
        changed = true;
    }

    if (FOOTER_RE.test(html)) {
        html = html.replace(FOOTER_RE, '<div data-ct-footer></div>');
        changed = true;
    }

    // Still wire DS on pages that only need CSS/scripts even if no nav match
    const beforeCss = html;
    html = ensureDsCss(html);
    html = ensureBodyCtDs(html);
    html = ensureShellScripts(html);

    if (html !== original) {
        fs.writeFileSync(full, html, 'utf8');
        return { file, changed: true, hadNav: changed };
    }
    return { file, changed: false };
}

function main() {
    const files = fs
        .readdirSync(ROOT)
        .filter((f) => f.endsWith('.html') && !SKIP.has(f));

    const results = files.map(migrateFile);
    const updated = results.filter((r) => r.changed);
    console.log(`Updated ${updated.length}/${files.length} files`);
    updated.forEach((r) => console.log(' -', r.file));
}

main();
