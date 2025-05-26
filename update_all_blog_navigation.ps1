# Script para actualizar navegación en todos los archivos de blog restantes
# Crack Total - Update All Blog Navigation

Write-Host "=== Actualizando navegación en archivos de blog restantes ===" -ForegroundColor Green

# Lista de archivos de blog restantes que necesitan actualización
$blogFiles = @(
    "blog-detail-tactics-football.html",
    "blog-detail-scaloneta.html", 
    "blog-detail-liga-argentina.html",
    "blog-detail-libertadores.html",
    "blog-detail-legends.html",
    "blog-detail-historia-mundial.html",
    "blog-detail-estilos-juego.html",
    "blog-detail-community.html",
    "blog-detail-champions.html",
    "ads-policy.html"
)

$count = 0

foreach ($file in $blogFiles) {
    if (Test-Path $file) {
        Write-Host "Procesando: $file" -ForegroundColor Cyan
        
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Patrón para encontrar navegación incompleta
        $oldNavPattern = '<nav class="main-navigation">\s*<ul>[\s\S]*?</ul>\s*</nav>'
        
        # Nueva navegación completa
        $newNavigation = @'
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
        
        # Reemplazar navegación si existe el patrón
        if ($content -match $oldNavPattern) {
            $content = $content -replace $oldNavPattern, $newNavigation
            Write-Host "  ✅ Navegación actualizada" -ForegroundColor Green
            
            # Guardar archivo
            $content | Out-File -FilePath $file -Encoding UTF8 -NoNewline
            $count++
        } else {
            Write-Host "  ⚠️ No se encontró navegación para actualizar" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "  ❌ Archivo no encontrado: $file" -ForegroundColor Red
    }
}

Write-Host "`n=== Resumen ===" -ForegroundColor Green
Write-Host "Archivos procesados: $count" -ForegroundColor White

# Verificar estado final de todos los archivos de blog
Write-Host "`n=== Verificando estado final ===" -ForegroundColor Yellow

$allBlogFiles = @(
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

foreach ($file in $allBlogFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Verificar si tiene navegación completa
        if ($content -match 'role="navigation"' -and $content -match 'aria-label="Navegación principal"') {
            Write-Host "✅ $file`: Navegación completa" -ForegroundColor Green
        } else {
            Write-Host "❌ $file`: Navegación incompleta" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== Script completado ===" -ForegroundColor Green 