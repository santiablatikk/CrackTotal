/**
 * ApiClient — low-level HTTP for API-Football (abort, timeout, retries).
 * Components must never call this directly.
 */
(function () {
    'use strict';

    const Services = (window.CrackTotalServices = window.CrackTotalServices || {});

    let activeControllers = new Map();

    function cfg() {
        return window.CrackTotalFootballApiConfig || {};
    }

    function sleep(ms) {
        return new Promise((resolve) => window.setTimeout(resolve, ms));
    }

    function buildUrl(path, params) {
        const base = String(cfg().baseUrl || '').replace(/\/$/, '');
        const url = new URL(base + (path.startsWith('/') ? path : '/' + path));
        if (params && typeof params === 'object') {
            Object.keys(params).forEach((key) => {
                const value = params[key];
                if (value == null || value === '') return;
                url.searchParams.set(key, String(value));
            });
        }
        return url.toString();
    }

    function abort(requestId) {
        const controller = activeControllers.get(requestId);
        if (controller) {
            controller.abort();
            activeControllers.delete(requestId);
        }
    }

    function abortAll() {
        activeControllers.forEach((controller) => controller.abort());
        activeControllers.clear();
    }

    async function request(path, options) {
        const opts = Object.assign({ method: 'GET', params: null, requestId: 'default', retries: null }, options || {});
        const config = cfg();
        const http = config.http || {};
        const retries = opts.retries == null ? (http.retries == null ? 1 : http.retries) : opts.retries;
        const timeoutMs = opts.timeoutMs || http.timeoutMs || 12000;
        const apiKey = config.apiKey || '';
        const headerName = (config.headers && config.headers.keyHeader) || 'x-apisports-key';

        if (!apiKey) {
            const error = new Error('API key missing');
            error.code = 'NO_API_KEY';
            throw error;
        }

        abort(opts.requestId);
        let lastError = null;

        for (let attempt = 0; attempt <= retries; attempt += 1) {
            const controller = new AbortController();
            activeControllers.set(opts.requestId, controller);
            const timer = window.setTimeout(() => controller.abort(), timeoutMs);

            try {
                const url = buildUrl(path, opts.params);
                const response = await fetch(url, {
                    method: opts.method || 'GET',
                    headers: {
                        Accept: 'application/json',
                        [headerName]: apiKey
                    },
                    signal: controller.signal,
                    credentials: 'omit'
                });

                window.clearTimeout(timer);
                if (activeControllers.get(opts.requestId) === controller) {
                    activeControllers.delete(opts.requestId);
                }

                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    const error = new Error('HTTP ' + response.status);
                    error.status = response.status;
                    error.data = data;
                    error.code = 'HTTP_ERROR';
                    throw error;
                }

                if (data && data.errors && (Array.isArray(data.errors) ? data.errors.length : Object.keys(data.errors).length)) {
                    const error = new Error('API errors');
                    error.status = response.status;
                    error.data = data.errors;
                    error.code = 'API_ERRORS';
                    throw error;
                }

                return {
                    data: data,
                    response: Array.isArray(data && data.response) ? data.response : [],
                    results: data && data.results != null ? data.results : 0
                };
            } catch (error) {
                window.clearTimeout(timer);
                if (activeControllers.get(opts.requestId) === controller) {
                    activeControllers.delete(opts.requestId);
                }
                lastError = error;
                if (error && error.name === 'AbortError') {
                    error.code = error.code || 'ABORTED';
                    throw error;
                }
                if (attempt < retries) {
                    await sleep((http.retryDelayMs || 500) * (attempt + 1));
                    continue;
                }
                throw error;
            }
        }

        throw lastError || new Error('Request failed');
    }

    Services.ApiClient = {
        buildUrl,
        request,
        get(path, params, options) {
            return request(path, Object.assign({}, options, { method: 'GET', params: params }));
        },
        abort,
        abortAll
    };
})();
