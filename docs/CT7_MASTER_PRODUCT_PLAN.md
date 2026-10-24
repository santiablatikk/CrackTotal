# CRACK TOTAL — HOJA DE RUTA DE PRODUCTO 7.0
**Corte editorial: 24/10/2026 · Propietario técnico: desarrollo Crack Total · Estado: por fases**

## Visión / diferencia competitiva

Crack Total no es una lista de preguntas generadas en masa. Es una **arena editorial de fútbol masculino** donde las reglas son claras, las respuestas tienen respaldo documental, los partidos se juegan realmente y los resultados pertenecen a personas identificables.

**Tono:** argentino natural, sin clichés tecnológicos, sin tonos grandilocuentes, sin frases clonadas entre secciones. **Estética:** dirección gráfica deportiva/editorial, no apariencia de plantilla de IA.

## Regla de realidad

**Jamás** llamar «en vivo» a un archivo JSON, «verificado» a un resultado enviado por un cliente, «online» a una simple conexión WebSocket o «actualizado» a código que no se desplegó.

### Regla de datos

- Solo fútbol masculino hasta nueva decisión editorial. Mi Carrera permanece fuera.
- No se paga por APIs; fuentes oficiales consultadas de forma permitida y trazable.
- Todo registro nuevo tiene ID, fuente, fecha de consulta y alcance de la afirmación; lo volátil lleva fecha de corte.
- Ninguna edición altera desafíos diarios o partidas congeladas de días anteriores.
- No se mezclan puntos locales con clasificaciones competitivas públicas.

## Arquitectura y secuencia de lanzamientos

### GATE 0 — Consolidar versiones (prioridad bloqueante)
- [ ] Integrar cuidadosamente 6.1 (PR frontend #2), 6.2 (PR frontend #4) y corrección Pasala Che de producción \`fab15689\`.
- [ ] Preservar círculos verdes/rojos/amarillos en Pasala, sus transiciones y lógica.
- [ ] Revisar todas las rutas HTML y activos históricos; no restaurar Mi Carrera.
- [ ] Pasar CI completo, Chromium y partidas reales contra staging.
- [ ] Mantener producción en el SHA aprobado hasta pasar la release checklist.

### GATE 1 — Competición y base segura (ideas 1–7, 21–26)
- [x] Contrato de lectura verificada Firestore y suscripción con \`onSnapshot\` en **rama 6.2**; NO en producción.
- [x] Prueba externa de Pasala 1v1 con dos clientes WS y espectador contra Render staging commit \`43935c75\`.
- [ ] Probar QSM y Mentiroso completos con dos clientes remotos y reconexiones, validando servidores exactos.
- [ ] Servicio autoritativo que registre cada partido una sola vez (matchId idempotente).
- [ ] Firestore Admin SDK exclusivamente en backend; secretos en entorno privado Render.
- [ ] Transacciones para acumular resultados verificados; inmutabilidad de resultados publicados.
- [ ] Actualización cross-client en tiempo real de rankings global, semanal, mensual y por juego.
- [ ] Clasificación con desempates deterministas y período UTC documentado.
- [ ] Auditoría de reglas de seguridad y resistencia a puntuaciones alteradas.
- [ ] Identidad persistente y recuperación de perfil; evitar falsa sensación de autenticación a través de alias local.
- [ ] Perfil público, privacidad configurable y historial de resultados verificados.
- [ ] Ligas Bronce→Leyenda con ELO/MMR diseñado para juegos competitivos comparables.
- [ ] Temporadas con archivos históricos inmutables.
- [ ] Misiones diarias, logros y medallas respaldados por resultados validados.
- [ ] Invitaciones por código/enlace; manejo de reconexiones, lobby, seguridad y revancha.
**Release gate:** juego completo desde dos redes, clasificación cruzada actualizada, ataques básicos bloqueados, rollback de datos documentado.

### GATE 2 — Biblioteca futbolera (ideas 8–14)
- [ ] Revisar TODO el corpus heredado, no solo errores estructurales.
- [ ] Crear registro de fuentes (FIFA/UEFA/CONMEBOL/AFA/ligas) y de aseveraciones históricas.
- [ ] Verificar hechos antes de producción; pendientes no participan de juegos competitivos.
- [ ] Ampliación de miles de preguntas por tandas auditadas; distribuir Mundiales, Sudamérica, Europa, ligas, jugadores, técnicos, épocas y niveles.
- [ ] Rotación anti-repetición por modo, usuario y sesión sin alterar desafíos diarios.
- [ ] Dificultad adaptativa en **modo no competitivo**; modo clasificado sin ventajas por historial.
- [ ] Mentiroso: universo ≥20 respuestas por desafío, sin falsa similitud como validación.
- [ ] Top 10: orden y desempates oficiales, histórico congelado y distribución por temporadas.
- [ ] Revisión automatizada frecuente de fuentes permitidas; propuestas siempre pendientes de aprobación factual.
**Release gate:** inventario exacto, fuentes consultadas, porcentajes verificados, muestras revisadas manualmente y auditoría de duplicados.

### GATE 3 — Nuevos juegos de autor (ideas 15–20)
- [x] ¿Quién soy? — seis rondas, cuatro pistas, hasta tres intentos, avance y puntuación por pistas usadas. Rama CT7.
- [x] Adiviná la carrera — cronología por clubes, revelado progresivo, alias controlados. Rama CT7.
- [x] Fuente oficial y fecha por trayectoria; primer lote de 12 dossiers con trazabilidad. Pendiente expansión.
- [x] Progreso local claramente etiquetado, sin integración fraudulenta en rankings.
- [ ] Duelo Relámpago — dos clientes, reloj servidor, tie-break definido, sin preguntas desiguales.
- [ ] Conexiones futboleras — cuatro grupos de cuatro con **una solución editorialmente inequívoca**.
- [x] Ordená la historia — cinco secuencias de cuatro hechos, años inequívocos, control por flechas táctil/teclado, 20 acontecimientos sourced FIFA/UEFA, XP local. Rama CT7; falta release QA.
- [ ] Armá el 11 — planteles históricos verificables por competición/partido/formación; no mezclar convocados con titulares.
**Release gate:** cada juego tiene fuente, tutorial, errores, éxito, resultado, reinicio, móvil, teclado y lector de pantalla; sin repetir mecánicas huecas.

### GATE 4 — Producto y estética (ideas 27–30)
- [x] Identidad editorial CT7 para los dos nuevos juegos: marcador, numeración, acento cobre, tipografía proporcionada, tarjetas asimétricas.
- [ ] Revisión visual y funcional de las seis experiencias anteriores sin destruir sus personalidades.
- [ ] Rehacer resultados y revanchas con estadísticas reales, sin gifs de celebración genéricos.
- [ ] Motion design discreto y desactivable con \`prefers-reduced-motion\`.
- [ ] Centro de progreso único con fuente diferenciada: **local** frente a **competitiva verificada**.
- [ ] PWA: manifest, iconos, caché por versión y funcionamiento offline solo para experiencias que realmente lo soportan.
- [ ] Protección de partidas activas frente a cachés antiguos; aviso de actualización disponible, sin reload destructivo.
- [ ] Pruebas de rendimiento en móvil medio, contrastes, scroll, 44px touch targets.
**Release gate:** Chromium en 320, 360, 390, 430, 768, 1024, 1366 y 1920; flujos reales, no solamente entrada.

## Dirección de arte innegociable

1. La primera pantalla de cada modo debe comunicar una regla jugable en menos de cinco segundos.
2. Máximo un tipo de acento brillante dominante por pantalla. Evitar degradados de fondo gratuitos, neumorfismo, iconos de robot, chat o «IA».
3. Usar Manrope para lectura; tamaños/espaciado intencionales, números deportivos y detalles editoriales, sin títulos ultracondensados en todas las zonas.
4. No repetir un hero idéntico en todos los juegos; distinguir el significado de la mecánica.
5. Fotografías reales, con licencias y créditos pertinentes; nunca poner una cara sintética de un futbolista.
6. Errores amables pero precisos: «El servidor no confirmó compatibilidad», no «¡Ups! Algo mágico ocurrió».
7. Tratar táctil, teclado, focus, lectores de pantalla y movimiento reducido como requisitos y no como decoración.
8. Reutilizar design tokens y piezas comunes; rechazar librerías de UI que impongan una estética estándar.

## Operación, observabilidad y lanzamiento

- CI por PR: smoke factual estructural, reglas de seguridad, tests dos clientes local y remoto, browser responsive, accesibilidad y consola.
- Staging debe ejecutar exactamente el SHA candidato. El estado \`live\` por sí solo no acredita funcionalidad.
- Desplegar backend compatible antes de frontend público; activar capacidades por feature flags.
- Medir latencia entre resultado competitivo autoritativo y cambio en segunda sesión Firestore.
- Monitorear reconexiones fallidas, errores de validación de datos, render quebrado, duplicados y degradación de contenido.
- Si falla un servicio: estado vacío real + recuperación; nunca tablas simuladas ni puntuación inventada.

## Estado a 24/10/2026

**En rama de implementación:** \`feature/crack-total-7-0-editorial-games\`, apilada sobre 6.2. Los juegos 7.0 NO están publicados en \`main\`.

**Aún bloqueado:** Firebase publisher seguro, integración completa con 6.1, pruebas visuales de las ocho experiencias, dos clientes reales de QSM/Mentiroso en staging y despliegue compatible de producción.

**Criterio de gestión:** no llamar «todo hecho» a un catálogo de 30 iniciativas hasta que sus gates se aprueben por separado.
