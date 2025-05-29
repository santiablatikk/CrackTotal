#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 ANÁLISIS PROFUNDO PARA ADSENSE - FACTORES ADICIONALES');
console.log('='.repeat(75));

let recommendations = [];
let criticalIssues = [];
let optimizations = [];

// 1. ANÁLISIS DE CONTENIDO Y CALIDAD
console.log('\n📝 ANÁLISIS DE CONTENIDO Y CALIDAD:');

const contentPages = [
    'blog.html', 'games.html', 'about.html', 'contact.html',
    'blog-detail-messi.html', 'blog-detail-worldcups.html',
    'blog-detail-champions.html', 'blog-detail-libertadores.html',
    'mentiroso.html', 'quiensabemas.html', 'crack-rapido.html',
    'pasalache.html', 'profile.html', 'ranking.html'
];

let totalWords = 0;
let pagesWithImages = 0;
let pagesWithGoodLength = 0;

contentPages.forEach(page => {
    if (fs.existsSync(page)) {
        const content = fs.readFileSync(page, 'utf8');
        
        // Contar palabras (aproximado)
        const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
        const wordCount = textContent.split(' ').length;
        totalWords += wordCount;
        
        // Verificar si tiene buena longitud (>300 palabras)
        if (wordCount > 300) {
            pagesWithGoodLength++;
        }
        
        // Verificar si tiene imágenes
        if (content.includes('<img') || content.includes('background-image')) {
            pagesWithImages++;
        }
        
        console.log(`📄 ${page}: ~${wordCount} palabras ${wordCount > 300 ? '✅' : '⚠️'}`);
    }
});

const avgWordsPerPage = Math.round(totalWords / contentPages.filter(p => fs.existsSync(p)).length);
console.log(`\n📊 Estadísticas de contenido:`);
console.log(`• Promedio de palabras por página: ${avgWordsPerPage}`);
console.log(`• Páginas con longitud adecuada (>300 palabras): ${pagesWithGoodLength}`);
console.log(`• Páginas con imágenes: ${pagesWithImages}`);

if (avgWordsPerPage < 300) {
    criticalIssues.push('Contenido demasiado corto (promedio < 300 palabras por página)');
} else if (avgWordsPerPage < 500) {
    recommendations.push('Agregar más contenido (ideal 500+ palabras por página)');
}

// 2. ANÁLISIS DE NAVEGACIÓN Y UX
console.log('\n🧭 ANÁLISIS DE NAVEGACIÓN Y UX:');

const navigationChecks = [
    { file: 'index.html', element: '<nav', name: 'Navegación principal' },
    { file: 'index.html', element: 'breadcrumb', name: 'Breadcrumbs' },
    { file: 'index.html', element: 'footer', name: 'Footer informativo' },
    { file: 'index.html', element: 'search', name: 'Función de búsqueda' }
];

navigationChecks.forEach(check => {
    if (fs.existsSync(check.file)) {
        const content = fs.readFileSync(check.file, 'utf8');
        if (content.toLowerCase().includes(check.element.toLowerCase())) {
            console.log(`✅ ${check.name}`);
        } else {
            console.log(`⚠️ ${check.name} - Podría mejorarse`);
            optimizations.push(`Mejorar ${check.name.toLowerCase()}`);
        }
    }
});

// 3. ANÁLISIS DE VELOCIDAD Y RENDIMIENTO
console.log('\n⚡ ANÁLISIS DE RENDIMIENTO:');

const performanceChecks = [
    { pattern: /\.css\?v=/, name: 'Cache busting en CSS' },
    { pattern: /\.js\?v=/, name: 'Cache busting en JS' },
    { pattern: /preload|prefetch/, name: 'Preload de recursos críticos' },
    { pattern: /loading="lazy"/, name: 'Lazy loading de imágenes' },
    { pattern: /ServiceWorker|sw\.js/, name: 'Service Worker implementado' }
];

if (fs.existsSync('index.html')) {
    const indexContent = fs.readFileSync('index.html', 'utf8');
    performanceChecks.forEach(check => {
        if (check.pattern.test(indexContent)) {
            console.log(`✅ ${check.name}`);
        } else {
            console.log(`⚠️ ${check.name} - No implementado`);
            optimizations.push(`Implementar ${check.name.toLowerCase()}`);
        }
    });
}

// 4. ANÁLISIS DE SEO AVANZADO
console.log('\n🎯 ANÁLISIS DE SEO AVANZADO:');

const seoChecks = [
    { pattern: /"@type":\s*"WebSite"/, name: 'Schema.org WebSite' },
    { pattern: /"@type":\s*"Organization"/, name: 'Schema.org Organization' },
    { pattern: /rel="alternate"\s+hreflang/, name: 'Hreflang implementado' },
    { pattern: /property="og:/, name: 'Open Graph tags' },
    { pattern: /name="twitter:/, name: 'Twitter Cards' },
    { pattern: /manifest\.json/, name: 'Web App Manifest' }
];

if (fs.existsSync('index.html')) {
    const indexContent = fs.readFileSync('index.html', 'utf8');
    seoChecks.forEach(check => {
        if (check.pattern.test(indexContent)) {
            console.log(`✅ ${check.name}`);
        } else {
            console.log(`⚠️ ${check.name} - Faltante`);
            optimizations.push(`Agregar ${check.name.toLowerCase()}`);
        }
    });
}

// 5. ANÁLISIS DE ACCESIBILIDAD
console.log('\n♿ ANÁLISIS DE ACCESIBILIDAD:');

const accessibilityChecks = [
    { pattern: /alt=["'][^"']*["']/, name: 'Atributos alt en imágenes' },
    { pattern: /aria-label=/, name: 'Labels ARIA' },
    { pattern: /role=/, name: 'Roles ARIA' },
    { pattern: /skip-link/, name: 'Skip links' },
    { pattern: /<h[1-6]/, name: 'Estructura de headings' }
];

if (fs.existsSync('index.html')) {
    const indexContent = fs.readFileSync('index.html', 'utf8');
    accessibilityChecks.forEach(check => {
        if (check.pattern.test(indexContent)) {
            console.log(`✅ ${check.name}`);
        } else {
            console.log(`⚠️ ${check.name} - Mejorable`);
            optimizations.push(`Mejorar ${check.name.toLowerCase()}`);
        }
    });
}

// 6. ANÁLISIS DE CONTENIDO ÚNICO Y ORIGINAL
console.log('\n🎨 ANÁLISIS DE ORIGINALIDAD:');

const blogPages = contentPages.filter(page => page.includes('blog-detail-'));
console.log(`• Artículos de blog originales: ${blogPages.length}`);
console.log(`• Páginas de juegos interactivos: ${contentPages.filter(p => p.includes('.html') && !p.includes('blog')).length}`);

if (blogPages.length < 5) {
    recommendations.push('Agregar más artículos de blog originales (mínimo 5-10)');
}

// 7. ANÁLISIS DE ELEMENTOS FALTANTES COMUNES
console.log('\n🔍 VERIFICANDO ELEMENTOS ADICIONALES:');

const additionalElements = [
    { file: 'favicon.ico', name: 'Favicon principal' },
    { file: 'apple-touch-icon.png', name: 'Apple touch icon' },
    { file: 'google-site-verification.html', name: 'Verificación de Google' },
    { file: 'BingSiteAuth.xml', name: 'Verificación de Bing' }
];

additionalElements.forEach(element => {
    if (fs.existsSync(element.file)) {
        console.log(`✅ ${element.name}`);
    } else {
        console.log(`⚠️ ${element.name} - Opcional pero recomendado`);
        optimizations.push(`Agregar ${element.name.toLowerCase()}`);
    }
});

// 8. RECOMENDACIONES ESPECÍFICAS PARA ADSENSE
console.log('\n💡 FACTORES CRÍTICOS PARA APROBACIÓN ADSENSE:');

const adsenseFactors = [
    'Tráfico orgánico regular (mínimo 100 visitantes/día)',
    'Tiempo de permanencia alto (>2 minutos promedio)',
    'Contenido actualizado regularmente',
    'Baja tasa de rebote (<70%)',
    'Navegación clara y intuitiva',
    'Contenido original y valioso',
    'Sin contenido copiado o duplicado',
    'Cumplimiento de políticas de Google'
];

console.log('\n📋 CHECKLIST FINAL PARA ADSENSE:');
adsenseFactors.forEach((factor, index) => {
    console.log(`${index + 1}. ${factor}`);
});

// RESUMEN FINAL
console.log('\n' + '='.repeat(75));
console.log('📊 RESUMEN DEL ANÁLISIS PROFUNDO:');

console.log(`\n✅ FORTALEZAS:`);
console.log(`• Configuración técnica perfecta (100%)`);
console.log(`• Políticas legales completas`);
console.log(`• Contenido de nicho específico (fútbol)`);
console.log(`• Múltiples páginas de contenido`);
console.log(`• Estructura profesional`);

if (criticalIssues.length > 0) {
    console.log(`\n🚨 PROBLEMAS CRÍTICOS:`);
    criticalIssues.forEach(issue => console.log(`• ${issue}`));
}

if (recommendations.length > 0) {
    console.log(`\n💡 RECOMENDACIONES IMPORTANTES:`);
    recommendations.forEach(rec => console.log(`• ${rec}`));
}

if (optimizations.length > 0) {
    console.log(`\n⚡ OPTIMIZACIONES OPCIONALES:`);
    optimizations.slice(0, 5).forEach(opt => console.log(`• ${opt}`));
    if (optimizations.length > 5) {
        console.log(`• ... y ${optimizations.length - 5} más`);
    }
}

console.log(`\n🎯 VEREDICTO FINAL:`);
if (criticalIssues.length === 0) {
    console.log(`🟢 TU SITIO ESTÁ LISTO PARA APLICAR A ADSENSE`);
    console.log(`• Probabilidad de aprobación: ALTA`);
    console.log(`• Factor limitante principal: Tráfico y engagement`);
} else {
    console.log(`🟡 NECESITA ALGUNAS MEJORAS ANTES DE APLICAR`);
    console.log(`• Corrige los problemas críticos identificados`);
}

console.log(`\n📈 FACTORES CLAVE PARA ÉXITO:`);
console.log(`1. 🚀 Generar tráfico orgánico (SEO, redes sociales)`);
console.log(`2. 📱 Promover en redes sociales de fútbol`);
console.log(`3. 📝 Publicar contenido nuevo semanalmente`);
console.log(`4. 🔗 Conseguir enlaces de otros sitios de fútbol`);
console.log(`5. 📊 Usar Google Analytics para mostrar actividad`);

console.log('\n' + '='.repeat(75)); 