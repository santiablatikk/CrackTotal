# Script para corregir problemas de codificación en blog-detail-legends.html
$file = "blog-detail-legends.html"

Write-Host "🔧 Corrigiendo codificación UTF-8 en $file..." -ForegroundColor Yellow

# Leer el contenido del archivo
$content = Get-Content $file -Raw -Encoding UTF8

# Correcciones de codificación UTF-8 (caracteres corruptos → caracteres correctos)
$corrections = @{
    'fútbol' = 'fútbol'
    'Pelé' = 'Pelé'
    'Más' = 'Más'
    'sinónimo' = 'sinónimo'
    'único' = 'único'
    'ganó' = 'ganó'
    'hacía' = 'hacía'
    'después' = 'después'
    'cómo' = 'cómo'
    'rebeldía' = 'rebeldía'
    'conquistó' = 'conquistó'
    'México' = 'México'
    'Llevó' = 'Llevó'
    'títulos' = 'títulos'
    'polémico' = 'polémico'
    'cósmico' = 'cósmico'
    'Revolucionó' = 'Revolucionó'
    'Mecánica' = 'Mecánica'
    'selección' = 'selección'
    'enamoró' = 'enamoró'
    'sinfonía' = 'sinfonía'
    'armó' = 'armó'
    'sentó' = 'sentó'
    'evolución' = 'evolución'
    'Andrés' = 'Andrés'
    'ganó' = 'ganó'
    'después' = 'después'
    'por fin se le dio' = 'por fin se le dio'
    'campeón' = 'campeón'
    'cerró' = 'cerró'
    'círculo' = 'círculo'
    'recién' = 'recién'
    'reinventándose' = 'reinventándose'
    'día' = 'día'
    'ambición' = 'ambición'
    'empezó' = 'empezó'
    'convirtió' = 'convirtió'
    'después' = 'después'
    'siguió' = 'siguió'
    'histórico' = 'histórico'
    'increíble' = 'increíble'
    'marcó' = 'marcó'
    'época' = 'época'
    'dominó' = 'dominó'
    'completísimo' = 'completísimo'
    'defendía' = 'defendía'
    'metía' = 'metía'
    'Lideró' = 'Lideró'
    'después' = 'después'
    'elegancia' = 'elegancia'
    'Nazário' = 'Nazário'
    'Fenómeno' = 'Fenómeno'
    'superó' = 'superó'
    'alegría' = 'alegría'
    'fantasía' = 'fantasía'
    'ángel' = 'ángel'
    'Puskás' = 'Puskás'
    'Cañoncito' = 'Cañoncito'
    'mágica' = 'mágica'
    'Eusébio' = 'Eusébio'
    'Müller' = 'Müller'
    'inspiración' = 'inspiración'
    'sueñan' = 'sueñan'
    'ídolos' = 'ídolos'
    'Artículo' = 'Artículo'
    'Artículos' = 'Artículos'
    'panorámica' = 'panorámica'
    'estadio' = 'estadio'
    'Evolución' = 'Evolución'
    'Mundiales' = 'Mundiales'
    'Términos' = 'Términos'
    '¿viste' = '¿viste'
    'poesía' = 'poesía'
    'sillón' = 'sillón'
    'más' = 'más'
    '¡Un' = '¡Un'
    '¡TRE-S' = '¡TRE-S'
    '¡un' = '¡un'
    '¡mil' = '¡mil'
    '¡Eso' = '¡Eso'
    '¡mamita' = '¡mamita'
    '¡Gracias' = '¡Gracias'
    '¿Qué' = '¿Qué'
    '¡siete' = '¡siete'
    '¡por' = '¡por'
    '¡Salud' = '¡Salud'
    'Artículo' = 'Artículo'
}

# Aplicar todas las correcciones
$correctionCount = 0
foreach ($incorrect in $corrections.Keys) {
    $correct = $corrections[$incorrect]
    if ($content -match [regex]::Escape($incorrect)) {
        $content = $content -replace [regex]::Escape($incorrect), $correct
        Write-Host "  ✓ $incorrect → $correct" -ForegroundColor Green
        $correctionCount++
    }
}

# Guardar el archivo corregido
$content | Out-File $file -Encoding UTF8 -NoNewline

Write-Host "✅ Codificación corregida en $file" -ForegroundColor Green
Write-Host "📊 Total de correcciones aplicadas: $correctionCount" -ForegroundColor Cyan 
$file = "blog-detail-legends.html"

Write-Host "🔧 Corrigiendo codificación UTF-8 en $file..." -ForegroundColor Yellow

# Leer el contenido del archivo
$content = Get-Content $file -Raw -Encoding UTF8

# Correcciones de codificación UTF-8 (caracteres corruptos → caracteres correctos)
$corrections = @{
    'fútbol' = 'fútbol'
    'Pelé' = 'Pelé'
    'Más' = 'Más'
    'sinónimo' = 'sinónimo'
    'único' = 'único'
    'ganó' = 'ganó'
    'hacía' = 'hacía'
    'después' = 'después'
    'cómo' = 'cómo'
    'rebeldía' = 'rebeldía'
    'conquistó' = 'conquistó'
    'México' = 'México'
    'Llevó' = 'Llevó'
    'títulos' = 'títulos'
    'polémico' = 'polémico'
    'cósmico' = 'cósmico'
    'Revolucionó' = 'Revolucionó'
    'Mecánica' = 'Mecánica'
    'selección' = 'selección'
    'enamoró' = 'enamoró'
    'sinfonía' = 'sinfonía'
    'armó' = 'armó'
    'sentó' = 'sentó'
    'evolución' = 'evolución'
    'Andrés' = 'Andrés'
    'ganó' = 'ganó'
    'después' = 'después'
    'por fin se le dio' = 'por fin se le dio'
    'campeón' = 'campeón'
    'cerró' = 'cerró'
    'círculo' = 'círculo'
    'recién' = 'recién'
    'reinventándose' = 'reinventándose'
    'día' = 'día'
    'ambición' = 'ambición'
    'empezó' = 'empezó'
    'convirtió' = 'convirtió'
    'después' = 'después'
    'siguió' = 'siguió'
    'histórico' = 'histórico'
    'increíble' = 'increíble'
    'marcó' = 'marcó'
    'época' = 'época'
    'dominó' = 'dominó'
    'completísimo' = 'completísimo'
    'defendía' = 'defendía'
    'metía' = 'metía'
    'Lideró' = 'Lideró'
    'después' = 'después'
    'elegancia' = 'elegancia'
    'Nazário' = 'Nazário'
    'Fenómeno' = 'Fenómeno'
    'superó' = 'superó'
    'alegría' = 'alegría'
    'fantasía' = 'fantasía'
    'ángel' = 'ángel'
    'Puskás' = 'Puskás'
    'Cañoncito' = 'Cañoncito'
    'mágica' = 'mágica'
    'Eusébio' = 'Eusébio'
    'Müller' = 'Müller'
    'inspiración' = 'inspiración'
    'sueñan' = 'sueñan'
    'ídolos' = 'ídolos'
    'Artículo' = 'Artículo'
    'Artículos' = 'Artículos'
    'panorámica' = 'panorámica'
    'estadio' = 'estadio'
    'Evolución' = 'Evolución'
    'Mundiales' = 'Mundiales'
    'Términos' = 'Términos'
    '¿viste' = '¿viste'
    'poesía' = 'poesía'
    'sillón' = 'sillón'
    'más' = 'más'
    '¡Un' = '¡Un'
    '¡TRE-S' = '¡TRE-S'
    '¡un' = '¡un'
    '¡mil' = '¡mil'
    '¡Eso' = '¡Eso'
    '¡mamita' = '¡mamita'
    '¡Gracias' = '¡Gracias'
    '¿Qué' = '¿Qué'
    '¡siete' = '¡siete'
    '¡por' = '¡por'
    '¡Salud' = '¡Salud'
    'Artículo' = 'Artículo'
}

# Aplicar todas las correcciones
$correctionCount = 0
foreach ($incorrect in $corrections.Keys) {
    $correct = $corrections[$incorrect]
    if ($content -match [regex]::Escape($incorrect)) {
        $content = $content -replace [regex]::Escape($incorrect), $correct
        Write-Host "  ✓ $incorrect → $correct" -ForegroundColor Green
        $correctionCount++
    }
}

# Guardar el archivo corregido
$content | Out-File $file -Encoding UTF8 -NoNewline

Write-Host "✅ Codificación corregida en $file" -ForegroundColor Green
Write-Host "📊 Total de correcciones aplicadas: $correctionCount" -ForegroundColor Cyan 