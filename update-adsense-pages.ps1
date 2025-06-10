# Script para actualizar todas las páginas HTML con AdSense
# Agrega el script adsense-early-blocker.js antes del script de AdSense

$updateCount = 0
$skippedCount = 0

Write-Host "=== Actualizando páginas HTML con AdSense ===" -ForegroundColor Cyan
Write-Host ""

# Buscar todos los archivos HTML que contienen el script de AdSense
$files = Get-ChildItem -Path "." -Filter "*.html" -Recurse | 
    Where-Object { 
        $content = Get-Content $_.FullName -Raw
        $content -match "pagead2\.googlesyndication\.com/pagead/js/adsbygoogle\.js"
    }

Write-Host "Encontrados $($files.Count) archivos HTML con AdSense" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $files) {
    Write-Host "Procesando: $($file.Name)" -NoNewline
    
    $content = Get-Content $file.FullName -Raw
    
    # Verificar si ya tiene el early blocker
    if ($content -match "adsense-early-blocker\.js") {
        Write-Host " - Ya actualizado (saltando)" -ForegroundColor Green
        $skippedCount++
        continue
    }
    
    # Patrón para encontrar el script de AdSense
    $pattern = '(\s*)(<!-- Google AdSense -->[\s\S]*?<script async src="https://pagead2\.googlesyndication\.com/pagead/js/adsbygoogle\.js[^"]*"[^>]*>[\s\S]*?</script>)'
    
    # Si no encuentra con ese patrón, intentar uno más simple
    if ($content -notmatch $pattern) {
        $pattern = '(\s*)(<script async src="https://pagead2\.googlesyndication\.com/pagead/js/adsbygoogle\.js[^"]*"[^>]*>[\s\S]*?</script>)'
    }
    
    if ($content -match $pattern) {
        $indentation = $matches[1]
        $adSenseBlock = $matches[2]
        
        # Construir el nuevo bloque con el early blocker
        $newBlock = "${indentation}<!-- AdSense Early Blocker - DEBE cargarse ANTES que AdSense -->`n${indentation}<script src=""assets/js/adsense-early-blocker.js?v=202506072312""></script>`n${indentation}$adSenseBlock"
        
        # Reemplazar en el contenido
        $newContent = $content -replace [regex]::Escape($matches[0]), $newBlock
        
        # Guardar el archivo actualizado
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        
        Write-Host " - Actualizado" -ForegroundColor Green
        $updateCount++
    } else {
        Write-Host " - No se pudo encontrar el patrón de AdSense" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Resumen ===" -ForegroundColor Cyan
Write-Host "Archivos actualizados: $updateCount" -ForegroundColor Green
Write-Host "Archivos saltados (ya actualizados): $skippedCount" -ForegroundColor Yellow
Write-Host "Total procesados: $($files.Count)" -ForegroundColor White
Write-Host ""
Write-Host "¡Actualización completada!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANTE: Recuerda probar las páginas actualizadas y verificar en la consola del navegador" -ForegroundColor Yellow
Write-Host "que aparezcan los mensajes de '[AdSense Early Blocker]' en las páginas correspondientes." -ForegroundColor Yellow 