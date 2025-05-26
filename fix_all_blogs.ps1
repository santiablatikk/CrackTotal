# Script para actualizar navegación en todos los archivos de blog
# Crack Total - Fix All Blogs Navigation

Write-Host "=== Actualizando navegación en archivos de blog ===" -ForegroundColor Green

# Lista de archivos de blog
$blogFiles = @(
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

$count = 0

foreach ($file in $blogFiles) {
    if (Test-Path $file) {
        Write-Host "Procesando: $file" -ForegroundColor Cyan
        
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Reemplazar navegación incompleta
        $oldNav = '<nav class="main-navigation">\s*<ul>.*?</ul>\s*</nav>'
        $newNav = @'
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
        
        if ($content -match $oldNav) {
            $content = $content -replace $oldNav, $newNav
            Write-Host "  ✅ Navegación actualizada" -ForegroundColor Green
        }
        
        # Añadir id="main-content" si no existe
        if ($content -notmatch 'id="main-content"') {
            $content = $content -replace '(<div class="blog-detail-screen page-container")', '$1 id="main-content"'
            $content = $content -replace '(<div class="page-container")', '$1 id="main-content"'
            $content = $content -replace '(<main class="[^"]*")', '$1 id="main-content"'
            Write-Host "  ✅ id='main-content' añadido" -ForegroundColor Green
        }
        
        # Guardar archivo
        $content | Out-File -FilePath $file -Encoding UTF8 -NoNewline
        $count++
        
    } else {
        Write-Host "  ❌ Archivo no encontrado: $file" -ForegroundColor Red
    }
}

Write-Host "`n=== Resumen ===" -ForegroundColor Green
Write-Host "Archivos procesados: $count" -ForegroundColor White
Write-Host "Navegación actualizada en archivos de blog." -ForegroundColor Green 