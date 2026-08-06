# Mi Carrera — club badge assets

## Resolve order

1. **REAL LOCAL** — file listed in `assets/data/mi-carrera/clubs/badges.json` with `status: "real"`
2. **REAL ASSET ON DISK** — `assets/images/mi-carrera/clubs/{clubId}.{svg|webp|png}`
3. **FALLBACK LOCAL** — legacy `assets/images/badges/`
4. **GENERATED** — monogram SVG from club colors (never claimed as an official crest)

## Manifest

`assets/data/mi-carrera/clubs/badges.json`

Fields per club: `clubId`, `clubName`, `assetPath`, `status` (`real` | `fallback` | `missing`).

## Status (2026-08-06)

- Clubs: **156**
- `status: real`: **0**
- Local crest files in `mi-carrera/clubs/`: **0**
- Repo scan: no redistributable official crests found under `assets/images` for Mi Carrera
- Runtime: generated monograms only, labeled as fallback (`data-badge-status="generated"`, title “sin escudo oficial”)
- No hotlinking. No paid APIs.

## Adding real crests

Only add legally redistributable files. Name them `{clubId}.svg` (preferred) and set `status` to `real` + `assetPath` in the manifest.

Priority order when adding:

1. Start-club pool (country giants / mid / small)
2. Frequent market clubs (Big 5 + Libertadores tops)
3. Career Card / final clubs
