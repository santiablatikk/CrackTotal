# Crack Total Design System

Base visual canónica alineada al lenguaje **Home premium** (navy + mint).  
Los juegos legacy siguen estables gracias a aliases en `tokens.css` y bridges acotados.

Ver también: [`COMPONENTS.md`](COMPONENTS.md).

## Cómo incluirlo

```html
<link rel="stylesheet" href="assets/css/base.css">
<link rel="stylesheet" href="assets/css/design-system/index.css">
<body class="ct-ds">
```

`base.css` importa `tokens.css`.  
`design-system/index.css` encadena: **tokens → utilities → components → bridges**.

Shell compartido (casi todas las páginas excepto Home):

```html
<div data-ct-navbar data-active="about"></div>
<div data-ct-footer></div>
<script src="assets/js/components/navbar.js"></script>
<script src="assets/js/components/footer.js"></script>
<script src="assets/js/components/shell.js"></script>
```

## Paleta (`--ct-*`)

| Token | Rol |
|-------|-----|
| `--ct-bg` / `--ct-surface` | Fondos navy |
| `--ct-text` / `--ct-text-muted` | Texto |
| `--ct-primary` `#79f2a6` | Acción principal (mint) |
| `--ct-accent` `#60a5fa` | Focus / links secundarios |
| `--ct-warm` / `--ct-danger` / `--ct-success` | Estados |
| `--ct-line` | Bordes |

Legacy (juegos): `--primary` azul Bootstrap, `--background` `#121212`, etc. — **no eliminar**.

Home aliases: `--home-*` → `--ct-*`.

## Tipografía

- UI: Montserrat → `--ct-font-sans`
- Display: Oswald → `--ct-font-display`
- Escala: `--ct-font-size-xs` … `--ct-font-size-hero` (`clamp`)

Jerarquía en chrome:

1. Display / page title (Oswald, uppercase ligero)
2. Section title (`.ct-section__title` o `h2`)
3. Body / muted (`.ct-text-muted`)

## Espaciado / radios / sombras

- Spacing: `--ct-space-2xs` … `--ct-space-3xl`, `--ct-space-section`
- Radii: `--ct-radius-xs` … `--ct-radius-pill`
- Shadows: `--ct-shadow-sm` … `--ct-shadow-xl`, `--ct-shadow-focus`
- Touch: `--ct-touch-min` ≥ 44px

## Breakpoints (referencia)

`--ct-bp-sm` 480 · `--ct-bp-md` 720 · `--ct-bp-lg` 1050 · `--ct-bp-xl` 1280

## Motion

- `--ct-duration-fast|base|slow`
- `--ct-ease` / `--ct-ease-out`
- `prefers-reduced-motion` colapsa durations del DS

## Componentes

Ver [`COMPONENTS.md`](COMPONENTS.md) para inventario completo CSS/JS.

Convención de nombres: namespace `ct-*` (CSS) y `CrackTotalUI` / `CrackTotalServices` (JS).

## Bridges legacy

En páginas `.ct-ds`, [`bridges.css`](assets/css/design-system/bridges.css) alinea focus/radii de `.btn`, `.small-button`, `.primary-button` de chrome.

**No** aplica a skins de partida: `.quantum-play-btn`, `.mentiroso-action-btn`, etc.

## Shell vs game-skin

| Capa | Qué unificar | Qué dejar |
|------|----------------|-----------|
| Shell | Navbar, footer, forms de contacto/perfil, CTAs de navegación | — |
| Home | Tokens vía `--home-*` | Estructura `.home-*` |
| Match UI | Focus tokens globales si cargan `base.css` | Botones/layouts del juego |

## Accesibilidad

- Focus visible global bajo `.ct-ds`
- Toasts/loaders/empty con `role` + `aria-live`
- Navbar: `aria-expanded`, `aria-controls`, Escape (vía `main.js`)
- Contraste mint-on-dark; primary con texto oscuro (`--ct-text-inverse`)

## Infraestructura (stubs)

`CrackTotalConfig` + `CrackTotalServices` (http, cache, errors) — listos para APIs futuras, **sin** providers deportivos conectados.

## Convenciones

1. Un solo Design System; no inventar paletas por página.
2. Migración opt-in con `ct-ds` + `index.css`.
3. Extender con tokens antes que magic numbers.
4. Documentar componentes nuevos en `COMPONENTS.md`.
