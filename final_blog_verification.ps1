# Script de Verificación Final de Blogs - Crack Total
Write-Host "=== VERIFICACIÓN FINAL DE UNIFICACIÓN DE BLOGS ===" -ForegroundColor Green

# Lista de todos los archivos de blog
$blogFiles = @(
    "blog.html",
    "blog-detail-champions.html",
    "blog-detail-community.html", 
    "blog-detail-estilos-juego.html",
    "blog-detail-historia-mundial.html",
    "blog-detail-legends.html",
    "blog-detail-libertadores.html",
    "blog-detail-liga-argentina.html",
    "blog-detail-messi.html",
    "blog-detail-scaloneta.html",
    "blog-detail-tactics-football.html",
    "blog-detail-worldcups.html"
)

Write-Host "Verificando $($blogFiles.Count) archivos de blog..." -ForegroundColor Cyan
Write-Host ""

$perfectFiles = 0
$issues = @()

foreach ($file in $blogFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Verificaciones de estilo unificado
        $hasSkipLink = $content -match 'class="skip-link"'
        $hasCorrectNav = $content -match 'role="navigation" aria-label="Navegación principal"'
        $hasCorrectButton = $content -match 'aria-label="Abrir menú de navegación"'
        $hasAppHeader = $content -match 'class="app-header"'
        $hasBreadcrumbs = $content -match 'class="breadcrumbs-container"'
        $hasMainContent = $content -match 'id="main-content"'
        $hasMainJs = $content -match 'src="js/main\.js"'
        $hasLayoutCss = $content -match 'href="css/layout\.css"'
        $noDuplicateHomeLinks = -not ($content -match '<a href="[^"]*" class="home-link">')
        $noEncodingIssues = -not ($content -match 'NavegaciÃ³n|menÃº')
        
        # Contar elementos perfectos
        $checks = @($hasSkipLink, $hasCorrectNav, $hasCorrectButton, $hasAppHeader, 
                   $hasBreadcrumbs, $hasMainContent, $hasMainJs, $hasLayoutCss, 
                   $noDuplicateHomeLinks, $noEncodingIssues)
        $score = ($checks | Where-Object { $_ }).Count
        
        if ($score -eq 10) {
            Write-Host "✅ $file - PERFECTO (10/10)" -ForegroundColor Green
            $perfectFiles++
        } else {
            Write-Host "⚠️ $file - Puntuación: $score/10" -ForegroundColor Yellow
            
            # Detallar problemas
            if (-not $hasSkipLink) { $issues += "$file - Falta Skip Link" }
            if (-not $hasCorrectNav) { $issues += "$file - Navegación incorrecta" }
            if (-not $hasCorrectButton) { $issues += "$file - Botón nav incorrecto" }
            if (-not $hasAppHeader) { $issues += "$file - Falta app-header" }
            if (-not $hasBreadcrumbs) { $issues += "$file - Faltan breadcrumbs" }
            if (-not $hasMainContent) { $issues += "$file - Falta main-content ID" }
            if (-not $hasMainJs) { $issues += "$file - Falta main.js" }
            if (-not $hasLayoutCss) { $issues += "$file - Falta layout.css" }
            if (-not $noDuplicateHomeLinks) { $issues += "$file - Home-links duplicados" }
            if (-not $noEncodingIssues) { $issues += "$file - Problemas de codificación" }
        }
        
        # Verificar elementos específicos
        Write-Host "   Skip Link: $(if($hasSkipLink){'✅'}else{'❌'})" -ForegroundColor $(if($hasSkipLink){'Green'}else{'Red'})
        Write-Host "   Navegación: $(if($hasCorrectNav){'✅'}else{'❌'})" -ForegroundColor $(if($hasCorrectNav){'Green'}else{'Red'})
        Write-Host "   App Header: $(if($hasAppHeader){'✅'}else{'❌'})" -ForegroundColor $(if($hasAppHeader){'Green'}else{'Red'})
        Write-Host "   Breadcrumbs: $(if($hasBreadcrumbs){'✅'}else{'❌'})" -ForegroundColor $(if($hasBreadcrumbs){'Green'}else{'Red'})
        Write-Host "   Main Content: $(if($hasMainContent){'✅'}else{'❌'})" -ForegroundColor $(if($hasMainContent){'Green'}else{'Red'})
        Write-Host "   Sin Duplicados: $(if($noDuplicateHomeLinks){'✅'}else{'❌'})" -ForegroundColor $(if($noDuplicateHomeLinks){'Green'}else{'Red'})
        Write-Host "   Codificación: $(if($noEncodingIssues){'✅'}else{'❌'})" -ForegroundColor $(if($noEncodingIssues){'Green'}else{'Red'})
        Write-Host ""
    } else {
        Write-Host "❌ $file - Archivo no encontrado" -ForegroundColor Red
    }
}

Write-Host "=== RESUMEN FINAL ===" -ForegroundColor Green
Write-Host "Archivos verificados: $($blogFiles.Count)" -ForegroundColor White
Write-Host "Archivos perfectos: $perfectFiles" -ForegroundColor Green
Write-Host "Archivos con problemas: $($blogFiles.Count - $perfectFiles)" -ForegroundColor $(if($perfectFiles -eq $blogFiles.Count){'Green'}else{'Yellow'})

if ($issues.Count -gt 0) {
    Write-Host "`n=== PROBLEMAS DETECTADOS ===" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "  - $issue" -ForegroundColor Red
    }
} else {
    Write-Host "`n🎉 ¡TODOS LOS BLOGS TIENEN EL MISMO ESTILO UNIFICADO!" -ForegroundColor Green
}

$percentage = [math]::Round(($perfectFiles / $blogFiles.Count) * 100, 1)
Write-Host "`nPorcentaje de unificación: $percentage%" -ForegroundColor $(if($percentage -eq 100){'Green'}else{'Yellow'})

Write-Host "`n=== VERIFICACION COMPLETADA ===" -ForegroundColor Green 
Write-Host "=== VERIFICACIÓN FINAL DE UNIFICACIÓN DE BLOGS ===" -ForegroundColor Green

# Lista de todos los archivos de blog
$blogFiles = @(
    "blog.html",
    "blog-detail-champions.html",
    "blog-detail-community.html", 
    "blog-detail-estilos-juego.html",
    "blog-detail-historia-mundial.html",
    "blog-detail-legends.html",
    "blog-detail-libertadores.html",
    "blog-detail-liga-argentina.html",
    "blog-detail-messi.html",
    "blog-detail-scaloneta.html",
    "blog-detail-tactics-football.html",
    "blog-detail-worldcups.html"
)

Write-Host "Verificando $($blogFiles.Count) archivos de blog..." -ForegroundColor Cyan
Write-Host ""

$perfectFiles = 0
$issues = @()

foreach ($file in $blogFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Verificaciones de estilo unificado
        $hasSkipLink = $content -match 'class="skip-link"'
        $hasCorrectNav = $content -match 'role="navigation" aria-label="Navegación principal"'
        $hasCorrectButton = $content -match 'aria-label="Abrir menú de navegación"'
        $hasAppHeader = $content -match 'class="app-header"'
        $hasBreadcrumbs = $content -match 'class="breadcrumbs-container"'
        $hasMainContent = $content -match 'id="main-content"'
        $hasMainJs = $content -match 'src="js/main\.js"'
        $hasLayoutCss = $content -match 'href="css/layout\.css"'
        $noDuplicateHomeLinks = -not ($content -match '<a href="[^"]*" class="home-link">')
        $noEncodingIssues = -not ($content -match 'NavegaciÃ³n|menÃº')
        
        # Contar elementos perfectos
        $checks = @($hasSkipLink, $hasCorrectNav, $hasCorrectButton, $hasAppHeader, 
                   $hasBreadcrumbs, $hasMainContent, $hasMainJs, $hasLayoutCss, 
                   $noDuplicateHomeLinks, $noEncodingIssues)
        $score = ($checks | Where-Object { $_ }).Count
        
        if ($score -eq 10) {
            Write-Host "✅ $file - PERFECTO (10/10)" -ForegroundColor Green
            $perfectFiles++
        } else {
            Write-Host "⚠️ $file - Puntuación: $score/10" -ForegroundColor Yellow
            
            # Detallar problemas
            if (-not $hasSkipLink) { $issues += "$file - Falta Skip Link" }
            if (-not $hasCorrectNav) { $issues += "$file - Navegación incorrecta" }
            if (-not $hasCorrectButton) { $issues += "$file - Botón nav incorrecto" }
            if (-not $hasAppHeader) { $issues += "$file - Falta app-header" }
            if (-not $hasBreadcrumbs) { $issues += "$file - Faltan breadcrumbs" }
            if (-not $hasMainContent) { $issues += "$file - Falta main-content ID" }
            if (-not $hasMainJs) { $issues += "$file - Falta main.js" }
            if (-not $hasLayoutCss) { $issues += "$file - Falta layout.css" }
            if (-not $noDuplicateHomeLinks) { $issues += "$file - Home-links duplicados" }
            if (-not $noEncodingIssues) { $issues += "$file - Problemas de codificación" }
        }
        
        # Verificar elementos específicos
        Write-Host "   Skip Link: $(if($hasSkipLink){'✅'}else{'❌'})" -ForegroundColor $(if($hasSkipLink){'Green'}else{'Red'})
        Write-Host "   Navegación: $(if($hasCorrectNav){'✅'}else{'❌'})" -ForegroundColor $(if($hasCorrectNav){'Green'}else{'Red'})
        Write-Host "   App Header: $(if($hasAppHeader){'✅'}else{'❌'})" -ForegroundColor $(if($hasAppHeader){'Green'}else{'Red'})
        Write-Host "   Breadcrumbs: $(if($hasBreadcrumbs){'✅'}else{'❌'})" -ForegroundColor $(if($hasBreadcrumbs){'Green'}else{'Red'})
        Write-Host "   Main Content: $(if($hasMainContent){'✅'}else{'❌'})" -ForegroundColor $(if($hasMainContent){'Green'}else{'Red'})
        Write-Host "   Sin Duplicados: $(if($noDuplicateHomeLinks){'✅'}else{'❌'})" -ForegroundColor $(if($noDuplicateHomeLinks){'Green'}else{'Red'})
        Write-Host "   Codificación: $(if($noEncodingIssues){'✅'}else{'❌'})" -ForegroundColor $(if($noEncodingIssues){'Green'}else{'Red'})
        Write-Host ""
    } else {
        Write-Host "❌ $file - Archivo no encontrado" -ForegroundColor Red
    }
}

Write-Host "=== RESUMEN FINAL ===" -ForegroundColor Green
Write-Host "Archivos verificados: $($blogFiles.Count)" -ForegroundColor White
Write-Host "Archivos perfectos: $perfectFiles" -ForegroundColor Green
Write-Host "Archivos con problemas: $($blogFiles.Count - $perfectFiles)" -ForegroundColor $(if($perfectFiles -eq $blogFiles.Count){'Green'}else{'Yellow'})

if ($issues.Count -gt 0) {
    Write-Host "`n=== PROBLEMAS DETECTADOS ===" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "  - $issue" -ForegroundColor Red
    }
} else {
    Write-Host "`n🎉 ¡TODOS LOS BLOGS TIENEN EL MISMO ESTILO UNIFICADO!" -ForegroundColor Green
}

$percentage = [math]::Round(($perfectFiles / $blogFiles.Count) * 100, 1)
Write-Host "`nPorcentaje de unificación: $percentage%" -ForegroundColor $(if($percentage -eq 100){'Green'}else{'Yellow'})

Write-Host "`n=== VERIFICACION COMPLETADA ===" -ForegroundColor Green 