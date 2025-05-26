# Script para corregir tildes en aria-labels
Write-Host "=== Corrigiendo tildes en aria-labels ===" -ForegroundColor Green

$files = Get-ChildItem -Filter "*.html"

foreach ($file in $files) {
    $content = Get-Content $file.Name -Raw -Encoding UTF8
    $originalContent = $content
    
    # Corregir aria-labels sin tildes
    $content = $content -replace 'aria-label="Navegacion principal"', 'aria-label="Navegación principal"'
    $content = $content -replace 'aria-label="Abrir menu de navegacion"', 'aria-label="Abrir menú de navegación"'
    
    if ($content -ne $originalContent) {
        $content | Out-File -FilePath $file.Name -Encoding UTF8 -NoNewline
        Write-Host "✅ $($file.Name) - Tildes corregidas" -ForegroundColor Green
    } else {
        Write-Host "✅ $($file.Name) - Sin cambios necesarios" -ForegroundColor Cyan
    }
}

Write-Host "`n=== Corrección de tildes completada ===" -ForegroundColor Green 