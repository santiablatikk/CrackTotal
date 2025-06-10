# Script simplificado para corregir problemas de codificación en archivos HTML

Write-Host "=== Corrección de problemas de codificación en archivos HTML ===" -ForegroundColor Cyan
Write-Host ""

$archivosCorregidos = 0
$totalArchivos = (Get-ChildItem -Filter "*.html").Count

Write-Host "Analizando $totalArchivos archivos HTML..." -ForegroundColor Yellow
Write-Host ""

# Procesamos los archivos HTML
foreach ($archivo in Get-ChildItem -Filter "*.html") {
    Write-Host "Analizando: $($archivo.Name)" -NoNewline
    
    $contenido = Get-Content $archivo.FullName -Raw
    $contenidoOriginal = $contenido
    
    # Aplicamos los reemplazos comunes
    $contenido = $contenido -replace "Navegacié³n", "Navegación"
    $contenido = $contenido -replace "navegacié³n", "navegación"
    $contenido = $contenido -replace "menÃº", "menú"
    $contenido = $contenido -replace "configuraciÃ³n", "configuración"
    $contenido = $contenido -replace "informaciÃ³n", "información"
    $contenido = $contenido -replace "atenciÃ³n", "atención"
    $contenido = $contenido -replace "fÃºtbol", "fútbol"
    $contenido = $contenido -replace "Pé¡gina", "Página"
    $contenido = $contenido -replace "buscé¡s", "buscás"
    $contenido = $contenido -replace "Més", "Más"
    $contenido = $contenido -replace "MÃ¡s", "Más"
    $contenido = $contenido -replace "Ã©frica", "África"
    $contenido = $contenido -replace "éfrica", "África"
    $contenido = $contenido -replace "Ã¡", "á"
    $contenido = $contenido -replace "Ã©", "é"
    $contenido = $contenido -replace "Ã­", "í"
    $contenido = $contenido -replace "Ã³", "ó"
    $contenido = $contenido -replace "Ãº", "ú"
    $contenido = $contenido -replace "Ã±", "ñ"
    $contenido = $contenido -replace "é¡", "á"
    $contenido = $contenido -replace "é©", "é"
    $contenido = $contenido -replace "é³", "ó"
    $contenido = $contenido -replace "é­", "í"
    $contenido = $contenido -replace "é±", "ñ"
    
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