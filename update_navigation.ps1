# Script para actualizar navegación principal en todos los archivos HTML
$files = @(
    "mentiroso.html",
    "quiensabemas.html", 
    "about.html",
    "blog.html",
    "contact.html",
    "cookies.html",
    "privacy.html",
    "terminos.html",
    "ads-policy.html",
    "logros.html"
)

$oldNavigation = @'
    <nav class="main-navigation">
        <ul>
            <li><a href="profile.html"><i class="fas fa-user"></i> Perfil</a></li>
            <li><a href="ranking.html"><i class="fas fa-trophy"></i> Ranking</a></li>
            <li><a href="logros.html"><i class="fas fa-medal"></i> Logros</a></li>
            <li><a href="blog.html"><i class="fas fa-blog"></i> Blog</a></li>
            <li><a href="about.html"><i class="fas fa-info-circle"></i> Acerca de</a></li>
            <li><a href="contact.html"><i class="fas fa-envelope"></i> Contacto</a></li>
        </ul>
    </nav>
'@

$newNavigation = @'
    <nav class="main-navigation">
        <ul>
            <li><a href="profile.html"><i class="fas fa-user"></i> Perfil</a></li>
            <li><a href="ranking.html"><i class="fas fa-trophy"></i> Ranking</a></li>
            <li><a href="ranking-mentiroso.html"><i class="fas fa-mask"></i> Ranking Mentiroso</a></li>
            <li><a href="ranking-quiensabemas.html"><i class="fas fa-brain"></i> Ranking Quién Sabe Más</a></li>
            <li><a href="logros.html"><i class="fas fa-medal"></i> Logros</a></li>
            <li><a href="blog.html"><i class="fas fa-blog"></i> Blog</a></li>
            <li><a href="about.html"><i class="fas fa-info-circle"></i> Acerca de</a></li>
            <li><a href="contact.html"><i class="fas fa-envelope"></i> Contacto</a></li>
        </ul>
    </nav>
'@

$updated = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        if ($content -match [regex]::Escape($oldNavigation)) {
            $content = $content -replace [regex]::Escape($oldNavigation), $newNavigation
            Set-Content $file $content
            Write-Host "✅ Actualizado: $file" -ForegroundColor Green
            $updated++
        } else {
            Write-Host "⚠️  No encontrada navegación antigua en: $file" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Archivo no encontrado: $file" -ForegroundColor Red
    }
}

Write-Host "`n🎯 Archivos actualizados: $updated de $($files.Count)" -ForegroundColor Cyan
Write-Host "🚀 Navegación principal actualizada con los nuevos rankings!" -ForegroundColor Green 