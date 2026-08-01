/**
 * CacheManager — TTL localStorage cache for Football Hub.
 */
(function () {
    'use strict';

    const Services = (window.CrackTotalServices = window.CrackTotalServices || {});

    function prefix() {
        const cfg = window.CrackTotalFootballApiConfig;
        return (cfg && cfg.cache && cfg.cache.prefix) || 'ct_hub_v1_';
    }

    function defaultTtl(kind) {
        const ttl = (window.CrackTotalFootballApiConfig &&
            window.CrackTotalFootballApiConfig.cache &&
            window.CrackTotalFootballApiConfig.cache.ttl) || {};
        if (kind && ttl[kind + 'Ms'] != null) return ttl[kind + 'Ms'];
        return ttl.defaultMs || 5 * 60 * 1000;
    }

    function storageKey(key) {
        return prefix() + key;
    }

    function readRaw(key) {
        try {
            const raw = localStorage.getItem(storageKey(key));
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (error) {
            return null;
        }
    }

    function get(key) {
        const parsed = readRaw(key);
        if (!parsed || typeof parsed !== 'object') return null;
        if (typeof parsed.expiresAt === 'number' && Date.now() > parsed.expiresAt) {
            return null;
        }
        return parsed.value;
    }

    /** Returns value even if expired (for offline / API fallback display). */
    function getStale(key) {
        const parsed = readRaw(key);
        if (!parsed || typeof parsed !== 'object') return null;
        const expired = typeof parsed.expiresAt === 'number' && Date.now() > parsed.expiresAt;
        return {
            value: parsed.value,
            expired: expired,
            storedAt: parsed.storedAt || null,
            expiresAt: parsed.expiresAt || null
        };
    }

    function set(key, value, ttlMs) {
        try {
            const ttl = typeof ttlMs === 'number' ? ttlMs : defaultTtl();
            const payload = {
                value: value,
                storedAt: Date.now(),
                expiresAt: Date.now() + Math.max(0, ttl)
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

    function clearHub() {
        try {
            const pfx = prefix();
            const keys = [];
            for (let i = 0; i < localStorage.length; i += 1) {
                const k = localStorage.key(i);
                if (k && k.startsWith(pfx)) keys.push(k);
            }
            keys.forEach((k) => localStorage.removeItem(k));
            return keys.length;
        } catch (error) {
            return 0;
        }
    }

    Services.CacheManager = {
        get,
        getStale,
        set,
        remove,
        clearHub,
        defaultTtl
    };
})();
