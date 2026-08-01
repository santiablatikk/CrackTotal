(function () {
    'use strict';

    async function waitForFirebaseService(timeoutMs = 5000) {
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeoutMs) {
            if (window.firebaseService?.currentUser) return window.firebaseService;
            await new Promise((resolve) => window.setTimeout(resolve, 100));
        }
        return window.firebaseService || null;
    }

    async function getUserId() {
        const service = await waitForFirebaseService();
        return service?.currentUser?.uid || null;
    }

    window.CrackTotalFirebaseUtils = Object.freeze({
        waitForFirebaseService,
        getUserId
    });
})();
