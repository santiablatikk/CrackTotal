# Mi Carrera — club badge assets

## Paths

- Preferred: `assets/images/mi-carrera/clubs/{clubId}.svg|webp|png`
- Legacy: `assets/images/badges/{badgeId}.webp`

Provider resolve order (`getClubBadge`):

1. **REAL LOCAL** — file present under `mi-carrera/clubs/` (or legacy badges)
2. **FALLBACK LOCAL** — alternate local path if mapped
3. **GENERATED** — monogram SVG from club colors + initials (never claimed as official crest)

## Status (2026-08-06)

- Clubs in dataset: 156
- Clubs with official local crest files: 0
- Runtime: generated monogram fallbacks only. No hotlinking. No paid APIs. No remote URLs.

## Adding real crests

Only add files that are legally reusable (open license / permission). Filename should match `clubId` (e.g. `club_boca.svg`).

Document source and license next to any added file when required.

Do not invent that a monogram is an official crest.
