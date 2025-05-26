# Script de Verificación Completa - Crack Total
# Revisa TODOS los archivos HTML en busca de problemas

Write-Host "=== VERIFICACIÓN COMPLETA DE CRACK TOTAL ===" -ForegroundColor Green
Write-Host "Revisando todos los archivos HTML..." -ForegroundColor Yellow

# Lista de todos los archivos HTML
$allHtmlFiles = Get-ChildItem -Filter "*.html" | Select-Object -ExpandProperty Name

Write-Host "`n=== ARCHIVOS ENCONTRADOS ===" -ForegroundColor Cyan
$allHtmlFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }

Write-Host "`n=== VERIFICANDO NAVEGACIONES DUPLICADAS ===" -ForegroundColor Yellow

foreach ($file in $allHtmlFiles) {
    $content = Get-Content $file -Raw -Encoding UTF8
    
    # Contar navegaciones
    $navCount = ([regex]'<nav[^>]*class="main-navigation"').Matches($content).Count
    
    if ($navCount -gt 1) {
        Write-Host "❌ $file`: $navCount navegaciones encontradas (DUPLICADO)" -ForegroundColor Red
    } elseif ($navCount -eq 1) {
        Write-Host "✅ $file`: 1 navegación (OK)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ $file`: Sin navegación" -ForegroundColor Yellow
    }
}

Write-Host "`n=== VERIFICANDO ESTRUCTURA DE NAVEGACIÓN ===" -ForegroundColor Yellow

foreach ($file in $allHtmlFiles) {
    $content = Get-Content $file -Raw -Encoding UTF8
    
    # Verificar elementos de navegación
    $hasSkipLink = $content -match 'class="skip-link"'
    $hasRole = $content -match 'role="navigation"'
    $hasAriaLabel = $content -match 'aria-label="Navegación principal"'
    $hasNavLogo = $content -match 'class="nav-logo"'
    $hasNavToggle = $content -match 'class="nav-toggle"'
    
    Write-Host "`n📋 $file`:" -ForegroundColor Cyan
    Write-Host "  Skip Link: $(if($hasSkipLink){'✅'}else{'❌'})" -ForegroundColor $(if($hasSkipLink){'Green'}else{'Red'})
    Write-Host "  Role Navigation: $(if($hasRole){'✅'}else{'❌'})" -ForegroundColor $(if($hasRole){'Green'}else{'Red'})
    Write-Host "  Aria Label: $(if($hasAriaLabel){'✅'}else{'❌'})" -ForegroundColor $(if($hasAriaLabel){'Green'}else{'Red'})
    Write-Host "  Nav Logo: $(if($hasNavLogo){'✅'}else{'❌'})" -ForegroundColor $(if($hasNavLogo){'Green'}else{'Red'})
    Write-Host "  Nav Toggle: $(if($hasNavToggle){'✅'}else{'❌'})" -ForegroundColor $(if($hasNavToggle){'Green'}else{'Red'})
}

Write-Host "`n=== VERIFICANDO BOTONES SIN ESTILO ===" -ForegroundColor Yellow

foreach ($file in $allHtmlFiles) {
    $content = Get-Content $file -Raw -Encoding UTF8
    
    # Buscar botones sin clases
    $buttonsWithoutClass = ([regex]'<button(?![^>]*class=)[^>]*>').Matches($content)
    $linksWithoutClass = ([regex]'<a(?![^>]*class=)(?![^>]*href="#")[^>]*>').Matches($content)
    
    if ($buttonsWithoutClass.Count -gt 0 -or $linksWithoutClass.Count -gt 0) {
        Write-Host "`n⚠️ $file`: Elementos sin estilo encontrados:" -ForegroundColor Yellow
        if ($buttonsWithoutClass.Count -gt 0) {
            Write-Host "  - $($buttonsWithoutClass.Count) botones sin clase" -ForegroundColor Red
        }
        if ($linksWithoutClass.Count -gt 0) {
            Write-Host "  - $($linksWithoutClass.Count) enlaces sin clase" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== VERIFICANDO MAIN CONTENT ID ===" -ForegroundColor Yellow

foreach ($file in $allHtmlFiles) {
    $content = Get-Content $file -Raw -Encoding UTF8
    
    $hasMainContent = $content -match 'id="main-content"'
    
    if ($hasMainContent) {
        Write-Host "✅ $file`: Tiene main-content ID" -ForegroundColor Green
    } else {
        Write-Host "❌ $file`: Falta main-content ID" -ForegroundColor Red
    }
}

Write-Host "`n=== VERIFICANDO HEADERS INCONSISTENTES ===" -ForegroundColor Yellow

foreach ($file in $allHtmlFiles) {
    $content = Get-Content $file -Raw -Encoding UTF8
    
    $hasAppHeader = $content -match 'class="app-header"'
    $hasGameHeader = $content -match 'class="game-header"'
    
    if ($hasAppHeader -and $hasGameHeader) {
        Write-Host "⚠️ $file`: Tiene AMBOS app-header y game-header" -ForegroundColor Yellow
    } elseif ($hasAppHeader) {
        Write-Host "✅ $file`: Usa app-header" -ForegroundColor Green
    } elseif ($hasGameHeader) {
        Write-Host "📝 $file`: Usa game-header" -ForegroundColor Cyan
    } else {
        Write-Host "❌ $file`: Sin header definido" -ForegroundColor Red
    }
}

Write-Host "`n=== VERIFICANDO SCRIPTS DUPLICADOS ===" -ForegroundColor Yellow

foreach ($file in $allHtmlFiles) {
    $content = Get-Content $file -Raw -Encoding UTF8
    
    # Contar scripts de main.js
    $mainJsCount = ([regex]'src="js/main\.js"').Matches($content).Count
    
    if ($mainJsCount -gt 1) {
        Write-Host "❌ $file`: main.js incluido $mainJsCount veces (DUPLICADO)" -ForegroundColor Red
    } elseif ($mainJsCount -eq 1) {
        Write-Host "✅ $file`: main.js incluido correctamente" -ForegroundColor Green
    } else {
        Write-Host "⚠️ $file`: main.js no incluido" -ForegroundColor Yellow
    }
}

Write-Host "`n=== VERIFICANDO ESTILOS CSS ===" -ForegroundColor Yellow

foreach ($file in $allHtmlFiles) {
    $content = Get-Content $file -Raw -Encoding UTF8
    
    $hasLayoutCss = $content -match 'href="css/layout\.css"'
    $hasBaseCss = $content -match 'href="css/base\.css"'
    
    Write-Host "📄 $file`:" -ForegroundColor Cyan
    Write-Host "  Layout CSS: $(if($hasLayoutCss){'✅'}else{'❌'})" -ForegroundColor $(if($hasLayoutCss){'Green'}else{'Red'})
    Write-Host "  Base CSS: $(if($hasBaseCss){'✅'}else{'❌'})" -ForegroundColor $(if($hasBaseCss){'Green'}else{'Red'})
}

Write-Host "`n=== RESUMEN FINAL ===" -ForegroundColor Green
Write-Host "Verificación completa terminada." -ForegroundColor White
Write-Host "Revisa los elementos marcados con ❌ y ⚠️ para corregir problemas." -ForegroundColor Yellow 