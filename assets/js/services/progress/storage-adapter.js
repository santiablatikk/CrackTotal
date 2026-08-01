/**
 * ProgressStorageAdapter — persistence boundary for gamification.
 * LocalStorage now; swap implementation for Firebase later without UI changes.
 */
(function () {
    'use strict';

    const Services = (window.CrackTotalServices = window.CrackTotalServices || {});

    function config() {
        return window.CrackTotalGamificationConfig || { storageKey: 'ct_progress_v1' };
    }

    function LocalStorageAdapter() {
        return {
            id: 'localStorage',
            async get(key) {
                try {
                    const raw = localStorage.getItem(key);
                    return raw ? JSON.parse(raw) : null;
                } catch (error) {
                    return null;
                }
            },
            async set(key, value) {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (error) {
                    return false;
                }
            },
            async remove(key) {
                try {
                    localStorage.removeItem(key);
                    return true;
                } catch (error) {
                    return false;
                }
            }
        };
    }

    /**
     * Firebase stub — same interface. Wire Auth/Firestore later.
     * Components must keep using ProgressService only.
     */
    function FirebaseAdapterStub() {
        return {
            id: 'firebase',
            async get() {
                throw new Error('Firebase progress adapter not configured yet');
            },
            async set() {
                throw new Error('Firebase progress adapter not configured yet');
            },
            async remove() {
                throw new Error('Firebase progress adapter not configured yet');
            }
        };
    }

    let active = LocalStorageAdapter();

    Services.ProgressStorage = {
        getAdapter() {
            return active;
        },
        useLocalStorage() {
            active = LocalStorageAdapter();
            return active;
        },
        /**
         * Future: ProgressStorage.useFirebase(firestore, uid)
         * Keep method signature stable for migration.
         */
        useFirebase() {
            active = FirebaseAdapterStub();
            return active;
        },
        async load() {
            return active.get(config().storageKey);
        },
        async save(state) {
            return active.set(config().storageKey, state);
        },
        async clear() {
            return active.remove(config().storageKey);
        },
        storageKey() {
            return config().storageKey;
        }
    };
})();
