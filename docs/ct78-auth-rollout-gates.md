# CT7.8 — Firebase Competitive Identity Gate (pre-integration)

## Status and limits

This change introduces `server/rankings/arena-identity.js`, a pure server-side
authorization boundary. **It is not wired into the current Arena WebSocket
router**, and therefore does not start ranking writes or impact casual matchmaking.

`createCompetitiveIdentity({ verifyIdToken, now })` takes a trusted Firebase
**Admin SDK** verifier, not browser-supplied claims. The verifier must be
configured as `(token,checkRevoked)=>admin.auth().verifyIdToken(token,checkRevoked)`.
The module always requests `checkRevoked=true`, refuses anonymous identities,
rejects unverified password emails, protects both seats of a room against
single-account play, keeps UID bound across reconnections, and treats expired
tokens as invalid. The bearer token is never written to stored match/room
records. `forgetRoom` removes private state after room expiry.

## Production prerequisites — blockers

1. Add a server-only Firebase Admin SDK dependency and its lockfile, enable an
   authenticated sign-in option besides the site's existing **anonymous**
   Firebase Auth, and deploy it only to the dedicated Arena backend.
2. Configure Admin credentials through Render secret/environment settings for
   project `cracktotal-cd2e7`. Never add credentials to GitHub, static JS,
   URLs, room events, debug logs, or user-visible health checks.
3. Attach auth verification at connection/room admission and room resume, using
   server-owned player IDs. Client user IDs are not authoritative. The
   spectator flow must never gain a verified competitor binding.
4. Add strong per-match IDs on game start, including every rematch. Link the
   existing `server/rankings/verified-match-ledger.js` via private
   server-finalization callbacks; never use client `gameOver` messages.
5. Prove two authenticated clients, invalid/revoked/expired JWT denial,
   reconnect, duplicate finish, and crash/retry with Firestore transactions
   in **staging connected to a dedicated test Firestore project**.
6. Deploy Firestore rules/indexes in the real Firebase project and test
   client write denials. Firestore Admin bypasses security rules.
7. Turn on competitively verified scores ONLY after exact production Arena and
   frontend commits are confirmed. Keep casual unverified games operational
   with honest "partida casual" status.

## Do not conflate

- Existing anonymous `firebaseService` local `matches` writes are not
  verified competitive results.
- Firebase browser API keys are public identifiers, NOT Admin credentials.
- Verified match ledgers require both players independently authenticated.
- The 25-player image library and existing QSM/Pasala/Mentiroso functionality
  are unrelated and must remain intact.
