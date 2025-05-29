#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 VERIFICACIÓN FINAL PARA APROBACIÓN ADSENSE');
console.log('='.repeat(70));

// Archivos críticos requeridos por AdSense
const criticalFiles = {
    'robots.txt': 'Robots.txt optimizado para AdSense',
    'ads.txt': 'Declaración de vendedores autorizados',
    'sitemap.xml': 'Mapa del sitio actualizado',
    'privacy.html': 'Política de privacidad con AdSense',
    'terminos.html': 'Términos y condiciones',
    'cookies.html': 'Política de cookies',
    'disclaimer.html': 'Descargo de responsabilidad',
    'about.html': 'Página Acerca de',
    'contact.html': 'Información de contacto',
    '404.html': 'Página de error 404',
    '500.html': 'Página de error 500',
    '.htaccess': 'Configuración del servidor',
    'web.config': 'Configuración IIS'
};

let score = 0;
let totalChecks = 0;

console.log('\n📁 VERIFICANDO ARCHIVOS CRÍTICOS:');
Object.entries(criticalFiles).forEach(([file, description]) => {
    totalChecks++;
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} - ${description}`);
        score++;
    } else {
        console.log(`❌ ${file} - FALTA (${description})`);
    }
});

// Verificar contenido crítico en archivos
console.log('\n🔍 VERIFICANDO CONTENIDO CRÍTICO:');

// Verificar robots.txt
if (fs.existsSync('robots.txt')) {
    const robotsContent = fs.readFileSync('robots.txt', 'utf8');
    const robotsChecks = [
        { test: /User-agent:\s*Mediapartners-Google/i, name: 'AdSense bot permitido' },
        { test: /User-agent:\s*AdsBot-Google/i, name: 'AdsBot-Google permitido' },
        { test: /Allow:\s*\/ads\.txt/i, name: 'ads.txt accesible' },
        { test: /Allow:\s*\*\.js/i, name: 'JavaScript permitido' },
        { test: /Sitemap:\s*https:\/\/cracktotal\.com\/sitemap\.xml/i, name: 'Sitemap declarado' }
    ];
    
    robotsChecks.forEach(check => {
        totalChecks++;
        if (check.test.test(robotsContent)) {
            console.log(`✅ ${check.name}`);
            score++;
        } else {
            console.log(`❌ ${check.name} - REVISAR robots.txt`);
        }
    });
}

// Verificar ads.txt
if (fs.existsSync('ads.txt')) {
    const adsContent = fs.readFileSync('ads.txt', 'utf8');
    const adsChecks = [
        { test: /pub-9579152019412427/i, name: 'Publisher ID correcto' },
        { test: /google\.com/i, name: 'Google como proveedor' },
        { test: /DIRECT/i, name: 'Relación directa declarada' }
    ];
    
    adsChecks.forEach(check => {
        totalChecks++;
        if (check.test.test(adsContent)) {
            console.log(`✅ ${check.name}`);
            score++;
        } else {
            console.log(`❌ ${check.name} - REVISAR ads.txt`);
        }
    });
}

// Verificar index.html
if (fs.existsSync('index.html')) {
    const htmlContent = fs.readFileSync('index.html', 'utf8');
    const htmlChecks = [
        { test: /ca-pub-9579152019412427/i, name: 'Publisher ID en HTML' },
        { test: /pagead2\.googlesyndication\.com/i, name: 'Script AdSense cargado' },
        { test: /'ad_storage':\s*'granted'/i, name: 'Almacenamiento de ads permitido' },
        { test: /'ad_personalization':\s*'granted'/i, name: 'Personalización permitida' },
        { test: /<meta\s+name="description"/i, name: 'Meta description presente' },
        { test: /rel="canonical"/i, name: 'URL canónica presente' },
        { test: /<title>.*<\/title>/i, name: 'Título presente' }
    ];
    
    htmlChecks.forEach(check => {
        totalChecks++;
        if (check.test.test(htmlContent)) {
            console.log(`✅ ${check.name}`);
            score++;
        } else {
            console.log(`❌ ${check.name} - REVISAR index.html`);
        }
    });
}

// Verificar privacy.html para consent correcto
if (fs.existsSync('privacy.html')) {
    const privacyContent = fs.readFileSync('privacy.html', 'utf8');
    const privacyChecks = [
        { test: /'ad_storage':\s*'granted'/i, name: 'Consent de ads en Privacy' },
        { test: /Google AdSense/i, name: 'Mención de AdSense en Privacy' },
        { test: /cookies/i, name: 'Información sobre cookies' },
        { test: /publicidad/i, name: 'Información sobre publicidad' }
    ];
    
    privacyChecks.forEach(check => {
        totalChecks++;
        if (check.test.test(privacyContent)) {
            console.log(`✅ ${check.name}`);
            score++;
        } else {
            console.log(`❌ ${check.name} - REVISAR privacy.html`);
        }
    });
}

// Verificar directorios de contenido
console.log('\n📂 VERIFICANDO ESTRUCTURA DE CONTENIDO:');
const contentDirs = ['css', 'js', 'images', 'img'];
contentDirs.forEach(dir => {
    totalChecks++;
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        const files = fs.readdirSync(dir);
        console.log(`✅ ${dir}/ - ${files.length} archivos`);
        score++;
    } else {
        console.log(`❌ ${dir}/ - Directorio faltante`);
    }
});

// Verificar número de páginas de contenido
console.log('\n📝 VERIFICANDO CONTENIDO SUFICIENTE:');
const contentPages = [
    'blog.html', 'games.html', 'about.html', 
    'blog-detail-messi.html', 'blog-detail-worldcups.html',
    'blog-detail-champions.html', 'blog-detail-libertadores.html',
    'mentiroso.html', 'quiensabemas.html', 'crack-rapido.html'
];

let contentPagesCount = 0;
contentPages.forEach(page => {
    if (fs.existsSync(page)) {
        contentPagesCount++;
    }
});

totalChecks++;
if (contentPagesCount >= 8) {
    console.log(`✅ Suficiente contenido - ${contentPagesCount} páginas`);
    score++;
} else {
    console.log(`❌ Poco contenido - Solo ${contentPagesCount} páginas (mínimo 8)`);
}

// Calcular puntuación final
const percentage = Math.round((score / totalChecks) * 100);

console.log('\n' + '='.repeat(70));
console.log(`📊 PUNTUACIÓN FINAL: ${score}/${totalChecks} (${percentage}%)`);

if (percentage >= 95) {
    console.log('🎉 EXCELENTE - Listo para aplicar a AdSense');
    console.log('✅ Tu sitio cumple con todos los requisitos críticos');
} else if (percentage >= 85) {
    console.log('👍 BUENO - Casi listo para AdSense');
    console.log('⚠️ Corrige los elementos faltantes antes de aplicar');
} else if (percentage >= 70) {
    console.log('⚠️ REGULAR - Necesita mejoras');
    console.log('🔧 Corrige los problemas críticos identificados');
} else {
    console.log('❌ CRÍTICO - No listo para AdSense');
    console.log('🚨 Múltiples problemas deben ser solucionados');
}

console.log('\n🎯 PRÓXIMOS PASOS PARA ADSENSE:');
console.log('1. 📤 Subir todos los archivos al servidor');
console.log('2. 🔗 Verificar que todas las URLs funcionen');
console.log('3. 🚀 Probar velocidad en PageSpeed Insights');
console.log('4. 📊 Revisar Google Search Console');
console.log('5. 🎯 Aplicar a Google AdSense');
console.log('6. ⏰ Esperar 24-48 horas para la revisión');

console.log('\n💡 CONSEJOS FINALES:');
if (percentage < 95) {
    console.log('• Corrige todos los elementos marcados con ❌');
    console.log('• Asegúrate de que el consent esté en "granted"');
    console.log('• Verifica que ads.txt sea accesible');
    console.log('• Revisa que la política de privacidad mencione AdSense');
}
console.log('• Agrega más contenido original si es posible');
console.log('• Asegúrate de tener tráfico regular antes de aplicar');
console.log('• Mantén el sitio actualizado y funcionando');

// Crear reporte detallado
const report = `
REPORTE FINAL DE ADSENSE - ${new Date().toISOString()}
======================================================

PUNTUACIÓN: ${score}/${totalChecks} (${percentage}%)

ARCHIVOS VERIFICADOS:
${Object.entries(criticalFiles).map(([file, desc]) => 
    `${fs.existsSync(file) ? '✅' : '❌'} ${file} - ${desc}`
).join('\n')}

CONTENIDO:
- Páginas de contenido: ${contentPagesCount}
- Directorios de recursos: ${contentDirs.filter(dir => fs.existsSync(dir)).length}/${contentDirs.length}

ESTADO: ${percentage >= 95 ? 'LISTO PARA ADSENSE' : 
         percentage >= 85 ? 'NECESITA AJUSTES MENORES' : 
         percentage >= 70 ? 'NECESITA MEJORAS' : 'NO LISTO'}

PRÓXIMOS PASOS:
1. Subir archivos al servidor
2. Verificar funcionamiento
3. Aplicar a AdSense
4. Monitorear aprobación

Generado: ${new Date().toLocaleString('es-AR')}
`;

fs.writeFileSync('adsense-readiness-report.txt', report);
console.log('\n📄 Reporte detallado guardado en: adsense-readiness-report.txt');
console.log('='.repeat(70)); 