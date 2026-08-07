/**
 * Smoke for Mi Carrera → main promotion workflow wiring.
 * Run: node scripts/promote_mi_carrera_workflow_smoke.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else {
    console.log('OK:', msg);
  }
}

const promotePath = path.join(ROOT, '.github', 'workflows', 'promote-mi-carrera.yml');
const deployPath = path.join(ROOT, '.github', 'workflows', 'deploy.yml');

assert(fs.existsSync(promotePath), 'promote-mi-carrera.yml exists');
assert(fs.existsSync(deployPath), 'deploy.yml exists');

const promote = fs.readFileSync(promotePath, 'utf8');
const deploy = fs.readFileSync(deployPath, 'utf8');

assert(/cursor\/mi-carrera-age-causality/.test(promote), 'promote triggers only Mi Carrera feature branch');
assert(!/branches:\s*\n\s*-\s*'\*'/.test(promote), 'promote does not use wildcard branches');
assert(/npm run validate/.test(promote), 'promote runs npm validate');
assert(/merge --ff-only/.test(promote), 'promote uses fast-forward only (no force)');
assert(/gh workflow run "Deploy production"/.test(promote), 'promote dispatches existing Deploy production');
assert(/contents:\s*write/.test(promote), 'promote requests contents:write for main push');
assert(/actions:\s*write/.test(promote), 'promote requests actions:write for workflow_dispatch');
assert(/behind/.test(promote), 'promote fails clearly when feature is behind main');

assert(/branches:\s*\n\s*-\s*main/.test(deploy), 'deploy still triggers on main');
assert(/npm run validate/.test(deploy), 'deploy still validates');
assert(/RENDER_DEPLOY_HOOK/.test(deploy), 'deploy still uses Render hook secret');
assert(!/on:\s*\n\s*push:\s*\n\s*branches:\s*\n(?:.*\n)*?\s*-\s*cursor\/mi-carrera-age-causality/.test(deploy), 'deploy on.push does not include feature branch');
assert(/Promote Mi Carrera|promote-mi-carrera/.test(deploy), 'deploy docs reference promote workflow');

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
assert(pkg.scripts && pkg.scripts.validate === 'node validate-deploy.js', 'package.json validate intact');
assert(pkg.scripts['deploy:check'], 'deploy:check script present');

if (failed) {
  console.error('\nFAILED', failed);
  process.exit(1);
}
console.log('\nPromote workflow smoke passed.');
