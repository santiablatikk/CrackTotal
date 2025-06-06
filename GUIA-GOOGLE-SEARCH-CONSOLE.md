# Guía de Optimización para Google Search Console - CrackTotal

Esta guía proporciona instrucciones paso a paso para optimizar la indexación de CrackTotal en Google Search Console y resolver problemas comunes.

## Índice
1. [Verificación inicial](#verificación-inicial)
2. [Problemas comunes de indexación](#problemas-comunes-de-indexación)
3. [Optimización de páginas](#optimización-de-páginas)
4. [Configuración avanzada](#configuración-avanzada)
5. [Monitoreo y mantenimiento](#monitoreo-y-mantenimiento)

## Verificación inicial

### Verificar la propiedad en Google Search Console
1. Accede a [Google Search Console](https://search.google.com/search-console)
2. Elige el método de verificación HTML
3. Copia el código de verificación proporcionado
4. Pega el código en el archivo `google-site-verification.html` (reemplaza `CÓDIGO_DE_VERIFICACIÓN_DE_GOOGLE`)
5. Sube el archivo al servidor
6. Haz clic en "Verificar" en Google Search Console

### Configurar el dominio correcto
- Verifica que estés utilizando la propiedad `sc-domain:cracktotal.com`
- Si solo tienes verificación de URL, añade también la propiedad de dominio

## Problemas comunes de indexación

### URLs no indexadas
Si Google no indexa algunas URLs:

1. Verifica que no estén bloqueadas en `robots.txt`
2. Asegúrate de que tengan etiqueta canónica correcta
3. Usa la herramienta "Inspeccionar URL" en Search Console
4. Solicita indexación manual para páginas importantes

### Contenido duplicado
Para evitar problemas de contenido duplicado:

1. Usa URLs canónicas consistentes (con o sin www, con o sin barra final)
2. Implementa redirecciones 301 para URLs alternativas
3. Usa etiquetas canónicas en todas las páginas
4. Evita parámetros de URL innecesarios

### Errores de rastreo
Si hay errores de rastreo:

1. Corrige las URLs que devuelven códigos 404 o 500
2. Verifica que el servidor responda rápidamente (menos de 2 segundos)
3. Asegúrate de que robots.txt no bloquee recursos importantes
4. Arregla redirecciones excesivas o ciclos de redirección

## Optimización de páginas

### Metadatos
Todas las páginas deben tener:

1. Etiqueta `<title>` única y descriptiva (50-60 caracteres)
2. Meta descripción informativa (120-158 caracteres)
3. Etiquetas Open Graph para compartir en redes sociales
4. Encabezados jerárquicos (H1, H2, H3...)

### Datos estructurados
Añade datos estructurados JSON-LD para:

1. Páginas principales como WebSite
2. Juegos como VideoGame
3. Artículos del blog como Article
4. Verificar los datos estructurados con la [Herramienta de pruebas](https://search.google.com/test/rich-results)

### Sitemap optimizado
Mantén tu sitemap.xml:

1. Actualizado con fechas recientes
2. Incluyendo solo URLs canónicas
3. Con información de imágenes
4. Enviándolo regularmente a Google Search Console

## Configuración avanzada

### Usar la API de Indexación de Google
Para páginas importantes o que cambian frecuentemente:

1. Configura autenticación OAuth2 para la API
2. Usa el script `assets/js/google-indexing-api.js` para notificar nuevas URLs
3. Prioriza páginas de juegos y contenido principal

### Optimizar rendimiento
El rendimiento afecta la indexación:

1. Comprime archivos JS y CSS grandes
2. Habilita caché del navegador
3. Optimiza imágenes
4. Implementa carga diferida (lazy loading)
5. Mejora la velocidad del servidor

## Monitoreo y mantenimiento

### Ejecutar diagnóstico regular
Utiliza el script de diagnóstico para monitorear la salud del sitio:

```bash
node search-console-diagnostico.js
```

### Revisar informes de Search Console
Revisa regularmente:

1. Rendimiento de búsqueda
2. Cobertura de índice
3. Experiencia de página
4. Mejoras de Core Web Vitals

### Actualizar contenido regularmente
Google prefiere sitios actualizados:

1. Publica nuevo contenido con regularidad
2. Actualiza páginas existentes
3. Revisa y corrige enlaces rotos
4. Elimina contenido obsoleto o redirige a páginas relevantes

---

## Recursos adicionales

- [Documentación oficial de Google Search Console](https://support.google.com/webmasters)
- [Guía de inicio de Search para sitios web](https://developers.google.com/search/docs/beginner/get-started)
- [Informe de rendimiento en Search Console](https://support.google.com/webmasters/answer/7042828)
- [Guía de datos estructurados](https://developers.google.com/search/docs/advanced/structured-data/intro-structured-data)

---

**Nota**: Reemplaza siempre el código de verificación de Google por el proporcionado en tu cuenta de Search Console y ajusta las fechas en el sitemap.xml regularmente. 