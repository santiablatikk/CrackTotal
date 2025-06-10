# Script mejorado para corregir problemas de codificación en archivos HTML
# Usa una estrategia más directa para garantizar que se corrijan los errores

Write-Host "=== Corrección de problemas de codificación en archivos HTML ===" -ForegroundColor Cyan
Write-Host ""

$archivosCorregidos = 0
$totalArchivos = (Get-ChildItem -Filter "blog-detail-*.html").Count

Write-Host "Analizando $totalArchivos archivos blog-detail-*.html..." -ForegroundColor Yellow
Write-Host ""

# Función para reemplazar caracteres problemáticos
function Fix-Encoding($text) {
    # Problemas comunes específicos
    $text = $text -replace "Navegacié³n", "Navegación"
    $text = $text -replace "navegacié³n", "navegación"
    $text = $text -replace "menÃº", "menú"
    $text = $text -replace "configuraciÃ³n", "configuración"
    $text = $text -replace "informaciÃ³n", "información"
    $text = $text -replace "atenciÃ³n", "atención"
    
    # Vocales con tildes
    $text = $text -replace "Ã¡", "á"
    $text = $text -replace "Ã©", "é"
    $text = $text -replace "Ã­", "í"
    $text = $text -replace "Ã³", "ó"
    $text = $text -replace "Ãº", "ú"
    $text = $text -replace "Ã±", "ñ"
    
    # Formato diferente de vocales con tildes
    $text = $text -replace "é¡", "á"
    $text = $text -replace "é©", "é"
    $text = $text -replace "é³", "ó"
    $text = $text -replace "é­", "í"
    $text = $text -replace "é±", "ñ"
    
    # Mayúsculas con tilde
    $text = $text -replace "MÃ¡s", "Más"
    $text = $text -replace "MÃ©s", "Más"
    $text = $text -replace "MÃ¡ximo", "Máximo"
    
    # Palabras específicas con problemas
    $text = $text -replace "fÃºtbol", "fútbol"
    $text = $text -replace "Pé¡gina", "Página"
    $text = $text -replace "buscé¡s", "buscás"
    $text = $text -replace "Més", "Más"
    $text = $text -replace "polÃ­tica", "política"
    $text = $text -replace "polÃ©tica", "política"
    $text = $text -replace "histÃ³rica", "histórica"
    $text = $text -replace "histérica", "histórica"
    $text = $text -replace "econémico", "económico"
    $text = $text -replace "clésico", "clásico"
    $text = $text -replace "Clésico", "Clásico"
    $text = $text -replace "Ã©frica", "África"
    $text = $text -replace "éfrica", "África"
    $text = $text -replace "Préximo", "Próximo"
    $text = $text -replace "éltimo", "último"
    $text = $text -replace "paé­ses", "países"
    $text = $text -replace "espaé±ol", "español"
    
    # Nombres propios y términos específicos
    $text = $text -replace "Fenerbahé", "Fenerbahçe"
    $text = $text -replace "Milén", "Milán"
    $text = $text -replace "Teherén", "Teherán"
    $text = $text -replace "MÃºnich", "Múnich"
    
    # Otros casos especiales
    $text = $text -replace "é¡s", "ás"
    $text = $text -replace "Ã©x", "éx"
    $text = $text -replace "Ã¿", "¿"
    $text = $text -replace "Ãºn", "ún"
    $text = $text -replace "â‚¬", "€"
    
    # Párrafos problemáticos específicos
    $text = $text -replace "Las <strong>rivalidades clásicas del fútbol mundial</strong> representan mucho Más que simples partidos de fútbol.", "Las <strong>rivalidades clásicas del fútbol mundial</strong> representan mucho más que simples partidos de fútbol."
    
    return $text
}

# Procesar los archivos de blog-detail-*.html
foreach ($archivo in Get-ChildItem -Filter "blog-detail-*.html") {
    Write-Host "Procesando: $($archivo.Name)" -NoNewline
    
    # Leer el contenido del archivo
    $contenido = Get-Content $archivo.FullName -Raw -Encoding UTF8
    $contenidoOriginal = $contenido
    
    # Corregir la codificación
    $contenido = Fix-Encoding -text $contenido
    
    # Si hubo cambios, guardar el archivo
    if ($contenido -ne $contenidoOriginal) {
        $archivosCorregidos++
        Write-Host " - CORREGIDO" -ForegroundColor Green
        $contenido | Set-Content $archivo.FullName -Encoding UTF8
    } else {
        Write-Host " - OK" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== Resumen ===" -ForegroundColor Cyan
Write-Host "Total archivos revisados: $totalArchivos" -ForegroundColor White
Write-Host "Archivos corregidos: $archivosCorregidos" -ForegroundColor Green
Write-Host ""
Write-Host "Proceso completado." -ForegroundColor Cyan 