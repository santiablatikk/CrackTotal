/**
 * CrackTotalServices barrel — ensures namespace after stub scripts load
 */
(function () {
    'use strict';

    const Services = (window.CrackTotalServices = window.CrackTotalServices || {});

    Services.ready = true;
    Services.version = (window.CrackTotalConfig && window.CrackTotalConfig.version) || '0.0.0';

    if (!Services.http) {
        console.warn('[CrackTotalServices] http-client.js not loaded');
    }
    if (!Services.cache) {
        console.warn('[CrackTotalServices] cache.js not loaded');
    }
    if (!Services.errors) {
        console.warn('[CrackTotalServices] errors.js not loaded');
    }
})();
