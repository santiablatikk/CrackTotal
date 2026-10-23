// Assemble a static-only Netlify deploy preview without touching game source files.
// The production app may still require its Node/WebSocket server for online matches.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'public');
const staticFolders = ['assets', 'config'];
const staticRootFiles = new Set([
  'ads.txt', 'robots.txt', 'sitemap.xml', 'sw.js',
  'portada.ico', 'BingSiteAuth.xml', '404.html', '500.html'
]);

// Clean build output so deleted assets cannot persist between preview builds.
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const dir of staticFolders) {
  const source = path.join(root, dir);
  if (fs.existsSync(source)) {
    fs.cpSync(source, path.join(out, dir), { recursive: true, force: true });
  }
}
let pageCount = 0;
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const ext = path.extname(entry.name).toLowerCase();
  if (ext === '.html' || staticRootFiles.has(entry.name)) {
    fs.copyFileSync(path.join(root, entry.name), path.join(out, entry.name));
    if (ext === '.html') pageCount++;
  }
}
if (!fs.existsSync(path.join(out, 'index.html')) || !fs.existsSync(path.join(out, 'assets/css/crack-total-2.css'))) {
  throw new Error('Missing entry page or redesign stylesheet in preview output');
}
if (!fs.existsSync(path.join(out, 'mi-carrera.html')) ||
    !fs.existsSync(path.join(out, 'assets/data/mi-carrera/clubs.json')) ||
    !fs.existsSync(path.join(out, 'assets/js/games/mi-carrera/ui/app.js'))) {
  throw new Error('Restored Mi Carrera game or dependencies missing from preview');
}
console.log('Netlify static preview ready:', pageCount, 'HTML pages, plus assets and config.');
