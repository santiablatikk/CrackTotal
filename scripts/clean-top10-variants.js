/*
  Limpia sufijos "(variante N)" de los títulos en top10_pool_extended.json
*/

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'assets', 'data', 'top10_pool_extended.json');

function run() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error('No se encuentra el archivo:', DATA_FILE);
    process.exit(1);
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('JSON inválido:', e.message);
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error('El archivo no contiene un array');
    process.exit(1);
  }

  const VARIANT_RE = /\s*\(variante\s+\d+\)$/i;
  let changed = 0;
  for (const item of data) {
    if (item && typeof item.title === 'string') {
      const newTitle = item.title.replace(VARIANT_RE, '');
      if (newTitle !== item.title) {
        item.title = newTitle;
        changed++;
      }
    }
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✔ Títulos actualizados: ${changed}`);
}

run();



