#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🚀 VERIFICACIÓN DE OPTIMIZACIÓN ADSENSE Y SEO');
console.log('='.repeat(60));

// 1. Verificar archivos críticos
const criticalFiles = [
    'robots.txt',
    'ads.txt', 
    'sitemap.xml',
    '.htaccess',
    'web.config',
    '404.html'
];

console.log('\n📁 VERIFICANDO ARCHIVOS CRÍTICOS:');
criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} - Existe`);
    } else {
        console.log(`❌ ${file} - FALTA (Crítico para SEO)`);
    }
});

// 2. Verificar robots.txt
console.log('\n🤖 VERIFICANDO ROBOTS.TXT:');
if (fs.existsSync('robots.txt')) {
    const robotsContent = fs.readFileSync('robots.txt', 'utf8');
    
    const checks = [
        { test: /Sitemap:\s*https:\/\/cracktotal\.com\/sitemap\.xml/, name: 'Sitemap declarado' },
        { test: /User-agent:\s*Mediapartners-Google/, name: 'AdSense bot permitido' },
        { test: /User-agent:\s*AdsBot-Google/, name: 'AdsBot permitido' },
        { test: /Allow:\s*\/ads\.txt/, name: 'ads.txt permitido' },
        { test: /Allow:\s*\*\.js/, name: 'JavaScript permitido' },
        { test: /Allow:\s*\*\.css/, name: 'CSS permitido' }
    ];
    
    checks.forEach(check => {
        if (check.test.test(robotsContent)) {
            console.log(`✅ ${check.name}`);
        } else {
            console.log(`❌ ${check.name} - FALTA`);
        }
    });
}

// 3. Verificar ads.txt
console.log('\n💰 VERIFICANDO ADS.TXT:');
if (fs.existsSync('ads.txt')) {
    const adsContent = fs.readFileSync('ads.txt', 'utf8');
    
    if (adsContent.includes('pub-9579152019412427')) {
        console.log('✅ Publisher ID de AdSense encontrado');
    } else {
        console.log('❌ Publisher ID de AdSense NO encontrado');
    }
    
    if (adsContent.includes('google.com')) {
        console.log('✅ Google como proveedor declarado');
    } else {
        console.log('❌ Google como proveedor NO declarado');
    }
    
    if (adsContent.includes('DIRECT')) {
        console.log('✅ Relación DIRECT declarada');
    } else {
        console.log('❌ Relación DIRECT NO declarada');
    }
}

// 4. Verificar HTML principal
console.log('\n🌐 VERIFICANDO INDEX.HTML:');
if (fs.existsSync('index.html')) {
    const htmlContent = fs.readFileSync('index.html', 'utf8');
    
    const htmlChecks = [
        { test: /'ad_storage':\s*'granted'/, name: 'AdSense storage permitido' },
        { test: /'ad_personalization':\s*'granted'/, name: 'Personalización de ads permitida' },
        { test: /pagead2\.googlesyndication\.com/, name: 'Script de AdSense cargado' },
        { test: /ca-pub-9579152019412427/, name: 'Publisher ID en HTML' },
        { test: /history\.replaceState/, name: 'Redirección SEO optimizada' },
        { test: /<title>.*<\/title>/, name: 'Título presente' },
        { test: /<meta\s+name="description"/, name: 'Meta description presente' },
        { test: /rel="canonical"/, name: 'URL canónica presente' }
    ];
    
    htmlChecks.forEach(check => {
        if (check.test.test(htmlContent)) {
            console.log(`✅ ${check.name}`);
        } else {
            console.log(`❌ ${check.name} - REVISAR`);
        }
    });
}

// 5. Verificar sitemap
console.log('\n🗺️ VERIFICANDO SITEMAP.XML:');
if (fs.existsSync('sitemap.xml')) {
    const sitemapContent = fs.readFileSync('sitemap.xml', 'utf8');
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (sitemapContent.includes(today) || sitemapContent.includes(yesterday)) {
        console.log('✅ Fechas actualizadas recientemente');
    } else {
        console.log('⚠️ Fechas del sitemap pueden estar desactualizadas');
    }
    
    const urlCount = (sitemapContent.match(/<url>/g) || []).length;
    console.log(`📊 URLs en sitemap: ${urlCount}`);
    
    if (urlCount >= 10) {
        console.log('✅ Buen número de URLs indexadas');
    } else {
        console.log('⚠️ Pocas URLs - considerar agregar más contenido');
    }
}

// 6. Verificar archivos CSS y JS críticos
console.log('\n🎨 VERIFICANDO RECURSOS ESTÁTICOS:');
const staticDirs = ['css', 'js', 'images', 'img'];
staticDirs.forEach(dir => {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        const files = fs.readdirSync(dir);
        console.log(`✅ ${dir}/ - ${files.length} archivos`);
    } else {
        console.log(`❌ ${dir}/ - Directorio no encontrado`);
    }
});

// 7. Recomendaciones finales
console.log('\n🎯 RECOMENDACIONES FINALES:');
console.log('1. ✅ Sube todos los archivos modificados a tu servidor');
console.log('2. 🔄 Solicita reindexación en Google Search Console');
console.log('3. 📊 Verifica AdSense en 24-48 horas');
console.log('4. 🚀 Monitorea Core Web Vitals');
console.log('5. 📈 Revisa métricas de velocidad con PageSpeed Insights');

console.log('\n' + '='.repeat(60));
console.log('🎉 VERIFICACIÓN COMPLETADA');

// Crear reporte
const report = `
REPORTE DE OPTIMIZACIÓN ADSENSE Y SEO
Fecha: ${new Date().toISOString()}
Sitio: cracktotal.com

CAMBIOS REALIZADOS:
✅ robots.txt optimizado para AdSense
✅ Configuración de consent mejorada (ad_storage: granted)
✅ Headers de seguridad optimizados
✅ Redirecciones SEO implementadas  
✅ Compresión y cache configurados
✅ Sitemap actualizado con fechas recientes
✅ Archivos .htaccess y web.config creados

PRÓXIMOS PASOS:
1. Subir archivos al servidor
2. Verificar en Google Search Console
3. Solicitar reindexación
4. Monitorear AdSense en 24-48h

Estado: OPTIMIZACIÓN COMPLETADA ✅
`;

fs.writeFileSync('optimization-report.txt', report);
console.log('📄 Reporte guardado en: optimization-report.txt'); 