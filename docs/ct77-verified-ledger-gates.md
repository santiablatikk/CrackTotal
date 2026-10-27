# Crack Total 7.7 — verified ranking ledger (foundation only)

**Status:** implemented and regression-tested module, **not enabled in public Arena**.
**Never present competitive scores or profile stats as authenticated until the
remaining admission and deployment requirements are completed.**

## Current deployed state

- Pasala Che 1v1, QSM and Mentiroso route to `cracktotal-arena-prod.onrender.com`.
- The Arena scores individual matches server-side, but **does not authenticate**
  Firebase user identities at room admission.
- `assets/js/services/progress/ranking-service.js` only reads
  Firestore `leaderboard_scopes/{scope}/entries/{uid}` with
  `verified=true`, `verifiedBy='server'` and schemaVersion 1.
- `firestore.rules` bans browser writes to these standings. Neither a browser
  snapshot nor a user-created `matches` document is a verified result.

## New backend-only module

`server/rankings/verified-match-ledger.js` exports
`createVerifiedMatchLedger({db,loadFinishedMatch,resolveAuthenticatedUid})`.

It requires **both server-private resolvers**, a finalised, authoritative match,
two different Firebase Admin-verified user UIDs and a fresh unique `matchId`
**per match, including each rematch**.

A transaction reads the private `verified_matches/{matchId}` ledger doc first.
If it already exists, duplicate delivery does nothing. Otherwise, within the
same Firestore Admin transaction, it writes the immutable audit record plus
global and per-game entries for both participants.

Win = 3 points, draw = 1, loss = 0. Question scores (including QSM half-points)
are used only to determine the match outcome. Per-game and global
`gamesPlayed`, `victories`, `score`, `name`, `updatedAt` remain consistent.
Weekly/monthly rankings are **not** written yet: those require calendar-period
IDs and scheduled/transactional rollover logic.

## Release gates before enabling writes

1. Authenticate each browser using Firebase Auth, verify the ID token with
   Firebase Admin on the Arena server, and securely bind `uid` to the
   *server-owned room participant* when admitting the player. Never accept
   `uid`, `winner`, `score` or `verifiedBy` as client authorization.
2. Give every Arena match a **cryptographically random unique match ID** at
   match start (separate from the shared room code), including rematches.
3. Expose private callbacks `loadFinishedMatch` and
   `resolveAuthenticatedUid` only inside the Arena process, never through
   HTTP/WS endpoints. Reject missing, expired, or unverified bindings.
4. Enable Firebase Admin with least-privileged service credentials stored in
   Render secret variables. Never put secrets, Firebase Admin credentials or
   private keys in GitHub, frontend bundles or logs.
5. Integrate the module into authoritative match-completion events, **not**
   user requests. Handle retries and surface persistence failures to monitoring.
6. Confirm deployed Firestore indexes, rules and security boundaries using the
   Firebase project connected to production. Admin bypasses client rules; the
   server must apply its own authorization.
7. Test authentic two-client matches, disconnect/reconnect, simultaneous end
   events, scores, duplicates, server crashes and revanches in staging.
8. Preserve separation between local single-player progression and
   server-verified competitive history. Never backfill legacy browser scores.
9. Verify `www.cracktotal.com` and new Arena deployment commits separately.

Until these gates pass, the new module is **inert**: there are no backend imports
from public `server.js`, no new environment variables, no client writes and
no fabricated leaderboard entries.
