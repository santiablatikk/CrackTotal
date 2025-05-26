# Script para actualizar la navegacion en todos los archivos HTML
# Aplicar menu de navegacion consistente y mejorado

Write-Host "Iniciando actualizacion del menu de navegacion..." -ForegroundColor Green

# Menu de navegacion mejorado
$navigationHTML = @"
    <!-- Skip Link para accesibilidad -->
    <a href="#main-content" class="skip-link">Saltar al contenido principal</a>
    
    <nav class="main-navigation" role="navigation" aria-label="Navegacion principal">
        <a href="index.html" class="nav-logo" aria-label="Crack Total - Inicio">
            Crack Total <i class="fas fa-futbol" aria-hidden="true"></i>
        </a>
        <button class="nav-toggle" aria-label="Abrir menu de navegacion" aria-expanded="false">
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
"@

# Funcion para procesar cada archivo HTML
function Update-HTMLNavigation {
    param(
        [string]$FilePath
    )
    
    $fileName = Split-Path $FilePath -Leaf
    Write-Host "Procesando: $fileName" -ForegroundColor Cyan
    
    try {
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        
        # Verificar si ya tiene el menu nuevo
        if ($content -match '<nav class="main-navigation" role="navigation"') {
            Write-Host "   Ya tiene el menu actualizado" -ForegroundColor Green
            return
        }
        
        # Remover menus de navegacion existentes (multiples patrones)
        $patterns = @(
            '<nav class="main-navigation"[\s\S]*?</nav>',
            '<!-- Skip Link para accesibilidad -->[\s\S]*?</nav>',
            '<a href="#main-content" class="skip-link">[\s\S]*?</nav>'
        )
        
        foreach ($pattern in $patterns) {
            $content = $content -replace $pattern, ''
        }
        
        # Agregar el nuevo menu despues del <body> tag
        if ($content -match '<body[^>]*>') {
            $bodyTag = $matches[0]
            $content = $content -replace [regex]::Escape($bodyTag), "$bodyTag`n$navigationHTML"
            
            # Asegurar que el contenido principal tenga id="main-content"
            $mainContentPatterns = @(
                '<main class="([^"]*)"(?![^>]*id=)',
                '<div class="container[^"]*"(?![^>]*id=)',
                '<div class="([^"]*)-container"(?![^>]*id=)',
                '<main[^>]*(?![^>]*id=)'
            )
            
            foreach ($pattern in $mainContentPatterns) {
                if ($content -match $pattern) {
                    $originalTag = $matches[0]
                    $newTag = $originalTag -replace '>', ' id="main-content">'
                    $content = $content -replace [regex]::Escape($originalTag), $newTag -replace 'id="main-content" id="main-content"', 'id="main-content"'
                    break
                }
            }
            
            # Escribir el archivo actualizado
            $content | Out-File $FilePath -Encoding UTF8 -NoNewline
            Write-Host "   Navegacion actualizada correctamente" -ForegroundColor Green
            
        } else {
            Write-Host "   No se encontro tag <body>" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "   Error: $_" -ForegroundColor Red
    }
}

# Obtener todos los archivos HTML principales (excluyendo algunos especificos)
$excludeFiles = @('test-rankings.html', 'ads-policy.html')
$htmlFiles = Get-ChildItem "*.html" | Where-Object { 
    $_.Name -notin $excludeFiles -and 
    $_.Name -notlike "blog-detail-*" 
}

Write-Host "Encontrados $($htmlFiles.Count) archivos HTML para procesar" -ForegroundColor Magenta

# Procesar cada archivo
foreach ($file in $htmlFiles) {
    Update-HTMLNavigation -FilePath $file.FullName
}

Write-Host ""
Write-Host "Actualizacion de navegacion completada!" -ForegroundColor Green
Write-Host "Caracteristicas agregadas:" -ForegroundColor White
Write-Host "   - Skip links para accesibilidad" -ForegroundColor Gray
Write-Host "   - Menu hamburguesa responsive" -ForegroundColor Gray
Write-Host "   - Navegacion consistente en todas las paginas" -ForegroundColor Gray
Write-Host "   - ARIA labels completos" -ForegroundColor Gray
Write-Host "   - Identificacion automatica de pagina activa" -ForegroundColor Gray

Write-Host ""
Write-Host "Recuerda verificar que main.js este incluido en todos los archivos" -ForegroundColor Yellow 