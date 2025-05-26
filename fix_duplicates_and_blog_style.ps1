# Script para corregir navegaciones duplicadas y unificar estilos de blog
# Crack Total - Fix Duplicates and Blog Style

Write-Host "=== Iniciando corrección de duplicados y unificación de estilos de blog ===" -ForegroundColor Green
Write-Host "Procesando archivos HTML..." -ForegroundColor Yellow

# Navegación estándar para blogs con Skip Link y navegación completa
$standardBlogNavigation = @'
    <!-- Skip Link para accesibilidad -->
    <a href="#main-content" class="skip-link">Saltar al contenido principal</a>
    
    <nav class="main-navigation" role="navigation" aria-label="Navegación principal">
        <a href="index.html" class="nav-logo" aria-label="Crack Total - Inicio">
            Crack Total <i class="fas fa-futbol" aria-hidden="true"></i>
        </a>
        <button class="nav-toggle" aria-label="Abrir menú de navegación" aria-expanded="false">
            <i class="fas fa-bars" aria-hidden="true"></i>
        </button>
        <ul>
            <li><a href="index.html" aria-label="Ir al inicio"><i class="fas fa-home" aria-hidden="true"></i> Inicio</a></li>
            <li><a href="games.html" aria-label="Ir a los juegos"><i class="fas fa-gamepad" aria-hidden="true"></i> Juegos</a></li>
            <li><a href="profile.html" aria-label="Ver mi perfil"><i class="fas fa-user" aria-hidden="true"></i> Perfil</a></li>
            <li><a href="ranking.html" aria-label="Ver ranking general"><i class="fas fa-trophy" aria-hidden="true"></i> Rankings</a></li>
            <li><a href="logros.html" aria-label="Ver mis logros"><i class="fas fa-medal" aria-hidden="true"></i> Logros</a></li>
            <li><a href="blog.html" aria-label="Leer el blog"><i class="fas fa-blog" aria-hidden="true"></i> Blog</a></li>
            <li><a href="about.html" aria-label="Acerca de nosotros"><i class="fas fa-info-circle" aria-hidden="true"></i> Acerca de</a></li>
            <li><a href="contact.html" aria-label="Contactar con nosotros"><i class="fas fa-envelope" aria-hidden="true"></i> Contacto</a></li>
        </ul>
    </nav>
'@

# Lista de archivos de blog que necesitan ser actualizados
$blogFiles = @(
    "blog-detail-worldcups.html",
    "blog-detail-tactics-football.html", 
    "blog-detail-scaloneta.html",
    "blog-detail-messi.html",
    "blog-detail-liga-argentina.html",
    "blog-detail-libertadores.html",
    "blog-detail-legends.html",
    "blog-detail-historia-mundial.html",
    "blog-detail-estilos-juego.html",
    "blog-detail-community.html",
    "blog-detail-champions.html",
    "ads-policy.html"
)

$processedFiles = 0
$totalFiles = $blogFiles.Count

foreach ($file in $blogFiles) {
    if (Test-Path $file) {
        Write-Host "Procesando: $file" -ForegroundColor Cyan
        
        try {
            # Leer el contenido del archivo
            $content = Get-Content $file -Raw -Encoding UTF8
            
            # Buscar el patrón de navegación existente (incompleta)
            $oldNavPattern = '<nav class="main-navigation">\s*<ul>.*?</ul>\s*</nav>'
            
            # Verificar si existe navegación incompleta sin role y aria-label
            if ($content -match $oldNavPattern) {
                Write-Host "  - Navegación incompleta encontrada, reemplazando..." -ForegroundColor Yellow
                
                # Reemplazar la navegación incompleta con la navegación estándar
                $content = $content -replace $oldNavPattern, $standardBlogNavigation
                
                # Guardar el archivo actualizado
                $content | Out-File -FilePath $file -Encoding UTF8 -NoNewline
                
                Write-Host "  ✅ Archivo actualizado correctamente" -ForegroundColor Green
                $processedFiles++
            } else {
                Write-Host "  - No necesita actualización de navegación" -ForegroundColor Gray
            }
            
            # Verificar si ya tiene Skip Link
            if ($content -notmatch 'class="skip-link"') {
                Write-Host "  - Añadiendo Skip Link..." -ForegroundColor Yellow
                
                # Buscar <body> y añadir Skip Link después
                $content = $content -replace '(<body[^>]*>)', "`$1`n    <!-- Skip Link para accesibilidad -->`n    <a href=`"#main-content`" class=`"skip-link`">Saltar al contenido principal</a>`n"
                
                # Guardar el archivo actualizado
                $content | Out-File -FilePath $file -Encoding UTF8 -NoNewline
                
                Write-Host "  ✅ Skip Link añadido" -ForegroundColor Green
            }
            
        } catch {
            Write-Host "  ❌ Error procesando $file`: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠️ Archivo no encontrado: $file" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Resumen de procesamiento ===" -ForegroundColor Green
Write-Host "Archivos procesados: $processedFiles de $totalFiles" -ForegroundColor White
Write-Host "Correcciones completadas exitosamente." -ForegroundColor Green

Write-Host "`n=== Verificando otros archivos HTML para duplicados ===" -ForegroundColor Yellow

# Lista de otros archivos HTML para verificar
$otherHtmlFiles = @(
    "index.html",
    "games.html", 
    "profile.html",
    "ranking.html",
    "contact.html",
    "about.html",
    "cookies.html",
    "privacy.html",
    "terminos.html",
    "logros.html",
    "blog.html",
    "pasalache.html",
    "quiensabemas.html",
    "mentiroso.html",
    "ranking-mentiroso.html",
    "ranking-quiensabemas.html"
)

foreach ($file in $otherHtmlFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Contar instancias de <nav class="main-navigation"
        $navMatches = ([regex]'<nav class="main-navigation"').Matches($content)
        
        if ($navMatches.Count -gt 1) {
            Write-Host "⚠️ DUPLICADO encontrado en $file`: $($navMatches.Count) navegaciones principales" -ForegroundColor Red
        } else {
            Write-Host "✅ $file`: OK (1 navegación principal)" -ForegroundColor Gray
        }
    }
}

Write-Host "`n=== Script completado ===" -ForegroundColor Green 