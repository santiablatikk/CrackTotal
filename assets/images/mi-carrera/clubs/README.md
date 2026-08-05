# Mi Carrera — club badge assets

## Paths

- Preferred: `assets/images/mi-carrera/clubs/{clubId}.svg|webp|png`
- Legacy: `assets/images/badges/{badgeId}.webp`

Providers resolve via `getClubBadge(clubId)` → local file (if present) → generated monogram SVG from club colors.

## Status (2026-08-05)

- Clubs in dataset: 156
- Clubs with `badgeId` set: 0
- Local crest files in `mi-carrera/clubs/`: 0 (directory reserved)
- Runtime: elegant generated fallbacks (club colors + initials). No hotlinking. No paid APIs.

## Adding real crests

Only add files that are legally reusable (open license / permission). Do not invent official trademarks.

Document source and license next to any added file when required.
