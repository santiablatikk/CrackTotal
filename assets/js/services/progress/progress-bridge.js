/**
 * ProgressBridge — non-invasive glue between games and ProgressService.
 * Games may call CrackTotalProgress.recordMatch(...) or dispatch cracktotal:match-completed.
 */
(function () {
    'use strict';

    const MATCH_EVENT = 'cracktotal:match-completed';

    function normalize(detail) {
        const d = detail || {};
        return {
            gameId: d.gameId || d.game || 'unknown',
            gameName: d.gameName || d.title || d.gameId || 'Juego',
            won: Boolean(d.won || d.result === 'victory'),
            result: d.result || (d.won ? 'victory' : 'defeat'),
            score: d.score,
            correctAnswers: d.correctAnswers != null ? d.correctAnswers : d.correct,
            incorrectAnswers: d.incorrectAnswers != null ? d.incorrectAnswers : d.incorrect,
            durationSec: d.durationSec != null ? d.durationSec : d.duration || d.timeSpent,
            perfect: Boolean(d.perfect),
            perfectAnswers: d.perfectAnswers,
            dailyChallenge: Boolean(d.dailyChallenge || d.daily),
            at: d.at || d.timestamp,
            meta: d.meta || {}
        };
    }

    function handle(detail) {
        if (!window.CrackTotalProgress || typeof window.CrackTotalProgress.recordMatch !== 'function') {
            return null;
        }
        try {
            return window.CrackTotalProgress.recordMatch(normalize(detail));
        } catch (error) {
            return null;
        }
    }

    window.addEventListener(MATCH_EVENT, (event) => {
        handle(event && event.detail);
    });

    window.addEventListener('cracktotal:profile-updated', (event) => {
        const name = event && event.detail && event.detail.name;
        if (name && window.CrackTotalProgress && window.CrackTotalProgress.setDisplayName) {
            window.CrackTotalProgress.setDisplayName(name);
        }
    });

    window.CrackTotalProgressBridge = {
        MATCH_EVENT: MATCH_EVENT,
        reportMatch(detail) {
            return handle(detail);
        },
        emitMatch(detail) {
            try {
                window.dispatchEvent(new CustomEvent(MATCH_EVENT, { detail: detail || {} }));
            } catch (error) {
                handle(detail);
            }
        }
    };
})();
