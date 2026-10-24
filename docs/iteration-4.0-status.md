# Crack Total 4.0 — rediseño focalizado de inicio

Fecha: 19/10/2026. Rama: `redesign/crack-total-2`. PR #1. No fusionar con main.

## Cambios realizados

- Reconstruida `index.html` sobre la arquitectura existente, sin tocar motores de juegos. La página pasó de **8 a 5 secciones** principales.
- Hero nuevo: título directo, dos acciones reales, fotografía existente optimizada por posición/recorte y señalización del catálogo.
- Los módulos de Top 10 y Wordle diario comparten una sección compacta. **Se preservaron los IDs** que usa el script de progreso real y la fecha UTC.
- Arena Pasala Che 1v1 destacada como sección única con dos modalidades, sin fingir partidas ni usuarios activos.
- Descubrimiento de los cinco juegos convertido en cinco fichas diferentes, con representación CSS propia y enlaces a los motores reales; búsqueda y filtros completos permanecen en `games.html`.
- Se eliminaron de la portada los bloques redundantes de entrenamiento (duplicaba Pasala Che y Top 10), promoción triple de duelos (solapada con Arena y catálogo), bloque de artículos y CTA final repetitivo. El blog y los artículos **no se borraron**; siguen disponibles desde el footer y sus URLs.
- Navegación superior simplificada: Inicio, Juegos, Arena, Rankings, Perfil y Buscar. Logros y contenido secundario quedan en pie de página.
- Footer reorganizado: enlaces a funciones, blog y legales preservados, sin duplicar promoción de juegos.
- CSS nuevo solo para inicio: `assets/css/home-4.css`, con estilos responsive, enfoque visible, animaciones mínimas y reducción de movimiento.
- `scripts/home_4_smoke.js` comprueba las cinco entradas, enlaces, IDs compartidos, secciones y responsive; integrado en `npm test`.
- Suite histórica `ct35_experience_smoke.js` actualizada para comprobar los estilos diarios de 4.0 sin perder sus validaciones de guardados.

## Estado de QA y limitaciones

- **Revisión estática del código:** completada; rutas de los cinco juegos conservadas. Antes: 37.397 caracteres HTML, después: 17.338. Reducción de marcado de 20.059 caracteres; **no equivale a reducción medida de bytes descargados**.
- **Prueba automatizada añadida:** commit en rama; ejecución final en Netlify/GitHub **confirmada con el estado SUCCESS de Netlify** en el commit b3bf941 (tras corregir un test de clase CSS). No se leyeron logs individuales de todas las pruebas; no atribuir PASS individuales sin ellos.
- **Navegador:** no se pudo abrir el sitio preview mediante el acceso web de este entorno (error cache miss); el check de deploy sí confirmó SUCCESS, pero no se inspeccionaron visualmente todas las resoluciones ni se midió Lighthouse.
- **Limpieza de archivos:** no se borró ningún archivo por precaución. Las secciones redundantes se retiraron de `index.html`; los recursos compartidos, scripts antiguos de compatibilidad, legal y ads permanecen.
- **WebSocket/Render:** no modificados. Las reglas 3.9 de Pasala Che y el resto de los juegos permanecen intactos.
- **Dependencias:** no alteradas. Continúa pendiente la auditoría de avisos de seguridad existentes.

## Siguiente verificación exigida

1. Confirmar `npm test` y `npm run build` en el último commit.
2. Abrir preview y revisar portada en 360, 390, 430, 768, 1366 y 1920 px.
3. Comprobar imágenes, CSS, menú, enlaces, estados diarios, accesibilidad, navegación de teclado.
4. Inspeccionar consola y comparar métricas reales de rendimiento.
5. Revisar posibles archivos huérfanos mediante un barrido completo de referencias dinámicas antes de eliminar.

## Límites

No se tocó producción, ni se fusionó con main, ni se modificaron `reports/`, guardados o backend de multijugador. Mi Carrera permanece oculto.
