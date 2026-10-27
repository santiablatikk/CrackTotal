# Crack Total 7.5 — Actual operating conditions (2026-10-27)

## Confirmed in this delivery

The public website is a **Render static site** deploying `main` from `santiablatikk/CrackTotal`. The server at `cracktotal-servidor.onrender.com` is a **different Render application and GitHub repository**, with its historical backend. The **Arena staging** at `cracktotal-arena-staging.onrender.com` is a test-only service with manual deployment.

**Pasala Che 1v1 is deliberately unavailable on the production domain** unless a valid `window.CRACK_TOTAL_DUEL_WS_URL` is configured. This static site cannot accept WebSocket connections by itself, and the historical backend does not include the Arena Pasala protocol. Do not silently route production matches to staging.

Quién Sabe Más and Mentiroso production clients address the historical `wss://cracktotal-servidor.onrender.com`; staging tests alone do not prove the production backend handles all cases correctly.

A **read-only verified scoreboard** lives in the frontend, but there is no confirmed production trusted result publisher, identity-to-match link, rules deployment or Firestore composite-index deployment. The `matches` and `user_stats` collections accept some authenticated client writes and therefore are **not authoritative competition records**. A server-side match publisher with authenticated identities, immutable match ids, transactions and rematch/reconnect replay defenses remains necessary.

## Completed safety work in 7.5

- Legacy ranking renderer escapes user-supplied player names, errors and empty messages before string-to-DOM interpolation; numeric metrics are normalized before insertion.
- The identity/career bank contains **14 licensed portraits from 35 players**, with creator, license, Commons file source, attribution and checked date. The remaining 21 players intentionally use a text-only fallback.
- An explicit regression checks credits, normalized file matching, old ranking name XSS attempts, and lack of unsafe innerHTML in the editorial engine.
- The existing gameplay engine reveals portraits only in the answer phase, preserving no-spoiler behavior.

## Copyright, trademarks and endorsement

Creative Commons attribution/share-alike permission applies to the photographs subject to its terms and does not imply a player's endorsement. Files labeled PD-textlogo on Wikimedia Commons can still contain **protected trademarks**. Bulk club crests should be released after a nominative use and jurisdictional review: correct historic version, exact club name and a no-affiliation disclaimer. No unlicensed crests are introduced in this tranche.

## Release gates for full 7.5 online competition

1. Dedicated production Arena service with HTTPS/WSS, exact `cracktotal-arena-5.2` handshake, allowlisted site origins and a verified published commit.
2. Two real independent clients playing Pasala, QSM and Mentiroso against **production**; perform dropout/recovery, unsolicited spectator actions, forged clocks, reconnect replay, forfeit, final result and rematch tests.
3. Real authenticated player identities and Firestore Admin publishing for **server-scored** immutable matches, transactions for leaderboard aggregates, deployed security rules/indexes and a second-browser validation after a match.
4. Performance budgets, documented risk remediation from `npm audit --json` (runtime vs build time), and release rollback procedure.

All rankings must fail closed without fabricated users, matches or totals.
