/**
 * Script de diagnóstico de problemas de indexación para CrackTotal
 * Este script analiza problemas comunes de indexación y genera un informe.
 * 
 * Uso: node search-console-diagnostico.js
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);
const readdirAsync = promisify(fs.readdir);

// Configuración
const DOMAIN = 'cracktotal.com';
const ROOT_DIR = './'; // Directorio raíz del proyecto
const HTML_EXT = '.html';
const SITEMAP_PATH = './sitemap.xml';
const ROBOTS_PATH = './robots.txt';

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// Función principal de diagnóstico
async function diagnosticarIndexacion() {
    console.log(`${colors.magenta}=== DIAGNÓSTICO DE INDEXACIÓN PARA ${DOMAIN} ===${colors.reset}\n`);
    
    try {
        // 1. Verificar sitemap.xml
        await verificarSitemap();
        
        // 2. Verificar robots.txt
        await verificarRobots();
        
        // 3. Verificar etiquetas canónicas
        await verificarCanonicas();
        
        // 4. Verificar metadatos
        await verificarMetadatos();
        
        // 5. Verificar estructura de datos
        await verificarEstructuraDatos();
        
        // 6. Verificar rendimiento
        await verificarRendimiento();
        
        // 7. Resumen y recomendaciones
        generarResumen();
        
    } catch (error) {
        console.error(`${colors.red}ERROR CRÍTICO: ${error.message}${colors.reset}`);
    }
}

// Función para verificar el sitemap
async function verificarSitemap() {
    console.log(`${colors.cyan}[1/6] Verificando sitemap.xml...${colors.reset}`);
    
    try {
        const sitemap = await readFileAsync(SITEMAP_PATH, 'utf8');
        
        // Verificar si el sitemap tiene formato XML válido
        if (!sitemap.includes('<?xml')) {
            console.log(`${colors.red}✗ El sitemap no tiene un formato XML válido${colors.reset}`);
        } else {
            console.log(`${colors.green}✓ El sitemap tiene formato XML válido${colors.reset}`);
        }
        
        // Verificar URLs en el sitemap
        const urlMatches = sitemap.match(/<loc>(.*?)<\/loc>/g) || [];
        console.log(`${colors.green}✓ Se encontraron ${urlMatches.length} URLs en el sitemap${colors.reset}`);
        
        // Verificar lastmod
        const lastmodMatches = sitemap.match(/<lastmod>(.*?)<\/lastmod>/g) || [];
        if (lastmodMatches.length === 0) {
            console.log(`${colors.yellow}⚠ No se encontraron etiquetas <lastmod> en el sitemap${colors.reset}`);
        } else {
            console.log(`${colors.green}✓ El sitemap incluye ${lastmodMatches.length} etiquetas de fecha${colors.reset}`);
            
            // Verificar fechas actualizadas
            const fechasActuales = lastmodMatches.filter(tag => {
                const fecha = tag.replace('<lastmod>', '').replace('</lastmod>', '');
                const hoy = new Date();
                const fechaTag = new Date(fecha);
                const unMesAtras = new Date();
                unMesAtras.setMonth(hoy.getMonth() - 1);
                
                return fechaTag > unMesAtras;
            });
            
            if (fechasActuales.length < lastmodMatches.length * 0.5) {
                console.log(`${colors.yellow}⚠ Más del 50% de las fechas en el sitemap son antiguas${colors.reset}`);
            }
        }
        
        // Verificar si el sitemap incluye imágenes
        if (sitemap.includes('image:image')) {
            console.log(`${colors.green}✓ El sitemap incluye información de imágenes${colors.reset}`);
        } else {
            console.log(`${colors.yellow}⚠ El sitemap no incluye información de imágenes${colors.reset}`);
        }
        
    } catch (error) {
        console.log(`${colors.red}✗ Error al analizar el sitemap: ${error.message}${colors.reset}`);
    }
    
    console.log('');
}

// Función para verificar robots.txt
async function verificarRobots() {
    console.log(`${colors.cyan}[2/6] Verificando robots.txt...${colors.reset}`);
    
    try {
        const robots = await readFileAsync(ROBOTS_PATH, 'utf8');
        
        // Verificar si permite a Googlebot
        if (robots.includes('User-agent: Googlebot') && !robots.includes('Disallow: /')) {
            console.log(`${colors.green}✓ El archivo robots.txt permite a Googlebot${colors.reset}`);
        } else if (!robots.includes('User-agent: *') || robots.includes('Disallow: /')) {
            console.log(`${colors.red}✗ El archivo robots.txt puede estar bloqueando la indexación${colors.reset}`);
        }
        
        // Verificar referencia al sitemap
        if (robots.includes('Sitemap:')) {
            console.log(`${colors.green}✓ El archivo robots.txt incluye referencia al sitemap${colors.reset}`);
        } else {
            console.log(`${colors.yellow}⚠ El archivo robots.txt no incluye referencia al sitemap${colors.reset}`);
        }
        
        // Verificar si bloquea recursos importantes
        const bloqueoRecursos = robots.includes('Disallow: /css') || 
                                robots.includes('Disallow: /js') || 
                                robots.includes('Disallow: /images');
        
        if (bloqueoRecursos) {
            console.log(`${colors.red}✗ El archivo robots.txt está bloqueando recursos importantes${colors.reset}`);
        } else {
            console.log(`${colors.green}✓ El archivo robots.txt no bloquea recursos importantes${colors.reset}`);
        }
        
    } catch (error) {
        console.log(`${colors.red}✗ Error al analizar robots.txt: ${error.message}${colors.reset}`);
    }
    
    console.log('');
}

// Función para verificar etiquetas canónicas
async function verificarCanonicas() {
    console.log(`${colors.cyan}[3/6] Verificando etiquetas canónicas...${colors.reset}`);
    
    try {
        // Obtener todos los archivos HTML
        const files = await buscarArchivosHTML(ROOT_DIR);
        console.log(`${colors.blue}ℹ Analizando ${files.length} archivos HTML${colors.reset}`);
        
        let archivosConCanonica = 0;
        let archivosConCanonicaIncorrecta = 0;
        
        for (const file of files) {
            const contenido = await readFileAsync(file, 'utf8');
            
            // Buscar etiqueta canónica
            const canonicalMatch = contenido.match(/<link[^>]*rel="canonical"[^>]*>/i);
            
            if (canonicalMatch) {
                archivosConCanonica++;
                
                // Verificar si la URL canónica contiene el dominio correcto
                const urlMatch = canonicalMatch[0].match(/href="([^"]*)"/i);
                if (urlMatch && urlMatch[1]) {
                    const url = urlMatch[1];
                    if (!url.includes(DOMAIN)) {
                        archivosConCanonicaIncorrecta++;
                        console.log(`${colors.yellow}⚠ URL canónica incorrecta en ${path.basename(file)}: ${url}${colors.reset}`);
                    }
                }
            } else {
                console.log(`${colors.yellow}⚠ Falta etiqueta canónica en ${path.basename(file)}${colors.reset}`);
            }
        }
        
        console.log(`${colors.green}✓ ${archivosConCanonica} de ${files.length} archivos tienen etiqueta canónica${colors.reset}`);
        if (archivosConCanonicaIncorrecta > 0) {
            console.log(`${colors.yellow}⚠ ${archivosConCanonicaIncorrecta} archivos tienen URL canónica incorrecta${colors.reset}`);
        }
        
    } catch (error) {
        console.log(`${colors.red}✗ Error al verificar etiquetas canónicas: ${error.message}${colors.reset}`);
    }
    
    console.log('');
}

// Función para verificar metadatos
async function verificarMetadatos() {
    console.log(`${colors.cyan}[4/6] Verificando metadatos...${colors.reset}`);
    
    try {
        // Obtener todos los archivos HTML
        const files = await buscarArchivosHTML(ROOT_DIR);
        
        let archivosSinTitulo = 0;
        let archivosSinDescripcion = 0;
        let archivosSinOpenGraph = 0;
        
        for (const file of files) {
            const contenido = await readFileAsync(file, 'utf8');
            const fileName = path.basename(file);
            
            // Verificar título
            const tituloMatch = contenido.match(/<title>(.*?)<\/title>/i);
            if (!tituloMatch || tituloMatch[1].trim() === '') {
                archivosSinTitulo++;
                console.log(`${colors.yellow}⚠ Falta título en ${fileName}${colors.reset}`);
            }
            
            // Verificar meta descripción
            const descriptionMatch = contenido.match(/<meta[^>]*name="description"[^>]*>/i);
            if (!descriptionMatch) {
                archivosSinDescripcion++;
                console.log(`${colors.yellow}⚠ Falta meta descripción en ${fileName}${colors.reset}`);
            }
            
            // Verificar Open Graph
            const ogMatch = contenido.match(/<meta[^>]*property="og:(?:title|description|image)"[^>]*>/i);
            if (!ogMatch) {
                archivosSinOpenGraph++;
                console.log(`${colors.yellow}⚠ Faltan etiquetas Open Graph en ${fileName}${colors.reset}`);
            }
        }
        
        console.log(`${colors.green}✓ ${files.length - archivosSinTitulo} de ${files.length} archivos tienen título${colors.reset}`);
        console.log(`${colors.green}✓ ${files.length - archivosSinDescripcion} de ${files.length} archivos tienen meta descripción${colors.reset}`);
        console.log(`${colors.green}✓ ${files.length - archivosSinOpenGraph} de ${files.length} archivos tienen etiquetas Open Graph${colors.reset}`);
        
    } catch (error) {
        console.log(`${colors.red}✗ Error al verificar metadatos: ${error.message}${colors.reset}`);
    }
    
    console.log('');
}

// Función para verificar estructura de datos
async function verificarEstructuraDatos() {
    console.log(`${colors.cyan}[5/6] Verificando estructura de datos...${colors.reset}`);
    
    try {
        // Obtener todos los archivos HTML
        const files = await buscarArchivosHTML(ROOT_DIR);
        
        let archivosConLD = 0;
        
        for (const file of files) {
            const contenido = await readFileAsync(file, 'utf8');
            
            // Buscar JSON-LD
            const ldMatch = contenido.match(/<script[^>]*type="application\/ld\+json"[^>]*>/g);
            
            if (ldMatch) {
                archivosConLD++;
            }
        }
        
        console.log(`${colors.green}✓ ${archivosConLD} de ${files.length} archivos tienen datos estructurados JSON-LD${colors.reset}`);
        
        if (archivosConLD < files.length * 0.5) {
            console.log(`${colors.yellow}⚠ Menos del 50% de las páginas tienen datos estructurados${colors.reset}`);
        }
        
    } catch (error) {
        console.log(`${colors.red}✗ Error al verificar estructura de datos: ${error.message}${colors.reset}`);
    }
    
    console.log('');
}

// Función para verificar rendimiento
async function verificarRendimiento() {
    console.log(`${colors.cyan}[6/6] Verificando problemas de rendimiento...${colors.reset}`);
    
    try {
        // Buscar archivos JS y CSS grandes
        const jsFiles = await buscarArchivosPorExtension(ROOT_DIR, '.js');
        const cssFiles = await buscarArchivosPorExtension(ROOT_DIR, '.css');
        
        const filesConTamanio = await Promise.all([
            ...jsFiles.map(async file => {
                const stats = await fs.promises.stat(file);
                return { file, size: stats.size, type: 'js' };
            }),
            ...cssFiles.map(async file => {
                const stats = await fs.promises.stat(file);
                return { file, size: stats.size, type: 'css' };
            })
        ]);
        
        // Ordenar por tamaño
        filesConTamanio.sort((a, b) => b.size - a.size);
        
        // Mostrar los 5 archivos más grandes
        console.log(`${colors.blue}ℹ Los 5 archivos JS/CSS más grandes:${colors.reset}`);
        for (let i = 0; i < Math.min(5, filesConTamanio.length); i++) {
            const f = filesConTamanio[i];
            console.log(`${colors.yellow}  ${i+1}. ${path.basename(f.file)} (${(f.size / 1024).toFixed(2)} KB)${colors.reset}`);
        }
        
        // Verificar archivos extremadamente grandes
        const archivosGrandes = filesConTamanio.filter(f => f.size > 500 * 1024); // Más de 500KB
        if (archivosGrandes.length > 0) {
            console.log(`${colors.yellow}⚠ Se encontraron ${archivosGrandes.length} archivos mayores a 500KB${colors.reset}`);
        }
        
        // Verificar si hay compresión Gzip habilitada
        const htaccessPath = path.join(ROOT_DIR, '.htaccess');
        if (fs.existsSync(htaccessPath)) {
            const htaccess = await readFileAsync(htaccessPath, 'utf8');
            if (htaccess.includes('mod_deflate') || htaccess.includes('gzip')) {
                console.log(`${colors.green}✓ La compresión Gzip parece estar habilitada${colors.reset}`);
            } else {
                console.log(`${colors.yellow}⚠ No se detectó configuración de compresión Gzip${colors.reset}`);
            }
        }
        
    } catch (error) {
        console.log(`${colors.red}✗ Error al verificar rendimiento: ${error.message}${colors.reset}`);
    }
    
    console.log('');
}

// Función para generar resumen y recomendaciones
function generarResumen() {
    console.log(`${colors.magenta}=== RESUMEN Y RECOMENDACIONES ===${colors.reset}\n`);
    
    console.log(`${colors.cyan}Para mejorar la indexación en Google Search Console:${colors.reset}`);
    console.log(`${colors.white}1. Actualiza las fechas en tu sitemap.xml regularmente${colors.reset}`);
    console.log(`${colors.white}2. Asegúrate de que todas las páginas tengan etiqueta canónica correcta${colors.reset}`);
    console.log(`${colors.white}3. Incluye metadatos completos en todas las páginas (título, descripción, Open Graph)${colors.reset}`);
    console.log(`${colors.white}4. Añade datos estructurados JSON-LD a todas las páginas importantes${colors.reset}`);
    console.log(`${colors.white}5. Optimiza el rendimiento del sitio comprimiendo archivos grandes${colors.reset}`);
    console.log(`${colors.white}6. Usa la API de Indexación de Google para las páginas más importantes${colors.reset}`);
    console.log(`${colors.white}7. Verifica regularmente en Google Search Console los errores de rastreo${colors.reset}`);
    
    console.log(`\n${colors.cyan}Pasos siguientes:${colors.reset}`);
    console.log(`${colors.white}1. Ejecuta este script regularmente para monitorear mejoras${colors.reset}`);
    console.log(`${colors.white}2. Implementa las soluciones sugeridas para cada problema encontrado${colors.reset}`);
    console.log(`${colors.white}3. Solicita la indexación de URLs importantes directamente en Google Search Console${colors.reset}`);
    
    console.log(`\n${colors.green}¡Buena suerte optimizando la indexación de tu sitio!${colors.reset}`);
}

// Función auxiliar para buscar archivos HTML
async function buscarArchivosHTML(directorio) {
    const files = [];
    
    async function buscarRecursivamente(dir) {
        const entries = await readdirAsync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                // Ignorar directorios comunes que no necesitamos
                if (!['node_modules', '.git', '.github'].includes(entry.name)) {
                    await buscarRecursivamente(fullPath);
                }
            } else if (entry.isFile() && entry.name.endsWith(HTML_EXT)) {
                files.push(fullPath);
            }
        }
    }
    
    await buscarRecursivamente(directorio);
    return files;
}

// Función auxiliar para buscar archivos por extensión
async function buscarArchivosPorExtension(directorio, extension) {
    const files = [];
    
    async function buscarRecursivamente(dir) {
        const entries = await readdirAsync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                // Ignorar directorios comunes que no necesitamos
                if (!['node_modules', '.git', '.github'].includes(entry.name)) {
                    await buscarRecursivamente(fullPath);
                }
            } else if (entry.isFile() && entry.name.endsWith(extension)) {
                files.push(fullPath);
            }
        }
    }
    
    await buscarRecursivamente(directorio);
    return files;
}

// Ejecutar el diagnóstico
diagnosticarIndexacion().catch(console.error);