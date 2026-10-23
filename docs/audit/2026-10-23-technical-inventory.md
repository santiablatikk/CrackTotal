# Crack Total 6.0 — Inventario técnico reproducible

**Snapshot de la rama:** `89f03fb9cd0fdb5e267ded7e730960a4e3b8c0c7` — 23/10/2026.

Este documento y el CSV adjunto son un **inventario automático del árbol Git**, no una auditoría manual línea a línea. **No se autorizan borrados** basándose solo en este inventario.

## Cobertura material

- **1617 archivos versionados** (blobs); **42 directorios**; **25.6 MB** acumulados según Git.
- **1265 SVG**, **120 JS**, **48 HTML**, **42 JSON**, **35 CSS**; otros tipos en `file-inventory-2026-10-23.csv`.
- **1134 escudos SVG generados**. No tratar como basura: el motor de Mi Carrera usa un manifiesto de escudos. Revisar contra el manifiesto antes de considerar sobrantes.
- Solo se detectó **1 grupo(s) de archivos de blob SHA idéntico(s)** entre archivos rastreados; el grupo encontrado corresponde a `.gitkeep` vacíos de directorios. **Esto no prueba ausencia de duplicación semántica** de CSS/JS ni de imágenes visualmente iguales.

### Distribución preliminar

| Área | Archivos |
|:--|--:|
| club-badge-generated | 1134 |
| image | 159 |
| javascript | 63 |
| test-build-script | 50 |
| html-route | 48 |
| other | 37 |
| css | 35 |
| game-data | 32 |
| career-engine-or-UI | 28 |
| documentation | 28 |
| automation | 3 |

### Recursos con prioridad de rendimiento

| Ruta | Tamaño (MB) |
|:--|--:|
| `assets/images/blog/copa america.jpg` | 6.56 |
| `assets/images/blog/catenaccio.png` | 2.66 |
| `assets/images/blog/scaloni.png` | 2.45 |
| `assets/images/blog/escudos.png` | 2.06 |

Estos archivos merecen comprobar uso real en páginas, lazy loading, dimensiones, formato moderno, compresión y Core Web Vitals. **No convertir ni eliminar antes de verificar los usos**.

## Problemas verificados y orden de intervención

1. **P0 — Integridad del producto:** Mi Carrera faltaba completamente en la rama candidata; se restauró desde la producción congelada (sin reescritura del motor). Los scripts antiguos habían bloqueado deliberadamente su publicación y la redirección servidor apuntaba al catálogo: corregidos en el trabajo de restauración.
2. **P0 — QA/release:** pruebas automatizadas con expectativas de CSS cache-buster antiguas; corregir el test y repetir suite completa.
3. **P1 — Seguridad dependencias:** la ejecución `npm ci` en GitHub Actions del 23/10/2026 informó **15 avisos (10 moderate, 3 high, 2 critical)**. Esto solo establece recuentos y no identifica aún paquetes ni explotabilidad; ejecutar `npm audit --json`, revisar cadena de dependencias y resolver sin aplicar `npm audit fix --force` indiscriminadamente.
4. **P1 — Backend multijugador:** diferencias históricas QSM / Mentiroso respecto al backend desplegado; verificar origen de verdad, evitar cambios de producción.
5. **P1 — Pruebas visuales:** pantallas iniciales y fixtures sintéticos de los seis juegos; los fixtures no prueban puntuaciones, persistencia ni WebSocket. Agregar pruebas con partidas reales de staging.
6. **P2 — Arquitectura CSS:** aún coexisten `assets/css/home.css`, `assets/css/discover.css`, `assets/css/crack-total-2.css`, `assets/css/home-4.css`, tokens compartidos y hojas de juegos. Requieren auditoría de cascada/uso real antes de consolidar.
7. **P2 — Mi Carrera:** prueba estructural de motor/datos y prueba inicial Chromium; faltan flujo creación, contratos, simulación, mercado, guardado/restauración, retirada.

## Significado del CSV

Cada fila incluye ruta, extensión, peso, hash de blob, categoría funcional inferida por ruta, conservación provisional, prioridad y estado de revisión. **`NOT_MANUALLY_REVIEWED` es explícito: no hemos certificado ni comprobado el contenido de cada archivo.**

### Condiciones para cambiar KEEP_PENDING_PROOF

- Evidencia de referencia directa/indirecta y uso dinámico.
- Verificación de manifiestos, SW, rutas en HTML, CSS `url()`, JavaScript y backend.
- Prueba de regresión para la funcionalidad afectada.
- Commit atómico reversible con lista de archivos borrados y motivo.

## Restricciones de despliegue

No modificar `main`, backend de producción, datos reales de usuarios ni `reports/`. No fusionar PR #1 hasta tener batería funcional completa y un candidato sin errores críticos.
