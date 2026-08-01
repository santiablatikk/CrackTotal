/**
 * CrackTotalServices.http — fetch wrapper with timeout / retry
 */
(function () {
    'use strict';

    const Services = (window.CrackTotalServices = window.CrackTotalServices || {});

    function getConfig() {
        const cfg = window.CrackTotalConfig && window.CrackTotalConfig.http;
        return {
            timeoutMs: (cfg && cfg.timeoutMs) || 10000,
            retries: (cfg && typeof cfg.retries === 'number') ? cfg.retries : 1,
            retryDelayMs: (cfg && cfg.retryDelayMs) || 400
        };
    }

    function sleep(ms) {
        return new Promise((resolve) => window.setTimeout(resolve, ms));
    }

    async function request(url, options) {
        const opts = Object.assign({ method: 'GET', headers: {}, json: true, retries: null }, options || {});
        const cfg = getConfig();
        const retries = opts.retries == null ? cfg.retries : opts.retries;
        const timeoutMs = opts.timeoutMs || cfg.timeoutMs;
        let lastError = null;

        for (let attempt = 0; attempt <= retries; attempt += 1) {
            const controller = new AbortController();
            const externalSignal = opts.signal;
            const onAbort = () => controller.abort();
            if (externalSignal) {
                if (externalSignal.aborted) controller.abort();
                else externalSignal.addEventListener('abort', onAbort, { once: true });
            }

            const timer = window.setTimeout(() => controller.abort(), timeoutMs);

            try {
                const headers = Object.assign({}, opts.headers);
                let body = opts.body;
                if (opts.json && body != null && typeof body !== 'string') {
                    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
                    body = JSON.stringify(body);
                }
                if (opts.json && !headers.Accept) {
                    headers.Accept = 'application/json';
                }

                const response = await fetch(url, {
                    method: opts.method,
                    headers,
                    body: opts.method === 'GET' || opts.method === 'HEAD' ? undefined : body,
                    signal: controller.signal,
                    credentials: opts.credentials || 'same-origin'
                });

                window.clearTimeout(timer);
                if (externalSignal) externalSignal.removeEventListener('abort', onAbort);

                const contentType = response.headers.get('content-type') || '';
                const isJson = opts.json !== false && contentType.includes('application/json');
                const data = isJson ? await response.json().catch(() => null) : await response.text();

                if (!response.ok) {
                    const error = new Error(`HTTP ${response.status}`);
                    error.status = response.status;
                    error.data = data;
                    error.url = url;
                    throw error;
                }

                return { data, response, status: response.status };
            } catch (error) {
                window.clearTimeout(timer);
                if (externalSignal) externalSignal.removeEventListener('abort', onAbort);
                lastError = error;
                const aborted = error && error.name === 'AbortError';
                if (aborted && externalSignal && externalSignal.aborted) throw error;
                if (attempt < retries) {
                    await sleep(cfg.retryDelayMs * (attempt + 1));
                    continue;
                }
                throw error;
            }
        }

        throw lastError || new Error('Request failed');
    }

    Services.http = {
        request,
        get(url, options) {
            return request(url, Object.assign({}, options, { method: 'GET' }));
        },
        post(url, body, options) {
            return request(url, Object.assign({}, options, { method: 'POST', body }));
        }
    };
})();
