/**
 * CrackTotalServices.cache — localStorage TTL helpers
 */
(function () {
    'use strict';

    const Services = (window.CrackTotalServices = window.CrackTotalServices || {});

    function prefix() {
        return (window.CrackTotalConfig && window.CrackTotalConfig.cache && window.CrackTotalConfig.cache.prefix) || 'ct_cache_';
    }

    function defaultTtl() {
        return (window.CrackTotalConfig && window.CrackTotalConfig.cache && window.CrackTotalConfig.cache.defaultTtlMs) || 300000;
    }

    function storageKey(key) {
        return `${prefix()}${key}`;
    }

    function get(key) {
        try {
            const raw = localStorage.getItem(storageKey(key));
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return null;
            if (typeof parsed.expiresAt === 'number' && Date.now() > parsed.expiresAt) {
                localStorage.removeItem(storageKey(key));
                return null;
            }
            return parsed.value;
        } catch (error) {
            return null;
        }
    }

    function set(key, value, ttlMs) {
        try {
            const ttl = typeof ttlMs === 'number' ? ttlMs : defaultTtl();
            const payload = {
                value,
                expiresAt: Date.now() + Math.max(0, ttl),
                storedAt: Date.now()
            };
            localStorage.setItem(storageKey(key), JSON.stringify(payload));
            return true;
        } catch (error) {
            return false;
        }
    }

    function remove(key) {
        try {
            localStorage.removeItem(storageKey(key));
            return true;
        } catch (error) {
            return false;
        }
    }

    function clearExpired() {
        let removed = 0;
        try {
            const pfx = prefix();
            const keys = [];
            for (let i = 0; i < localStorage.length; i += 1) {
                const k = localStorage.key(i);
                if (k && k.startsWith(pfx)) keys.push(k);
            }
            keys.forEach((k) => {
                try {
                    const parsed = JSON.parse(localStorage.getItem(k) || 'null');
                    if (parsed && typeof parsed.expiresAt === 'number' && Date.now() > parsed.expiresAt) {
                        localStorage.removeItem(k);
                        removed += 1;
                    }
                } catch (error) {
                    localStorage.removeItem(k);
                    removed += 1;
                }
            });
        } catch (error) {
            /* ignore */
        }
        return removed;
    }

    Services.cache = {
        get,
        set,
        remove,
        clearExpired
    };
})();
