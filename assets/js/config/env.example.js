/**
 * Copy to env.local.js (do not commit secrets) and load BEFORE football-api-config.js:
 *
 *   <script src="assets/js/config/env.local.js"></script>
 *   <script src="assets/js/config/football-api-config.js"></script>
 *
 * Then set MODE = 'API' in football-api-config.js
 */
window.CrackTotalEnv = window.CrackTotalEnv || {
    API_FOOTBALL_KEY: 'YOUR_API_FOOTBALL_KEY_HERE'
};
