#!/usr/bin/env node
/**
 * Run all Mi Carrera smoke tests + balance/archetype reports + validate.
 */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const scripts = fs
  .readdirSync(dir)
  .filter((f) => /^mi_carrera_.*smoke\.js$/.test(f))
  .sort();

scripts.push('mi_carrera_balance_1000.js');
scripts.push('mi_carrera_archetypes_1000.js');

let failed = 0;
scripts.forEach(function (s) {
  console.log('\n======== ' + s + ' ========');
  const r = spawnSync(process.execPath, [path.join(dir, s)], { stdio: 'inherit' });
  if (r.status !== 0) failed += 1;
});

console.log('\n======== validate-deploy.js ========');
const v = spawnSync(process.execPath, [path.join(dir, '..', 'validate-deploy.js')], { stdio: 'inherit' });
if (v.status !== 0) failed += 1;

console.log('\nMi Carrera suite failed scripts:', failed);
process.exit(failed ? 1 : 0);
