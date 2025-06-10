# Script para corregir problemas de codificación en archivos HTML
# Este script corrige automáticamente los caracteres mal codificados en español

Write-Host "=== Corrección de problemas de codificación en archivos HTML ===" -ForegroundColor Cyan
Write-Host ""

$archivosCorregidos = 0
$totalArchivos = (Get-ChildItem -Filter "*.html").Count

Write-Host "Analizando $totalArchivos archivos HTML..." -ForegroundColor Yellow
Write-Host ""

# Diccionario de reemplazos
$reemplazos = @{
    # Tildes
    "Ã¡" = "á"
    "Ã©" = "é"
    "Ã­" = "í"
    "Ã³" = "ó"
    "Ãº" = "ú"
    "Ã±" = "ñ"
    
    # Mayúsculas con tilde
    "Ã€" = "Á"
    "Ã‰" = "É"
    "ÃŒ" = "Í"
    "Ã"" = "Ó"
    "Ãš" = "Ú"
    "Ã'" = "Ñ"
    
    # Problemas específicos encontrados
    "Navegacié³n" = "Navegación"
    "navegacié³n" = "navegación"
    "menÃº" = "menú"
    "configuraciÃ³n" = "configuración"
    "informaciÃ³n" = "información"
    "atenciÃ³n" = "atención"
    "fÃºtbol" = "fútbol"
    "Pé¡gina" = "Página"
    "buscé¡s" = "buscás"
    "Més" = "Más"
    "polÃ­tica" = "política"
    "polÃ©tica" = "política"
    "histÃ³rica" = "histórica"
    "histérica" = "histórica"
    "econémico" = "económico"
    "clésico" = "clásico"
    "Clésico" = "Clásico"
    "é¡" = "á"
    "é©" = "é"
    "é³" = "ó"
    "é­" = "í"
    "é±" = "ñ"
    "Ã©frica" = "África"
    "éfrica" = "África"
    "Préximo" = "Próximo"
    "éltimo" = "último"
    "paé­ses" = "países"
    "espaé±ol" = "español"
    "MÃ¡s" = "Más"
    "â‚¬" = "€"
    "Ãšltimo" = "Último"
    "GrÃ¡ficos" = "Gráficos"
    "Fenerbahé" = "Fenerbahçe"
    "turÃ­stico" = "turístico"
    "tÃ©cnicas" = "técnicas"
    "tÃ©cnico" = "técnico"
    "Ã‰xitos" = "Éxitos"
    "ã‰xitos" = "Éxitos"
    "ã‰xito" = "Éxito"
    "futbolã­stico" = "futbolístico"
    "MÃºnich" = "Múnich"
    "posiciÃ³n" = "posición"
    "tã©cnico" = "técnico"
    "lÃ­der" = "líder"
    "mÃ¡ximo" = "máximo"
    "competiciÃ³n" = "competición"
    "campeÃ³n" = "campeón"
    "ã¿quã©" = "¿Qué"
}

# Contador para seguimiento
$contadorArchivos = 0

# Recorrer todos los archivos HTML
foreach ($archivo in Get-ChildItem -Filter "*.html") {
    $contadorArchivos++
    Write-Host "[$contadorArchivos/$totalArchivos] Analizando: $($archivo.Name)" -NoNewline
    
    $contenido = Get-Content $archivo.FullName -Raw
    $contenidoOriginal = $contenido
    $modificado = $false
    
    # Aplicar cada reemplazo al contenido
    foreach ($clave in $reemplazos.Keys) {
        if ($contenido -match [regex]::Escape($clave)) {
            $contenido = $contenido -replace [regex]::Escape($clave), $reemplazos[$clave]
            $modificado = $true
        }
    }
    
    # Si hubo cambios, guardar el archivo
    if ($modificado) {
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
Write-Host "Proceso completado. Todos los archivos HTML han sido revisados y corregidos." -ForegroundColor Cyan