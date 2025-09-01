/*
  Filtra títulos subjetivos del pool extendido y corrige patrones
  - Mantiene sólo categorías objetivas (goleadores, asistencias, valores)
  - Elimina "(aprox)", "(clubes)" y títulos tipo "Leyendas"
*/

const fs = require('fs');
const path = require('path');

const EXT_FILE = path.join(__dirname, '..', 'assets', 'data', 'top10_pool_extended.json');

function isObjectiveTitle(title) {
  const t = (title || '').toLowerCase();
  if (/^leyendas\b/.test(t)) return false;
  if (/\(clubes\)/.test(t)) return false;
  if (/[?]/.test(t)) return false;
  return (
    /^goleadores/.test(t) ||
    /^máximos goleadores/.test(t) ||
    /^top asistencias/.test(t) ||
    /^top valores/.test(t)
  );
}

function cleanTitle(title) {
  return (title || '')
    .replace(/\s*\(aprox\)/ig, '')
    .replace(/\s*\(clubes\)/ig, '')
    .trim();
}

function run() {
  if (!fs.existsSync(EXT_FILE)) {
    console.error('No existe el archivo:', EXT_FILE);
    process.exit(1);
  }
  const arr = JSON.parse(fs.readFileSync(EXT_FILE, 'utf8'));
  const filtered = [];
  let removed = 0, cleaned = 0;
  for (const item of arr) {
    if (!item || typeof item.title !== 'string') continue;
    if (!isObjectiveTitle(item.title)) { removed++; continue; }
    const newTitle = cleanTitle(item.title);
    if (newTitle !== item.title) cleaned++;
    filtered.push({ ...item, title: newTitle });
  }
  fs.writeFileSync(EXT_FILE, JSON.stringify(filtered, null, 2), 'utf8');
  console.log(`✔ Objetivo aplicado. Quedan ${filtered.length}. Removidos: ${removed}. Títulos limpiados: ${cleaned}.`);
}

run();


