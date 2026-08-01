# Crack Total — Gamification

Sistema de identidad, progreso y retención diaria. La UI de juegos y el Football Hub **no** dependen de este módulo.

## Arquitectura

```
Juegos / Bridge
      │
      ▼
ProgressService  ◄── GamificationConfig (XP, niveles, logros)
      │
      ├── StorageAdapter (LocalStorage hoy → Firebase mañana)
      ├── RankingService (mock scopes)
      └── Events (xp / level-up / unlock)
            │
            ▼
CrackTotalUI.gamification.*  →  profile-gamification.js
```

| Capa | Archivo | Responsabilidad |
|------|---------|-----------------|
| Config | `assets/js/config/gamification-config.js` | Tabla XP, niveles, logros, badges, flags |
| Persistencia | `assets/js/services/progress/storage-adapter.js` | Adapter `get/set/remove` |
| Dominio | `assets/js/services/progress/progress-service.js` | XP, niveles, rachas, logros, historial |
| Rankings | `assets/js/services/progress/ranking-service.js` | global / weekly / monthly / friends |
| Bridge | `assets/js/services/progress/progress-bridge.js` | Evento `cracktotal:match-completed` |
| UI | `assets/js/components/gamification/gamification-ui.js` | Componentes reutilizables |
| Mount | `assets/js/profile-gamification.js` | Dashboard en `profile.html` |
| Estilos | `assets/css/gamification.css` | Tokens del Design System (sin modificar el DS) |

API pública: `window.CrackTotalProgress` y `window.CrackTotalProgressBridge`.

## Modelo de datos (`ct_progress_v1`)

```json
{
  "version": 1,
  "profile": { "displayName", "createdAt", "lastActiveAt" },
  "xp": { "total", "entries[]" },
  "streak": { "current", "best", "lastPlayDate" },
  "stats": {
    "gamesPlayed", "gamesWon", "correctAnswers", "incorrectAnswers",
    "totalPlayTimeSec", "dailyChallenges", "perfectRoscos", "triviaWins", "byGame"
  },
  "achievements": { "<id>": { "progress", "target", "unlocked", "unlockedAt" } },
  "badges": ["badge_starter"],
  "history": { "matches[]", "achievements[]", "activity[]" },
  "meta": { "legacyMigrated": true }
}
```

## Sistema XP

Tabla configurable en `GamificationConfig.xpTable` (no hardcodear en componentes):

| Evento | XP por defecto |
|--------|----------------|
| `first_game` | 50 |
| `match_played` | 10 |
| `victory` | 25 |
| `perfect_answers` | 20 |
| `streak_day` | 15 |
| `daily_challenge` | 40 |
| `achievement_unlock` | 30 |
| `level_up_bonus` | 20 |

Los juegos reportan partidas con:

```js
CrackTotalProgressBridge.reportMatch({
  gameId: 'pasalache',
  gameName: 'Pasala Che',
  won: true,
  correctAnswers: 26,
  incorrectAnswers: 0,
  durationSec: 180,
  perfect: true,
  dailyChallenge: false
});
```

o disparando `cracktotal:match-completed`.

## Niveles

Ordenados por `minXp` en config:

Novato → Promesa → Titular → Capitán → Ídolo → Leyenda

`ProgressService.resolveLevel(xp)` calcula progreso hacia el siguiente.

## Logros e insignias

Definidos en `GamificationConfig.achievements` / `badges`. Cada logro expone:

- icono, descripción, progreso, desbloqueado, fecha

Reglas soportadas: `games_played`, `wins`, `correct_answers`, `streak_days`, `perfect_rosco`, `game_wins`, `trivia_wins`, `daily_challenge`.

## Rachas

- Se actualizan al **jugar** (no al recargar).
- Clave diaria local `YYYY-MM-DD` en `streak.lastPlayDate`.
- Día consecutivo → `current++` y XP `streak_day`.
- Día roto → `current = 1`.
- `best` nunca baja.

## Rankings

`RankingService` carga mocks en `assets/data/rankings/{global,weekly,monthly,friends}.json` e inyecta al jugador local por XP. Misma interfaz servirá para Firestore/Cloud Functions.

## Componentes UI

Registrados en `CrackTotalUI.gamification`:

`ProfileCard`, `XPBar`, `AchievementCard`, `Badge`, `LevelCard`, `StatsGrid`, `HistoryCard`, `RankingCard`, `ActivityFeed`, `StreakWidget`

Usan clases `ct-*` / tokens existentes. Estilos adicionales solo en `gamification.css`.

## Persistencia y migración a Firebase

Hoy: `ProgressStorage` → LocalStorage (`ct_progress_v1`).

Para Firebase Auth + Firestore **sin tocar componentes**:

1. Implementar un adapter real con la misma interfaz `{ get, set, remove }`.
2. Llamar `CrackTotalServices.ProgressStorage.useFirebase(db, uid)` (reemplazar el stub).
3. Opcional: hidratar al login y hacer merge con estado local.
4. Seguir usando solo `CrackTotalProgress.getSnapshot()` / events en la UI.

Los componentes **nunca** leen `localStorage` ni Firestore directamente.

## Integración con juegos

Hooks mínimos (no cambian reglas de juego):

- `pasalache.js` — al guardar historial
- `top10.js` — en `showResult`
- `mentiroso.js` — en `endGame`
- `quiensabemas_1v1.js` — al cerrar partida

Legacy `pasalacheUserStats` / historial se migran **una vez** a stats/historial del progreso.

## Validación rápida

1. Abrir `profile.html` → dashboard con avatar, XP, racha, logros, rankings mock.
2. Jugar Pasala Che o Top 10 → XP / actividad / racha actualizados al volver al perfil.
3. Recargar → racha y XP persisten.
4. Home / Football Hub / Design System sin cambios de comportamiento.
