# Crack Total — Componentes

Inventario de componentes reutilizables del shell y Design System.  
**Home** (`index.html`) mantiene su skin `.home-*`. La UI in-match de los juegos no se reescribe.

## Cuándo reutilizar

| Necesitás… | Usá | No hagas |
|---|---|---|
| Navegación del sitio | `data-ct-navbar` + `CrackTotalUI.navbar` | Copiar otro `<nav class="main-navigation">` |
| Footer del sitio | `data-ct-footer` + `CrackTotalUI.footer` | Copiar otro `.site-footer` |
| Botón de chrome/CTA | `.ct-button` (+ variantes) | Nuevo estilo one-off |
| Toast | `CrackTotalUI.toast` | Segundo sistema de notificaciones |
| Modal genérico | `CrackTotalUI.modal` | Nuevo overlay ad-hoc |
| Nombre de jugador | `CrackTotalProfile` / `ct-profile-dialog` | Modal de nombre duplicado |
| Empty / error | `.ct-empty` / `.ct-error` + factories | Markup suelto sin `role` |

## Shell (Navbar / Footer)

### Markup

```html
<link rel="stylesheet" href="assets/css/design-system/index.css">
<body class="ct-ds">
  <a class="skip-link" href="#main-content">Saltar al contenido principal</a>
  <div data-ct-navbar data-active="games"></div>
  <!-- contenido -->
  <div data-ct-footer></div>
  <script src="assets/js/components/navbar.js"></script>
  <script src="assets/js/components/footer.js"></script>
  <script src="assets/js/components/shell.js"></script>
</body>
```

`data-active` opcional: `home` | `games` | `profile` | `ranking` | `logros` | `blog` | `about` | `contact`.

El markup inyectado conserva `.main-navigation` / `.site-footer` para compatibilidad con [`layout.css`](assets/css/layout.css) y [`main.js`](assets/js/main.js) (toggle mobile + Escape).

### API

- `CrackTotalUI.navbar.mount(el, { active })`
- `CrackTotalUI.footer.mount(el)`
- `CrackTotalUI.shell.mount()` — auto-init de placeholders

## CSS `ct-*`

Definidos en [`assets/css/design-system/components.css`](assets/css/design-system/components.css):

- **Actions:** `.ct-button`, `--primary|secondary|ghost|danger`, `--sm|--lg`
- **Forms:** `.ct-label`, `.ct-input`, `.ct-select`, `.ct-search`, `.ct-field-error`
- **Layout:** `.ct-card`, `.ct-section`, `.ct-badge`, `.ct-banner`
- **Feedback:** `.ct-loader`, `.ct-skeleton`, `.ct-empty`, `.ct-error`, `.ct-toast`
- **Overlay:** `.ct-modal-overlay`, `.ct-modal`
- **Data:** `.ct-ranking-item`, `.ct-stat`, `.ct-avatar`
- **Marketing (fuera de Home):** `.ct-hero`, `.ct-game-card`, `.ct-category-card`

Bridges legacy (solo en páginas `.ct-ds`): [`bridges.css`](assets/css/design-system/bridges.css) — alinea `.btn` / `.small-button` / `.primary-button` de chrome sin pisar `.quantum-play-btn` ni `.mentiroso-action-btn`.

## JS `CrackTotalUI`

| API | Archivo |
|-----|---------|
| `loader` | `components/loader.js` |
| `emptyState` | `components/empty-state.js` |
| `errorState` | `components/error-state.js` |
| `toast` | `components/toast.js` |
| `modal` | `components/modal.js` |
| `navbar` / `footer` / `shell` | `components/navbar.js`, `footer.js`, `shell.js` |
| `avatar` | `components/avatar.js` |
| `rankingItem` | `components/ranking-item.js` |
| `statCard` | `components/stat-card.js` |

Ejemplos:

```js
CrackTotalUI.toast.success('Guardado');
CrackTotalUI.errorState.render(container, { title: 'Error', text: 'Reintentá más tarde' });
CrackTotalUI.avatar.create({ name: 'El 10' }).mount(parent);
```

## Cómo extender

1. Agregar tokens en `tokens.css` si el valor se reutiliza ≥2 veces.
2. Agregar clase `ct-*` en `components.css` (BEM simple: bloque / `__elem` / `--mod`).
3. Si necesita DOM dinámico, factory en `assets/js/components/` que amplíe `window.CrackTotalUI`.
4. Documentar aquí y en `DESIGN_SYSTEM.md`.
5. Adoptar en una página chrome antes de usarlo en juegos.

## Anti-patrones

- No crear un segundo toast/modal/navbar.
- No reescribir CSS de partida (`pasalache.css`, `mentiroso.css`, etc.) para “unificar botones”.
- No cambiar la estructura de Home (`.home-header`, `.home-footer`, `.home-game-card`).
- No introducir dependencias de bundler salvo decisión de producto.

## Migración de páginas

Helper one-shot: [`scripts/migrate-shell.js`](scripts/migrate-shell.js) (ya aplicado). Nuevas páginas: usar placeholders + scripts shell desde el inicio.

## Football Hub (Home)

Sección `#centro-futbol` en [`index.html`](index.html). Arquitectura desacoplada:

| Capa | Archivos |
|------|----------|
| Datos mock | `assets/data/hub/*.json` |
| Config | `CrackTotalConfig.hub` (`source: "mock" \| "api"`) |
| Servicio | `assets/js/services/hub-service.js` → `CrackTotalServices.hub` |
| Formato | `assets/js/utils/hub-format.js` |
| Render | `assets/js/components/hub/hub-renderers.js` (solo datos normalizados) |
| Orquestación | `assets/js/football-hub.js` |
| Estilos | `assets/css/football-hub.css` |

Para API real: setear `hub.source = "api"` y `hub.apiBasePath` — **sin cambiar renderers**.
