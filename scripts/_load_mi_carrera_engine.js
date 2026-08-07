/**
 * Node loader for Mi Carrera providers + engine (no browser).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

const SCRIPTS = [
  'assets/js/games/mi-carrera/providers/flags.js',
  'assets/js/games/mi-carrera/providers/clubs.js',
  'assets/js/games/mi-carrera/providers/competitions.js',
  'assets/js/games/mi-carrera/providers/awards.js',
  'assets/js/games/mi-carrera/providers/trophies.js',
  'assets/js/games/mi-carrera/main.js',
  'assets/js/games/mi-carrera/engine/career-randomizer.js',
  'assets/js/games/mi-carrera/engine/career-rules.js',
  'assets/js/games/mi-carrera/engine/career-eligibility.js',
  'assets/js/games/mi-carrera/engine/career-state.js',
  'assets/js/games/mi-carrera/engine/career-progression.js',
  'assets/js/games/mi-carrera/engine/career-events.js',
  'assets/js/games/mi-carrera/engine/career-competitions.js',
  'assets/js/games/mi-carrera/engine/career-awards.js',
  'assets/js/games/mi-carrera/engine/career-national.js',
  'assets/js/games/mi-carrera/engine/career-market.js',
  'assets/js/games/mi-carrera/engine/career-history.js',
  'assets/js/games/mi-carrera/engine/career-engine.js'
];

function loadMiCarrera() {
  const context = {
    console,
    process,
    require,
    module,
    __dirname,
    __filename,
    globalThis: {}
  };
  context.window = context.globalThis;
  vm.createContext(context);
  for (const rel of SCRIPTS) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, context, { filename: rel });
  }
  process.chdir(ROOT);
  const MC = context.globalThis.MiCarrera;
  MC.loadPhase1DataSync();
  return MC;
}

module.exports = { loadMiCarrera, ROOT, SCRIPTS };
