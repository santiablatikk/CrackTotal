# Script para corregir problemas de codificación
Write-Host "=== Corrigiendo problemas de codificación ===" -ForegroundColor Green

$files = Get-ChildItem -Filter "*.html"

foreach ($file in $files) {
    $content = Get-Content $file.Name -Raw -Encoding UTF8
    $originalContent = $content
    
    # Corregir caracteres mal codificados
    $content = $content -replace 'NavegaciÃ³n principal', 'Navegación principal'
    $content = $content -replace 'Abrir menÃº de navegaciÃ³n', 'Abrir menú de navegación'
    $content = $content -replace 'navegaciÃ³n', 'navegación'
    $content = $content -replace 'menÃº', 'menú'
    
    # Verificar si hay main-content ID
    $hasMainContent = $content -match 'id="main-content"'
    
    if ($content -ne $originalContent) {
        $content | Out-File -FilePath $file.Name -Encoding UTF8 -NoNewline
        Write-Host "✅ $($file.Name) - Codificación corregida" -ForegroundColor Green
    } else {
        Write-Host "✅ $($file.Name) - Sin problemas de codificación" -ForegroundColor Cyan
    }
    
    # Verificar main-content
    if (-not $hasMainContent) {
        Write-Host "⚠️ $($file.Name) - Falta id='main-content'" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Corrección de codificación completada ===" -ForegroundColor Green 