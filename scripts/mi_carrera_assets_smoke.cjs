'use strict';
// Ensures the restored career game remains deliverable in the static deployment.
// Not a replacement for browser gameplay and progression tests.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const html = read('mi-carrera.html');
const gameHub = read('games.html');
assert.match(html, /data-mc-root/, 'Career mount point missing');
assert.match(gameHub, /href="mi-carrera\.html"/, 'Career not discoverable in game hub');
const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map(m=>m[1].split(/[?#]/)[0])
  .filter(s=>s.startsWith('assets/') || s.startsWith('/assets/'));
const missing = references.filter(s=>!fs.existsSync(path.join(root,s.replace(/^\//,''))));
assert.deepEqual(missing,[], 'Missing Mi Carrera page dependencies');
const engine = references.filter(s=>s.startsWith('assets/js/games/mi-carrera/'));
assert.ok(engine.length>=20, 'Career engine scripts missing');
for (const resource of [
  'assets/data/mi-carrera/clubs.json',
  'assets/data/mi-carrera/competitions.json',
  'assets/data/mi-carrera/countries.json',
  'assets/data/mi-carrera/leagues.json',
  'assets/data/mi-carrera/manifests/club-badges.json'
]) JSON.parse(read(resource));
const manifest=JSON.parse(read('assets/data/mi-carrera/manifests/club-badges.json'));
assert.ok(manifest && typeof manifest === 'object','Career badges manifest invalid');
console.log('PASS Mi Carrera: page, '+engine.length+' module scripts, shared resources, game hub and five data files');
