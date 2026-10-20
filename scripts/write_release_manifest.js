'use strict';

// Render serves cracktotal.com as a Static Site, not as the Node server.
// Emit non-sensitive deployment metadata into its publish directory ('.').
const fs = require('fs');
const path = require('path');

const manifest = {
  service: 'cracktotal-static',
  version: '5.1.0',
  environment: process.env.RENDER === 'true' ? 'production' : 'build',
  commit: process.env.RENDER_GIT_COMMIT || null,
  branch: process.env.RENDER_GIT_BRANCH || null
};

const destination = path.join(__dirname, '..', '__ct_release.json');
fs.writeFileSync(destination, JSON.stringify(manifest) + '\n', 'utf8');
console.log('[release] Wrote static deployment identity', {
  version: manifest.version,
  branch: manifest.branch,
  hasCommit: Boolean(manifest.commit)
});
