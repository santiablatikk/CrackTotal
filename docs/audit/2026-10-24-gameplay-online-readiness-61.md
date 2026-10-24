# Crack Total 6.1 — Incidencias jugables y compatibilidad online

**Corte:** 24-10-2026. **Estado:** desarrollo, no publicación. Los despliegues y rutas aquí descriptos fueron leídos directamente de los servicios Render conectados. La corrección en ramas no implica que el usuario de producción la esté viendo.

## Pasala Che individual: regresiones reproducidas por lectura de código

| Severidad | Síntoma | Causa técnica | Implementación en rama |
| --- | --- | --- | --- |
| Alta | Verde/rojo/amarillo invisibles | `body.game-body .letter` sobrescribía por especificidad `.letter.correct/.incorrect/.pending` | Estados escopados `body.game-body.ct-ds #lettersContainer .letter.*`, activos separados |
| Alta | Pasapalabra se borraba en vueltas posteriores | `nextLetter()` convertía `pending` a `unanswered` | Estados pendientes persistentes hasta resolución |
| Media | Click no contabilizaba pase | `addEventListener('click', pasapalabra)` entregaba el Event truthy como `silent` | Wrapper explícito `() => pasapalabra(false)` |
| Alta | Normal terminaba al tercer error | `incorrectAnswers >= maxErrors` contrario al modal «máximo 3 errores» | Condición `> maxErrors` y victoria con `<=` |
| Media | Normal comenzaba con 240 s | Valor inicial `totalTime=240` frente a tarjeta Normal de 300 s | Predeterminado sincronizado a 300 |
| Media | Una letra siguiente podía quedar activa tras derrota | Actualización del rosco antes de `gameEnded=true` | Volver a pintar al finalizar |
| Media | No había HUD de tres resultados | Referencias a contadores sin elementos DOM | Aciertos, errores y por resolver visibles y accesibles |

**Validación:** la suite de contrato de contenido 6.1 cubre estructura. Chromium `--fixture pasala-live` pulsa controles reales y comprueba estilos computados; un primer ensayo del 24-10-2026 llegó a A pendiente y B correcta, pero **falló al marcar C incorrecta**. Ese fallo se investiga, no se descarta ni se transforma artificialmente en verde. El QA visual tradicional no sustituye este test de gameplay. Los seis juegos siguen sujetos a auditoría de estados finales.

## Online: despliegues de Render leídos

| Servicio | Tipo / rama | Commit live | Observación |
| --- | --- | --- | --- |
| `CrackTotal` (`srv-d06n6p2li9vc73ei37m0`) | Sitio estático / `main` | `8c77d74875f06602e186af7e6896b0d149d1f3df` | Versión web 6.0, sin endpoint WebSocket del mismo dominio |
| `cracktotal-arena-staging` (`srv-dbb6hj2gjjms73d73fd0`) | Node / `redesign/crack-total-2` | `2b3406580cebcfe4f27851363829a741f03fd6fd` | Backend de pruebas 6.0, origen restringido a preview autorizada |
| `cracktotal-servidor` (`srv-d08ch1s9c44c73bqfg60`) | Node / `main` | `15aa29b989d4f0e002da04092c87401a91fb2c07` | Backend público anterior, del 03-06-2025 |

### Riesgos de compatibilidad comprobados en código

1. `assets/js/pasala-duel-client.js` deriva sin override el WebSocket de `location.host`. Pero la web pública es **estática**, por lo que `wss://cracktotal.com` no constituye una ruta verificada a su motor 1v1. La arena 5.2 que entiende eventos `pasala:` no debe confundirse con el backend antiguo.
2. `assets/js/quiensabemas_1v1.js` y `assets/js/mentiroso.js` eligen en el dominio público `wss://cracktotal-servidor.onrender.com`, cuyo deploy live corresponde al código histórico, no a las mejoras recientes de 6.1.
3. El servidor de staging solo admite orígenes autorizados y requiere handshake y versiones compatibles. Apuntar producción al staging sin preparación puede fallar y mezclar telemetría de pruebas con partidas reales.
4. Los tests `scripts/pasala_duel_ws_integration.js` y `scripts/legacy_online_ws_integration.js` crean un servidor **local aislado**, usan dos clientes WebSocket y son relevantes, pero no certifican que el dominio público y Render tengan el mismo código.
5. QSM frontend/backend mantienen bancos distintos mientras ambos Pull Requests estén sin fusionar. La conciliación no debe cambiar respuestas de partidas activas.

### Requisitos previos a migrar el modo online

- Crear un backend de staging con **los dos códigos candidatos** en commits explícitos y origen del frontend de preview autorizado.
- Probar las conexiones externas y dos clientes reales con Pasala 1v1, QSM y Mentiroso: sala, turnos, validación autoritativa, reconexión, expiración, revancha y abandono.
- Probar latencia, paquetes duplicados y versiones incompatibles.
- Implementar servicio público compatible y cambiar rutas **solo después** de pasar todo lo anterior. Una URL de servidor no es evidencia de disponibilidad real.
- Mantener `main` y los tres servicios de producción sin modificaciones durante esta auditoría.

## Otros juegos

Las pruebas existentes cubren estructura responsive de las seis entradas, las seis etapas activas sintéticas, interacción real de teclado/persistencia de Wordle, validación larga de QSM y lista de 25 respuestas de Mentiroso. También hay integración real local de WebSocket. **Aún falta E2E externo sobre la versión 6.1 desplegada, auditoría factual exhaustiva y QA humano/automatizado de todas las transiciones de fin de partida.**

Este informe no afirma haber verificado todos los detalles del juego ni que la corrección ya esté en producción.

## Segunda pasada de Chromium — regresión real corregida

Tras incorporar `--fixture pasala-live` al QA de Chrome, el primer ensayo encontró que la C figuraba como activa mientras `currentQuestionData` seguía siendo B. Causa: un `setTimeout(150)` que demoraba `loadQuestion()` tras la respuesta correcta. Se actualiza ahora en forma atómica tras resolver la anterior (`c079afd0`).

El siguiente ensayo pasó las respuestas incorrectas y avanzó por el rosco completo, pero al volver a una letra pendiente el fondo conservaba un instante el color neutro. Se corrigió la transición `background 0.3s` y la prioridad de `.letter.active.pending`, dejando transiciones únicamente de movimiento y sombra (`e61cf204`).

**Pruebas confirmadas en ejecución de GitHub Actions `40093535299`, HEAD `e61cf204`:**
- `npm test`: aprobado, incluidos tests reales WebSocket en loopback, controles de banco masculino y protección de Wordle.
- `pasala-live` en Chromium 360 px: aprobado; respuesta B correcta, C incorrecta, A pasada y conservada, vuelta completa de letras, contadores `[1,1,24]`, derrota en el cuarto error en modo Normal y eliminación del resaltado activo al finalizar.
- `top10-live` en Chromium 360 px: aprobado; error, acierto, duplicado, resultado, persistencia y bloqueo final, con tema `ct-top10-bl-2022-23-final`.
- Los tests `pasala-live` y `top10-live` **no son fixtures visuales sintéticos**: accionan botones y verifican datos del juego en el DOM. Están limitados a navegador local aislado; no comprueban los despliegues externos.

El QA visual completo con diez anchos y cinco medidas del rosco continúa en GitHub Actions independientemente. Mantener `main` y Render de producción sin cambios.
