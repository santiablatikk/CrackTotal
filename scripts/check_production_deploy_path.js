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
      promoteWorkflow: '.github/workflows/promote-mi-carrera.yml (ONLY cursor/mi-carrera-age-causality → main)',
      renderServiceExpectedBranch: 'main'
    },
    null,
    2
  )
);

console.log('\nHow production updates:');
console.log('  1) Commit on cursor/mi-carrera-age-causality');
console.log('  2) git push (feature) → Promote workflow validates');
console.log('  3) If OK and not behind main → fast-forward origin/main');
console.log('  4) Promote dispatches Deploy production on main');
console.log('  5) Deploy validates again + Render hook / auto-deploy');
console.log('  6) cracktotal.com rebuilds');
console.log('\nFetch origin only downloads from GitHub. It does NOT deploy.');
console.log('Other feature branches are NOT auto-promoted.');

if (!onMain) {
  console.log(
    '\nSTATUS: you are on "' +
      branch +
      '". Production will NOT change until these commits reach origin/main (' +
      aheadOfMain +
      ' commit(s) ahead).'
  );
  if (branch === 'cursor/mi-carrera-age-causality') {
    console.log(
      'Auto-promote: push this branch to run promote-mi-carrera.yml (validate → ff-only main → Deploy production).'
    );
  } else {
    console.log('Auto-promote: NOT enabled for this branch (only cursor/mi-carrera-age-causality).');
  }
  process.exit(0);
}

if (!syncedWithMain) {
  console.log('\nSTATUS: local main differs from origin/main. Push or pull before expecting prod sync.');
  process.exit(0);
}

console.log('\nSTATUS: local main matches origin/main. If prod is stale, check Render deploy + Cloudflare/SW cache.');
