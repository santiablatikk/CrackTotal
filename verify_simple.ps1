# Script de Verificación Simple - Crack Total
Write-Host "=== VERIFICACIÓN COMPLETA DE CRACK TOTAL ===" -ForegroundColor Green

# Lista de archivos HTML
$files = Get-ChildItem -Filter "*.html" | Select-Object -ExpandProperty Name

Write-Host "Archivos encontrados: $($files.Count)" -ForegroundColor Cyan

# Verificar navegaciones duplicadas
Write-Host "`n=== NAVEGACIONES DUPLICADAS ===" -ForegroundColor Yellow
foreach ($file in $files) {
    $content = Get-Content $file -Raw -Encoding UTF8
    $navCount = ([regex]'<nav[^>]*class="main-navigation"').Matches($content).Count
    
    if ($navCount -gt 1) {
        Write-Host "❌ $file - $navCount navegaciones (DUPLICADO)" -ForegroundColor Red
    } elseif ($navCount -eq 1) {
        Write-Host "✅ $file - OK" -ForegroundColor Green
    } else {
        Write-Host "⚠️ $file - Sin navegación" -ForegroundColor Yellow
    }
}

# Verificar main-content ID
Write-Host "`n=== MAIN CONTENT ID ===" -ForegroundColor Yellow
foreach ($file in $files) {
    $content = Get-Content $file -Raw -Encoding UTF8
    $hasMainContent = $content -match 'id="main-content"'
    
    if ($hasMainContent) {
        Write-Host "✅ $file - Tiene main-content" -ForegroundColor Green
    } else {
        Write-Host "❌ $file - Falta main-content" -ForegroundColor Red
    }
}

# Verificar headers
Write-Host "`n=== TIPOS DE HEADER ===" -ForegroundColor Yellow
foreach ($file in $files) {
    $content = Get-Content $file -Raw -Encoding UTF8
    $hasAppHeader = $content -match 'class="app-header"'
    $hasGameHeader = $content -match 'class="game-header"'
    
    if ($hasAppHeader -and $hasGameHeader) {
        Write-Host "⚠️ $file - AMBOS headers" -ForegroundColor Yellow
    } elseif ($hasAppHeader) {
        Write-Host "✅ $file - app-header" -ForegroundColor Green
    } elseif ($hasGameHeader) {
        Write-Host "📝 $file - game-header" -ForegroundColor Cyan
    } else {
        Write-Host "❌ $file - Sin header" -ForegroundColor Red
    }
}

Write-Host "`n=== VERIFICACIÓN COMPLETADA ===" -ForegroundColor Green 