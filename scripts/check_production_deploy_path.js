/**
 * Diagnose why local work may not appear on cracktotal.com.
 * Run: node scripts/check_production_deploy_path.js
 *
 * Facts this project uses:
 * - Production branch: main
 * - Deploy trigger: push to main → .github/workflows/deploy.yml → Render
 * - Fetch origin only downloads remotes; it never deploys
 */
'use strict';

const { execSync } = require('child_process');

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

const branch = sh('git rev-parse --abbrev-ref HEAD');
const head = sh('git rev-parse HEAD');
let originMain = '';
try {
  originMain = sh('git rev-parse origin/main');
} catch (e) {
  console.error('FAIL: origin/main missing. Run: git fetch origin');
  process.exit(1);
}

const aheadOfMain = sh('git rev-list --count origin/main..HEAD');
const behindMain = sh('git rev-list --count HEAD..origin/main');
const onMain = branch === 'main';
const syncedWithMain = head === originMain;

console.log(
  JSON.stringify(
    {
      currentBranch: branch,
      head: head.slice(0, 7),
      originMain: originMain.slice(0, 7),
      commitsAheadOfMain: Number(aheadOfMain),
      commitsBehindMain: Number(behindMain),
      onProductionBranch: onMain,
      localMatchesOriginMain: syncedWithMain,
      fetchOriginUpdatesProduction: false,
      pushUpdatesProductionOnlyIf: 'push (or merge) lands on origin/main',
      workflow: '.github/workflows/deploy.yml (on: push branches: [main] | workflow_dispatch)',
      promoteWorkflow: null,
      renderServiceExpectedBranch: 'main'
    },
    null,
    2
  )
);

console.log('\nHow production updates:');
console.log('  1) Validate candidate branch with npm ci && npm test.');
console.log('  2) Merge reviewed release PR into main.');
console.log('  3) GitHub workflow .github/workflows/deploy.yml validates + triggers Render hook.');
console.log('  4) Verify Render deployment and cracktotal.com live after publishing.');
console.log('  5) Use backup/production-pre-5-1-20261020 for rollback if necessary.');
console.log('Other feature branches do NOT auto-promote to production.');

if (!onMain) {
  console.log(
    '\nSTATUS: you are on "' +
      branch +
      '". Production will NOT change until these commits reach origin/main (' +
      aheadOfMain +
      ' commit(s) ahead).'
  );
  console.log('Auto-promote: disabled. Merge a validated PR into main to release.');
  process.exit(0);
}

if (!syncedWithMain) {
  console.log('\nSTATUS: local main differs from origin/main. Push or pull before expecting prod sync.');
  process.exit(0);
}

console.log('\nSTATUS: local main matches origin/main. If prod is stale, check Render deploy + Cloudflare/SW cache.');
