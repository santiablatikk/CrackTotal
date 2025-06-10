# Script para corregir todos los errores de codificación en los archivos de blog
# Enfoque radical para garantizar que se eliminen todos los problemas

Write-Host "=== Corrección radical de errores de codificación en archivos de blog ===" -ForegroundColor Cyan
Write-Host ""

$totalArchivos = (Get-ChildItem -Filter "blog-detail-*.html").Count
$archivosCorregidos = 0

Write-Host "Procesando $totalArchivos archivos de blog..." -ForegroundColor Yellow
Write-Host ""

# Lista de reemplazos de caracteres especiales
$reemplazos = @(
    # Vocales con tilde
    @{ Buscar = "é¡"; Reemplazar = "á" },
    @{ Buscar = "é©"; Reemplazar = "é" },
    @{ Buscar = "é­"; Reemplazar = "í" },
    @{ Buscar = "é³"; Reemplazar = "ó" },
    @{ Buscar = "éº"; Reemplazar = "ú" },
    @{ Buscar = "é±"; Reemplazar = "ñ" },
    @{ Buscar = "Ã¡"; Reemplazar = "á" },
    @{ Buscar = "Ã©"; Reemplazar = "é" },
    @{ Buscar = "Ã­"; Reemplazar = "í" },
    @{ Buscar = "Ã³"; Reemplazar = "ó" },
    @{ Buscar = "Ãº"; Reemplazar = "ú" },
    @{ Buscar = "Ã±"; Reemplazar = "ñ" },
    
    # Navegación
    @{ Buscar = "Navegacié³n"; Reemplazar = "Navegación" },
    @{ Buscar = "navegacié³n"; Reemplazar = "navegación" },
    @{ Buscar = "menÃº"; Reemplazar = "menú" },
    
    # Palabras comunes
    @{ Buscar = "configuraciÃ³n"; Reemplazar = "configuración" },
    @{ Buscar = "informaciÃ³n"; Reemplazar = "información" },
    @{ Buscar = "atenciÃ³n"; Reemplazar = "atención" },
    @{ Buscar = "posicié³n"; Reemplazar = "posición" },
    @{ Buscar = "generacié³n"; Reemplazar = "generación" },
    @{ Buscar = "seleccié³n"; Reemplazar = "selección" },
    @{ Buscar = "competicié³n"; Reemplazar = "competición" },
    @{ Buscar = "distribucié³n"; Reemplazar = "distribución" },
    @{ Buscar = "asociacié³n"; Reemplazar = "asociación" },
    @{ Buscar = "conclusié³n"; Reemplazar = "conclusión" },
    @{ Buscar = "adaptacié³n"; Reemplazar = "adaptación" },
    @{ Buscar = "formacié³n"; Reemplazar = "formación" },
    @{ Buscar = "proyeccié³n"; Reemplazar = "proyección" },
    @{ Buscar = "exposicié³n"; Reemplazar = "exposición" },
    @{ Buscar = "evolucié³n"; Reemplazar = "evolución" },
    
    # Palabras específicas
    @{ Buscar = "fené³meno"; Reemplazar = "fenómeno" },
    @{ Buscar = "julié¡n"; Reemplazar = "julián" },
    @{ Buscar = "Julié¡n"; Reemplazar = "Julián" },
    @{ Buscar = "élvarez"; Reemplazar = "Álvarez" },
    @{ Buscar = "atlé©tico"; Reemplazar = "atlético" },
    @{ Buscar = "Atlé©tico"; Reemplazar = "Atlético" },
    @{ Buscar = "Té­tulos"; Reemplazar = "Títulos" },
    @{ Buscar = "té­tulos"; Reemplazar = "títulos" },
    @{ Buscar = "té©cnico"; Reemplazar = "técnico" },
    @{ Buscar = "Té©cnico"; Reemplazar = "Técnico" },
    @{ Buscar = "estadé­sticas"; Reemplazar = "estadísticas" },
    @{ Buscar = "Estadé­sticas"; Reemplazar = "Estadísticas" },
    @{ Buscar = "Marté­nez"; Reemplazar = "Martínez" },
    @{ Buscar = "marté­nez"; Reemplazar = "martínez" },
    @{ Buscar = "guardié¡n"; Reemplazar = "guardián" },
    @{ Buscar = "Guardié¡n"; Reemplazar = "Guardián" },
    @{ Buscar = "Més"; Reemplazar = "Más" },
    @{ Buscar = "MáS"; Reemplazar = "más" },
    @{ Buscar = "MÃ¡s"; Reemplazar = "Más" },
    @{ Buscar = "milé¡n"; Reemplazar = "milán" },
    @{ Buscar = "Milé¡n"; Reemplazar = "Milán" },
    @{ Buscar = "aé±o"; Reemplazar = "año" },
    @{ Buscar = "Aé±o"; Reemplazar = "Año" },
    @{ Buscar = "ferné¡ndez"; Reemplazar = "fernández" },
    @{ Buscar = "Ferné¡ndez"; Reemplazar = "Fernández" },
    @{ Buscar = "arté­culos"; Reemplazar = "artículos" },
    @{ Buscar = "Arté­culos"; Reemplazar = "Artículos" },
    
    # Símbolos y otros
    @{ Buscar = "â†'"; Reemplazar = "→" },
    @{ Buscar = "â‚¬"; Reemplazar = "€" },
    @{ Buscar = "Â"; Reemplazar = "" },
    
    # Nombres propios
    @{ Buscar = "Jé¼rgen"; Reemplazar = "Jürgen" },
    @{ Buscar = "é©rica"; Reemplazar = "érica" },
    @{ Buscar = "Amé©rica"; Reemplazar = "América" },
    @{ Buscar = "mé©xico"; Reemplazar = "méxico" },
    @{ Buscar = "Mé©xico"; Reemplazar = "México" },
    @{ Buscar = "canadé¡"; Reemplazar = "canadá" },
    @{ Buscar = "Canadé¡"; Reemplazar = "Canadá" },
    @{ Buscar = "espaé±ol"; Reemplazar = "español" },
    @{ Buscar = "Espaé±ol"; Reemplazar = "Español" },
    @{ Buscar = "paé­ses"; Reemplazar = "países" },
    @{ Buscar = "Paé­ses"; Reemplazar = "Países" }
)

foreach ($archivo in Get-ChildItem -Filter "blog-detail-*.html") {
    Write-Host "Procesando $($archivo.Name)..." -NoNewline
    
    # Leer el contenido del archivo
    $contenido = Get-Content $archivo.FullName -Raw
    $contenidoOriginal = $contenido
    
    # Aplicar todos los reemplazos
    foreach ($reemplazo in $reemplazos) {
        $contenido = $contenido -replace $reemplazo.Buscar, $reemplazo.Reemplazar
    }
    
    # Corregir casos específicos de "Más" que deberían ser "más" (minúscula)
    $contenido = $contenido -replace "figuras Más", "figuras más"
    $contenido = $contenido -replace "eventos Más", "eventos más"
    $contenido = $contenido -replace "jugador Más", "jugador más"
    
    # Si hubo cambios, guardar el archivo
    if ($contenido -ne $contenidoOriginal) {
        $archivosCorregidos++
        Write-Host " - CORREGIDO" -ForegroundColor Green
        $contenido | Set-Content $archivo.FullName -Encoding UTF8
    } else {
        Write-Host " - Sin cambios" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== Resumen ===" -ForegroundColor Cyan
Write-Host "Total archivos revisados: $totalArchivos" -ForegroundColor White
Write-Host "Archivos corregidos: $archivosCorregidos" -ForegroundColor Green
Write-Host ""
Write-Host "Proceso completado." -ForegroundColor Cyan 