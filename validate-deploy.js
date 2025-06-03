#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validando estructura del proyecto para deploy...\n');

// Archivos críticos que deben existir
const criticalFiles = [
    'server.js',
    'package.json',
    'index.html',
    'games.html'
];

// Directorios importantes
const criticalDirs = [
    'assets',
    'assets/css',
    'assets/js',
    'assets/data'
];

let errors = 0;
let warnings = 0;

// Verificar archivos críticos
console.log('📄 Verificando archivos críticos:');
criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - FALTANTE`);
        errors++;
    }
});

// Verificar directorios
console.log('\n📁 Verificando directorios:');
criticalDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        console.log(`✅ ${dir}/`);
    } else {
        console.log(`⚠️  ${dir}/ - FALTANTE`);
        warnings++;
    }
});

// Verificar package.json
console.log('\n📦 Verificando package.json:');
try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (pkg.scripts && pkg.scripts.start) {
        console.log('✅ Script "start" definido');
    } else {
        console.log('❌ Script "start" faltante');
        errors++;
    }
    
    if (pkg.scripts && pkg.scripts.build) {
        console.log('✅ Script "build" definido');
    } else {
        console.log('❌ Script "build" faltante');
        errors++;
    }
    
    if (pkg.main) {
        console.log(`✅ Punto de entrada: ${pkg.main}`);
    } else {
        console.log('⚠️  Punto de entrada no definido');
        warnings++;
    }
    
    if (pkg.engines && pkg.engines.node) {
        console.log(`✅ Versión de Node especificada: ${pkg.engines.node}`);
    } else {
        console.log('⚠️  Versión de Node no especificada');
        warnings++;
    }
} catch (e) {
    console.log('❌ Error leyendo package.json:', e.message);
    errors++;
}

// Verificar server.js
console.log('\n🖥️  Verificando server.js:');
try {
    const serverContent = fs.readFileSync('server.js', 'utf8');
    
    if (serverContent.includes('process.env.PORT')) {
        console.log('✅ Variable PORT configurada');
    } else {
        console.log('❌ Variable PORT no encontrada');
        errors++;
    }
    
    if (serverContent.includes('WebSocket') || serverContent.includes('ws')) {
        console.log('✅ WebSocket configurado');
    } else {
        console.log('⚠️  WebSocket no detectado');
        warnings++;
    }
} catch (e) {
    console.log('❌ Error leyendo server.js:', e.message);
    errors++;
}

// Resumen
console.log('\n📊 Resumen de validación:');
console.log(`✅ Validaciones exitosas`);
console.log(`⚠️  Advertencias: ${warnings}`);
console.log(`❌ Errores: ${errors}`);

if (errors > 0) {
    console.log('\n🚨 ¡ATENCIÓN! Hay errores que deben corregirse antes del deploy.');
    process.exit(1);
} else if (warnings > 0) {
    console.log('\n⚠️  Hay algunas advertencias, pero el proyecto debería deployarse correctamente.');
    process.exit(0);
} else {
    console.log('\n🎉 ¡Proyecto listo para deploy!');
    process.exit(0);
} 