/**
 * ErrorManager — logging + fallback decisions for Football Hub.
 * Never throws to the UI layer; returns structured outcomes.
 */
(function () {
    'use strict';

    const Services = (window.CrackTotalServices = window.CrackTotalServices || {});

    function log(level, message, meta) {
        const payload = Object.assign({ message: message, time: new Date().toISOString() }, meta || {});
        if (level === 'error') console.warn('[FootballHub]', payload);
        else if (level === 'warn') console.warn('[FootballHub]', payload);
        else console.info('[FootballHub]', payload);
    }

    function toMessage(error) {
        if (!error) return 'Error desconocido';
        if (error.code === 'NO_API_KEY') return 'Falta configurar la API key.';
        if (error.code === 'ABORTED' || error.name === 'AbortError') return 'Solicitud cancelada.';
        if (error.status === 429) return 'Límite de la API alcanzado. Usamos datos guardados.';
        if (error.status === 401 || error.status === 403) return 'API key inválida o sin permiso.';
        if (window.CrackTotalServices && window.CrackTotalServices.errors) {
            return window.CrackTotalServices.errors.toFriendlyMessage(error);
        }
        return error.message || 'No pudimos actualizar los datos.';
    }

    function shouldFallbackToMock(error) {
        const cfg = window.CrackTotalFootballApiConfig;
        if (cfg && cfg.features && cfg.features.fallbackToMockOnError === false) return false;
        if (!error) return true;
        if (error.code === 'ABORTED') return false;
        return true;
    }

    function wrapFailure(error, context) {
        log('warn', toMessage(error), { context: context, code: error && error.code, status: error && error.status });
        return {
            ok: false,
            error: error,
            message: toMessage(error),
            fallback: shouldFallbackToMock(error)
        };
    }

    Services.ErrorManager = {
        log,
        toMessage,
        shouldFallbackToMock,
        wrapFailure
    };
})();
