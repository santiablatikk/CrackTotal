# Crack Total

Plataforma de juegos futboleros en español. **Diseño objetivo:** Crack Total 5.0 (Manrope, Space Grotesk, carbón, bosque, crema, lima y cobre). Esta versión vive en la rama `redesign/crack-total-2` y solo pasa a ser oficial cuando se fusiona a `main` y se verifica su despliegue en Render.

- **Dominio canónico de producción:** https://cracktotal.com (la variante `www` redirige al dominio raíz).
- **Preview aislado:** https://deploy-preview-1--zingy-haupia-53b742.netlify.app/
- **Pull request de consolidación:** https://github.com/santiablatikk/CrackTotal/pull/1
- **Backend de pruebas (aislado):** servicio Render `cracktotal-arena-staging`. Nunca usarlo para partidas de producción.

## Juegos y páginas activas

| Experiencia | Archivo |
| --- | --- |
| Inicio y desafíos diarios | `index.html` |
| Biblioteca de juegos | `games.html` |
| Top 10 | `top10.html` |
| Pasala Che individual | `pasalache.html` |
| Pasala Che 1v1 (Turnos / Espejo) | `pasala-1v1.html` |
| Wordle Futbolero | `wordle-futbol.html` |
| Quién Sabe Más | `quiensabemas.html` |
| Mentiroso | `mentiroso.html` |
| Perfil, rankings, logros | `profile.html`, `ranking.html`, `logros.html` |
| Artículos | `blog.html` y `blog-detail-*.html` |

**Mi Carrera está retirado** de la versión activa y de los archivos versionados. Su implementación histórica se conserva en el historial de Git. Los enlaces antiguos a `/mi-carrera.html` se redirigen a `/games.html` por el servidor Node.

## Estructura

- `assets/css/design-system/`: tokens canónicos y componentes/puentes CSS.
- `assets/css/`: estilos por experiencia y estilos heredados que siguen siendo dependencias activas.
- `assets/js/`: motores e interfaces frontend.
- `assets/data/`: preguntas, respuestas, bancos objetivos y datos públicos necesarios.
- `server.js`: HTTP y WebSocket; `server/pasala-duel.js`: lógica autoritativa del duelo.
- `scripts/`: validación y pruebas de regresión, utilidades activas de build.
- `docs/`: historial técnico y auditorías.
- `render.yaml`: Blueprint de producción.
- `deploy/staging.render.yaml`: Backend de pruebas, aislado de producción.
- `netlify.toml`: Preview estático para Pull Requests; **no** configuración de producción.

## Instalación y pruebas

Se necesita Node.js 22 para reproducir el entorno de tests del preview. En el servidor productivo, verificar la versión Node configurada en Render.

```bash
npm ci
npm test
npm run validate
npm start
```

El servidor usa `PORT` del entorno. Los juegos multijugador necesitan conexión WebSocket; el preview estático de Netlify no aloja el servidor.

Las suites actuales incluyen validaciones de contenido, Top 10, interfaces de juego, accesibilidad estructural, selección diaria y WebSockets. **Una suite verde no demuestra por sí sola que la interfaz se ve bien ni que Render publicó el commit deseado.**

## Despliegue

1. Trabajar en una rama feature y validar con `npm ci && npm test`.
2. Revisar diferencias contra `main`; comprobar dependencias, rutas y estado del PR.
3. Confirmar el rollback antes de publicar.
4. Fusionar un PR revisado a `main` únicamente con las pruebas críticas y QA aceptadas.
5. `.github/workflows/deploy.yml` valida el código y ejecuta pruebas; luego intenta activar el Deploy Hook de Render, si está configurado. **Si falta el hook, la acción por sí sola no confirma publicación**; verificar el auto-deploy en Render.
6. Comprobar servicio Render y commit desplegado, `https://cracktotal.com`, `https://www.cracktotal.com`, juegos, websockets, SEO y caché.

El sitio usa `cracktotal.com` como URL canónica y redirige `www` al dominio raíz. No usar el Netlify preview como prueba de publicación en producción.

## Recuperación / rollback

Antes de la promoción 5.1 se creó el punto de referencia:
`backup/production-pre-5-1-20261020` → commit `5e8ffb476a221dcb49946875957126c61928f13a`.

Si hubiera una regresión después de publicar, restaurar el commit conocido mediante un **PR de reversión** o un despliegue anterior en Render (según configuración efectiva), volver a ejecutar pruebas y verificar el dominio real. No forzar `main` sin plan de coordinación. No borrar datos Firebase ni almacenamiento local para restaurar solo el diseño.

## Criterios de lanzamiento

No considerar la release verificada hasta completar:
- Build y pruebas automáticas del commit publicado.
- QA real de la portada, cinco juegos y multijugador.
- Validación de datos persistidos, conexión de Render y URL canónica.
- Inspección visual y responsive a 320–1920 px.
- Plan de retorno al commit de recuperación disponible.

Consultá `docs/iteration-5.0-status.md` para el rediseño y `docs/release-5.1-status.md` para el estado de consolidación y posibles bloqueos de la puesta en producción.
