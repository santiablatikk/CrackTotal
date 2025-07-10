#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validando archivos para deploy...');

// Lista de archivos críticos que deben existir
const criticalFiles = [
    'index.html',
    'games.html',
    'blog.html',
    'about.html',
    'contact.html',
    'privacy.html',
    'cookies.html',
    'terminos.html',
    'ads.txt',
    'robots.txt',
    'sitemap.xml',
    'server.js',
    'package.json'
];

// Lista de directorios críticos
const criticalDirs = [
    'assets',
    'assets/css',
    'assets/js',
    'assets/images',
    'assets/data'
];

let hasErrors = false;

// Validar archivos críticos
console.log('📄 Validando archivos críticos...');
for (const file of criticalFiles) {
    if (!fs.existsSync(file)) {
        console.error(`❌ Archivo crítico faltante: ${file}`);
        hasErrors = true;
    } else {
        console.log(`✅ ${file}`);
    }
}

// Validar directorios críticos
console.log('\n📁 Validando directorios críticos...');
for (const dir of criticalDirs) {
    if (!fs.existsSync(dir)) {
        console.error(`❌ Directorio crítico faltante: ${dir}`);
        hasErrors = true;
    } else {
        console.log(`✅ ${dir}/`);
    }
}

// Validar package.json
console.log('\n📦 Validando package.json...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (!packageJson.name || !packageJson.version) {
        console.error('❌ package.json mal formado');
        hasErrors = true;
    } else {
        console.log(`✅ ${packageJson.name} v${packageJson.version}`);
    }
} catch (error) {
    console.error('❌ Error leyendo package.json:', error.message);
    hasErrors = true;
}

// Validar ads.txt para AdSense
console.log('\n💰 Validando configuración AdSense...');
try {
    const adsContent = fs.readFileSync('ads.txt', 'utf8');
    if (adsContent.includes('pub-9579152019412427')) {
        console.log('✅ ads.txt configurado correctamente');
    } else {
        console.warn('⚠️  ads.txt podría necesitar configuración');
    }
} catch (error) {
    console.error('❌ Error leyendo ads.txt:', error.message);
    hasErrors = true;
}

// Verificar que no haya archivos de desarrollo/prueba
console.log('\n🧹 Verificando ausencia de archivos de desarrollo...');
const devFiles = [
    'debug-ranking.html',
    'test-ranking.html',
    'create-test-data.html',
    'test-simple.html'
];

let foundDevFiles = false;
for (const file of devFiles) {
    if (fs.existsSync(file)) {
        console.warn(`⚠️  Archivo de desarrollo encontrado: ${file}`);
        foundDevFiles = true;
    }
}

if (!foundDevFiles) {
    console.log('✅ No se encontraron archivos de desarrollo');
}

// Resultado final
console.log('\n' + '='.repeat(50));
if (hasErrors) {
    console.error('❌ VALIDACIÓN FALLIDA - Hay errores críticos');
    process.exit(1);
} else {
    console.log('✅ VALIDACIÓN EXITOSA - Listo para deploy');
    console.log('🚀 Todos los archivos críticos están presentes');
    console.log('🎯 Proyecto preparado para AdSense');
    process.exit(0);
} 