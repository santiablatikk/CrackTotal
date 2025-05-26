# Script para Unificar Estilo de Todos los Blogs - Crack Total
Write-Host "=== UNIFICANDO ESTILO DE TODOS LOS BLOGS ===" -ForegroundColor Green

# Lista de todos los archivos de blog
$blogFiles = @(
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

$count = 0

foreach ($file in $blogFiles) {
    if (Test-Path $file) {
        Write-Host "Procesando: $file" -ForegroundColor Cyan
        
        $content = Get-Content $file -Raw -Encoding UTF8
        $originalContent = $content
        
        # 1. Corregir problemas de codificación
        $content = $content -replace 'NavegaciÃ³n principal', 'Navegación principal'
        $content = $content -replace 'Abrir menÃº de navegaciÃ³n', 'Abrir menú de navegación'
        $content = $content -replace 'aria-label="Navegacion principal"', 'aria-label="Navegación principal"'
        $content = $content -replace 'aria-label="Abrir menu de navegacion"', 'aria-label="Abrir menú de navegación"'
        
        # 2. Eliminar home-links duplicados
        $content = $content -replace '\s*<a href="/" class="home-link">[\s\S]*?</a>\s*', ''
        $content = $content -replace '\s*<a href="index\.html" class="home-link">[\s\S]*?</a>\s*', ''
        
        # 3. Asegurar navegación estándar correcta
        if ($content -notmatch 'role="navigation" aria-label="Navegación principal"') {
            $content = $content -replace 'class="main-navigation"', 'class="main-navigation" role="navigation" aria-label="Navegación principal"'
        }
        
        # 4. Agregar main-content ID si no existe
        if ($content -notmatch 'id="main-content"') {
            # Buscar diferentes patrones donde agregar main-content
            if ($content -match '<div class="blog-detail-screen page-container">') {
                $content = $content -replace '<div class="blog-detail-screen page-container">', '<div class="blog-detail-screen page-container" id="main-content">'
            } elseif ($content -match '<div class="page-container blog-detail-container">') {
                $content = $content -replace '<div class="page-container blog-detail-container">', '<div class="page-container blog-detail-container" id="main-content">'
            } elseif ($content -match '<div class="blog-detail-container">') {
                $content = $content -replace '<div class="blog-detail-container">', '<div class="blog-detail-container" id="main-content">'
            }
        }
        
        # 5. Asegurar breadcrumbs consistente
        if ($content -notmatch 'class="breadcrumbs-container"') {
            # Agregar breadcrumbs después de la navegación si no existen
            $breadcrumbsHtml = @'

    <div class="breadcrumbs-container">
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="/">Inicio</a></li>
                <li class="breadcrumb-item"><a href="blog.html">Blog</a></li>
                <li class="breadcrumb-item active" aria-current="page">Artículo</li>
            </ol>
        </nav>
    </div>
'@
            $content = $content -replace '(</nav>\s*)', "`$1$breadcrumbsHtml"
        }
        
        # 6. Asegurar header consistente (app-header)
        if ($content -notmatch 'class="app-header"') {
            # Si tiene otro tipo de header, reemplazarlo
            if ($content -match '<header class="blog-detail-header">[\s\S]*?</header>') {
                $standardHeader = @'
    <header class="app-header">
        <div class="logo-animation">
            <i class="fas fa-futbol ball-icon bounce"></i>
        </div>
        <a href="games.html" class="title-link">
            <h1 class="title-text">Crack Total</h1>
        </a>
        <p class="subtitle">Blog de Fútbol</p>
    </header>
'@
                $content = $content -replace '<header class="blog-detail-header">[\s\S]*?</header>', $standardHeader
            }
        }
        
        # 7. Verificar y reportar cambios
        if ($content -ne $originalContent) {
            $content | Out-File -FilePath $file -Encoding UTF8 -NoNewline
            Write-Host "✅ $file - Estilo unificado correctamente" -ForegroundColor Green
            $count++
        } else {
            Write-Host "✅ $file - Ya tenía el estilo correcto" -ForegroundColor Cyan
        }
        
        # 8. Verificar elementos importantes
        $hasMainContent = $content -match 'id="main-content"'
        $hasCorrectNav = $content -match 'role="navigation" aria-label="Navegación principal"'
        $hasAppHeader = $content -match 'class="app-header"'
        $hasBreadcrumbs = $content -match 'class="breadcrumbs-container"'
        
        Write-Host "   - Main Content: $(if($hasMainContent){'✅'}else{'❌'})" -ForegroundColor $(if($hasMainContent){'Green'}else{'Red'})
        Write-Host "   - Navegación: $(if($hasCorrectNav){'✅'}else{'❌'})" -ForegroundColor $(if($hasCorrectNav){'Green'}else{'Red'})
        Write-Host "   - App Header: $(if($hasAppHeader){'✅'}else{'❌'})" -ForegroundColor $(if($hasAppHeader){'Green'}else{'Red'})
        Write-Host "   - Breadcrumbs: $(if($hasBreadcrumbs){'✅'}else{'❌'})" -ForegroundColor $(if($hasBreadcrumbs){'Green'}else{'Red'})
        Write-Host ""
    } else {
        Write-Host "❌ $file - Archivo no encontrado" -ForegroundColor Red
    }
}

Write-Host "`n=== RESUMEN FINAL ===" -ForegroundColor Green
Write-Host "Archivos procesados: $($blogFiles.Count)" -ForegroundColor White
Write-Host "Archivos modificados: $count" -ForegroundColor Yellow
Write-Host "Unificación de blogs completada." -ForegroundColor Green 
Write-Host "=== UNIFICANDO ESTILO DE TODOS LOS BLOGS ===" -ForegroundColor Green

# Lista de todos los archivos de blog
$blogFiles = @(
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

$count = 0

foreach ($file in $blogFiles) {
    if (Test-Path $file) {
        Write-Host "Procesando: $file" -ForegroundColor Cyan
        
        $content = Get-Content $file -Raw -Encoding UTF8
        $originalContent = $content
        
        # 1. Corregir problemas de codificación
        $content = $content -replace 'NavegaciÃ³n principal', 'Navegación principal'
        $content = $content -replace 'Abrir menÃº de navegaciÃ³n', 'Abrir menú de navegación'
        $content = $content -replace 'aria-label="Navegacion principal"', 'aria-label="Navegación principal"'
        $content = $content -replace 'aria-label="Abrir menu de navegacion"', 'aria-label="Abrir menú de navegación"'
        
        # 2. Eliminar home-links duplicados
        $content = $content -replace '\s*<a href="/" class="home-link">[\s\S]*?</a>\s*', ''
        $content = $content -replace '\s*<a href="index\.html" class="home-link">[\s\S]*?</a>\s*', ''
        
        # 3. Asegurar navegación estándar correcta
        if ($content -notmatch 'role="navigation" aria-label="Navegación principal"') {
            $content = $content -replace 'class="main-navigation"', 'class="main-navigation" role="navigation" aria-label="Navegación principal"'
        }
        
        # 4. Agregar main-content ID si no existe
        if ($content -notmatch 'id="main-content"') {
            # Buscar diferentes patrones donde agregar main-content
            if ($content -match '<div class="blog-detail-screen page-container">') {
                $content = $content -replace '<div class="blog-detail-screen page-container">', '<div class="blog-detail-screen page-container" id="main-content">'
            } elseif ($content -match '<div class="page-container blog-detail-container">') {
                $content = $content -replace '<div class="page-container blog-detail-container">', '<div class="page-container blog-detail-container" id="main-content">'
            } elseif ($content -match '<div class="blog-detail-container">') {
                $content = $content -replace '<div class="blog-detail-container">', '<div class="blog-detail-container" id="main-content">'
            }
        }
        
        # 5. Asegurar breadcrumbs consistente
        if ($content -notmatch 'class="breadcrumbs-container"') {
            # Agregar breadcrumbs después de la navegación si no existen
            $breadcrumbsHtml = @'

    <div class="breadcrumbs-container">
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="/">Inicio</a></li>
                <li class="breadcrumb-item"><a href="blog.html">Blog</a></li>
                <li class="breadcrumb-item active" aria-current="page">Artículo</li>
            </ol>
        </nav>
    </div>
'@
            $content = $content -replace '(</nav>\s*)', "`$1$breadcrumbsHtml"
        }
        
        # 6. Asegurar header consistente (app-header)
        if ($content -notmatch 'class="app-header"') {
            # Si tiene otro tipo de header, reemplazarlo
            if ($content -match '<header class="blog-detail-header">[\s\S]*?</header>') {
                $standardHeader = @'
    <header class="app-header">
        <div class="logo-animation">
            <i class="fas fa-futbol ball-icon bounce"></i>
        </div>
        <a href="games.html" class="title-link">
            <h1 class="title-text">Crack Total</h1>
        </a>
        <p class="subtitle">Blog de Fútbol</p>
    </header>
'@
                $content = $content -replace '<header class="blog-detail-header">[\s\S]*?</header>', $standardHeader
            }
        }
        
        # 7. Verificar y reportar cambios
        if ($content -ne $originalContent) {
            $content | Out-File -FilePath $file -Encoding UTF8 -NoNewline
            Write-Host "✅ $file - Estilo unificado correctamente" -ForegroundColor Green
            $count++
        } else {
            Write-Host "✅ $file - Ya tenía el estilo correcto" -ForegroundColor Cyan
        }
        
        # 8. Verificar elementos importantes
        $hasMainContent = $content -match 'id="main-content"'
        $hasCorrectNav = $content -match 'role="navigation" aria-label="Navegación principal"'
        $hasAppHeader = $content -match 'class="app-header"'
        $hasBreadcrumbs = $content -match 'class="breadcrumbs-container"'
        
        Write-Host "   - Main Content: $(if($hasMainContent){'✅'}else{'❌'})" -ForegroundColor $(if($hasMainContent){'Green'}else{'Red'})
        Write-Host "   - Navegación: $(if($hasCorrectNav){'✅'}else{'❌'})" -ForegroundColor $(if($hasCorrectNav){'Green'}else{'Red'})
        Write-Host "   - App Header: $(if($hasAppHeader){'✅'}else{'❌'})" -ForegroundColor $(if($hasAppHeader){'Green'}else{'Red'})
        Write-Host "   - Breadcrumbs: $(if($hasBreadcrumbs){'✅'}else{'❌'})" -ForegroundColor $(if($hasBreadcrumbs){'Green'}else{'Red'})
        Write-Host ""
    } else {
        Write-Host "❌ $file - Archivo no encontrado" -ForegroundColor Red
    }
}

Write-Host "`n=== RESUMEN FINAL ===" -ForegroundColor Green
Write-Host "Archivos procesados: $($blogFiles.Count)" -ForegroundColor White
Write-Host "Archivos modificados: $count" -ForegroundColor Yellow
Write-Host "Unificación de blogs completada." -ForegroundColor Green 